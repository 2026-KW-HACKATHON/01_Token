import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Btn, Chip, Field, inputStyle } from '../components/ui';
import { DAYS, isValidTime } from '../lib/hours';
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
  if (!place) return <Text style={{ padding: 20 }}>장소 정보를 읽지 못했어요.</Text>;
  if (!store.isOwnerOf(place.id)) return <Text style={{ padding: 20 }}>이 가게의 운영 권한이 승인된 뒤에 수정할 수 있어요.</Text>;

  const toggleDay = (d: number) => setClosedDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort()));

  function submit() {
    if ((open || close) && (!isValidTime(open) || !isValidTime(close))) {
      Alert.alert('영업시간 형식을 확인해 주세요', '11:00처럼 시:분으로 입력해 주세요.');
      return;
    }
    const r = store.submitInfoEdit(place!, {
      open: open.trim() || undefined, close: close.trim() || undefined, closedDays,
      menu: menu.trim() || undefined, intro: intro.trim() || undefined,
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
      <Btn label="검수 요청 보내기" kind="primary" onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 20 },
});
