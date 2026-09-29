import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Btn, ChipGroup, Field, inputStyle, Tag } from '../../components/ui';
import { distanceM } from '../../lib/geo';
import { monthLabel, parsePlace } from '../../lib/nav';
import { COMPANIONS, PRICE_FEELS, REVIEW_MOODS, VERIFY_RADIUS_M } from '../../lib/reviews';
import { useAppStore } from '../../store/AppStore';
import { colors } from '../../theme';

const recentMonths = () => {
  const d = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
  });
};

/** F-BAYAZZ 후기 작성 + F-OVVLRA 방문 인증·중복 작성 제어 */
export default function WriteReview() {
  const { p, edit } = useLocalSearchParams<{ p: string; edit?: string }>();
  const place = parsePlace(p);
  const store = useAppStore();
  const existing = store.reviews.find((r) => r.id === edit);
  const months = recentMonths();

  const [satisfaction, setSatisfaction] = useState<string | undefined>(existing ? String(existing.satisfaction) : undefined);
  const [visitedMonth, setVisitedMonth] = useState<string | undefined>(existing?.visitedMonth ?? months[0]);
  const [mood, setMood] = useState<string | undefined>(existing?.mood);
  const [priceFeel, setPriceFeel] = useState<string | undefined>(existing?.priceFeel);
  const [companion, setCompanion] = useState<string | undefined>(existing?.companion);
  const [revisit, setRevisit] = useState<string | undefined>(existing ? (existing.revisit ? 'y' : 'n') : undefined);
  const [text, setText] = useState(existing?.text ?? '');
  const [verified, setVerified] = useState(existing?.verified ?? false);
  const [checking, setChecking] = useState(false);

  if (!place) return <View style={s.wrap}><Text>장소 정보를 읽지 못했어요.</Text></View>;
  if (store.hidden[place.id] && !existing) {
    return <View style={s.wrap}><Text style={s.body}>비공개 처리된 장소라 새 후기를 쓸 수 없어요.</Text></View>;
  }

  async function verify() {
    setChecking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한이 꺼져 있어요', '방문 인증은 가게 근처에서 현재 위치로 확인해요.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const d = distanceM({ lat: pos.coords.latitude, lng: pos.coords.longitude }, place!);
      if (d <= VERIFY_RADIUS_M) {
        setVerified(true);
        if (existing) store.verifyReview(existing.id);
        Alert.alert('방문 인증 완료', '후기에 방문 인증 표시가 붙어요.');
      } else {
        Alert.alert('인증하지 못했어요', `지금 위치가 가게에서 약 ${Math.round(d)}m 떨어져 있어요. ${VERIFY_RADIUS_M}m 안에서 다시 시도해 주세요.`);
      }
    } catch {
      Alert.alert('현재 위치를 확인하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setChecking(false);
    }
  }

  function submit() {
    const missing = [
      !satisfaction && '만족도', !visitedMonth && '방문 시점', !mood && '분위기',
      !priceFeel && '가격 체감', !companion && '동행 유형', !revisit && '재방문 의향',
    ].filter(Boolean);
    if (missing.length) {
      Alert.alert('빠진 항목이 있어요', `${missing.join(', ')}을(를) 골라 주세요.`);
      return;
    }
    const summary = `만족도 ${satisfaction}점, ${monthLabel(visitedMonth!)} 방문, ${companion}와(과), 분위기 ${mood}, 가격 ${priceFeel}, ${revisit === 'y' ? '다시 갈래요' : '재방문은 글쎄요'}${verified ? ', 방문 인증 완료' : ''}`;
    Alert.alert('이대로 등록할까요?', summary + (text ? `\n\n"${text}"` : ''), [
      { text: '고치기', style: 'cancel' },
      {
        text: existing ? '수정하기' : '등록하기',
        onPress: () => {
          const r = store.saveReview({
            placeId: place!.id, placeName: place!.name, satisfaction: Number(satisfaction), visitedMonth: visitedMonth!,
            mood: mood!, priceFeel: priceFeel!, companion: companion!, revisit: revisit === 'y', text: text.trim(), verified,
            lat: place!.lat, lng: place!.lng,
          }, existing?.id);
          if (r === 'duplicate') {
            Alert.alert('이미 쓴 후기가 있어요', `${monthLabel(visitedMonth!)} 방문 후기가 이미 있어요. 장소 화면에서 기존 후기를 수정하거나 방문 시점을 다르게 골라 주세요.`);
            return;
          }
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: existing ? '후기 수정' : '후기 쓰기' }} />
      <Text style={s.title}>{place.name}</Text>

      <ChipGroup label="만족도" allowSkip={false} options={['1', '2', '3', '4', '5']}
        labels={{ 1: '★1', 2: '★2', 3: '★3', 4: '★4', 5: '★5' }} value={satisfaction} onChange={setSatisfaction} />
      <ChipGroup label="언제 다녀왔나요?" allowSkip={false} options={months}
        labels={Object.fromEntries(months.map((m) => [m, monthLabel(m)]))} value={visitedMonth} onChange={setVisitedMonth} />
      <ChipGroup label="누구와 갔나요?" allowSkip={false} options={COMPANIONS} value={companion} onChange={setCompanion} />
      <ChipGroup label="분위기" allowSkip={false} options={REVIEW_MOODS} value={mood} onChange={setMood} />
      <ChipGroup label="가격은 어땠나요?" allowSkip={false} options={PRICE_FEELS} value={priceFeel} onChange={setPriceFeel} />
      <ChipGroup label="다시 갈 건가요?" allowSkip={false} options={['y', 'n']}
        labels={{ y: '다시 갈래요', n: '글쎄요' }} value={revisit} onChange={setRevisit} />

      <Field label="한 줄 후기 (선택)">
        <TextInput style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]} multiline value={text}
          onChangeText={setText} placeholder="어떤 점이 좋았는지 알려 주세요" placeholderTextColor={colors.muted} maxLength={300} />
      </Field>

      <Field label="방문 인증" hint={`가게 ${VERIFY_RADIUS_M}m 안에서 현재 위치로 인증하면 '방문 인증' 표시가 붙어요.`}>
        {verified ? <Tag label="방문 인증 완료" tone="done" /> :
          <Btn label={checking ? '위치 확인 중' : '지금 위치로 방문 인증'} onPress={verify} disabled={checking} />}
      </Field>

      <Btn label={existing ? '후기 수정하기' : '후기 등록하기'} kind="primary" onPress={submit} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 20 },
  body: { fontSize: 14, color: colors.ink, lineHeight: 21 },
});
