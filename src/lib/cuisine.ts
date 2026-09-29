import type { Place } from '../types';

/**
 * 음식 종류 (매니패스트 S-WGLJGI: 한식·중식·일식·양식 + 분식·아시안·카페·디저트, 복수 선택)
 * 분류 체계와 동의어 사전은 age-cuisine-feature 모듈에서 가져와 카카오 분류에 맞췄다.
 */
export const CUISINES = [
  { code: 'KOREAN', label: '한식', kakao: ['한식'] },
  { code: 'CHINESE', label: '중식', kakao: ['중식'] },
  { code: 'JAPANESE', label: '일식', kakao: ['일식'] },
  { code: 'WESTERN', label: '양식', kakao: ['양식', '패스트푸드'] },
  { code: 'BUNSIK', label: '분식', kakao: ['분식'] },
  { code: 'ASIAN', label: '아시안', kakao: ['아시아음식'] },
  { code: 'CAFE_DESSERT', label: '카페·디저트', kakao: ['카페', '간식', '제과,베이커리', '디저트'] },
] as const;

export type CuisineCode = (typeof CUISINES)[number]['code'];
export const CUISINE_LABEL = Object.fromEntries(CUISINES.map((c) => [c.code, c.label])) as Record<CuisineCode, string>;
export const isCuisine = (s: string): s is CuisineCode => CUISINES.some((c) => c.code === s);

/** 카카오 분류 경로로 음식 종류 판정 (예: 음식점 > 중식 > 중국요리 → CHINESE) */
export function cuisinesOf(p: Place): CuisineCode[] {
  if (p.category === 'SPOT') return [];
  const parts = p.categoryPath.split(' > ');
  if (p.category === 'CAFE') return ['CAFE_DESSERT'];
  return CUISINES.filter((c) => c.kakao.some((k) => parts.includes(k))).map((c) => c.code);
}

const SYNONYMS: Record<CuisineCode, string[]> = {
  KOREAN: ['한식', '한정식', '백반', '국밥', '찌개', '고기집', '삼겹살', '갈비', '한우', '비빔밥', '냉면', '칼국수', '보쌈', '족발'],
  CHINESE: ['중식', '중국집', '중국음식', '짜장면', '짜장', '짬뽕', '탕수육', '마라탕', '마라', '딤섬', '훠궈'],
  JAPANESE: ['일식', '일본음식', '초밥', '스시', '라멘', '돈카츠', '돈까스', '우동', '오마카세', '이자카야', '규동', '소바'],
  WESTERN: ['양식', '파스타', '스테이크', '피자', '버거', '햄버거', '브런치', '이탈리안', '프렌치', '리조또'],
  BUNSIK: ['분식', '떡볶이', '김밥', '순대', '라볶이'],
  ASIAN: ['아시안', '베트남', '쌀국수', '태국', '팟타이', '인도', '커리', '카레', '멕시칸', '타코'],
  CAFE_DESSERT: ['카페', '디저트', '커피', '베이커리', '빵집', '케이크', '빙수', '마카롱'],
};
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/** 검색어에서 음식 종류 인식 (예: "성수 중국집" → CHINESE) */
export function detectCuisines(query: string): CuisineCode[] {
  const q = norm(query);
  if (!q) return [];
  return (Object.keys(SYNONYMS) as CuisineCode[]).filter((c) => SYNONYMS[c].some((w) => q.includes(norm(w))));
}
