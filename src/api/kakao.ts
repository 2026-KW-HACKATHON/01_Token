import type { Category, Place } from '../types';

const KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY;
const BASE = 'https://dapi.kakao.com/v2/local';

type KakaoDoc = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
};

async function call<T>(path: string, params: Record<string, string | number | undefined>): Promise<T[]> {
  if (!KEY) throw new Error('카카오 REST API 키가 없어요. .env에 EXPO_PUBLIC_KAKAO_REST_KEY를 넣고 앱을 다시 실행하세요.');
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: { Authorization: `KakaoAK ${KEY}` } });
  if (!res.ok) throw new Error(`장소 정보를 불러오지 못했어요 (카카오 API ${res.status}).`);
  const json = await res.json();
  return (json.documents ?? []) as T[];
}

const GROUP_TO_CAT: Record<string, Category> = { FD6: 'FOOD', CE7: 'CAFE', AT4: 'SPOT', CT1: 'SPOT' };
export const CAT_GROUPS: Record<Category, string[]> = { FOOD: ['FD6'], CAFE: ['CE7'], SPOT: ['AT4', 'CT1'] };

function toPlace(d: KakaoDoc): Place | null {
  const category = GROUP_TO_CAT[d.category_group_code];
  if (!category) return null;
  const parts = d.category_name.split(' > ');
  return {
    id: d.id,
    name: d.place_name,
    category,
    categoryName: parts[parts.length - 1],
    categoryPath: d.category_name,
    address: d.road_address_name || d.address_name,
    phone: d.phone || undefined,
    lat: Number(d.y),
    lng: Number(d.x),
    url: d.place_url,
  };
}

/** 동·역·상권 이름을 좌표로 변환 */
export async function findRegion(query: string) {
  const addr = await call<{ x: string; y: string }>('/search/address.json', { query, size: 1 });
  if (addr.length) return { lat: Number(addr[0].y), lng: Number(addr[0].x), label: query };
  const kw = await call<KakaoDoc>('/search/keyword.json', { query, size: 1 });
  if (kw.length) return { lat: Number(kw[0].y), lng: Number(kw[0].x), label: query };
  return null;
}

/** 반경 내 카테고리 검색. keyword가 있으면 키워드 검색 */
export async function searchNearby(opts: {
  group: string;
  lat: number;
  lng: number;
  radius: number;
  keyword?: string;
  pages?: number;
}): Promise<Place[]> {
  const path = opts.keyword ? '/search/keyword.json' : '/search/category.json';
  const pages = Array.from({ length: opts.pages ?? 1 }, (_, i) => i + 1);
  const results = await Promise.all(
    pages.map((page) =>
      call<KakaoDoc>(path, {
        query: opts.keyword,
        category_group_code: opts.group,
        x: opts.lng,
        y: opts.lat,
        radius: opts.radius,
        page,
        size: 15,
      })
    )
  );
  return results.flat().map(toPlace).filter((p): p is Place => p !== null);
}
