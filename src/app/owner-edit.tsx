import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Btn, Chip, Field, inputStyle } from '../components/ui';
import { DAYS, isValidTime, PAYMENTS } from '../lib/hours';
import { parsePlace } from '../lib/nav';
import { useAppStore } from '../store/AppStore';
import { colors } from '../theme';

/** F-TLOBFA 운영자 장소 정보 변경 제출 (S-PHPZRM) */
export default function OwnerEdit() {
  const { p } = useLocalSearchParams<{ p: string }>();
  const place = parsePlace(p);
  const store = useAppStore();
  const cur = place ? store.placeInfo[place.id] : undefined;
  const [open, setOpen] = useState(cur?.open ?? '');
  const [close, setClose] = useState(cur?.close ?? '');
  const [closedDays, setClosedDays] = useState<number[]>(cur?.closedDays ?? []);
  const [menu, setMenu] = useState(cur?.menu ?? '');
  const [intro, setIntro] = useState(cur?.intro ?? '');
  const [perk, setPerk] = useState(cur?.perk ?? '');
  const [perkStart, setPerkStart] = useState(cur?.perkStart ?? '');
  const [perkEnd, setPerkEnd] = useState(cur?.perkEnd ?? '');
  const [payments, setPayments] = useState<string[]>(cur?.payments ?? []);
  if (!place) return <Text style={{ padding: 20 }}>장소 정보를 읽지 못했어요.</Text>;
  if (!store.isOwnerOf(place.id)) return <Text style={{ padding: 20 }}>이 가게의 운영 권한이 승인된 뒤에 수정할 수 있어요.</Text>;

  const toggleDay = (d: number) => setClosedDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort()));

  function submit() {
    if ((open || close) && (!isValidTime(open) || !isValidTime(close))) {
      Alert.alert('영업시간 형식을 확인해 주세요', '11:00처럼 시:분으로 입력해 주세요.');
      return;
    }
    if ((perkStart || perkEnd) && (!isValidTime(perkStart) || !isValidTime(perkEnd))) {
      Alert.alert('혜택 시간 형식을 확인해 주세요', '15:00처럼 시:분으로 입력하거나 두 칸을 모두 비워 주세요.');
      return;
    }
    const r = store.submitInfoEdit(place!, {
      open: open.trim() || undefined, close: close.trim() || undefined, closedDays,
      menu: menu.trim() || undefined, intro: intro.trim() || undefined,
      perk: perk.trim() || undefined,
      perkStart: perk.trim() && perkStart.trim() ? perkStart.trim() : undefined,
      perkEnd: perk.trim() && perkEnd.trim() ? perkEnd.trim() : undefined,
      payments: payments.length ? payments : undefined,
    });
    if (r === 'duplicate') {
      Alert.alert('검수 중인 변경이 있어요', '이전 변경 요청이 처리된 뒤에 다시 보내 주세요.');
      return;
    }
    Alert.alert('변경 요청을 보냈어요', '관리자 검수 후 공개 정보에 반영돼요.', [{ text: '확인', onPress: () => router.back() }]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Text style={s.title}>{place.name}</Text>
      <Field label="영업시간">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput style={[inputStyle, { flex: 1 }]} value={open} onChangeText={setOpen} placeholder="11:00" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={5} />
          <Text style={{ color: colors.muted }}>~</Text>
          <TextInput style={[inputStyle, { flex: 1 }]} value={close} onChangeText={setClose} placeholder="21:00" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
      </Field>
      <Field label="휴무일">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DAYS.map((d, i) => <Chip key={d} label={d} on={closedDays.includes(i)} onPress={() => toggleDay(i)} />)}
        </View>
      </Field>
      <Field label="대표 메뉴·가격">
        <TextInput style={[inputStyle, { minHeight: 70, textAlignVertical: 'top' }]} multiline value={menu} onChangeText={setMenu} placeholder="예: 들기름 막국수 11,000원" placeholderTextColor={colors.muted} />
      </Field>
      <Field label="가게 소개">
        <TextInput style={[inputStyle, { minHeight: 70, textAlignVertical: 'top' }]} multiline value={intro} onChangeText={setIntro} placeholder="예: 3대째 운영하는 동네 국숫집" placeholderTextColor={colors.muted} />
      </Field>
      <Field label="결제수단" hint="받는 결제수단을 고르면 배지와 '지역화폐·온누리' 필터에 나와요">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PAYMENTS.map((p) => (
            <Chip key={p.key} label={p.label} on={payments.includes(p.key)}
              onPress={() => setPayments((x) => (x.includes(p.key) ? x.filter((y) => y !== p.key) : [...x, p.key]))} />
          ))}
        </View>
      </Field>
      <Field label="동네 혜택 (선택)" hint="앱 보고 온 손님에게 주는 혜택이에요. 예: 음료 1잔 서비스">
        <TextInput style={inputStyle} value={perk} onChangeText={setPerk} placeholder="예: 아메리카노 1,000원 할인" placeholderTextColor={colors.muted} maxLength={60} />
      </Field>
      <Field label="혜택 시간대 (선택)" hint="손님이 적은 시간에만 걸면 그 시간에 추천 순위가 올라가요. 비우면 영업시간 내내 적용돼요.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput style={[inputStyle, { flex: 1 }]} value={perkStart} onChangeText={setPerkStart} placeholder="15:00" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={5} />
          <Text style={{ color: colors.muted }}>~</Text>
          <TextInput style={[inputStyle, { flex: 1 }]} value={perkEnd} onChangeText={setPerkEnd} placeholder="17:00" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
      </Field>
      <Btn label="검수 요청 보내기" kind="primary" onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 20 },
});
