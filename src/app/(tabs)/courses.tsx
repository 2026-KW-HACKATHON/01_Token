import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Tag } from '../../components/ui';
import { useAppStore } from '../../store/AppStore';
import { colors } from '../../theme';
import { openPlace } from '../../lib/nav';
import { purposeOf } from '../../lib/purpose';
import { CATEGORY_ICON } from '../../theme';
import type { Course } from '../../types';

/** F-GKKPJJ 코스 목록·상태 */
export default function CoursesScreen() {
  const store = useAppStore();
  const planning = store.courses.filter((c) => c.status === 'planning');
  const done = store.courses.filter((c) => c.status === 'done');

  function create() {
    const id = store.createCourse('새 데이트 코스');
    router.push({ pathname: '/course/[id]', params: { id } });
  }

  const savedList = (
    <>
      <Text style={[s.section, { marginTop: 24 }]}>저장한 장소 {store.saved.length}</Text>
      {store.saved.map((p) => (
        <Pressable key={p.id} onPress={() => openPlace(p)} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
          <Text style={{ fontSize: 20 }}>{CATEGORY_ICON[p.category]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{p.name}</Text>
            <Text style={s.date}>{p.categoryName}{store.hidden[p.id] ? ', 이용할 수 없는 장소' : ''}</Text>
          </View>
        </Pressable>
      ))}
    </>
  );

  if (store.ready && store.courses.length === 0 && store.saved.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>아직 만든 코스나 저장한 장소가 없어요</Text>
        <Text style={s.emptyText}>코스 찾기에서 추천을 받아 저장하거나, 빈 코스를 만들어 장소를 직접 담아 보세요.</Text>
        <Btn label="추천 받으러 가기" kind="primary" onPress={() => router.navigate('/')} />
        <Btn label="빈 코스 만들기" onPress={create} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Btn label="새 코스 만들기" onPress={create} style={{ marginBottom: 20 }} />
      {planning.length > 0 && <Text style={s.section}>계획 중</Text>}
      {planning.map((c) => <CourseRow key={c.id} c={c} />)}
      {done.length > 0 && <Text style={[s.section, { marginTop: 20 }]}>방문 완료</Text>}
      {done.map((c) => <CourseRow key={c.id} c={c} />)}
      {store.saved.length > 0 && savedList}
    </ScrollView>
  );
}

function CourseRow({ c }: { c: Course }) {
  const first = c.stops[0]?.place.name;
  const d = new Date(c.updatedAt);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/course/[id]', params: { id: c.id } })}
      style={({ pressed }) => [s.row, c.status === 'done' && s.rowDone, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{c.name}</Text>
        <Text style={s.meta}>
          {first ? (c.stops.length > 1 ? `${first} 외 ${c.stops.length - 1}곳` : first) : '담은 장소 없음'}
        </Text>
        <Text style={s.date}>{purposeOf(c.purpose)?.label ? `${purposeOf(c.purpose)!.label}, ` : ''}{d.getMonth() + 1}월 {d.getDate()}일 수정</Text>
      </View>
      {c.status === 'done' ? <Tag label="방문 완료" tone="done" /> : <Tag label={`${c.stops.length}곳`} tone="route" />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48 },
  section: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 10,
  },
  rowDone: { backgroundColor: colors.paper },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.ink, marginTop: 4 },
  date: { fontSize: 12, color: colors.muted, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.paper },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  emptyText: { fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 8 },
});
