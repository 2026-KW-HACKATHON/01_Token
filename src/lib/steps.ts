import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

/**
 * 걸음수 조회 모듈. 실제 측정과 시연용 데이터를 같은 형태로 돌려준다.
 * - iOS: Core Motion 기간 조회(getStepCountAsync). 앱이 꺼져 있을 때 기기가 기록한 걸음도 포함된다.
 * - Android: Expo Pedometer는 기간 조회를 지원하지 않는다. 'unsupported'로 돌려주고 0보로 단정하지 않는다.
 */
export type StepStatus = 'ok' | 'denied' | 'unavailable' | 'unsupported' | 'error';
export type StepSource = 'core-motion' | 'demo';

export interface StepReading {
  status: StepStatus;
  source: StepSource;
  steps: number | null; // status가 'ok'일 때만 숫자
  dateKey: string; // 기기 현지 날짜 YYYY-MM-DD
  from: string; // 조회 구간 시작 (ISO)
  queriedAt: string; // 조회 시각 (ISO)
  message?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKeyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export async function readTodaySteps(now = new Date()): Promise<StepReading> {
  const from = startOfDay(now);
  const base = { source: 'core-motion' as const, dateKey: dateKeyOf(now), from: from.toISOString(), queriedAt: now.toISOString() };

  if (Platform.OS !== 'ios') {
    return { ...base, status: 'unsupported', steps: null, message: '이 기기에서는 오늘 걸음 기록 조회를 지원하지 않아요 (iOS 전용 경로).' };
  }
  try {
    if (!(await Pedometer.isAvailableAsync())) {
      return { ...base, status: 'unavailable', steps: null, message: '이 기기에서 걸음 센서를 사용할 수 없어요.' };
    }
    let perm = await Pedometer.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Pedometer.requestPermissionsAsync();
    if (!perm.granted) {
      return { ...base, status: 'denied', steps: null, message: '동작 및 피트니스 권한이 꺼져 있어요. 설정에서 허용해 주세요.' };
    }
    const r = await Pedometer.getStepCountAsync(from, now);
    return { ...base, status: 'ok', steps: r.steps };
  } catch (e) {
    return { ...base, status: 'error', steps: null, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 시연용 데이터. 화면에 반드시 '시연용'으로 표시한다. */
export function demoReading(steps: number, now = new Date()): StepReading {
  return {
    status: 'ok', source: 'demo', steps, dateKey: dateKeyOf(now),
    from: startOfDay(now).toISOString(), queriedAt: now.toISOString(),
  };
}
