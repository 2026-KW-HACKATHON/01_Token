import type { Review } from '../types';

export interface ReviewSummary {
  count: number;
  verified: number;
  avg: number;
  revisitRate: number;
  companions: Record<string, number>;
}

export function summarize(reviews: Review[], placeId: string): ReviewSummary | null {
  const list = reviews.filter((r) => r.placeId === placeId);
  if (!list.length) return null;
  const companions: Record<string, number> = {};
  list.forEach((r) => { companions[r.companion] = (companions[r.companion] ?? 0) + 1; });
  return {
    count: list.length,
    verified: list.filter((r) => r.verified).length,
    avg: list.reduce((a, r) => a + r.satisfaction, 0) / list.length,
    revisitRate: list.filter((r) => r.revisit).length / list.length,
    companions,
  };
}

/** 신뢰도 점수: 방문 인증 후기에 가중치를 둔다 (S-OQBYIM) */
export const trustScore = (s: ReviewSummary | null) => (s ? s.verified * 3 + s.count + s.avg : -1);

export const COMPANIONS = ['연인', '가족', '친구', '혼자'] as const;
export const REVIEW_MOODS = ['조용한', '아늑한', '감성적인', '활기찬'] as const;
export const PRICE_FEELS = ['저렴해요', '적당해요', '비싸요'] as const;
export const VERIFY_RADIUS_M = 200;
