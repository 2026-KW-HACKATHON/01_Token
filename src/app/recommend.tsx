import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Chip, Tag } from '../components/ui';
import { getRecommendations, type RecommendResult } from '../lib/recommend';
import { useAppStore } from '../store/AppStore';
import { CATEGORY_ICON, CATEGORY_LABEL, colors } from '../theme';
import type { Category, Place, Prefs, RecCourse, ScoredPlace } from '../types';

type Filter = Category | 'ALL';
const FILTERS: Filter[] = ['ALL', 'FOOD', 'CAFE', 'SPOT'];

/** F-IBCYQW 개인화 장소 추천 + F-CZKUBF 코스 추천·피드백 */
export default function RecommendScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const store = useAppStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');

  const prefs: Prefs = useMemo(() => ({
    region: params.region || undefined,
    lat: params.lat ? Number(params.lat) : undefined,
    lng: params.lng ? Number(params.lng) : undefined,
    purpose: params.purpose || undefined,
    mood: params.mood || undefined,
    budget: params.budget || undefined,
    timeSlot: params.timeSlot || undefined,
  }), [params.region, params.lat, params.lng, params.purpose, params.mood, params.budget, params.timeSlot]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = storeRef.current;
      const r = await getRecommendations(prefs, new Set(st.saved.map((p) => p.id)), new Set(Object.keys(st.feedback)));
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : '추천을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [prefs]);

  useEffect(() => { if (store.ready) load(); }, [store.ready, load]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={colors.rose} /><Text style={s.muted}>주변 장소를 모으는 중</Text></View>;
  }
  if (error || !result) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{error}</Text>
        <Btn label="다시 시도" onPress={load} />
      </View>
    );
  }

  const courses = result.courses.filter(
    (c) => !store.feedback[`course:${c.key}`] && !c.stops.some((p) => store.feedback[p.id])
  );
  const places = result.places
    .filter((sp) => !store.feedback[sp.place.id])
    .filter((sp) => filter === 'ALL' || sp.place.category === filter)
    .slice(0, 20);

  function saveCourse(c: RecCourse) {
    const id = store.createCourse(`${result!.center.label} 데이트`, c.stops, c.key);
    router.push({ pathname: '/course/[id]', params: { id } });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={s.h1}>{result.center.label} 추천 코스</Text>
      <Text style={s.muted}>
        {result.order.map((c) => CATEGORY_LABEL[c]).join(' → ')} 순서로 걷기 좋은 조합을 골랐어요.
      </Text>

      {courses.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>
            이 조건으로는 식사, 카페, 산책을 모두 갖춘 코스를 만들지 못했어요. 분위기나 예산을 '상관없음'으로 바꾸거나 다른 시간대, 다른 지역으로 다시 찾아보세요.
          </Text>
          <Btn label="조건 바꾸기" onPress={() => router.back()} />
        </View>
      ) : (
        courses.map((c) => (
          <CourseCard
            key={c.key}
            course={c}
            onSave={() => saveCourse(c)}
            onDislike={() => store.giveFeedback(`course:${c.key}`, 'dislike')}
          />
        ))
      )}

      <Text style={[s.h1, { marginTop: 28 }]}>추천 장소</Text>
      <View style={s.filters}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f === 'ALL' ? '전체' : CATEGORY_LABEL[f]} on={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      {places.length === 0 && <Text style={s.muted}>이 분류에는 남은 추천 장소가 없어요.</Text>}
      {places.map((sp) => (
        <PlaceCard key={sp.place.id} sp={sp} />
      ))}
    </ScrollView>
  );
}

function CourseCard({ course, onSave, onDislike }: { course: RecCourse; onSave: () => void; onDislike: () => void }) {
  return (
    <View style={s.card}>
      {course.stops.map((p, i) => (
        <View key={p.id} style={s.stopRow}>
          <View style={s.rail}>
            <View style={s.dot}><Text style={s.dotText}>{i + 1}</Text></View>
            {i < course.stops.length - 1 && <View style={s.railLine} />}
          </View>
          <View style={{ flex: 1, paddingBottom: 14 }}>
            <Text style={s.name}>{p.name}</Text>
            <Text style={s.meta}>{CATEGORY_LABEL[p.category]}, {p.categoryName}</Text>
          </View>
        </View>
      ))}
      <View style={s.tags}>{course.reasons.map((r) => <Tag key={r} label={r} tone="route" />)}</View>
      <View style={s.row}>
        <Btn label="이 코스 저장" kind="primary" onPress={onSave} style={{ flex: 1 }} />
        <Btn label="관심 없음" onPress={onDislike} />
      </View>
    </View>
  );
}

function PlaceCard({ sp }: { sp: ScoredPlace }) {
  const store = useAppStore();
  const p: Place = sp.place;
  const saved = store.isSaved(p.id);
  return (
    <View style={s.card}>
      <View style={s.placeHead}>
        <View style={s.icon}><Text style={{ fontSize: 22 }}>{CATEGORY_ICON[p.category]}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.meta} numberOfLines={1}>{p.categoryName}, {p.address}</Text>
        </View>
      </View>
      <View style={s.tags}>{sp.reasons.map((r) => <Tag key={r} label={r} />)}</View>
      <View style={s.actions}>
        <Action label={saved ? '저장됨' : '저장'} on={saved} onPress={() => store.toggleSave(p)} />
        <Action label="코스에 추가" onPress={() => router.push({ pathname: '/pick-course', params: { place: JSON.stringify(p) } })} />
        <Action label="지도" onPress={() => Linking.openURL(p.url)} />
        <Action label="숨김" onPress={() => store.giveFeedback(p.id, 'hide')} />
        <Action label="관심 없음" onPress={() => store.giveFeedback(p.id, 'dislike')} />
      </View>
    </View>
  );
}

function Action({ label, onPress, on }: { label: string; onPress: () => void; on?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6}>
      <Text style={[s.action, on && { color: colors.rose, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.paper },
  h1: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 4, letterSpacing: -0.3 },
  muted: { fontSize: 13, color: colors.muted, marginBottom: 14 },
  errorText: { fontSize: 15, color: colors.ink, textAlign: 'center', lineHeight: 22 },
  empty: { backgroundColor: colors.card, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.line },
  emptyText: { fontSize: 14, lineHeight: 21, color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  stopRow: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 26 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.route, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  railLine: { flex: 1, width: 2, backgroundColor: colors.routeSoft, marginVertical: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  placeHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  action: { fontSize: 14, color: colors.muted, fontWeight: '600' },
});
