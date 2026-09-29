import type { Place } from '../types';

/** 연령대 (매니패스트 추천안: 10대/20대/30대/40대/50대 이상) */
export const AGE_GROUPS = [
  { code: '10s', label: '10대' },
  { code: '20s', label: '20대' },
  { code: '30s', label: '30대' },
  { code: '40s', label: '40대' },
  { code: '50s', label: '50대 이상' },
] as const;

export const ageLabel = (code?: string) => AGE_GROUPS.find((a) => a.code === code)?.label;

/**
 * 연령대별로 선호도가 높을 것으로 추정하는 카카오 분류.
 * 실제 연령별 방문 데이터는 공개 API에 없어서 분류 기반으로 '순위만' 조정하고 결과에서 빼지 않는다.
 * 네이버 "동네 + 연령대 + 맛집" 리뷰 인기 검색이 실제 데이터 신호를 보완한다.
 */
const AGE_HINTS: Record<string, string[]> = {
  '10s': ['분식', '떡볶이', '패스트푸드', '햄버거', '간식', '디저트카페', '테마카페', '마라'],
  '20s': ['디저트카페', '테마카페', '이탈리안', '일식', '이자카야', '브런치', '전시', '공방'],
  '30s': ['양식', '브런치', '와인', '오마카세', '일식', '미술관', '전시'],
  '40s': ['한식', '육류,고기', '해물,생선', '중식', '공원'],
  '50s': ['한식', '한정식', '국수', '칼국수', '해물,생선', '공원', '수목원'],
};

export function ageHit(p: Place, code?: string) {
  if (!code) return undefined;
  const parts = p.categoryPath.split(' > ');
  return AGE_HINTS[code]?.find((h) => parts.some((x) => x.includes(h)));
}
