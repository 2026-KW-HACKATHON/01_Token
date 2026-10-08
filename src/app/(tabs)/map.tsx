import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapFallback } from '../../components/MapFallback';
import { CAN_EMBED_MAP } from '../../lib/mapSupport';
import { FeaturedStore } from '../../components/FeaturedStore';
import { cardStyle, Chip, Tag } from '../../components/ui';
import { WALK_STORES, won } from '../../data/walkStores';
import { COUPON_COST } from '../../lib/rewards';
import { useWalk } from '../../store/WalkStore';
import { colors } from '../../theme';

const CATS = ['전체', '식사', '분식', '베이커리', '카페·디저트'] as const;
const BUDGETS = [{ label: '예산 무관', max: Infinity }, { label: '5천 원 이하', max: 5000 }, { label: '1만 원 이하', max: 10000 }];

/** 월계 들름길 — 혜택 지도: 쿠폰 사용처(시연용 가상 가게)와 메뉴·예산 비교 */
export default function PerkMap() {
  const w = useWalk();
  const [cat, setCat] = useState<(typeof CATS)[number]>('전체');
  const [budget, setBudget] = useState(0);
  const max = BUDGETS[budget].max;

  const stores = WALK_STORES
    .filter((st) => cat === '전체' || st.category === cat)
    .map((st) => ({ st, fit: st.menus.filter((m) => m.price <= max) }))
    .filter((x) => x.fit.length > 0);

  const open = (id: string) => router.push({ pathname: '/store/[id]', params: { id } });

  // 목록 노출 기록 (필터 조합마다 이 실행에서 한 번만)
  const logStore = w.logStore;
  const shownIds = stores.map((x) => x.st.id).join(',');
  useEffect(() => {
    if (shownIds) logStore(shownIds.split(','), 'shown', `map:${cat}:${budget}`);
  }, [logStore, shownIds, cat, budget]);

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={s.title}>걸어서 모은 보상,{'\n'}어디서 써볼까요?</Text>
      <View style={s.notice}>
        <Text style={s.noticeText}>시연용 가상 가게예요. 실제 매장·제휴·사용 가능한 쿠폰이 아니에요.</Text>
      </View>

      <FeaturedStore placement="map" />

      {CAN_EMBED_MAP ? (
        <MapView
          style={s.map}
          initialRegion={{ latitude: 37.6222, longitude: 127.0598, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        >
          {stores.map(({ st }) => (
            <Marker
              key={st.id}
              coordinate={{ latitude: st.lat, longitude: st.lng }}
              title={st.name}
              description={st.perk}
              onCalloutPress={() => open(st.id)}
              pinColor={colors.rose}
            />
          ))}
        </MapView>
      ) : (
        <MapFallback note="이 기기에서는 앱 안 지도를 표시하지 않아요. 아래 가게를 눌러 상세에서 네이버 지도·카카오맵으로 위치를 확인하세요." />
      )}

      <View style={s.chips}>
        {CATS.map((c) => <Chip key={c} label={c} on={cat === c} onPress={() => setCat(c)} />)}
      </View>
      <View style={s.chips}>
        {BUDGETS.map((b, i) => <Chip key={b.label} label={b.label} on={budget === i} onPress={() => setBudget(i)} muted={i === 0} />)}
      </View>

      <Text style={s.balance}>
        보상 잔액 {w.rewards.balance}개 · 쿠폰 1장 = 보상 {COUPON_COST}개
      </Text>

      {stores.length === 0 && (
        <View style={cardStyle}>
          <Text style={s.body}>조건에 맞는 메뉴가 있는 가게가 없어요. 예산이나 분류를 바꿔 보세요.</Text>
        </View>
      )}

      {stores.map(({ st, fit }) => {
        const owned = w.rewards.coupons.filter((c) => c.storeId === st.id && !c.usedAt).length;
        return (
          <Pressable key={st.id} onPress={() => open(st.id)} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.8 }]}>
            <View style={s.rowBetween}>
              <Text style={s.name}>{st.name}</Text>
              <Text style={s.more}>상세 ›</Text>
            </View>
            <Text style={s.meta}>{st.category} · {st.area}</Text>
            <View style={s.tags}>
              <Tag label={`🎟 ${st.perk}`} tone="done" />
              {owned > 0 && <Tag label={`보유 쿠폰 ${owned}장`} tone="route" />}
            </View>
            <Text style={s.menus}>
              {fit.slice(0, 3).map((m) => `${m.name} ${won(m.price)}`).join(' · ')}
            </Text>
          </Pressable>
        );
      })}

      <Text style={s.hint}>메뉴·가격·위치는 시연용 예시예요. 지도의 가게 위치는 실제 매장 위치가 아니에요.</Text>
      <Pressable onPress={() => router.push('/store-report')}>
        <Text style={s.link}>사장님 화면: 제휴 가게 성과 보기 (시연) ›</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48, gap: 10 },
  notice: { backgroundColor: '#FFF4D6', borderRadius: 12, padding: 12 },
  noticeText: { color: '#7A5600', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  title: { fontSize: 27, lineHeight: 36, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, marginBottom: 12 },
  map: { height: 260, borderRadius: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  balance: { fontSize: 13, lineHeight: 20, fontWeight: '600', color: colors.rose, backgroundColor: colors.doneSoft, padding: 16, borderRadius: 16, marginVertical: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 19, fontWeight: '800', color: colors.ink, flex: 1, letterSpacing: -0.4 },
  more: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  menus: { fontSize: 13, color: colors.ink, marginTop: 8 },
  body: { fontSize: 14, color: colors.ink },
  hint: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  link: { fontSize: 13, color: colors.route, fontWeight: '600', marginTop: 4 },
});
