import { Redirect, router, Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, cardStyle, IconBox, Notice, ProgressBar, T } from '../components/ui';
import { storeById } from '../data/walkStores';
import { clearOwnerSession, useOwnerSession } from '../lib/ownerSession';
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

/**
 * 우리 가게 성과 (사장님 전용, 시연용 로그인 필요)
 * - 로그인한 가게의 성과만 보여 준다. 다른 가게 숫자는 보이지 않는다.
 * - 걸음수 등 걷기 데이터는 포함하지 않는다.
 */
export default function StoreReport() {
  const w = useWalk();
  const { storeId, loaded } = useOwnerSession();

  if (!loaded) return <View style={s.center}><ActivityIndicator color={colors.primary} /></View>;
  const st = storeId ? storeById(storeId) : undefined;
  if (!st) return <Redirect href="/owner-login" />;

  const rows = summarize(w.storeEvents[st.id]);
  const total = (t: StoreEventType) => rows.find((r) => r.t === t)!.total;
  const funnel = [
    { label: '노출 → 상세 조회', a: total('view'), b: total('shown') },
    { label: '상세 조회 → 쿠폰 교환', a: total('exchanged'), b: total('view') },
    { label: '쿠폰 교환 → 사용 완료', a: total('used'), b: total('exchanged') },
  ];

  async function logout() {
    await clearOwnerSession();
    router.replace('/');
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: '우리 가게 성과' }} />
      <View style={s.head}>
        <IconBox icon={STORE_ICON[st.category] ?? '🏪'} size={56} bg={colors.card} />
        <View style={{ flex: 1 }}>
          <Text style={s.owner}>사장님 로그인 중 (시연)</Text>
          <Text style={s.name} numberOfLines={1}>{st.name}</Text>
        </View>
      </View>
      <Notice text="시연용 화면이에요. 이 기기에서 발생한 기록만 집계되며 전체 이용자·실제 매출 통계가 아니에요." style={{ marginBottom: 12 }} />

      <View style={cardStyle}>
        <Text style={T.label}>최근 7일</Text>
        <View style={s.grid}>
          {rows.map((r) => (
            <View key={r.t} style={s.stat}>
              <Text style={s.statLabel}>{r.label}</Text>
              <Text style={s.statVal}>{r.week.toLocaleString()}<Text style={s.statUnit}>회</Text></Text>
              <Text style={s.statSub}>누적 {r.total}회</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={[T.label, { marginBottom: 4 }]}>단계별 전환율 (누적)</Text>
        <View style={{ gap: 14, marginTop: 10 }}>
          {funnel.map((f) => (
            <View key={f.label}>
              <View style={s.between}>
                <Text style={s.funnelLabel}>{f.label}</Text>
                <Text style={s.funnelVal}>{pct(f.a, f.b)}</Text>
              </View>
              <ProgressBar value={ratio(f.a, f.b)} height={8} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={T.label}>우리 가게 쿠폰 혜택</Text>
        <Text style={s.perk}>{st.perk}</Text>
        <Text style={[T.caption, { marginTop: 6 }]}>
          하루 {st.dailyLimit}장 · 발급 후 {st.validDays}일{st.validHours ? ` · ${st.validHours} 사용` : ''}
        </Text>
        <Btn label="손님에게 보이는 가게 화면" kind="secondary" onPress={() => router.push({ pathname: '/store/[id]', params: { id: st.id } })} style={{ marginTop: 14 }} />
      </View>

      <Text style={[T.caption, { marginHorizontal: 4, marginBottom: 12 }]}>
        사장님 화면에는 노출·조회·교환·사용 횟수만 보여 줘요. 손님의 걸음 기록·월계토큰 잔액은 포함하지 않고, 걸음 데이터로 광고 대상을 고르지 않아요.
        실제 서비스에서는 사업자 확인을 거친 계정으로 로그인하고, 모든 이용자의 기록을 서버에서 모아 보여 줘요.
      </Text>
      <Btn label="로그아웃" kind="ghost" onPress={logout} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 4, marginBottom: 16 },
  owner: { fontSize: 14, fontWeight: '700', color: colors.primary },
  name: { fontSize: 23, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  stat: { width: '48.5%', backgroundColor: colors.fill, borderRadius: 16, padding: 14 },
  statLabel: { fontSize: 14, color: colors.sub, fontWeight: '600' },
  statVal: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 4, fontVariant: ['tabular-nums'] },
  statUnit: { fontSize: 15, color: colors.sub, fontWeight: '600' },
  statSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  funnelLabel: { fontSize: 15, color: colors.sub, fontWeight: '500' },
  funnelVal: { fontSize: 15, color: colors.primary, fontWeight: '700' },
  perk: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.ink, marginTop: 10, letterSpacing: -0.4 },
});
