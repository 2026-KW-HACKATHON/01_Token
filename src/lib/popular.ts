import { findPlaceNear } from '../api/kakao';
import { naverEnabled, naverPopular, type NaverPlace } from '../api/naver';
import type { Place } from '../types';
import { FOCUS_DONG } from './focus';
import { distanceM } from './geo';

/**
 * 카카오 + 네이버 결합
 * - 카카오: 장소 목록의 기본 데이터(분류·좌표·주소)와 행정동 판별
 * - 네이버: '카페·블로그 리뷰가 많은 순' 지역 검색으로 인기 근거를 붙이고,
 *   카카오 목록에 빠진 인기 가게를 찾아 카카오 장소로 변환해 후보에 추가한다
 */
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
/** 월계1동을 검색할 때 함께 찾는 동네 랜드마크 (사람들이 실제로 검색하는 이름) */
const FOCUS_LANDMARKS = ['광운대', '광운대역', '석계역'];

function matches(n: NaverPlace, p: Place) {
  const a = norm(n.name);
  const b = norm(p.name);
  if (!a || !b || !(a.includes(b) || b.includes(a))) return false;
  return n.lat == null || n.lng == null || distanceM({ lat: n.lat, lng: n.lng }, p) < 300;
}

export interface NaverEnrich {
  popular: Map<string, string>; // placeId → 인기 근거 문구
  discovered: Place[]; // 카카오 목록에 없던 네이버 인기 가게 (카카오 장소로 변환됨)
}

export async function naverEnrich(
  region: string | null,
  center: { lat: number; lng: number },
  places: Place[],
  opts: { purpose?: string; age?: string; radius: number },
): Promise<NaverEnrich> {
  const popular = new Map<string, string>();
  const discovered: Place[] = [];
  if (!naverEnabled || !region) return { popular, discovered };

  const kinds = [
    ...QUERIES,
    ...(opts.purpose && PURPOSE_QUERY[opts.purpose] ? [PURPOSE_QUERY[opts.purpose]] : []),
    ...(opts.age ? [{ suffix: `${opts.age} 맛집`, kind: `${opts.age} 맛집` }] : []),
  ];
  const queries = kinds.map((k) => ({ area: region, ...k }));
  if (region.includes(FOCUS_DONG) || region.includes('월계') || FOCUS_LANDMARKS.some((l) => region.includes(l))) {
    FOCUS_LANDMARKS.filter((l) => !region.includes(l)).forEach((area) => {
      queries.push({ area, suffix: '맛집', kind: '맛집' }, { area, suffix: '카페', kind: '카페' });
    });
  }

  const lists = await Promise.all(queries.map((q) => naverPopular(`${q.area} ${q.suffix}`)));
  const unmatched = new Map<string, { n: NaverPlace; label: string }>();
  lists.forEach((items, i) => {
    const label = `네이버 리뷰가 많은 ${queries[i].area} 인기 ${queries[i].kind}`;
    items.forEach((n) => {
      const p = places.find((x) => matches(n, x));
      if (p) {
        if (!popular.has(p.id)) popular.set(p.id, label);
      } else if (n.lat != null && n.lng != null && distanceM(center, { lat: n.lat, lng: n.lng }) <= opts.radius + 300) {
        const key = norm(n.name);
        if (!unmatched.has(key)) unmatched.set(key, { n, label });
      }
    });
  });

  // 카카오 목록에 없던 가게는 카카오에서 이름으로 다시 찾아 추가 (최대 15곳)
  const found = await Promise.all(
    [...unmatched.values()].slice(0, 15).map(async ({ n, label }) => ({ place: await findPlaceNear(n.name, n.lat!, n.lng!), label })),
  );
  const known = new Set(places.map((p) => p.id));
  found.forEach(({ place, label }) => {
    if (place && !known.has(place.id)) {
      known.add(place.id);
      discovered.push(place);
      popular.set(place.id, label);
    }
  });
  return { popular, discovered };
}

export { naverEnabled };
