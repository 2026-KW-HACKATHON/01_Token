import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapFallback } from '../../components/MapFallback';
import { CAN_EMBED_MAP, naverWalkUrl } from '../../lib/mapSupport';
import { Btn, cardStyle, Section, Tag } from '../../components/ui';
import { storeById, won } from '../../data/walkStores';
import { kakaoRouteUrl } from '../../lib/geo';
import { COUPON_COST } from '../../lib/rewards';
import { useWalk } from '../../store/WalkStore';
import { colors } from '../../theme';

/** 월계 들름길 — 가게 상세·쿠폰 교환 (시연용 가상 가게) */
export default function StoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = storeById(id);
  const w = useWalk();
  const logStore = w.logStore;

  // 상세 조회 기록 (화면을 열 때마다 1회)
  useEffect(() => {
    if (id && storeById(id)) logStore([id], 'view');
  }, [logStore, id]);

  if (!st) {
    return <View style={s.center}><Text style={s.body}>가게 정보를 찾지 못했어요.</Text></View>;
  }
  const store = st;
  const myCoupons = w.rewards.coupons.filter((c) => c.storeId === store.id);
  const enough = w.rewards.balance >= COUPON_COST;

  function openRoute() {
    Linking.openURL(naverWalkUrl(store)).catch(() =>
      Linking.openURL(kakaoRouteUrl(store)).catch(() => Alert.alert('길찾기를 열 수 없어요', '네이버 지도나 카카오맵 앱을 확인해 주세요.')));
  }

  function onExchange() {
    Alert.alert(
      '쿠폰으로 교환할까요?',
      `보상 ${COUPON_COST}개를 사용해 ${store.name} 쿠폰 1장을 받아요.\n교환 후 다른 가게 쿠폰으로 바꿀 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '교환하기',
          onPress: () => {
            const c = w.exchangeFor(store.id, store.validDays);
            if (!c) { Alert.alert('보상이 부족해요', `쿠폰 1장에 보상 ${COUPON_COST}개가 필요해요.`); return; }
            Alert.alert('쿠폰을 받았어요', '쿠폰함에서 확인할 수 있어요.', [
              { text: '닫기', style: 'cancel' },
              { text: '쿠폰함 보기', onPress: () => router.navigate('/coupons') },
            ]);
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: store.name }} />
      <View style={s.notice}>
        <Text style={s.noticeText}>시연용 가상 가게예요. 이름·메뉴·가격·혜택·위치 모두 예시이며 실제로 사용할 수 없어요.</Text>
      </View>

      <Text style={s.name}>{store.name}</Text>
      <Text style={s.meta}>{store.category} · {store.area}</Text>

      <View style={[cardStyle, { backgroundColor: colors.doneSoft, borderColor: colors.doneSoft }]}>
        <Text style={s.perkTitle}>🎟 걷기 쿠폰 혜택</Text>
        <Text style={s.perk}>{store.perk}</Text>
        <View style={s.tags}>
          {store.minOrder ? <Tag label={`최소 ${won(store.minOrder)}`} tone="muted" /> : null}
          <Tag label={store.validHours ? `사용 ${store.validHours}` : '영업시간 내 사용'} tone="muted" />
          <Tag label={`발급 후 ${store.validDays}일`} tone="muted" />
          <Tag label={`하루 ${store.dailyLimit}장 한정`} tone="muted" />
        </View>
        <Btn
          label={enough ? `보상 ${COUPON_COST}개로 쿠폰 교환` : `보상 ${COUPON_COST - w.rewards.balance}개 더 필요`}
          kind="primary"
          disabled={!enough}
          onPress={onExchange}
          style={{ marginTop: 12 }}
        />
        <Text style={s.hint}>현재 잔액 {w.rewards.balance}개</Text>
      </View>

      <Section title="메뉴 (시연용 예시)">
        <View style={cardStyle}>
          {store.menus.map((m) => (
            <View key={m.name} style={s.menuRow}>
              <Text style={[s.body, { flex: 1 }]}>{m.name}</Text>
              <Text style={[s.body, { fontWeight: '700' }]}>{won(m.price)}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="위치">
        {CAN_EMBED_MAP ? (
          <MapView
            style={s.map}
            scrollEnabled={false}
            initialRegion={{ latitude: store.lat, longitude: store.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
          >
            <Marker coordinate={{ latitude: store.lat, longitude: store.lng }} title={store.name} pinColor={colors.rose} />
          </MapView>
        ) : (
          <MapFallback place={store} note="가상 위치예요. 지도 앱에서 대략적인 위치를 확인할 수 있어요." />
        )}
        <Btn label="길찾기 (네이버 지도 도보)" onPress={openRoute} style={{ marginTop: 10 }} />
        <Text style={s.hint}>실제 경로와 시간은 지도 앱에서 확인해요. 가상 위치라 실제 매장으로 안내되지 않아요.</Text>
      </Section>

      <Btn label="사장님 화면: 가게 성과 보기 (시연)" onPress={() => router.push('/store-report')} />

      {myCoupons.length > 0 && (
        <Section title={`이 가게 내 쿠폰 ${myCoupons.length}장`}>
          <Btn label="쿠폰함에서 보기" onPress={() => router.navigate('/coupons')} />
        </Section>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notice: { backgroundColor: '#FFF4D6', borderRadius: 12, padding: 12 },
  noticeText: { color: '#7A5600', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  name: { fontSize: 30, lineHeight: 39, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  meta: { fontSize: 13, color: colors.muted },
  perkTitle: { fontSize: 14, fontWeight: '800', color: colors.done, marginBottom: 4 },
  perk: { fontSize: 26, lineHeight: 35, fontWeight: '800', color: colors.ink, letterSpacing: -0.7, marginVertical: 10 },
  body: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  map: { height: 200, borderRadius: 24 },
});
