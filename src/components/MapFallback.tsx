import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { kakaoMapUrl, naverPlaceUrl } from '../lib/mapSupport';
import { colors } from '../theme';
import { Btn } from './ui';

/** 앱 안 지도를 띄울 수 없을 때(안드로이드 APK) 지도 앱으로 여는 대체 영역 */
export function MapFallback({ place, note }: { place?: { name: string; lat: number; lng: number }; note?: string }) {
  const open = (url: string, fallback?: string) =>
    Linking.openURL(url).catch(() =>
      fallback
        ? Linking.openURL(fallback).catch(() => Alert.alert('지도 앱을 열 수 없어요'))
        : Alert.alert('지도 앱을 열 수 없어요'));

  return (
    <View style={s.box}>
      <Text style={s.title}>🗺 지도는 지도 앱에서 볼 수 있어요</Text>
      <Text style={s.body}>{note ?? '이 기기에서는 앱 안 지도를 표시하지 않아요.'}</Text>
      {place && (
        <View style={s.row}>
          <Btn label="네이버 지도" onPress={() => open(naverPlaceUrl(place), kakaoMapUrl(place))} style={{ flex: 1 }} />
          <Btn label="카카오맵" onPress={() => open(kakaoMapUrl(place))} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.routeSoft, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: colors.route },
  body: { fontSize: 13, color: colors.ink, marginTop: 4, lineHeight: 19 },
  row: { flexWrap: 'wrap', flexDirection: 'row', gap: 8, marginTop: 16 },
});
