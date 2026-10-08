import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapFallback } from '../../components/MapFallback';
import { BottomCTA, Btn, cardStyle, IconBox, InfoRow, Notice, T, Tag } from '../../components/ui';
import { storeById, won } from '../../data/walkStores';
import { kakaoRouteUrl } from '../../lib/geo';
import { CAN_EMBED_MAP, naverWalkUrl } from '../../lib/mapSupport';
import { COUPON_COST } from '../../lib/rewards';
import { useWalk } from '../../store/WalkStore';
import { colors, STORE_ICON } from '../../theme';

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
    return <View style={s.center}><Text style={T.body}>가게 정보를 찾지 못했어요.</Text></View>;
  }
  const store = st;
  const myCoupons = w.rewards.coupons.filter((c) => c.storeId === store.id && !c.usedAt);
  const balance = w.rewards.balance;
  const enough = balance >= COUPON_COST;

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
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.head}>
          <IconBox icon={STORE_ICON[store.category] ?? '🏪'} size={56} bg={colors.card} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{store.name}</Text>
            <Text style={[T.caption, { marginTop: 2 }]}>{store.category} · {store.area}</Text>
          </View>
        </View>

        <Notice text="시연용 가상 가게예요. 이름·메뉴·가격·혜택·위치 모두 예시이며 실제로 사용할 수 없어요." style={{ marginBottom: 12 }} />

        {/* 쿠폰 혜택 */}
        <View style={cardStyle}>
          <View style={{ flexDirection: 'row' }}><Tag label="🎟 걷기 쿠폰 혜택" /></View>
          <Text style={s.perk}>{store.perk}</Text>
          <View style={{ marginTop: 10 }}>
            <InfoRow label="사용 시간" value={store.validHours ?? '영업시간 내'} />
            {store.minOrder ? <InfoRow label="최소 주문" value={won(store.minOrder)} /> : null}
            <InfoRow label="유효 기간" value={`발급 후 ${store.validDays}일`} />
            <InfoRow label="하루 한정" value={`${store.dailyLimit}장`} />
          </View>
          {myCoupons.length > 0 && (
            <Pressable onPress={() => router.navigate('/coupons')} style={s.mine}>
              <Text style={s.mineText}>이 가게 쿠폰 {myCoupons.length}장 보유 중 · 쿠폰함 보기 ›</Text>
            </Pressable>
          )}
        </View>

        {/* 메뉴 */}
        <View style={cardStyle}>
          <View style={s.between}>
            <Text style={s.cardTitle}>메뉴</Text>
            <Tag label="시연용 예시" tone="muted" />
          </View>
          <View style={{ marginTop: 6 }}>
            {store.menus.map((m) => (
              <InfoRow key={m.name} label={m.name} value={won(m.price)} />
            ))}
          </View>
        </View>

        {/* 위치 */}
        <View style={cardStyle}>
          <Text style={[s.cardTitle, { marginBottom: 12 }]}>위치</Text>
          {CAN_EMBED_MAP ? (
            <View style={s.mapBox}>
              <MapView
                style={StyleSheet.absoluteFill}
                scrollEnabled={false}
                initialRegion={{ latitude: store.lat, longitude: store.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
              >
                <Marker coordinate={{ latitude: store.lat, longitude: store.lng }} title={store.name} pinColor={colors.primary} />
              </MapView>
            </View>
          ) : (
            <MapFallback place={store} note="가상 위치예요. 지도 앱에서 대략적인 위치를 확인할 수 있어요." />
          )}
          <Btn label="🚶  네이버 지도로 걸어가는 길 보기" kind="secondary" onPress={openRoute} style={{ marginTop: 12 }} />
          <Text style={[T.caption, { marginTop: 10 }]}>실제 경로와 시간은 지도 앱에서 확인해요. 가상 위치라 실제 매장으로 안내되지 않아요.</Text>
        </View>

        <Btn label="📊  사장님 화면: 가게 성과 보기 (시연)" kind="text" onPress={() => router.push('/store-report')} />
      </ScrollView>

      <BottomCTA note={enough ? `내 보상 ${balance}개 · 교환하면 ${balance - COUPON_COST}개 남아요` : `내 보상 ${balance}개 · 쿠폰 1장에 ${COUPON_COST}개가 필요해요`}>
        <Btn
          label={enough ? `보상 ${COUPON_COST}개로 쿠폰 받기` : `보상 ${COUPON_COST - balance}개 더 모으면 받을 수 있어요`}
          kind="primary"
          size="lg"
          disabled={!enough}
          onPress={onExchange}
        />
      </BottomCTA>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 4, marginBottom: 18 },
  name: { fontSize: 23, lineHeight: 31, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  perk: { fontSize: 21, lineHeight: 29, fontWeight: '700', color: colors.ink, marginTop: 12, letterSpacing: -0.5 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  mine: { backgroundColor: colors.successSoft, borderRadius: 12, padding: 12, marginTop: 12 },
  mineText: { color: colors.success, fontSize: 14, fontWeight: '700' },
  mapBox: { height: 180, borderRadius: 16, overflow: 'hidden' },
});
