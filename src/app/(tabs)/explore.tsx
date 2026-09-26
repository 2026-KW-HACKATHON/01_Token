import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { CAT_GROUPS, searchNearby } from '../../api/kakao';
import { PlaceThumb } from '../../components/PlaceThumb';
import { Btn, Chip, inputStyle, Tag } from '../../components/ui';
import { distanceM, kakaoRouteUrl, walkMinutes } from '../../lib/geo';
import { OPEN_LABEL, openState } from '../../lib/hours';
import { openPlace } from '../../lib/nav';
import { naverEnabled, popularMap } from '../../lib/popular';
import { hintHit, SEARCH_PURPOSES } from '../../lib/purpose';
import { filterLocal, resolveCenter } from '../../lib/recommend';
import { summarize, trustScore } from '../../lib/reviews';
import { excludedIds, useAppStore } from '../../store/AppStore';
import { CATEGORY_LABEL, colors } from '../../theme';
import type { Category, Place } from '../../types';

type Cat = Category | 'ALL';
type Sort = 'distance' | 'popular' | 'trust' | 'fit';
const RADII = [500, 1000, 2000];
const SORT_LABEL: Record<Sort, string> = { distance: '거리순', popular: '인기순', trust: '신뢰도순', fit: '적합도순' };
const km = (m: number) => (m >= 1000 ? `${m / 1000}km` : `${m}m`);

