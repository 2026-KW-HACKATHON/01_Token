import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { closePopup, onPopupFree, tryOpenPopup } from '../lib/popupGate';
import { DAILY_MAX, earnedFor } from '../lib/rewards';
import { useWalk } from '../store/WalkStore';
import { colors } from '../theme';
import { Btn, Tag } from './ui';

const KEY = '@walk/rewardNotice/v1'; // { dateKey, earned } 마지막으로 알린 단계

/**
 * 월계토큰 알림 팝업
 * - 걸음이 1,000보 단위를 새로 넘어 받을 월계토큰이 생기면 앱 안에서 알려 준다.
 * - 같은 날 같은 단계는 한 번만 알린다(앱을 다시 열어도 반복하지 않음).
 * - 앱이 꺼져 있을 때 보내는 휴대폰 알림은 아니다.
 */
export function RewardReadyPopup() {
  const insets = useSafeAreaInsets();
  const w = useWalk();
  const r = w.reading;
  const steps = r?.status === 'ok' ? r.steps ?? 0 : null;
  const dateKey = r?.dateKey ?? '';
  const claimed = w.rewards.claimedByDate[dateKey] ?? 0;
  const earned = steps == null ? 0 : earnedFor(steps);
  const canClaim = Math.max(0, earned - claimed);

  const [open, setOpen] = useState(false);
  const notified = useRef<{ dateKey: string; earned: number } | null>(null);
  const loaded = useRef(false);

  // 저장된 '마지막 알림 단계' 불러오기
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v) notified.current = JSON.parse(v); })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
  }, []);

  useEffect(() => {
    if (!dateKey || canClaim <= 0) return;
    let cancel = () => {};
    const t = setTimeout(function check() {
      if (!loaded.current) { cancel(); const tt = setTimeout(check, 300); cancel = () => clearTimeout(tt); return; }
      const last = notified.current?.dateKey === dateKey ? notified.current.earned : 0;
      if (earned <= last) return;
      if (tryOpenPopup('reward')) setOpen(true);
      else cancel = onPopupFree(() => { if (tryOpenPopup('reward')) setOpen(true); });
    }, 400);
    return () => { clearTimeout(t); cancel(); };
  }, [dateKey, earned, canClaim]);

  function remember() {
    notified.current = { dateKey, earned };
    AsyncStorage.setItem(KEY, JSON.stringify(notified.current)).catch(() => {});
  }

  function close() {
    remember();
    setOpen(false);
    closePopup('reward');
  }

  function claimNow() {
    const before = w.rewards.balance;
    const added = w.claimToday();
    close();
    setTimeout(() => {
      if (added) Alert.alert(`월계토큰 ${added}개를 받았어요`, `잔액 ${before + added}개`);
      else Alert.alert('새로 받을 월계토큰이 없어요', '같은 걸음으로는 다시 지급되지 않아요.');
    }, 350);
  }

  if (!open) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.dim} onPress={close} accessibilityLabel="월계토큰 알림 닫기" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={s.handle} />
        {w.demo && <View style={{ flexDirection: 'row' }}><Tag label="시연용 데이터 · 실제 측정 아님" tone="warn" /></View>}
        <Text style={s.emoji}>🎉</Text>
        <Text style={s.title}>{(earned * 1000).toLocaleString()}보를 넘었어요!</Text>
        <Text style={s.sub}>월계토큰 <Text style={s.em}>{canClaim}개</Text>를 받을 수 있어요</Text>

        <View style={s.box}>
          <View style={s.row}><Text style={s.k}>오늘 걸음</Text><Text style={s.v}>{(steps ?? 0).toLocaleString()}보</Text></View>
          <View style={s.row}><Text style={s.k}>오늘 받은 월계토큰</Text><Text style={s.v}>{claimed} / {DAILY_MAX}개</Text></View>
          <View style={s.row}><Text style={s.k}>지금 잔액</Text><Text style={s.v}>{w.rewards.balance}개</Text></View>
        </View>

        <Btn label={`월계토큰 ${canClaim}개 받기`} kind="primary" size="lg" onPress={claimNow} style={{ marginTop: 18 }} />
        <Btn label="나중에 받을게요" kind="text" onPress={close} style={{ marginTop: 4 }} />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 14 },
  emoji: { fontSize: 52, textAlign: 'center', marginTop: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, textAlign: 'center', marginTop: 8, letterSpacing: -0.5 },
  sub: { fontSize: 17, color: colors.sub, textAlign: 'center', marginTop: 6, fontWeight: '500' },
  em: { color: colors.primary, fontWeight: '700' },
  box: { backgroundColor: colors.fill, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  k: { fontSize: 15, color: colors.muted },
  v: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
