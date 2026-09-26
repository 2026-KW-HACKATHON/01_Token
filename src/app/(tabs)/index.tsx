import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Btn, ChipGroup } from '../../components/ui';
import { BUDGETS, DEFAULT_TIME_SLOT, MOODS, PURPOSES, TIME_SLOTS } from '../../constants';
import { colors } from '../../theme';

/** F-OZVLQS 데이트 선호·조건 입력 */
export default function FindScreen() {
  const [region, setRegion] = useState('성수동');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [purpose, setPurpose] = useState<string>();
  const [mood, setMood] = useState<string>();
  const [budget, setBudget] = useState<string>();
  const [timeSlot, setTimeSlot] = useState<string>();

  async function useMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한이 꺼져 있어요', '설정에서 위치 권한을 허용하거나 지역을 직접 입력해 주세요.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      Alert.alert('현재 위치를 가져오지 못했어요', '지역을 직접 입력해 주세요.');
    } finally {
      setLocating(false);
    }
  }

  function start() {
    if (!coords && !region.trim()) {
      Alert.alert('지역을 입력해 주세요', '동 이름이나 역 이름(예: 성수동, 합정역)을 입력하거나 현재 위치를 사용하세요.');
      return;
    }
    router.push({
      pathname: '/recommend',
      params: {
        region: coords ? '' : region.trim(),
        lat: coords ? String(coords.lat) : '',
        lng: coords ? String(coords.lng) : '',
        purpose: purpose ?? '',
        mood: mood ?? '',
        budget: budget ?? '',
        timeSlot: timeSlot ?? '',
      },
    });
  }

  const where = coords ? '현재 위치' : region.trim() || '지역 미입력';

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>오늘 데이트,{'\n'}어디서 시작할까요?</Text>

      <View style={s.group}>
        <Text style={s.label}>지역</Text>
        <View style={s.regionRow}>
          <TextInput
            style={[s.input, coords && s.inputOff]}
            value={coords ? '현재 위치 사용 중' : region}
            editable={!coords}
            onChangeText={setRegion}
            placeholder="성수동, 합정역, 익선동"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
          />
          {coords ? (
            <Btn label="직접 입력" onPress={() => setCoords(null)} />
          ) : (
            <Btn label={locating ? '찾는 중' : '현재 위치'} onPress={useMyLocation} disabled={locating} />
          )}
        </View>
      </View>

      <ChipGroup label="방문 시간대" options={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} />
      <ChipGroup label="데이트 목적" options={PURPOSES} value={purpose} onChange={setPurpose} />
      <ChipGroup label="분위기" options={MOODS} value={mood} onChange={setMood} />
      <ChipGroup label="예산" options={BUDGETS} value={budget} onChange={setBudget} />

      <Text style={s.summary}>
        {where} 반경 1.5km, {timeSlot ?? `${DEFAULT_TIME_SLOT}(기본)`} 기준으로 추천해요. 고르지 않은 조건은 추천에 쓰지 않아요.
      </Text>
      <Btn label="추천 받기" kind="primary" onPress={start} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800', color: colors.ink, marginBottom: 28, letterSpacing: -0.5 },
  group: { marginBottom: 22 },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  regionRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 16, color: colors.ink, minHeight: 46,
  },
  inputOff: { color: colors.muted },
  summary: { fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 12 },
});
