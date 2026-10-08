import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn, IconBox, T, Tag } from '../../components/ui';
import { storeById } from '../../data/walkStores';
import { useWalk } from '../../store/WalkStore';
import { colors, STORE_ICON } from '../../theme';

const date = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 월계 들름길 — 내 쿠폰함 (사용 확인은 시연용, 결제·POS 연동 없음) */
export default function Coupons() {
  const insets = useSafeAreaInsets();
  const w = useWalk();
  const now = new Date();
  const list = w.rewards.coupons;

  function confirmUse(id: string, storeName: string) {
    Alert.alert(
      '매장 직원 확인 (시연)',
      `${storeName} 직원이 쿠폰 코드를 확인한 뒤 눌러 주세요.\n사용 완료 후에는 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '사용 완료', style: 'destructive', onPress: () => { if (!w.useCouponById(id)) Alert.alert('사용할 수 없는 쿠폰이에요'); } },
      ],
    );
  }

  if (list.length === 0) {
    return (
      <View style={[s.empty, { paddingTop: insets.top }]}>
        <IconBox icon="🎟️" size={80} bg={colors.card} />
        <Text style={[T.title, { marginTop: 20 }]}>아직 쿠폰이 없어요</Text>
        <Text style={[T.body, { textAlign: 'center', marginTop: 6 }]}>
          걸어서 월계토큰 10개를 모으면{'\n'}혜택 지도에서 가게 쿠폰으로 바꿀 수 있어요.
        </Text>
        <Btn label="혜택 지도 보기" kind="primary" size="lg" onPress={() => router.navigate('/map')} style={{ marginTop: 24, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const usable = list.filter((c) => !c.usedAt && !(c.expiresAt && new Date(c.expiresAt) < now)).length;

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={[s.wrap, { paddingTop: insets.top + 16 }]}>
      <Text style={[T.hero, s.hero]}>내 쿠폰 {list.length}장</Text>
      <Text style={[T.caption, s.sub]}>
        사용 가능 {usable}장 · 시연용 쿠폰이에요. 실제 매장에서 사용할 수 없어요.
      </Text>

      {list.map((c) => {
        const st = storeById(c.storeId);
        const expired = !c.usedAt && c.expiresAt ? new Date(c.expiresAt) < now : false;
        const state = c.usedAt ? '사용 완료' : expired ? '기간 만료' : '사용 가능';
        const active = state === '사용 가능';
        return (
          <View key={c.id} style={[s.ticket, !active && s.dim]}>
            <View style={s.top}>
              <View style={s.between}>
                <View style={s.store}>
                  <IconBox icon={st ? STORE_ICON[st.category] ?? '🏪' : '🏪'} size={40} />
                  <Text style={s.name} numberOfLines={1}>{st?.name ?? '알 수 없는 가게'}</Text>
                </View>
                <Tag label={state} tone={active ? 'done' : 'muted'} />
              </View>
              <Text style={s.perk}>{st?.perk}</Text>
              <Text style={[T.caption, { marginTop: 6 }]}>
                {c.expiresAt ? `${date(c.expiresAt)}까지` : `${date(c.issuedAt)} 발급`}
                {st?.validHours ? ` · ${st.validHours} 사용` : ''}
                {st?.minOrder ? ` · 최소 ${st.minOrder.toLocaleString()}원` : ''}
                {c.usedAt ? ` · ${date(c.usedAt)} 사용함` : ''}
              </Text>
            </View>

            {/* 절취선 */}
            <View style={s.cutRow}>
              <View style={[s.notch, { marginLeft: -10 }]} />
              <View style={s.cut} />
              <View style={[s.notch, { marginRight: -10 }]} />
            </View>

            <View style={s.bottom}>
              <Text style={T.caption}>쿠폰 번호</Text>
              <Text style={s.code}>{c.id}</Text>
              <View style={s.btns}>
                {st && <Btn label="가게 보기" kind="ghost" onPress={() => router.push({ pathname: '/store/[id]', params: { id: st.id } })} style={{ flex: 1 }} />}
                {active && <Btn label="매장에서 사용" kind="primary" onPress={() => confirmUse(c.id, st?.name ?? '')} style={{ flex: 1.4 }} />}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingBottom: 40 },
  hero: { marginHorizontal: 4 },
  sub: { marginHorizontal: 4, marginTop: 4, marginBottom: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.paper },
  ticket: { backgroundColor: colors.card, borderRadius: 24, marginBottom: 12, overflow: 'hidden' },
  dim: { opacity: 0.5 },
  top: { padding: 22, paddingBottom: 18 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  store: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink, flex: 1 },
  perk: { fontSize: 21, lineHeight: 29, fontWeight: '700', color: colors.ink, marginTop: 14, letterSpacing: -0.5 },
  cutRow: { flexDirection: 'row', alignItems: 'center' },
  notch: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paper },
  cut: { flex: 1, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.line, marginHorizontal: 6 },
  bottom: { padding: 22, paddingTop: 16 },
  code: { fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: 2, marginTop: 2, fontVariant: ['tabular-nums'] },
  btns: { flexDirection: 'row', gap: 8, marginTop: 16 },
});
