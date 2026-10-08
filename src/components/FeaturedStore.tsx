import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WALK_STORES } from '../data/walkStores';
import { dateKeyOf } from '../lib/steps';
import { useWalk } from '../store/WalkStore';
import { colors, STORE_ICON } from '../theme';
import { IconBox, Tag } from './ui';

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
      style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <View style={s.head}>
        <Tag label="제휴 · 시연용" tone="warn" />
        <Text style={s.kicker}>오늘의 동네 가게</Text>
      </View>
      <View style={s.row}>
        <IconBox icon={STORE_ICON[st.category] ?? '🏪'} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{st.name}</Text>
          <Text style={s.perk} numberOfLines={2}>{st.perk}</Text>
        </View>
        <Text style={s.chev}>›</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 20 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  kicker: { fontSize: 14, fontWeight: '600', color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  perk: { fontSize: 15, fontWeight: '600', color: colors.primary, marginTop: 3, lineHeight: 21 },
  chev: { fontSize: 24, color: colors.faint },
});
