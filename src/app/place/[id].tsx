import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { dongOf, FOCUS_DONG } from '../../lib/focus';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { naverMapUrl } from '../../api/naver';
import { PlaceHero } from '../../components/PlaceThumb';
import { Btn, cardStyle, Section, Tag } from '../../components/ui';
import { hasCoord, kakaoRouteUrl } from '../../lib/geo';
import { closedDaysText, hoursText, OPEN_LABEL, openState, paymentLabel, perkActive, perkWindow } from '../../lib/hours';
import { residentBadge } from '../../lib/local';
import { monthLabel, parsePlace } from '../../lib/nav';
import { summarize } from '../../lib/reviews';
import { useAppStore } from '../../store/AppStore';
import { CATEGORY_ICON, CATEGORY_LABEL, colors } from '../../theme';
import type { Place } from '../../types';

/** F-INXTDD 장소 상세 + F-WDURRY 방문 실행·저장 + F-RXNEQL 오류 신고 + F-UZFCSU 후기 확인 */
export default function PlaceDetail() {
  const { p } = useLocalSearchParams<{ p: string }>();
  const place = parsePlace(p);
  const store = useAppStore();
  const [dong, setDong] = useState<string | null>(place?.dong ?? null);
  useEffect(() => {
    let alive = true;
    const pl = parsePlace(p);
    if (pl && !pl.dong) dongOf(pl).then((d) => { if (alive) setDong(d); });
    return () => { alive = false; };
  }, [p]);
  if (!place) return <View style={s.center}><Text>장소 정보를 읽지 못했어요. 이전 화면에서 다시 선택해 주세요.</Text></View>;

  const pl: Place = place;
  const info = store.placeInfo[pl.id];
  const state = openState(info);
  const hidden = store.hidden[pl.id];
  const saved = store.isSaved(pl.id);
  const reviews = store.reviews.filter((r) => r.placeId === pl.id);
  const sum = summarize(store.reviews, pl.id);
  const myRequest = store.ownerRequests.find((r) => r.place.id === pl.id && r.status !== 'rejected');
  const isOwner = store.isOwnerOf(pl.id);

  const open = (url: string, fail: string) =>
    Linking.openURL(url).catch(() => Alert.alert('열 수 없어요', fail));

  function hide() {
    Alert.alert('비공개 사유를 고르세요', '비공개한 장소는 추천과 검색에서 빠져요.', [
      { text: '중복 장소', onPress: () => store.hidePlace(pl, '중복 장소') },
      { text: '허위 정보', onPress: () => store.hidePlace(pl, '허위 정보') },
      { text: '취소', style: 'cancel' },
    ]);
  }

  const rows: [string, string | undefined][] = [
    ['주소', pl.address + (dong ? ` (${dong})` : '')],
    ['영업시간', hoursText(info)],
    ['휴무일', closedDaysText(info)],
    ['대표 메뉴·가격', info?.menu],
    ['소개', info?.intro],
    ['결제수단', info?.payments?.length ? info.payments.map(paymentLabel).join(', ') : undefined],
    ['전화', pl.phone],
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: pl.name }} />
      {hidden && (
        <View style={s.banner}><Text style={s.bannerText}>관리자가 비공개 처리한 장소예요 ({hidden.reason}). 추천과 검색에 나오지 않아요.</Text></View>
      )}

      <PlaceHero place={pl} />
      <View style={s.head}>
        <View style={s.icon}><Text style={{ fontSize: 26 }}>{CATEGORY_ICON[pl.category]}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{pl.name}</Text>
          <Text style={s.muted}>{CATEGORY_LABEL[pl.category]}, {pl.categoryName}</Text>
          <View style={s.tags}>
            {dong === FOCUS_DONG && <Tag label={`📍 ${FOCUS_DONG} 동네 가게`} tone="route" />}
            <Tag label={OPEN_LABEL[state]} tone={state === 'open' ? 'done' : state === 'closed' ? 'rose' : 'muted'} />
            {info && <Tag label="운영자 확인 정보" tone="route" />}
            {sum && <Tag label={`후기 ${sum.count} (인증 ${sum.verified})`} tone="route" />}
          </View>
        </View>
      </View>

      {info?.perk && (
        <View style={[s.perk, perkActive(info) && s.perkOn]}>
          <Text style={s.perkTitle}>🎁 동네 혜택{perkActive(info) && perkWindow(info) ? ' · 지금 혜택 시간' : ''}</Text>
          <Text style={s.body}>{info.perk}</Text>
          <Text style={s.muted}>{perkWindow(info) ? `적용 시간 ${perkWindow(info)}` : '영업시간 내내 적용'}, 결제 전 "앱 보고 왔어요"라고 말해 주세요.</Text>
        </View>
      )}

      <View style={s.actions}>
        <Btn label={saved ? '저장됨' : '저장'} kind={saved ? 'primary' : 'ghost'} onPress={() => store.toggleSave(pl)} style={{ flex: 1 }} />
        <Btn label="코스에 추가" onPress={() => router.push({ pathname: '/pick-course', params: { place: JSON.stringify(pl) } })} style={{ flex: 1 }} />
      </View>
      <View style={s.actions}>
        <Btn label="전화" disabled={!pl.phone} onPress={() => open(`tel:${pl.phone}`, '이 기기에서 전화를 걸 수 없어요.')} style={{ flex: 1 }} />
        <Btn label="카카오맵" onPress={() => open(pl.url, '카카오맵을 열 수 없어요.')} style={{ flex: 1 }} />
        <Btn label="네이버" onPress={() => open(naverMapUrl(pl.name), '네이버 지도를 열 수 없어요.')} style={{ flex: 1 }} />
        <Btn label="길찾기" disabled={!hasCoord(pl)} onPress={() => open(kakaoRouteUrl(pl), '길찾기를 열 수 없어요.')} style={{ flex: 1 }} />
      </View>

      {hasCoord(pl) && (
        <MapView
          style={s.map}
          scrollEnabled={false}
          initialRegion={{ latitude: pl.lat, longitude: pl.lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
        >
          <Marker coordinate={{ latitude: pl.lat, longitude: pl.lng }} title={pl.name} />
        </MapView>
      )}

      <View style={cardStyle}>
        {rows.map(([k, v]) => (
          <View key={k} style={s.row}>
            <Text style={s.rowKey}>{k}</Text>
            <Text style={[s.rowVal, !v && s.unknown]}>{v || (k === '전화' ? '미등록' : '미확인')}</Text>
          </View>
        ))}
        <View style={s.row}>
          <Text style={s.rowKey}>사진</Text>
          <Text style={[s.rowVal, s.unknown]}>운영자 등록 사진 없음 (위 사진은 검색 이미지)</Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: '/report', params: { p: JSON.stringify(pl) } })}>
          <Text style={s.link}>정보가 틀렸나요? 수정 요청하기</Text>
        </Pressable>
      </View>

      <Section
        title="방문 후기"
        right={<Btn label="후기 쓰기" onPress={() => router.push({ pathname: '/review/[id]', params: { id: pl.id, p: JSON.stringify(pl) } })} />}
      >
        {sum ? (
          <View style={[cardStyle, { backgroundColor: colors.routeSoft, borderColor: colors.routeSoft }]}>
            <Text style={s.body}>
              만족도 평균 {sum.avg.toFixed(1)}점, 재방문 의향 {Math.round(sum.revisitRate * 100)}%, 방문 인증 {sum.verified}개
            </Text>
            <Text style={s.muted}>
              동행 유형: {Object.entries(sum.companions).map(([k, v]) => `${k} ${v}`).join(', ')}
            </Text>
          </View>
        ) : (
          <Text style={s.muted}>아직 후기가 없어요. 다녀왔다면 첫 후기를 남겨 주세요.</Text>
        )}
        {reviews.map((r) => (
          <View key={r.id} style={cardStyle}>
            <View style={s.tags}>
              {residentBadge(r, store.home, store.reviews) && <Tag label="🏠 주민 추천" tone="rose" />}
              {r.verified ? <Tag label="방문 인증" tone="done" /> : <Tag label="일반 후기" tone="muted" />}
              <Tag label={`${'★'.repeat(r.satisfaction)}${'☆'.repeat(5 - r.satisfaction)}`} />
            </View>
            <Text style={s.muted}>
              {monthLabel(r.visitedMonth)} 방문, {r.companion}와(과), 분위기 {r.mood}, 가격 {r.priceFeel}, {r.revisit ? '다시 갈래요' : '재방문은 글쎄요'}
            </Text>
            {r.text ? <Text style={[s.body, { marginTop: 6 }]}>{r.text}</Text> : null}
            <Pressable onPress={() => router.push({ pathname: '/review/[id]', params: { id: pl.id, p: JSON.stringify(pl), edit: r.id } })}>
              <Text style={s.link}>{r.verified ? '수정하기' : '수정하기 또는 방문 인증하기'}</Text>
            </Pressable>
          </View>
        ))}
      </Section>

      {store.role === 'owner' && (
        <Section title="매장 운영">
          {isOwner ? (
            <Btn label="영업 정보 수정 요청" kind="primary"
              onPress={() => router.push({ pathname: '/owner-edit', params: { p: JSON.stringify(pl) } })} />
          ) : myRequest ? (
            <Text style={s.muted}>운영 권한 신청이 접수됐어요. 관리자 승인을 기다리는 중이에요.</Text>
          ) : (
            <Btn label="이 가게 운영 권한 신청" onPress={() => router.push({ pathname: '/owner-apply', params: { p: JSON.stringify(pl) } })} />
          )}
        </Section>
      )}

      {store.role === 'admin' && (
        <Section title="관리자">
          {hidden
            ? <Btn label="다시 공개하기" onPress={() => store.unhidePlace(pl.id)} />
            : <Btn label="이 장소 비공개 처리" kind="danger" onPress={hide} />}
        </Section>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  banner: { backgroundColor: colors.roseSoft, borderRadius: 12, padding: 12, marginBottom: 14 },
  bannerText: { color: colors.rose, fontSize: 13, lineHeight: 19 },
  head: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  icon: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  muted: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 19 },
  body: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  map: { height: 170, borderRadius: 16, marginVertical: 12 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  rowKey: { width: 92, fontSize: 13, color: colors.muted },
  rowVal: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 20 },
  unknown: { color: colors.muted, fontStyle: 'italic' },
  perk: { backgroundColor: colors.doneSoft, borderRadius: 14, padding: 14, marginBottom: 12 },
  perkOn: { borderWidth: 2, borderColor: colors.done },
  perkTitle: { fontSize: 14, fontWeight: '800', color: colors.done, marginBottom: 4 },
  link: { fontSize: 13, color: colors.route, fontWeight: '600', marginTop: 12 },
});
