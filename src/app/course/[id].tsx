import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Btn, Tag } from '../../components/ui';
import { distanceM, hasCoord, kakaoRouteUrl, walkMinutes } from '../../lib/geo';
import { openPlace } from '../../lib/nav';
import { useAppStore } from '../../store/AppStore';
import { CATEGORY_ICON, CATEGORY_LABEL, colors } from '../../theme';
import type { Course, CourseStop } from '../../types';

/** F-JIOKIJ 코스 구성 + F-JUUEEV 일정·메모·동선 + F-GKKPJJ 상태·공유 */
export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useAppStore();
  const course = store.courses.find((c) => c.id === id);
  const mapRef = useRef<MapView>(null);

  const mapped = useMemo(
    () => (course?.stops ?? []).map((st, i) => ({ st, i })).filter(({ st }) => hasCoord(st.place)),
    [course?.stops]
  );
  const coords = mapped.map(({ st }) => ({ latitude: st.place.lat, longitude: st.place.lng }));
  const coordKey = coords.map((c) => `${c.latitude},${c.longitude}`).join('|');

  useEffect(() => {
    if (coords.length > 1) {
      mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordKey]);

  if (!store.ready) return null;
  if (!course) {
    return (
      <View style={s.center}>
        <Text style={s.body}>삭제되었거나 찾을 수 없는 코스예요.</Text>
        <Btn label="내 코스로 돌아가기" onPress={() => router.navigate('/courses')} />
      </View>
    );
  }

  const c: Course = course;
  const upd = (fn: (c: Course) => Course) => store.updateCourse(c.id, fn);
  const setStop = (i: number, patch: Partial<CourseStop>) =>
    upd((x) => ({ ...x, stops: x.stops.map((st, j) => (j === i ? { ...st, ...patch } : st)) }));
  const move = (i: number, dir: -1 | 1) =>
    upd((x) => {
      const j = i + dir;
      if (j < 0 || j >= x.stops.length) return x;
      const stops = [...x.stops];
      [stops[i], stops[j]] = [stops[j], stops[i]];
      return { ...x, stops };
    });
  const remove = (i: number) => upd((x) => ({ ...x, stops: x.stops.filter((_, j) => j !== i) }));
  const isEmpty = c.stops.length === 0;
  const addable = store.saved.filter((p) => !c.stops.some((st) => st.place.id === p.id)).slice(0, 10);

  function openRoute(st: CourseStop) {
    Linking.openURL(kakaoRouteUrl(st.place)).catch(() =>
      Alert.alert('길찾기를 열 수 없어요', '카카오맵 앱이나 브라우저를 열 수 있는지 확인해 주세요.')
    );
  }

  async function share() {
    if (isEmpty) { Alert.alert('장소를 먼저 추가해 주세요', '빈 코스는 공유할 수 없어요.'); return; }
    // 공유 내용에는 개인 메모를 넣지 않는다
    const lines = c.stops.map((st, i) =>
      `${i + 1}. ${st.place.name}${st.time ? ` (${st.time})` : ''}\n   ${CATEGORY_LABEL[st.place.category]}, ${st.place.address}\n   ${kakaoRouteUrl(st.place)}`
    );
    try {
      await Share.share({ message: `[${c.name}]\n\n${lines.join('\n\n')}` });
    } catch {
      Alert.alert('공유하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  function toggleDone() {
    if (isEmpty) { Alert.alert('장소를 먼저 추가해 주세요', '빈 코스는 방문 완료로 바꿀 수 없어요.'); return; }
    upd((x) => ({ ...x, status: x.status === 'done' ? 'planning' : 'done' }));
  }

  function confirmDelete() {
    Alert.alert('코스를 삭제할까요?', '삭제한 코스는 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { store.deleteCourse(c.id); router.back(); } },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={s.wrap}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Stack.Screen options={{ title: c.status === 'done' ? '방문 완료한 코스' : '코스 편집' }} />

      <TextInput
        style={s.nameInput}
        value={c.name}
        onChangeText={(name) => upd((x) => ({ ...x, name }))}
        placeholder="코스 이름"
        placeholderTextColor={colors.muted}
      />
      <View style={s.metaRow}>
        {c.status === 'done' ? <Tag label="방문 완료" tone="done" /> : <Tag label="계획 중" tone="route" />}
        <Text style={s.muted}>{c.stops.length}곳</Text>
      </View>

      {coords.length > 0 && (
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={{ latitude: coords[0].latitude, longitude: coords[0].longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
          onMapReady={() => coords.length > 1 &&
            mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: false })}
        >
          {coords.length > 1 && (
            <Polyline coordinates={coords} strokeColor={colors.route} strokeWidth={4} lineDashPattern={[10, 6]} />
          )}
          {mapped.map(({ st, i }) => (
            <Marker
              key={st.place.id}
              coordinate={{ latitude: st.place.lat, longitude: st.place.lng }}
              title={`${i + 1}. ${st.place.name}`}
              description={st.time ? `${st.time} 방문 예정` : undefined}
            >
              <View style={s.pin}><Text style={s.pinText}>{i + 1}</Text></View>
            </Marker>
          ))}
        </MapView>
      )}

      {isEmpty && (
        <View style={s.emptyBox}>
          <Text style={s.body}>아직 담은 장소가 없어요. 추천에서 장소를 고르거나 아래 저장한 장소를 추가해 보세요.</Text>
          <Btn label="추천에서 장소 찾기" onPress={() => router.navigate('/')} />
        </View>
      )}

      {c.stops.map((st, i) => {
        const prev = c.stops[i - 1];
        const gap = prev && hasCoord(prev.place) && hasCoord(st.place) ? distanceM(prev.place, st.place) : null;
        return (
          <View key={st.place.id}>
            {i > 0 && (
              <View style={s.leg}>
                <View style={s.legLine} />
                <Text style={s.legText}>
                  {gap != null ? `도보 약 ${walkMinutes(gap)}분, ${(gap / 1000).toFixed(1)}km` : '위치 정보가 없어 이동 거리를 계산하지 못했어요'}
                </Text>
              </View>
            )}
            <View style={s.stop}>
              <View style={s.stopHead}>
                <View style={s.num}><Text style={s.numText}>{i + 1}</Text></View>
                <Pressable style={{ flex: 1 }} onPress={() => openPlace(st.place)}>
                  <Text style={s.stopName}>{CATEGORY_ICON[st.place.category]} {st.place.name} ›</Text>
                  <Text style={s.muted}>{st.place.categoryName}, {st.place.address}</Text>
                  {!hasCoord(st.place) && <Text style={s.warn}>위치 정보가 없어 지도와 동선에서 빠졌어요.</Text>}
                  {store.hidden[st.place.id] && <Text style={s.warn}>비공개 처리되어 이용할 수 없는 장소예요.</Text>}
                </Pressable>
              </View>
              <View style={s.fields}>
                <TextInput
                  style={[s.input, { width: 90 }]}
                  value={st.time ?? ''}
                  onChangeText={(time) => setStop(i, { time })}
                  placeholder="14:00"
                  placeholderTextColor={colors.muted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  accessibilityLabel="방문 예정 시간"
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={st.memo ?? ''}
                  onChangeText={(memo) => setStop(i, { memo })}
                  placeholder="나만 보는 메모"
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="개인 메모"
                />
              </View>
              <View style={s.stopActions}>
                <Small label="위로" onPress={() => move(i, -1)} disabled={i === 0} />
                <Small label="아래로" onPress={() => move(i, 1)} disabled={i === c.stops.length - 1} />
                <Small label="길찾기" onPress={() => openRoute(st)} disabled={!hasCoord(st.place)} />
                <Small label="빼기" onPress={() => remove(i)} danger />
              </View>
            </View>
          </View>
        );
      })}

      {addable.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={s.section}>저장한 장소에서 추가</Text>
          {addable.map((p) => (
            <View key={p.id} style={s.addRow}>
              <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>{CATEGORY_ICON[p.category]} {p.name}</Text>
              <Small label="추가" onPress={() => store.addPlaceToCourse(c.id, p)} />
            </View>
          ))}
        </View>
      )}

      <View style={s.bottom}>
        <Btn label="동행자에게 공유" kind="primary" onPress={share} disabled={isEmpty} />
        <Btn label={c.status === 'done' ? '계획 중으로 되돌리기' : '방문 완료로 표시'} onPress={toggleDone} disabled={isEmpty} />
        <Btn label="코스 삭제" kind="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

function Small({ label, onPress, disabled, danger }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} hitSlop={6}>
      <Text style={[s.small, danger && { color: colors.rose }, disabled && { opacity: 0.3 }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.paper },
  nameInput: { fontSize: 24, fontWeight: '800', color: colors.ink, paddingVertical: 4, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 16 },
  muted: { fontSize: 13, color: colors.muted, marginTop: 2 },
  body: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  warn: { fontSize: 12, color: colors.rose, marginTop: 4 },
  map: { height: 240, borderRadius: 16, marginBottom: 20 },
  pin: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.route, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  pinText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  emptyBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.line },
  leg: { flexDirection: 'row', alignItems: 'center', marginLeft: 13, minHeight: 40 },
  legLine: { width: 2, alignSelf: 'stretch', backgroundColor: colors.route, opacity: 0.35, marginRight: 22 },
  legText: { fontSize: 12, color: colors.route, fontWeight: '600' },
  stop: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line },
  stopHead: { flexDirection: 'row', gap: 12 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.route, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stopName: { fontSize: 16, fontWeight: '700', color: colors.ink },
  fields: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: {
    backgroundColor: colors.paper, borderRadius: 10, paddingHorizontal: 12, minHeight: 40,
    fontSize: 14, color: colors.ink, borderWidth: 1, borderColor: colors.line,
  },
  stopActions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  small: { fontSize: 14, fontWeight: '600', color: colors.muted },
  section: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  bottom: { gap: 10, marginTop: 28 },
});
