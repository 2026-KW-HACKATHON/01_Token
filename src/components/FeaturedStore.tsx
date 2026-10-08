import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WALK_STORES } from '../data/walkStores';
import { dateKeyOf } from '../lib/steps';
import { useWalk } from '../store/WalkStore';
import { colors } from '../theme';

/**
 * 오늘의 동네 가게 (제휴 노출 카드)
 * - 날짜 기준으로 모든 사용자에게 같은 순서로 돌아가며 보여 준다.
 * - 걸음수·보상 잔액 등 걷기 데이터로 고르지 않는다(건강·활동 데이터를 광고에 쓰지 않음).
 */
export function featuredStoreFor(d = new Date()) {
  const dayIndex = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
  return WALK_STORES[((dayIndex % WALK_STORES.length) + WALK_STORES.length) % WALK_STORES.length];
}

export function FeaturedStore({ placement }: { placement: string }) {
  const w = useWalk();
  const st = featuredStoreFor();
  const logStore = w.logStore;

  useEffect(() => {
    logStore([st.id], 'shown', `featured:${placement}:${st.id}:${dateKeyOf(new Date())}`);
  }, [logStore, st.id, placement]);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/store/[id]', params: { id: st.id } })}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <View style={s.head}>
        <Text style={s.badge}>제휴 · 시연용</Text>
        <Text style={s.kicker}>오늘의 동네 가게</Text>
      </View>
      <Text style={s.name}>{st.name}</Text>
      <Text style={s.perk}>🎟 {st.perk}</Text>
      <Text style={s.meta}>{st.category} · {st.area} ›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.ink, borderRadius: 16, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    fontSize: 11, fontWeight: '800', color: colors.ink, backgroundColor: '#FFE08A',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  kicker: { fontSize: 12, fontWeight: '700', color: '#C9C5D8' },
  name: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 8 },
  perk: { fontSize: 14, color: '#fff', marginTop: 4 },
  meta: { fontSize: 12, color: '#C9C5D8', marginTop: 6 },
});
