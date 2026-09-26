import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { searchImage, type SearchImage } from '../api/kakao';
import { colors, CATEGORY_ICON } from '../theme';
import type { Place } from '../types';

/** 가게 이름 + 구 이름으로 검색한 대표 이미지 */
export const imageQuery = (p: Place) => {
  const gu = p.address.split(' ').find((t) => /[구군시]$/.test(t)) ?? '';
  return `${p.name} ${gu}`.trim();
};

export function usePlaceImage(p: Place, enabled = true) {
  const [img, setImg] = useState<SearchImage | null>(null);
  useEffect(() => {
    let alive = true;
    if (enabled) searchImage(imageQuery(p)).then((r) => { if (alive) setImg(r); });
    return () => { alive = false; };
  }, [p, enabled]);
  return img;
}

/** 목록용 작은 썸네일. 이미지가 없으면 분류 아이콘 */
export function PlaceThumb({ place, size = 56, enabled = true }: { place: Place; size?: number; enabled?: boolean }) {
  const img = usePlaceImage(place, enabled);
  const [failed, setFailed] = useState(false);
  return (
    <View style={[s.box, { width: size, height: size }]}>
      {img && !failed ? (
        <Image source={{ uri: img.thumbnail }} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      ) : (
        <Text style={{ fontSize: size * 0.42 }}>{CATEGORY_ICON[place.category]}</Text>
      )}
    </View>
  );
}

/** 상세 화면용 큰 이미지 + 출처 */
export function PlaceHero({ place }: { place: Place }) {
  const img = usePlaceImage(place);
  const [failed, setFailed] = useState(false);
  if (!img || failed) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Image source={{ uri: img.thumbnail }} style={s.hero} resizeMode="cover" onError={() => setFailed(true)} />
      <Pressable onPress={() => Linking.openURL(img.docUrl).catch(() => {})}>
        <Text style={s.caption}>검색 이미지라 실제와 다를 수 있어요. 출처: {img.source || '웹 문서'} ›</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line,
  },
  hero: { width: '100%', height: 190, borderRadius: 16, backgroundColor: colors.line },
  caption: { fontSize: 11, color: colors.muted, marginTop: 6 },
});
