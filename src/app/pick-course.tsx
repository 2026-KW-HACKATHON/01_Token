import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Tag } from '../components/ui';
import { useAppStore } from '../store/AppStore';
import { colors } from '../theme';
import type { Place } from '../types';

/** 장소를 기존 코스나 새 코스에 추가 (F-JIOKIJ) */
export default function PickCourse() {
  const { place: raw } = useLocalSearchParams<{ place: string }>();
  const store = useAppStore();
  const place = useMemo<Place | null>(() => {
    try { return JSON.parse(raw); } catch { return null; }
  }, [raw]);

  if (!place) return <View style={s.wrap}><Text>장소 정보를 읽지 못했어요. 이전 화면에서 다시 선택해 주세요.</Text></View>;

  function add(courseId: string) {
    const r = store.addPlaceToCourse(courseId, place!);
    if (r === 'duplicate') {
      Alert.alert('이미 들어 있는 장소예요', `${place!.name}은(는) 이 코스에 이미 추가되어 있어요.`);
      return;
    }
    router.back();
  }

  function createNew() {
    const id = store.createCourse(`${place!.name}에서 시작하는 코스`, [place!]);
    router.replace({ pathname: '/course/[id]', params: { id } });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={s.title}>{place.name}을(를) 어느 코스에 넣을까요?</Text>
      <Btn label="새 코스 만들기" kind="primary" onPress={createNew} />
      <View style={{ height: 16 }} />
      {store.courses.map((c) => {
        const has = c.stops.some((st) => st.place.id === place.id);
        return (
          <Pressable key={c.id} onPress={() => add(c.id)} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{c.name}</Text>
              <Text style={s.meta}>{c.stops.length}곳</Text>
            </View>
            {has ? <Tag label="추가됨" tone="route" /> : c.status === 'done' ? <Tag label="방문 완료" tone="done" /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 16, lineHeight: 28 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
