import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, cardStyle } from '../components/ui';
import { WALK_STORES } from '../data/walkStores';
import { useWalk, type StoreEvent, type StoreEventType } from '../store/WalkStore';
import { colors } from '../theme';

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

const rate = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

/** 제휴 가게 성과 (사장님용 시연 화면). 걸음수 등 걷기 데이터는 포함하지 않는다. */
export default function StoreReport() {
  const w = useWalk();

  function confirmReset() {
    Alert.alert('가게 성과 기록을 초기화할까요?', '이 기기에 쌓인 노출·조회·교환·사용 기록이 지워져요.', [
      { text: '취소', style: 'cancel' },
      { text: '초기화', style: 'destructive', onPress: w.resetStoreEvents },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <View style={s.notice}>
        <Text style={s.noticeText}>
          시연용 화면이에요. 이 기기에서 발생한 기록만 집계되며 전체 이용자·실제 매출 통계가 아니에요.
        </Text>
      </View>
      <Text style={s.lead}>
        가게는 광고비 대신 걷기 쿠폰 혜택을 내고, 앱 안 노출과 쿠폰 사용 성과를 확인해요.
      </Text>

      {WALK_STORES.map((st) => {
        const rows = summarize(w.storeEvents[st.id]);
        const total = (t: StoreEventType) => rows.find((r) => r.t === t)!.total;
        return (
          <Pressable
            key={st.id}
            onPress={() => router.push({ pathname: '/store/[id]', params: { id: st.id } })}
            style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.name}>{st.name}</Text>
            <Text style={s.meta}>혜택: {st.perk}</Text>
            <View style={s.grid}>
              {rows.map((r) => (
                <View key={r.t} style={s.stat}>
                  <Text style={s.statVal}>{r.week}</Text>
                  <Text style={s.statLabel}>{r.label} (7일)</Text>
                  <Text style={s.statSub}>누적 {r.total}</Text>
                </View>
              ))}
            </View>
            <Text style={s.funnel}>
              노출→조회 {rate(total('view'), total('shown'))} · 조회→교환 {rate(total('exchanged'), total('view'))} · 교환→사용 {rate(total('used'), total('exchanged'))}
            </Text>
          </Pressable>
        );
      })}

      <Text style={s.hint}>
        집계 원칙: 가게에는 노출·조회·교환·사용 횟수만 보여 줘요. 개인의 걸음수·걷기 기록·보상 잔액은 포함하지 않고, 걸음 데이터로 광고 대상을 고르지 않아요.
      </Text>
      <Btn label="가게 성과 기록 초기화" kind="danger" onPress={confirmReset} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48, gap: 10 },
  notice: { backgroundColor: '#FFF4D6', borderRadius: 12, padding: 12 },
  noticeText: { color: '#7A5600', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  lead: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  stat: { width: '48%', backgroundColor: colors.paper, borderRadius: 12, padding: 10 },
  statVal: { fontSize: 20, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.ink, marginTop: 2 },
  statSub: { fontSize: 11, color: colors.muted },
  funnel: { fontSize: 12, color: colors.route, fontWeight: '600', marginTop: 10 },
  hint: { fontSize: 12, color: colors.muted, lineHeight: 17 },
});
