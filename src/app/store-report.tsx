import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, cardStyle, IconBox, Notice, ProgressBar, T } from '../components/ui';
import { WALK_STORES } from '../data/walkStores';
import { useWalk, type StoreEvent, type StoreEventType } from '../store/WalkStore';
import { colors, STORE_ICON } from '../theme';

const TYPES: { t: StoreEventType; label: string }[] = [
  { t: 'shown', label: '노출' },
  { t: 'view', label: '상세 조회' },
  { t: 'exchanged', label: '쿠폰 교환' },
  { t: 'used', label: '사용 완료' },
];
const WEEK = 7 * 864e5;

function summarize(events: StoreEvent[] = [], now = Date.now()) {
  return TYPES.map(({ t, label }) => ({
    t, label,
    total: events.filter((e) => e.t === t).length,
    week: events.filter((e) => e.t === t && now - new Date(e.at).getTime() <= WEEK).length,
  }));
}

const ratio = (a: number, b: number) => (b ? a / b : 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

/** 제휴 가게 성과 (사장님용 시연 화면). 걸음수 등 걷기 데이터는 포함하지 않는다. */
export default function StoreReport() {
  const w = useWalk();

  function confirmReset() {
    Alert.alert('가게 성과 기록을 초기화할까요?', '이 기기에 쌓인 노출·조회·교환·사용 기록이 지워져요.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: w.resetStoreEvents },
    ]);
  }

  // 전체 가게 7일 합계
  const all = TYPES.map(({ t, label }) => ({
    t, label,
    week: WALK_STORES.reduce((n, st) => n + summarize(w.storeEvents[st.id]).find((r) => r.t === t)!.week, 0),
  }));

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={[T.hero, s.hero]}>우리 가게,{'\n'}이번 주 성과예요</Text>
      <Notice text="시연용 화면이에요. 이 기기에서 발생한 기록만 집계되며 전체 이용자·실제 매출 통계가 아니에요." style={{ marginBottom: 12 }} />

      <View style={cardStyle}>
        <Text style={T.label}>제휴 가게 전체 · 최근 7일</Text>
        <View style={s.grid}>
          {all.map((r) => (
            <View key={r.t} style={s.stat}>
              <Text style={s.statLabel}>{r.label}</Text>
              <Text style={s.statVal}>{r.week.toLocaleString()}<Text style={s.statUnit}>회</Text></Text>
            </View>
          ))}
        </View>
        <Text style={[T.caption, { marginTop: 14 }]}>
          가게는 광고비 대신 걷기 쿠폰 혜택을 내고, 앱 안 노출과 쿠폰 사용 성과를 확인해요.
        </Text>
      </View>

      <Text style={s.section}>가게별 성과</Text>
      {WALK_STORES.map((st) => {
        const rows = summarize(w.storeEvents[st.id]);
        const total = (t: StoreEventType) => rows.find((r) => r.t === t)!.total;
        const steps = [
          { label: '노출 → 조회', a: total('view'), b: total('shown') },
          { label: '조회 → 교환', a: total('exchanged'), b: total('view') },
          { label: '교환 → 사용', a: total('used'), b: total('exchanged') },
        ];
        return (
          <Pressable
            key={st.id}
            onPress={() => router.push({ pathname: '/store/[id]', params: { id: st.id } })}
            style={({ pressed }) => [cardStyle, pressed && { opacity: 0.8 }]}
          >
            <View style={s.head}>
              <IconBox icon={STORE_ICON[st.category] ?? '🏪'} />
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{st.name}</Text>
                <Text style={s.perk} numberOfLines={1}>{st.perk}</Text>
              </View>
              <Text style={{ fontSize: 22, color: colors.faint }}>›</Text>
            </View>

            <View style={s.row4}>
              {rows.map((r) => (
                <View key={r.t} style={s.mini}>
                  <Text style={s.miniVal}>{r.week}</Text>
                  <Text style={s.miniLabel}>{r.label}</Text>
                  <Text style={s.miniSub}>누적 {r.total}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 14, gap: 10 }}>
              {steps.map((f) => (
                <View key={f.label}>
                  <View style={s.between}>
                    <Text style={s.funnelLabel}>{f.label}</Text>
                    <Text style={s.funnelVal}>{pct(f.a, f.b)}</Text>
                  </View>
                  <ProgressBar value={ratio(f.a, f.b)} height={6} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}

      <Text style={[T.caption, { marginHorizontal: 4, marginBottom: 12 }]}>
        집계 원칙: 가게에는 노출·조회·교환·사용 횟수만 보여 줘요. 개인의 걸음수·걷기 기록·보상 잔액은 포함하지 않고, 걸음 데이터로 광고 대상을 고르지 않아요.
      </Text>
      <Btn label="가게 성과 기록 초기화" kind="danger" onPress={confirmReset} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 40 },
  hero: { marginHorizontal: 4, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  stat: { width: '48.5%', backgroundColor: colors.fill, borderRadius: 16, padding: 14 },
  statLabel: { fontSize: 14, color: colors.sub, fontWeight: '600' },
  statVal: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 4, fontVariant: ['tabular-nums'] },
  statUnit: { fontSize: 15, color: colors.sub, fontWeight: '600' },
  section: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 12, marginBottom: 12, marginHorizontal: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  perk: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },
  row4: { flexDirection: 'row', marginTop: 16, backgroundColor: colors.fill, borderRadius: 16, paddingVertical: 12 },
  mini: { flex: 1, alignItems: 'center' },
  miniVal: { fontSize: 20, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  miniLabel: { fontSize: 13, color: colors.sub, fontWeight: '600', marginTop: 2 },
  miniSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  funnelLabel: { fontSize: 14, color: colors.sub, fontWeight: '500' },
  funnelVal: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});
