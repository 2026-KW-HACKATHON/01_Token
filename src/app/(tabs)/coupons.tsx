import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, cardStyle, Tag } from '../../components/ui';
import { storeById } from '../../data/walkStores';
import { useWalk } from '../../store/WalkStore';
import { colors } from '../../theme';

const date = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 월계 들름길 — 내 쿠폰함 (사용 확인은 시연용, 결제·POS 연동 없음) */
export default function Coupons() {
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
      <View style={s.empty}>
        <View style={s.emptyIcon}><Text style={{ fontSize: 36 }}>🎟</Text></View>
        <Text style={s.title}>아직 쿠폰이 없어요</Text>
        <Text style={s.body}>걸어서 보상 10개를 모으면 혜택 지도에서 가게 쿠폰으로 바꿀 수 있어요.</Text>
        <Btn label="혜택 지도 보기" kind="primary" onPress={() => router.navigate('/map')} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={s.title}>차곡차곡 모은 동네 혜택</Text>
      <Text style={s.body}>내 쿠폰 {list.length}장</Text>
      <Text style={s.hint}>시연용 쿠폰이에요. 실제 매장에서 사용할 수 없어요.</Text>
      {list.map((c) => {
        const st = storeById(c.storeId);
        const expired = !c.usedAt && c.expiresAt ? new Date(c.expiresAt) < now : false;
        const state = c.usedAt ? '사용 완료' : expired ? '기간 만료' : '사용 가능';
        return (
          <View key={c.id} style={[cardStyle, (c.usedAt || expired) && s.dim]}>
            <View style={s.rowBetween}>
              <Text style={s.name}>{st?.name ?? '알 수 없는 가게'}</Text>
              <Tag label={state} tone={state === '사용 가능' ? 'done' : 'muted'} />
            </View>
            <Text style={s.perk}>{st?.perk}</Text>
            <Text style={s.code}>{c.id}</Text>
            <Text style={s.meta}>
              {date(c.issuedAt)} 발급{c.expiresAt ? ` · ${date(c.expiresAt)}까지` : ''}{c.usedAt ? ` · ${date(c.usedAt)} 사용` : ''}
            </Text>
            {st?.validHours ? <Text style={s.meta}>사용 시간 {st.validHours}{st.minOrder ? ` · 최소 ${st.minOrder.toLocaleString()}원` : ''}</Text> : null}
            <View style={s.btns}>
              {st && <Btn label="가게 보기" onPress={() => router.push({ pathname: '/store/[id]', params: { id: st.id } })} style={{ flex: 1 }} />}
              {state === '사용 가능' && <Btn label="매장 사용 확인" kind="primary" onPress={() => confirmUse(c.id, st?.name ?? '')} style={{ flex: 1 }} />}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48, gap: 10 },
  empty: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.paper },
  title: { fontSize: 25, lineHeight: 33, letterSpacing: -0.8, fontWeight: '800', color: colors.ink },
  emptyIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.doneSoft, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1 },
  body: { fontSize: 14, color: colors.ink, marginTop: 6, lineHeight: 20 },
  perk: { fontSize: 22, fontWeight: '800', color: colors.rose, lineHeight: 30, marginTop: 16, letterSpacing: -0.5 },
  code: { fontSize: 14, fontWeight: '600', color: colors.ink, letterSpacing: 1, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.line, fontVariant: ['tabular-nums'] },
  meta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  hint: { fontSize: 12, color: colors.muted },
  btns: { gap: 8, marginTop: 18 },
  dim: { opacity: 0.55 },
});