/** F-LBUGRG 위치·상권 검색 + F-NACDUD 필터·정렬 + F-EIPVIV 결과 없음 대안 */
export default function Explore() {
  const store = useAppStore();
  const [region, setRegion] = useState('성수동');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searched, setSearched] = useState<{ center: { lat: number; lng: number; label: string }; places: Place[]; chains: number; keyword: string; popular: Map<string, string> } | null>(null);
  const [loading, setLoading] = useState(false);

  const [cat, setCat] = useState<Cat>('ALL');
  const [radius, setRadius] = useState(1000);
  const [purpose, setPurpose] = useState<string>();
  const [openNow, setOpenNow] = useState(false);
  const [sort, setSort] = useState<Sort>('distance');

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한이 꺼져 있어요', '동네나 상권 이름을 직접 입력해서 찾아보세요.');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      Alert.alert('현재 위치를 확인하지 못했어요', '동네나 상권 이름을 직접 입력해 주세요.');
    }
  }

  async function search(kw = keyword) {
    setLoading(true);
    try {
      const center = await resolveCenter(coords ? { ...coords } : { region: region.trim() });
      const groups = Object.values(CAT_GROUPS).flat();
      const res = await Promise.all(groups.map((group) =>
        searchNearby({ group, lat: center.lat, lng: center.lng, radius: 2000, pages: 3, sort: 'distance', keyword: kw.trim() || undefined })));
      const { list, chainExcluded } = filterLocal(res.flat(), excludedIds(store));
      const popular = await popularMap(center.area, list, purpose);
      setSearched({ center, places: list, chains: chainExcluded, keyword: kw.trim(), popular });
    } catch (e) {
      Alert.alert('검색하지 못했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  const purposeObj = SEARCH_PURPOSES.find((p) => p.key === purpose);

  const results = useMemo(() => {
    if (!searched) return [];
    const rows = searched.places
      .filter((p) => !store.hidden[p.id] && !store.feedback[p.id])
      .map((p) => {
        const d = distanceM(searched.center, p);
        const sum = summarize(store.reviews, p.id);
        const hit = purposeObj ? hintHit(p.categoryPath, purposeObj.hints) : undefined;
        const avoid = purposeObj ? hintHit(p.categoryPath, purposeObj.avoid) : undefined;
        return { p, d, sum, hit, avoid, state: openState(store.placeInfo[p.id]), hot: searched.popular.get(p.id) };
      })
      .filter((r) => r.d <= radius)
      .filter((r) => cat === 'ALL' || r.p.category === cat)
      .filter((r) => !purposeObj || (r.hit && !r.avoid))
      .filter((r) => !openNow || r.state === 'open');
    const fit = (r: (typeof rows)[number]) =>
      (r.hit ? 30 : 0) + (r.hot ? 20 : 0) + (store.isSaved(r.p.id) ? 10 : 0) + (r.sum ? r.sum.avg * 4 : 0) - r.d / 100;
    return rows.sort((a, b) =>
      sort === 'distance' ? a.d - b.d
        : sort === 'popular' ? Number(Boolean(b.hot)) - Number(Boolean(a.hot)) || trustScore(b.sum) - trustScore(a.sum) || a.d - b.d
          : sort === 'trust' ? trustScore(b.sum) - trustScore(a.sum) || a.d - b.d
            : fit(b) - fit(a));
  }, [searched, store, radius, cat, purposeObj, openNow, sort]);

  const active: { label: string; clear: () => void }[] = [
    ...(cat !== 'ALL' ? [{ label: CATEGORY_LABEL[cat], clear: () => setCat('ALL') }] : []),
    ...(purposeObj ? [{ label: purposeObj.label, clear: () => setPurpose(undefined) }] : []),
    ...(openNow ? [{ label: '영업 중', clear: () => setOpenNow(false) }] : []),
    ...(searched?.keyword ? [{ label: `'${searched.keyword}'`, clear: () => { setKeyword(''); search(''); } }] : []),
  ];
  const reset = () => { setCat('ALL'); setPurpose(undefined); setOpenNow(false); setRadius(1000); setSort('distance'); };

  // 결과 없음: 조건 하나씩만 완화한 대안 (S-DTPXYH)
  const alternatives: { label: string; run: () => void }[] = [
    ...(radius < 2000 ? [{ label: `반경 ${km(RADII[RADII.indexOf(radius) + 1])}로 넓히기`, run: () => setRadius(RADII[RADII.indexOf(radius) + 1]) }] : []),
    ...(openNow ? [{ label: '영업시간 미확인 가게도 보기', run: () => setOpenNow(false) }] : []),
    ...(purposeObj ? [{ label: '방문 목적 조건 빼기', run: () => setPurpose(undefined) }] : []),
    ...(cat !== 'ALL' ? (['FOOD', 'CAFE', 'SPOT'] as Category[]).filter((c) => c !== cat).map((c) => ({ label: `${CATEGORY_LABEL[c]} 보기`, run: () => setCat(c) })) : []),
    ...(searched?.keyword ? [{ label: '키워드 없이 찾기', run: () => { setKeyword(''); search(''); } }] : []),
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.row}>
        <TextInput
          style={[inputStyle, { flex: 1 }, coords && { color: colors.muted }]}
          value={coords ? '현재 위치 사용 중' : region}
          editable={!coords}
          onChangeText={setRegion}
          placeholder="동네·상권 (예: 망원동)"
          placeholderTextColor={colors.muted}
        />
        {coords ? <Btn label="직접 입력" onPress={() => setCoords(null)} /> : <Btn label="현재 위치" onPress={useMyLocation} />}
      </View>
      <View style={[s.row, { marginTop: 8 }]}>
        <TextInput
          style={[inputStyle, { flex: 1 }]}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="음식 종류·가게 이름 (선택)"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          onSubmitEditing={() => search()}
        />
        <Btn label="검색" kind="primary" onPress={() => search()} />
      </View>

      <View style={s.chips}>
        {(['ALL', 'FOOD', 'CAFE', 'SPOT'] as Cat[]).map((c) => (
          <Chip key={c} label={c === 'ALL' ? '전체' : CATEGORY_LABEL[c]} on={cat === c} onPress={() => setCat(c)} />
        ))}
      </View>
      <View style={s.chips}>
        {RADII.map((r) => <Chip key={r} label={km(r)} on={radius === r} onPress={() => setRadius(r)} />)}
        <Chip label="영업 중" on={openNow} onPress={() => setOpenNow(!openNow)} />
      </View>
      <View style={s.chips}>
        {SEARCH_PURPOSES.map((p) => (
          <Chip key={p.key} label={p.label} on={purpose === p.key} onPress={() => setPurpose(purpose === p.key ? undefined : p.key)} />
        ))}
      </View>
      <View style={s.chips}>
        {(Object.keys(SORT_LABEL) as Sort[]).map((k) => (
          <Chip key={k} label={SORT_LABEL[k]} muted on={sort === k} onPress={() => setSort(k)} />
        ))}
      </View>
      <Text style={s.hint}>
        방문 목적은 가게 분류로 추정하고, 영업 중은 운영자가 등록한 영업시간으로만 판단해요. 인기순은 네이버 카페·블로그 리뷰가 많은 동네 가게를, 신뢰도순은 방문 인증 후기가 많은 곳을 먼저 보여 줘요.{naverEnabled ? '' : ' (네이버 키가 없어 인기 정보는 꺼져 있어요)'}
      </Text>

      {loading && <ActivityIndicator color={colors.rose} style={{ marginTop: 24 }} />}

      {!loading && searched && (
        <>
          <View style={s.activeRow}>
            <Text style={s.activeText}>{searched.center.label} 반경 {km(radius)}, {SORT_LABEL[sort]}</Text>
            {active.map((a) => (
              <Pressable key={a.label} onPress={a.clear} style={s.activeChip}><Text style={s.activeChipText}>{a.label} ✕</Text></Pressable>
            ))}
            {active.length > 0 && <Pressable onPress={reset}><Text style={s.link}>전체 초기화</Text></Pressable>}
          </View>
          {searched.chains > 0 && <Text style={s.hint}>프랜차이즈 {searched.chains}곳은 동네 가게를 위해 제외했어요.</Text>}

          {results.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>조건에 맞는 동네 가게가 없어요</Text>
              <Text style={s.hint}>지금 조건: {[searched.center.label, `반경 ${km(radius)}`, ...active.map((a) => a.label)].join(', ')}</Text>
              {alternatives.length ? alternatives.map((a) => <Btn key={a.label} label={a.label} onPress={a.run} style={{ marginTop: 8 }} />)
                : <Text style={s.body}>다른 동네나 상권 이름으로 다시 검색해 보세요.</Text>}
              {active.length > 0 && <Btn label="필터 전체 초기화" onPress={reset} style={{ marginTop: 8 }} />}
            </View>
          ) : (
            <>
              <Text style={s.count}>{results.length}곳</Text>
              {results.slice(0, 40).map(({ p, d, sum, state, hot }, i) => (
                <Pressable key={p.id} onPress={() => openPlace(p)} style={({ pressed }) => [s.item, pressed && { opacity: 0.7 }]}>
                  <PlaceThumb place={p} size={52} enabled={i < 15} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{p.name}</Text>
                    <Text style={s.meta}>{p.categoryName}, {d <= 1000 ? `도보 ${walkMinutes(d)}분` : `${(d / 1000).toFixed(1)}km`}</Text>
                    <View style={s.tags}>
                      {hot && <Tag label="🔥 인기" />}
                      <Tag label={OPEN_LABEL[state]} tone={state === 'open' ? 'done' : state === 'closed' ? 'rose' : 'muted'} />
                      {sum && <Tag label={`★${sum.avg.toFixed(1)} 후기 ${sum.count}`} tone="route" />}
                      {sum?.verified ? <Tag label={`인증 ${sum.verified}`} tone="done" /> : null}
                    </View>
                  </View>
                  <Pressable hitSlop={8} onPress={() => Linking.openURL(kakaoRouteUrl(p)).catch(() => Alert.alert('길찾기를 열 수 없어요'))}>
                    <Text style={s.link}>길찾기</Text>
                  </Pressable>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}

      {!loading && !searched && (
        <Text style={[s.body, { marginTop: 24 }]}>동네나 상권을 입력하고 검색을 눌러 보세요. 프랜차이즈를 뺀 동네 가게만 보여 드려요.</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  row: { flexDirection: 'row', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 10, lineHeight: 17 },
  body: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  activeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 20 },
  activeText: { fontSize: 13, fontWeight: '700', color: colors.ink, marginRight: 4 },
  activeChip: { backgroundColor: colors.roseSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  activeChipText: { color: colors.rose, fontSize: 12, fontWeight: '600' },
  link: { fontSize: 13, color: colors.route, fontWeight: '600' },
  count: { fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 6 },
  empty: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.line,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
