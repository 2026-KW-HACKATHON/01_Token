import type { Home, Review, StatEvent, StatType } from '../types';
import { distanceM } from './geo';

/** 내 동네 반경과 주민 판정 기준 (매니패스트 F-WQKJMS 추천안) */
export const HOME_RADIUS_M = 1500;
export const RESIDENT_MIN_VERIFIED = 3;

export const inHome = (home: Home | null, p: { lat?: number; lng?: number }) =>
  Boolean(home && p.lat != null && p.lng != null && distanceM(home, { lat: p.lat, lng: p.lng }) <= HOME_RADIUS_M);

export const homeVerifiedCount = (home: Home | null, reviews: Review[]) =>
  reviews.filter((r) => r.verified && inHome(home, r)).length;

export const isResident = (home: Home | null, reviews: Review[]) =>
  homeVerifiedCount(home, reviews) >= RESIDENT_MIN_VERIFIED;

/** 주민 추천 배지: 주민이 내 동네 가게에 남긴 방문 인증 후기 */
export const residentBadge = (r: Review, home: Home | null, reviews: Review[]) =>
  r.verified && inHome(home, r) && isResident(home, reviews);

const WEEK = 7 * 24 * 3600 * 1000;
export function statSummary(events: StatEvent[] = [], now = Date.now()) {
  const count = (t: StatType, recent: boolean) =>
    events.filter((e) => e.t === t && (!recent || now - e.at <= WEEK)).length;
  const types: StatType[] = ['shown', 'saved', 'coursed', 'verified'];
  return types.map((t) => ({ t, week: count(t, true), total: count(t, false) }));
}
export const STAT_LABEL: Record<StatType, string> = {
  shown: '추천·검색 노출', saved: '저장', coursed: '코스 담기', verified: '방문 인증',
};
