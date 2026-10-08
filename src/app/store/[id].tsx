import Constants from 'expo-constants';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Btn, cardStyle, Section, Tag } from '../../components/ui';
import { storeById, won } from '../../data/walkStores';
import { kakaoRouteUrl } from '../../lib/geo';
import { COUPON_COST } from '../../lib/rewards';
import { useWalk } from '../../store/WalkStore';
import { colors } from '../../theme';

/** 네이버 지도 앱 도보 길찾기 (appname 필수: Expo Go면 Expo Go 번들 ID) */
function naverWalkUrl(p: { name: string; lat: number; lng: number }) {
  const appname = Constants.executionEnvironment === 'storeClient'
    ? 'host.exp.Exponent'
    : Constants.expoConfig?.ios?.bundleIdentifier ?? 'datecourse';
  return `nmap://route/walk?dlat=${p.lat}&dlng=${p.lng}&dname=${encodeURIComponent(p.name)}&appname=${appname}`;
}

/** 월계 들름길 — 가게 상세·쿠폰 교환 (시연용 가상 가게) */
export default function StoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const st = storeById(id);
  const w = useWalk();

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
        <Text style={s.body}>{store.perk}</Text>
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
              <Text style={s.body}>{m.name}</Text>
              <Text style={s.body}>{won(m.price)}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="위치">
        <MapView
          style={s.map}
          scrollEnabled={false}
          initialRegion={{ latitude: store.lat, longitude: store.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        >
          <Marker coordinate={{ latitude: store.lat, longitude: store.lng }} title={store.name} pinColor={colors.rose} />
        </MapView>
        <Btn label="길찾기 (네이버 지도 도보)" onPress={openRoute} style={{ marginTop: 10 }} />
        <Text style={s.hint}>실제 경로와 시간은 지도 앱에서 확인해요. 가상 위치라 실제 매장으로 안내되지 않아요.</Text>
      </Section>

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
  name: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  meta: { fontSize: 13, color: colors.muted },
  perkTitle: { fontSize: 14, fontWeight: '800', color: colors.done, marginBottom: 4 },
  body: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  map: { height: 180, borderRadius: 16 },
});
