import type { Category } from './types';

/**
 * 월계 들름길 디자인 토큰 — 밝은 회색 바탕 + 흰 카드 + 광운대 색(#8A1601) 포인트.
 * 예전 화면(코스 찾기 등)이 쓰는 키(rose, route, done …)는 이름을 유지하고 값만 새 팔레트로 맞춘다.
 */
export const colors = {
  // 바탕·표면
  paper: '#F2F4F6',
  card: '#FFFFFF',
  fill: '#F2F4F6', // 카드 안의 회색 영역
  line: '#E5E8EB',

  // 글자
  ink: '#191F28',
  sub: '#333D4B',
  muted: '#6B7684',
  faint: '#9EA6B0',

  // 포인트
  primary: '#8A1601',
  primaryPressed: '#6B1100',
  primarySoft: '#FBEDEA',
  primaryLight: '#D9A79E', // 받을 수 있는 보상 칸
  success: '#03A66D',
  successSoft: '#E6F8F0',
  warnBg: '#FFF6E0',
  warnText: '#9A6700',
  danger: '#D92D20',
  dangerSoft: '#FDECEA',

  // 예전 키 (호환용)
  rose: '#8A1601',
  roseSoft: '#FBEDEA',
  route: '#8A1601',
  routeSoft: '#FBEDEA',
  done: '#03A66D',
  doneSoft: '#E6F8F0',
  accent: '#8A1601',
};

export const radius = { card: 24, inner: 16, btn: 16 };

export const CATEGORY_LABEL: Record<Category, string> = {
  FOOD: '식사',
  CAFE: '카페',
  SPOT: '산책·관광',
};

export const CATEGORY_ICON: Record<Category, string> = {
  FOOD: '🍽',
  CAFE: '☕',
  SPOT: '🌿',
};

/** 들름길 가게 분류별 아이콘 */
export const STORE_ICON: Record<string, string> = {
  식사: '🍲',
  분식: '🍢',
  베이커리: '🥐',
  '카페·디저트': '☕',
};
