import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdPopup, resetAdPopup } from '../../components/AdPopup';
import { FeaturedStore } from '../../components/FeaturedStore';
import { Btn, cardStyle, Chip, Disclosure, ProgressBar, Section, T, Tag } from '../../components/ui';
import { getReminderOn, REMINDER_HOUR, setDailyReminder, testReminder } from '../../lib/reminder';
import { COUPON_COST, DAILY_MAX, earnedFor, STEPS_PER_REWARD } from '../../lib/rewards';
import { useWalk } from '../../store/WalkStore';
import { colors } from '../../theme';

const STATUS_LABEL: Record<string, string> = {
  ok: '조회 성공', denied: '권한 거부', unavailable: '센서 없음', unsupported: '지원 안 함', error: '오류',
};
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 월계 들름길 — 걷기 홈: 오늘 걸음 → 보상 받기 → 잔액 → 쿠폰 교환으로 이동 */
export default function WalkHome() {
  const insets = useSafeAreaInsets();
  const w = useWalk();
  const [adTick, setAdTick] = useState(0);
  const [reminderOn, setReminderOn] = useState(false);
  useEffect(() => { getReminderOn().then(setReminderOn); }, []);

  async function toggleReminder(on: boolean) {
    setReminderOn(on);
    const ok = await setDailyReminder(on);
    if (!ok) {
      setReminderOn(false);
      Alert.alert('알림을 켤 수 없어요', '휴대폰 설정에서 이 앱(Expo Go)의 알림을 허용해 주세요.');
    } else if (on) {
      Alert.alert('매일 알림을 켰어요', `매일 저녁 ${REMINDER_HOUR}시에 보상 받으라고 알려 드릴게요. 앱이 꺼져 있어도 와요.`);
    }
  }

  async function onTestReminder() {
    const ok = await testReminder(10);
    Alert.alert(ok ? '10초 뒤에 알림이 와요' : '알림을 보낼 수 없어요', ok ? '홈 화면으로 나가거나 화면을 꺼 두고 기다려 보세요.' : '휴대폰 설정에서 알림을 허용해 주세요.');
  }
  const r = w.reading;
  const steps = r?.status === 'ok' ? r.steps ?? 0 : null;
  const dateKey = r?.dateKey ?? '';
  const claimed = w.rewards.claimedByDate[dateKey] ?? 0;
  const earned = steps == null ? 0 : earnedFor(steps);
  const canClaim = Math.max(0, earned - claimed);
  const nextIn = steps == null || earned >= DAILY_MAX ? null : STEPS_PER_REWARD - (steps % STEPS_PER_REWARD);
  const balance = w.rewards.balance;
  const progress = Math.min(1, balance / COUPON_COST);

  function onClaim() {
    const added = w.claimToday();
    if (added) Alert.alert(`보상 ${added}개를 받았어요`, `잔액 ${balance + added}개`);
    else Alert.alert('새로 받을 보상이 없어요', '같은 걸음으로는 다시 지급되지 않아요. 더 걷고 다시 확인해 주세요.');
  }

  function confirmReset() {
    Alert.alert('걷기 기록을 초기화할까요?', '보상 잔액·쿠폰·조회 기록이 이 기기에서 지워져요.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: w.resetWalk },
    ]);
  }

  const headline2 =
    steps == null ? '걸음을 확인하면 보상을 계산해요'
      : canClaim > 0 ? `보상 ${canClaim}개를 받을 수 있어요`
        : nextIn == null ? '오늘 보상을 모두 채웠어요'
          : `다음 보상까지 ${nextIn.toLocaleString()}보`;

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={[s.wrap, { paddingTop: insets.top + 16 }]}>
      <AdPopup trigger={adTick} />
      <Text style={s.kicker}>월계 들름길</Text>
      <Text style={[T.hero, s.hero]}>
        {steps == null ? '오늘 걸음을 확인해 볼까요?' : <>오늘 <Text style={{ color: colors.primary }}>{steps.toLocaleString()}보</Text> 걸었어요</>}
        {'\n'}{headline2}
      </Text>

      {/* 오늘 걸음 + 보상 받기 */}
      <View style={cardStyle}>
        <View style={s.between}>
          <Text style={T.label}>오늘 걸음</Text>
          {w.demo && <Tag label="시연용 데이터 · 실제 측정 아님" tone="warn" />}
        </View>
        <Text style={[T.num, s.big]}>
          {steps == null ? '—' : steps.toLocaleString()}
          <Text style={s.unit}> 보</Text>
        </Text>
        {r && (
          <Text style={T.caption}>
            오늘 0시 ~ {hhmm(r.queriedAt)} 기준 ·{' '}
            {w.demo ? '시연용 값' : `${STATUS_LABEL[r.status]} · ${r.source === 'core-motion' ? 'iPhone 동작 기록' : r.source === 'live-sensor' ? '앱 실행 중 측정' : Platform.OS}`}
          </Text>
        )}
        {r?.message ? <Text style={s.warn}>{r.message}</Text> : null}

        {/* 하루 보상 5칸: 받은 칸 · 지금 받을 수 있는 칸 · 남은 칸 */}
        <View style={s.dots}>
          {Array.from({ length: DAILY_MAX }, (_, i) => (
            <View key={i} style={[s.dot, i < claimed ? s.dotGot : i < earned ? s.dotCan : null]} />
          ))}
        </View>
        <View style={[s.between, { marginTop: 8 }]}>
          <Text style={T.caption}>오늘 보상 {claimed} / {DAILY_MAX}개 받음</Text>
          {nextIn != null && <Text style={T.caption}>다음까지 {nextIn.toLocaleString()}보</Text>}
        </View>

        <Btn
          label={canClaim ? `보상 ${canClaim}개 받기` : '지금 받을 보상이 없어요'}
          kind="primary"
          size="lg"
          disabled={!canClaim}
          onPress={onClaim}
          style={{ marginTop: 18 }}
        />
        <Btn label="↻  걸음 다시 확인" kind="text" onPress={() => w.refresh('수동 조회')} style={{ marginTop: 4, minHeight: 40 }} />
      </View>

      {/* 보상 잔액 */}
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/map')} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.7 }]}>
        <View style={s.between}>
          <Text style={T.label}>내 보상</Text>
          <Text style={s.balance}>{balance}개 <Text style={{ color: colors.faint }}>›</Text></Text>
        </View>
        <ProgressBar value={progress} style={{ marginTop: 14 }} />
        <Text style={[T.caption, { marginTop: 10 }]}>
          {balance >= COUPON_COST
            ? <>쿠폰으로 바꿀 수 있어요. <Text style={s.em}>혜택 지도에서 고르기</Text></>
            : <>쿠폰까지 <Text style={s.em}>{COUPON_COST - balance}개</Text> 남았어요</>}
        </Text>
      </Pressable>

      {/* 매일 정해진 시간 알림 */}
      <View style={[cardStyle, s.between]}>
        <View style={{ flex: 1 }}>
          <Text style={s.remTitle}>⏰  매일 저녁 {REMINDER_HOUR}시 보상 알림</Text>
          <Text style={[T.caption, { marginTop: 4 }]}>앱이 꺼져 있어도 와요. 알림을 누르면 걸음을 확인하고 보상을 받을 수 있어요.</Text>
        </View>
        <Switch value={reminderOn} onValueChange={toggleReminder} trackColor={{ true: colors.primary, false: colors.line }} thumbColor="#FFFFFF" />
      </View>

      <Section title="오늘의 광고 가게">
        <FeaturedStore placement="home" />
      </Section>

      <View style={{ height: 20 }} />
      <Disclosure title="시연 설정">
        <View style={s.chips}>
          <Chip label="실제 측정" on={!w.demo} onPress={() => w.setDemo(false)} />
          <Chip label="시연용 데이터" on={w.demo} onPress={() => w.setDemo(true)} />
        </View>
        {w.demo && (
          <View style={[s.chips, { marginTop: 8 }]}>
            {[990, 1000, 2800, 5600].map((n) => (
              <Chip key={n} label={`${n.toLocaleString()}보`} on={w.demoSteps === n} onPress={() => w.setDemoSteps(n)} />
            ))}
            <Chip label="잔액 9개로" on={false} onPress={() => w.setDemoBalance(9)} />
          </View>
        )}
        <View style={[s.chips, { marginTop: 8 }]}>
          <Chip label="광고 팝업 다시 보기" on={false} onPress={() => { resetAdPopup().then(() => setAdTick((n) => n + 1)); }} />
          <Chip label="10초 뒤 알림 테스트" on={false} onPress={onTestReminder} />
        </View>
        <Text style={[T.caption, { marginTop: 10 }]}>
          시연용 데이터는 발표에서 보상 달성 과정을 보여 주기 위한 값이에요. 실제 걸음과 구분해서 표시돼요.
        </Text>
      </Disclosure>

      <Disclosure title="조회 기록 · 측정 확인">
        <Text style={T.caption}>앱을 열거나 돌아올 때마다 기록돼요. 화면을 끄고 걸은 뒤 돌아오면 '앱 복귀' 기록이 늘어나는지 확인할 수 있어요.</Text>
        <View style={s.log}>
          {w.log.length === 0 && <Text style={T.caption}>아직 기록이 없어요.</Text>}
          {w.log.slice(0, 10).map((l, i) => (
            <Text key={i} style={s.logRow}>
              {hhmm(l.at)}  {l.trigger}  {l.demo ? '시연' : STATUS_LABEL[l.status]}  {l.steps == null ? '—' : `${l.steps.toLocaleString()}보`}
            </Text>
          ))}
        </View>
        <Btn label="걷기 기록 초기화" kind="danger" onPress={confirmReset} />
      </Disclosure>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingBottom: 40 },
  kicker: { fontSize: 15, fontWeight: '700', color: colors.primary, marginHorizontal: 4 },
  hero: { marginTop: 6, marginBottom: 18, marginHorizontal: 4 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  big: { fontSize: 42, marginTop: 6, marginBottom: 2 },
  unit: { fontSize: 20, fontWeight: '600', color: colors.sub, letterSpacing: 0 },
  warn: { fontSize: 14, color: colors.warnText, backgroundColor: colors.warnBg, borderRadius: 12, padding: 12, marginTop: 10, lineHeight: 20 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 18 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.fill },
  dotGot: { backgroundColor: colors.primary },
  dotCan: { backgroundColor: colors.primaryLight },
  balance: { fontSize: 22, fontWeight: '700', color: colors.ink },
  em: { color: colors.primary, fontWeight: '700' },
  remTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  log: { backgroundColor: colors.fill, borderRadius: 14, padding: 14, marginVertical: 12 },
  logRow: { fontSize: 13, color: colors.sub, fontVariant: ['tabular-nums'], marginVertical: 2 },
});
