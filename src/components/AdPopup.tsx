import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { closePopup, tryOpenPopup } from '../lib/popupGate';
import { dateKeyOf } from '../lib/steps';
import { useWalk } from '../store/WalkStore';
import { colors, STORE_ICON } from '../theme';
import { featuredStoreFor } from './FeaturedStore';
import { Btn, IconBox, Tag } from './ui';

const KEY = '@walk/adPopupHiddenDate/v1';

/** 시연에서 팝업을 다시 보여 주기 위해 '오늘 하루 보지 않기'를 지운다 */
export async function resetAdPopup() {
  try { await AsyncStorage.removeItem(KEY); } catch { /* 저장소 오류는 무시 */ }
}

/**
 * 광고 팝업 (하루 한 번)
 * - 광고 가게는 날짜 기준 순환(featuredStoreFor)으로 정한다. 걸음수·보상 등 걷기 데이터로 고르지 않는다.
 * - '오늘 하루 보지 않기'를 누르면 같은 날에는 다시 뜨지 않는다. 닫기만 누르면 앱을 다시 열 때 다시 뜬다.
 */
export function AdPopup({ trigger = 0 }: { trigger?: number }) {
  const insets = useSafeAreaInsets();
  const w = useWalk();
  const logStore = w.logStore;
  const st = featuredStoreFor();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      let hidden: string | null = null;
      try { hidden = await AsyncStorage.getItem(KEY); } catch { /* 무시 */ }
      // 보상 알림 등 다른 팝업이 떠 있으면 이번에는 광고를 띄우지 않는다
      if (alive && hidden !== dateKeyOf(new Date()) && tryOpenPopup('ad')) setOpen(true);
    }, 700);
    return () => { alive = false; clearTimeout(t); };
  }, [trigger]);

  useEffect(() => {
    if (!open) closePopup('ad');
  }, [open]);

  useEffect(() => {
    if (open) logStore([st.id], 'shown', `popup:${st.id}:${dateKeyOf(new Date())}`);
  }, [open, logStore, st.id]);

  async function hideToday() {
    try { await AsyncStorage.setItem(KEY, dateKeyOf(new Date())); } catch { /* 무시 */ }
    setOpen(false);
  }

  function goStore() {
    setOpen(false);
    router.push({ pathname: '/store/[id]', params: { id: st.id } });
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <Pressable style={s.dim} onPress={() => setOpen(false)} accessibilityLabel="광고 닫기" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={s.handle} />
        <View style={s.tags}>
          <Tag label="광고" tone="muted" />
          <Tag label="시연용 가상 가게" tone="warn" />
        </View>

        <View style={s.hero}>
          <IconBox icon={STORE_ICON[st.category] ?? '🏪'} size={72} bg={colors.primarySoft} />
          <Text style={s.name}>{st.name}</Text>
          <Text style={s.area}>{st.category} · {st.area}</Text>
        </View>

        <View style={s.perkBox}>
          <Text style={s.perkLabel}>🎟 걷기 쿠폰 혜택</Text>
          <Text style={s.perk}>{st.perk}</Text>
        </View>

        <Btn label="가게 보러 가기" kind="primary" size="lg" onPress={goStore} style={{ marginTop: 18 }} />
        <View style={s.row}>
          <Pressable onPress={hideToday} hitSlop={8}><Text style={s.link}>오늘 하루 보지 않기</Text></Pressable>
          <Pressable onPress={() => setOpen(false)} hitSlop={8}><Text style={[s.link, { color: colors.ink }]}>닫기</Text></Pressable>
        </View>
        <Text style={s.foot}>광고는 날짜별로 돌아가며 보여 줘요. 걸음 기록으로 광고를 고르지 않아요.</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 14 },
  tags: { flexDirection: 'row', gap: 6 },
  hero: { alignItems: 'center', marginTop: 14 },
  name: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 14, letterSpacing: -0.5, textAlign: 'center' },
  area: { fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' },
  perkBox: { backgroundColor: colors.fill, borderRadius: 18, padding: 18, marginTop: 18 },
  perkLabel: { fontSize: 14, fontWeight: '700', color: colors.primary },
  perk: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: colors.ink, marginTop: 6, letterSpacing: -0.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 },
  link: { fontSize: 15, fontWeight: '600', color: colors.muted },
  foot: { fontSize: 12, color: colors.faint, textAlign: 'center', marginTop: 14 },
});
