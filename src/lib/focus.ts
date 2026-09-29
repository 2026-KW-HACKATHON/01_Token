import { regionName } from '../api/kakao';
import type { Place } from '../types';

/**
 * 집중 지역: 서울특별시 노원구 월계1동 (PRD 개정안)
 * 행정동은 주소(법정동 '월계동')로는 구분이 안 되어, 카카오 좌표→행정동 변환으로 판별한다.
 */
export const FOCUS_DONG = '월계1동';
export const DEFAULT_REGION = '월계1동';

const cache = new Map<string, Promise<string | null>>();

export function dongOf(p: Place): Promise<string | null> {
  if (p.dong) return Promise.resolve(p.dong);
  const hit = cache.get(p.id);
  if (hit) return hit;
  const req = regionName(p.lat, p.lng);
  cache.set(p.id, req);
  return req;
}

/** 후보 장소들의 행정동을 동시에 최대 8개씩 조회해 place.dong을 채운다 */
export async function annotateDong(places: Place[]): Promise<Place[]> {
  const out: Place[] = [];
  for (let i = 0; i < places.length; i += 8) {
    const chunk = places.slice(i, i + 8);
    const dongs = await Promise.all(chunk.map((p) => dongOf(p).catch(() => null)));
    chunk.forEach((p, j) => out.push(dongs[j] ? { ...p, dong: dongs[j]! } : p));
  }
  return out;
}

export const isFocus = (p: Place) => p.dong === FOCUS_DONG;
