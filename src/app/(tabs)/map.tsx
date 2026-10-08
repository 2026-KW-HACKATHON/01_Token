import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { featuredStoreFor } from '../../components/FeaturedStore';
import { MapFallback } from '../../components/MapFallback';
import { cardStyle, Chip, ListRow, Notice, T, Tag } from '../../components/ui';
import { WALK_STORES, won } from '../../data/walkStores';
import { CAN_EMBED_MAP } from '../../lib/mapSupport';
import { dateKeyOf } from '../../lib/steps';
import { COUPON_COST } from '../../lib/rewards';
import { useWalk } from '../../store/WalkStore';
import { colors, STORE_ICON } from '../../theme';

const CATS = ['전체', '식사', '분식', '베이커리', '카페·디저트'] as const;
const BUDGETS = [{ label: '예산 무관', max: Infinity }, { label: '5천 원 이하', max: 5000 }, { label: '1만 원 이하', max: 10000 }];

/** 월계 들름길 — 혜택 지도: 쿠폰 사용처(시연용 가상 가게)와 메뉴·예산 비교 */
export default function PerkMap() {
  const insets = useSafeAreaInsets();
  const w = useWalk();
  const [cat, setCat] = useState<(typeof CATS)[number]>('전체');
  const [budget, setBudget] = useState(0);
  const max = BUDGETS[budget].max;

  const stores = WALK_STORES
    .filter((st) => cat === '전체' || st.category === cat)
    .map((st) => ({ st, fit: st.menus.filter((m) => m.price <= max) }))
    .filter((x) => x.fit.length > 0);

  const open = (id: string) => router.push({ pathname: '/store/[id]', params: { id } });

  // 광고 자리: 날짜 순환으로 정한 가게를 목록 맨 위에 고정 (걷기 데이터로 고르지 않음)
  const adId = featuredStoreFor().id;
  const ad = stores.find((x) => x.st.id === adId);
  const organic = stores.filter((x) => x.st.id !== adId);

  // 목록 노출 기록 (필터 조합마다 이 실행에서 한 번만)
  const logStore = w.logStore;
  const shownIds = stores.map((x) => x.st.id).join(',');
  useEffect(() => {
    if (shownIds) logStore(shownIds.split(','), 'shown', `map:${cat}:${budget}`);
  }, [logStore, shownIds, cat, budget]);
  useEffect(() => {
    if (ad) logStore([adId], 'shown', `ad-top:${adId}:${dateKeyOf(new Date())}`);
  }, [logStore, ad, adId]);

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={[s.wrap, { paddingTop: insets.top + 16 }]}>
      <Text style={[T.hero, s.hero]}>모은 월계토큰,{'\n'}어디서 써볼까요?</Text>
      <Notice text="시연용 가상 가게예요. 실제 매장·제휴·사용 가능한 쿠폰이 아니에요." style={{ marginBottom: 12 }} />

      {CAN_EMBED_MAP ? (
        <View style={s.mapBox}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{ latitude: 37.6222, longitude: 127.0598, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
          >
            {stores.map(({ st }) => (
              <Marker
                key={st.id}
                coordinate={{ latitude: st.lat, longitude: st.lng }}
                title={st.name}
                description={st.perk}
                onCalloutPress={() => open(st.id)}
                pinColor={colors.primary}
              />
            ))}
          </MapView>
        </View>
      ) : (
        <MapFallback note="이 기기에서는 앱 안 지도를 표시하지 않아요. 아래 가게를 눌러 상세에서 네이버 지도·카카오맵으로 위치를 확인하세요." />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipScroll}>
        {CATS.map((c) => <Chip key={c} label={c} on={cat === c} onPress={() => setCat(c)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={[s.chipScroll, { marginBottom: 12 }]}>
        {BUDGETS.map((b, i) => <Chip key={b.label} label={b.label} on={budget === i} onPress={() => setBudget(i)} />)}
      </ScrollView>

      <View style={cardStyle}>
        <View style={s.between}>
          <Text style={T.label}>내 월계토큰 <Text style={{ color: colors.ink, fontWeight: '700' }}>{w.rewards.balance}개</Text></Text>
          <Text style={T.caption}>쿠폰 1장 = 월계토큰 {COUPON_COST}개</Text>
        </View>
        <View style={{ height: 18 }} />
        {ad && (
          <Pressable onPress={() => open(ad.st.id)} style={({ pressed }) => [s.ad, pressed && { opacity: 0.7 }]}>
            <View style={s.adTags}>
              <Tag label="광고" tone="muted" />
              <Text style={s.adNote}>오늘의 추천 가게 · 시연용</Text>
            </View>
            <ListRow
              icon={STORE_ICON[ad.st.category] ?? '🏪'}
              title={ad.st.name}
              sub={ad.st.perk}
              subColor={colors.primary}
              last
            />
            <Text style={[s.menus, { marginLeft: 58 }]} numberOfLines={1}>
              {ad.fit.slice(0, 3).map((m) => `${m.name} ${won(m.price)}`).join(' · ')}
            </Text>
          </Pressable>
        )}
        {stores.length === 0 && (
          <Text style={T.body}>조건에 맞는 메뉴가 있는 가게가 없어요. 예산이나 분류를 바꿔 보세요.</Text>
        )}
        {organic.map(({ st, fit }, i) => {
          const owned = w.rewards.coupons.filter((c) => c.storeId === st.id && !c.usedAt).length;
          return (
            <View key={st.id}>
              <ListRow
                icon={STORE_ICON[st.category] ?? '🏪'}
                title={st.name}
                sub={st.perk}
                subColor={colors.primary}
                right={owned > 0 ? <Text style={s.owned}>쿠폰 {owned}</Text> : undefined}
                onPress={() => open(st.id)}
                last
              />
              <Text style={s.menus} numberOfLines={1}>
                {fit.slice(0, 3).map((m) => `${m.name} ${won(m.price)}`).join(' · ')}
              </Text>
              {i < organic.length - 1 && <View style={s.divider} />}
            </View>
          );
        })}
      </View>

      <Text style={[T.caption, { marginHorizontal: 4 }]}>메뉴·가격·위치는 시연용 예시예요. 지도의 가게 위치는 실제 매장 위치가 아니에요.</Text>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingBottom: 40 },
  hero: { marginHorizontal: 4, marginBottom: 14 },
  mapBox: { height: 220, borderRadius: 24, overflow: 'hidden', marginBottom: 12, backgroundColor: colors.card },
  chipScroll: { marginHorizontal: -18, marginBottom: 8 },
  chips: { gap: 8, paddingHorizontal: 18 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  owned: { fontSize: 13, fontWeight: '700', color: colors.success, backgroundColor: colors.successSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  menus: { fontSize: 14, color: colors.muted, marginLeft: 58, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 16, marginLeft: 58 },
  ad: { backgroundColor: colors.primarySoft, borderRadius: 18, padding: 14, marginHorizontal: -8, marginBottom: 18 },
  adTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  adNote: { fontSize: 13, fontWeight: '600', color: colors.primary },
  owner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 18 },
  ownerText: { fontSize: 15, fontWeight: '600', color: colors.sub },
});
