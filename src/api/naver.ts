/**
 * NAVER API HUB 지역 검색 (2026-07-31부터 신규 키는 API HUB에서만 발급)
 * sort=comment: 카페·블로그 리뷰 개수가 많은 순. 한 번에 최대 5개.
 */
const ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
const SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET;
const BASE = 'https://naverapihub.apigw.ntruss.com/search/v1/local';

export const naverEnabled = Boolean(ID && SECRET);

export interface NaverPlace {
  name: string;
  category: string;
  lat?: number;
  lng?: number;
}

const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const coord = (v: string) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return undefined;
  return Math.abs(n) > 1000 ? n / 1e7 : n; // 정수형(WGS84×10^7)으로 오는 경우 보정
};

const cache = new Map<string, Promise<NaverPlace[]>>();

export function naverPopular(query: string): Promise<NaverPlace[]> {
  if (!naverEnabled) return Promise.resolve([]);
  const hit = cache.get(query);
  if (hit) return hit;
  const req = fetch(`${BASE}?query=${encodeURIComponent(query)}&display=5&start=1&sort=comment&format=json`, {
    headers: { 'X-NCP-APIGW-API-KEY-ID': ID!, 'X-NCP-APIGW-API-KEY': SECRET! },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`NAVER ${res.status}`);
      const json = await res.json();
      return ((json.items ?? []) as { title: string; category: string; mapx: string; mapy: string }[]).map((i) => ({
        name: strip(i.title), category: i.category, lng: coord(i.mapx), lat: coord(i.mapy),
      }));
    })
    .catch(() => {
      cache.delete(query); // 실패는 캐시하지 않음
      return [] as NaverPlace[];
    });
  cache.set(query, req);
  return req;
}

/** 네이버 지도 앱/웹에서 장소 검색 화면 열기 */
export const naverMapUrl = (name: string) => `https://map.naver.com/p/search/${encodeURIComponent(name)}`;
