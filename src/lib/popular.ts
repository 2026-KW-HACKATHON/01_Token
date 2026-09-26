import { naverEnabled, naverPopular, type NaverPlace } from '../api/naver';
import type { Place } from '../types';
import { distanceM } from './geo';

/** 네이버에서 '카페·블로그 리뷰가 많은 순'으로 뽑은 동네 인기 가게를 카카오 장소와 연결한다 */
const norm = (s: string) => s.replace(/\s|점$|본점$|\(.*?\)/g, '').toLowerCase();

const QUERIES: { suffix: string; kind: string }[] = [
  { suffix: '맛집', kind: '맛집' },
  { suffix: '카페', kind: '카페' },
  { suffix: '가볼만한곳', kind: '명소' },
];
const PURPOSE_QUERY: Record<string, { suffix: string; kind: string }> = {
  couple: { suffix: '데이트', kind: '데이트 장소' },
  family: { suffix: '가족 외식', kind: '가족 외식 장소' },
  friends: { suffix: '모임', kind: '모임 장소' },
};

function matches(n: NaverPlace, p: Place) {
  const a = norm(n.name);
  const b = norm(p.name);
  if (!a || !b || !(a.includes(b) || b.includes(a))) return false;
  return n.lat == null || n.lng == null || distanceM({ lat: n.lat, lng: n.lng }, p) < 300;
}

/** placeId → 인기 근거 문구 */
export async function popularMap(region: string | null, places: Place[], purpose?: string) {
  const result = new Map<string, string>();
  if (!naverEnabled || !region) return result;
  const qs = [...QUERIES, ...(purpose && PURPOSE_QUERY[purpose] ? [PURPOSE_QUERY[purpose]] : [])];
  const lists = await Promise.all(qs.map((q) => naverPopular(`${region} ${q.suffix}`)));
  lists.forEach((items, i) => {
    items.forEach((n) => {
      const p = places.find((x) => matches(n, x));
      if (p && !result.has(p.id)) result.set(p.id, `네이버 리뷰가 많은 ${region} 인기 ${qs[i].kind}`);
    });
  });
  return result;
}

export { naverEnabled };
