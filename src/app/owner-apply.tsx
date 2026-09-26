import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Btn, Field, inputStyle } from '../components/ui';
import { parsePlace } from '../lib/nav';
import { useAppStore } from '../store/AppStore';
import { colors } from '../theme';

/** F-DGSIXX 매장 운영 권한 신청 (S-NNHFSK) */
export default function OwnerApply() {
  const { p } = useLocalSearchParams<{ p: string }>();
  const place = parsePlace(p);
  const store = useAppStore();
  const [applicant, setApplicant] = useState('');
  const [contact, setContact] = useState('');
  const [proof, setProof] = useState('');
  if (!place) return <Text style={{ padding: 20 }}>장소 정보를 읽지 못했어요.</Text>;

  function submit() {
    if (!applicant.trim() || !contact.trim() || !proof.trim()) {
      Alert.alert('빈 칸이 있어요', '이름, 연락처, 증빙 정보를 모두 입력해 주세요.');
      return;
    }
    const r = store.requestOwner(place!, applicant.trim(), contact.trim(), proof.trim());
    if (r === 'duplicate') {
      Alert.alert('이미 신청한 가게예요', '관리자 승인을 기다리는 중이거나 이미 승인됐어요.');
      return;
    }
    Alert.alert('신청이 접수됐어요', '관리자가 확인하면 운영 탭에서 결과를 볼 수 있어요. 신청만으로 공개 정보는 바뀌지 않아요.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Text style={s.title}>{place.name}</Text>
      <Text style={s.muted}>승인되면 이 가게의 영업시간, 휴무일, 메뉴를 직접 관리할 수 있어요.</Text>
      <Field label="신청자 이름">
        <TextInput style={inputStyle} value={applicant} onChangeText={setApplicant} placeholder="홍길동" placeholderTextColor={colors.muted} />
      </Field>
      <Field label="연락처">
        <TextInput style={inputStyle} value={contact} onChangeText={setContact} placeholder="010-0000-0000" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
      </Field>
      <Field label="증빙 정보" hint="사업자등록번호나 가게와의 관계를 적어 주세요">
        <TextInput style={inputStyle} value={proof} onChangeText={setProof} placeholder="000-00-00000" placeholderTextColor={colors.muted} />
      </Field>
      <Btn label="운영 권한 신청하기" kind="primary" onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  muted: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 20, lineHeight: 19 },
});
