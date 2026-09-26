import type { Category } from './types';

export const PURPOSES = ['첫 데이트', '기념일', '가벼운 만남', '활동적인 데이트'] as const;
export const MOODS = ['조용한', '감성적인', '뷰가 좋은', '활기찬'] as const;
export const BUDGETS = ['가볍게', '적당히', '여유 있게'] as const;
export const TIME_SLOTS = ['낮', '오후', '저녁'] as const;
export const DEFAULT_TIME_SLOT = '오후';

/** 목적별로 어울리는 카카오 분류 키워드 */
export const PURPOSE_HINTS: Record<string, string[]> = {
  '첫 데이트': ['이탈리안', '양식', '디저트', '베이커리', '공원'],
  기념일: ['양식', '프랑스', '이탈리안', '일식', '스테이크', '와인', '전망대'],
  '가벼운 만남': ['분식', '한식', '국수', '베이커리', '디저트'],
  '활동적인 데이트': ['공방', '체험', '테마', '전시', '미술관', '공원'],
};

export const BUDGET_HINTS: Record<string, string[]> = {
  가볍게: ['분식', '국수', '베이커리', '패스트푸드', '한식'],
  적당히: [],
  '여유 있게': ['양식', '프랑스', '일식', '스테이크', '오마카세', '와인'],
};

/** 분위기 → 카카오 키워드 검색어 */
export const MOOD_KEYWORD: Record<string, string> = {
  조용한: '조용한',
  감성적인: '감성',
  '뷰가 좋은': '루프탑',
  활기찬: '핫플',
};

/** 시간대별 코스 구성 순서 */
export const SLOT_ORDER: Record<string, Category[]> = {
  낮: ['SPOT', 'FOOD', 'CAFE'],
  오후: ['CAFE', 'SPOT', 'FOOD'],
  저녁: ['FOOD', 'SPOT', 'CAFE'],
};

export const SEARCH_RADIUS_M = 1500;
