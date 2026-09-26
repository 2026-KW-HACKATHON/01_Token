import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Btn, ChipGroup, Field, inputStyle } from '../components/ui';
import { parsePlace } from '../lib/nav';
import { useAppStore } from '../store/AppStore';
import { colors } from '../theme';

const FIELDS = ['영업시간', '휴무일', '주소·위치', '전화번호', '메뉴·가격', '폐업·이전', '기타'] as const;

/** F-RXNEQL 장소 정보 오류 신고 및 수정 요청 */
export default function Report() {
  const { p } = useLocalSearchParams<{ p: string }>();
  const place = parsePlace(p);
  const store = useAppStore();
  const [field, setField] = useState<string>();
  const [content, setContent] = useState('');
  if (!place) return <Text style={{ padding: 20 }}>장소 정보를 읽지 못했어요.</Text>;

  function submit() {
    if (!field || !content.trim()) {
      Alert.alert('내용을 채워 주세요', '틀린 항목을 고르고 바른 정보를 적어 주세요.');
      return;
    }
    const r = store.addReport(place!, field, content.trim());
    if (r === 'duplicate') {
      Alert.alert('이미 접수된 요청이 있어요', `${field} 수정 요청이 처리를 기다리고 있어요.`);
      return;
    }
    Alert.alert('요청이 접수됐어요', '관리자가 확인한 뒤 반영해요. 바로 공개 정보가 바뀌지는 않아요.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Text style={s.title}>{place.name}</Text>
      <ChipGroup label="어떤 정보가 틀렸나요?" allowSkip={false} options={FIELDS} value={field} onChange={setField} />
      <Field label="바른 정보">
        <TextInput style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]} multiline value={content}
          onChangeText={setContent} placeholder="예: 월요일은 휴무예요" placeholderTextColor={colors.muted} maxLength={300} />
      </Field>
      <Btn label="수정 요청 보내기" kind="primary" onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 20 },
});
