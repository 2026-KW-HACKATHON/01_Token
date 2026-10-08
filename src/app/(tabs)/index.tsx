import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeaturedStore } from '../../components/FeaturedStore';
import { Btn, cardStyle, Chip, Section, Tag } from '../../components/ui';
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
  const w = useWalk();
  const r = w.reading;
  const steps = r?.status === 'ok' ? r.steps ?? 0 : null;
  const dateKey = r?.dateKey ?? '';
  const claimed = w.rewards.claimedByDate[dateKey] ?? 0;
  const earned = steps == null ? 0 : earnedFor(steps);
  const canClaim = Math.max(0, earned - claimed);
  const nextIn = steps == null || earned >= DAILY_MAX ? null : STEPS_PER_REWARD - (steps % STEPS_PER_REWARD);
  const progress = Math.min(1, w.rewards.balance / COUPON_COST);

  function onClaim() {
    const added = w.claimToday();
    if (added) Alert.alert(`보상 ${added}개를 받았어요`, `잔액 ${w.rewards.balance + added}개`);
    else Alert.alert('새로 받을 보상이 없어요', '같은 걸음으로는 다시 지급되지 않아요. 더 걷고 다시 확인해 주세요.');
  }

  function confirmReset() {
    Alert.alert('걷기 기록을 초기화할까요?', '보상 잔액·쿠폰·조회 기록이 이 기기에서 지워져요.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: w.resetWalk },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={s.kicker}>월계 들름길</Text>
      <Text style={s.title}>어디서 걸어도,{'\n'}월계1동 가게 혜택으로</Text>
      <FeaturedStore placement="home" />

      <View style={[cardStyle, s.stepCard, w.demo && s.demoCard]}>
        {w.demo && <Text style={s.demoBadge}>시연용 데이터 · 실제 측정 아님</Text>}
        <Text style={s.label}>오늘 걸음</Text>
        <Text style={s.big}>
          {steps == null ? '—' : steps.toLocaleString()}
          <Text style={s.unit}> 보</Text>
        </Text>
        {r && (
          <>
            <Text style={s.meta}>
              {w.demo ? '시연용 값' : `${STATUS_LABEL[r.status]} · ${r.source === 'core-motion' ? 'iPhone 동작 기록' : r.source === 'live-sensor' ? '앱 실행 중 측정' : Platform.OS}`}
              {' · '}오늘 0시 ~ {hhmm(r.queriedAt)} 기준
            </Text>
            {r.message ? <Text style={s.warn}>{r.message}</Text> : null}
          </>
        )}
        <Btn label="걸음 다시 확인" onPress={() => w.refresh('수동 조회')} style={{ marginTop: 10 }} />
      </View>

      <View style={cardStyle}>
        <View style={s.rowBetween}>
          <Text style={s.label}>오늘 보상</Text>
          <Tag label={`${claimed} / ${DAILY_MAX}개 받음`} tone="route" />
        </View>
        <Text style={s.body}>
          {steps == null
            ? '걸음을 확인하면 보상을 계산해요.'
            : nextIn == null
              ? '오늘 받을 수 있는 보상을 모두 채웠어요.'
              : `다음 보상까지 ${nextIn.toLocaleString()}보`}
        </Text>
        <Btn
          label={canClaim ? `보상 ${canClaim}개 받기` : '받을 보상 없음'}
          kind="primary"
          disabled={!canClaim}
          onPress={onClaim}
          style={{ marginTop: 10 }}
        />
        <Text style={s.hint}>1,000보마다 1개, 하루 최대 {DAILY_MAX}개. 받은 보상은 다음 날에도 남아요.</Text>
      </View>

      <Pressable onPress={() => router.navigate('/map')} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.8 }]}>
        <View style={s.rowBetween}>
          <Text style={s.label}>보상 잔액</Text>
          <Text style={s.balance}>{w.rewards.balance}개</Text>
        </View>
        <View style={s.bar}><View style={[s.barFill, { width: `${progress * 100}%` }]} /></View>
        <Text style={s.body}>
          {w.rewards.balance >= COUPON_COST
            ? '쿠폰으로 바꿀 수 있어요. 혜택 지도에서 가게를 골라 보세요 ›'
            : `쿠폰까지 ${COUPON_COST - w.rewards.balance}개 남았어요. 혜택 지도 보기 ›`}
        </Text>
      </Pressable>

      <Section title="시연 설정">
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
        <Text style={s.hint}>
          시연용 데이터는 발표에서 보상 달성 과정을 보여 주기 위한 값이에요. 실제 걸음과 구분해서 표시돼요.
        </Text>
      </Section>

      <Section title="조회 기록">
        <Text style={s.hint}>앱을 열거나 돌아올 때마다 기록돼요. 화면을 끄고 걸은 뒤 돌아오면 '앱 복귀' 기록이 늘어나는지 확인할 수 있어요.</Text>
        <View style={[cardStyle, { marginTop: 8 }]}>
          {w.log.length === 0 && <Text style={s.meta}>아직 기록이 없어요.</Text>}
          {w.log.slice(0, 10).map((l, i) => (
            <Text key={i} style={s.logRow}>
              {hhmm(l.at)}  {l.trigger}  {l.demo ? '시연' : STATUS_LABEL[l.status]}  {l.steps == null ? '—' : `${l.steps.toLocaleString()}보`}
            </Text>
          ))}
        </View>
        <Btn label="걷기 기록 초기화" kind="danger" onPress={confirmReset} />
      </Section>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48, gap: 12 },
  kicker: { fontSize: 13, fontWeight: '700', color: colors.rose },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginBottom: 6 },
  stepCard: { paddingVertical: 20 },
  demoCard: { borderColor: '#9A6B00', borderWidth: 2 },
  demoBadge: { color: '#9A6B00', fontWeight: '800', fontSize: 12, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
  big: { fontSize: 46, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  unit: { fontSize: 18, fontWeight: '600', color: colors.muted },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  warn: { fontSize: 13, color: colors.rose, marginTop: 4 },
  body: { fontSize: 14, color: colors.ink, marginTop: 8, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balance: { fontSize: 22, fontWeight: '800', color: colors.ink },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.line, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.rose },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logRow: { fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums'], marginVertical: 1 },
});
