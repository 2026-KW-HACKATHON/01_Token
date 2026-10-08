import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * 시연용 사장님 로그인 (가게별 4자리 PIN)
 * - 실제 보안 인증이 아니다. PIN은 앱 안에 들어 있고, 성과 기록도 이 기기 것만 센다.
 * - 실제 서비스에서는 서버 계정 인증(사업자 확인) 후 자기 가게 데이터만 내려받는다.
 */
export const DEMO_OWNER_PINS: Record<string, string> = {
  'demo-bakery': '1111',
  'demo-gukbap': '2222',
  'demo-tteok': '3333',
  'demo-cafe': '4444',
};

const KEY = '@walk/ownerSession/v1';

export function checkOwnerPin(storeId: string, pin: string) {
  return DEMO_OWNER_PINS[storeId] != null && DEMO_OWNER_PINS[storeId] === pin;
}

export async function saveOwnerSession(storeId: string) {
  await AsyncStorage.setItem(KEY, storeId).catch(() => {});
}

export async function clearOwnerSession() {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

/** 현재 로그인한 가게 id (없으면 null). loaded가 false인 동안은 아직 확인 중 */
export function useOwnerSession() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setStoreId(v && DEMO_OWNER_PINS[v] ? v : null))
      .catch(() => setStoreId(null))
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { storeId, loaded, reload };
}
