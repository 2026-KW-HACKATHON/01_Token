type LatLng = { lat: number; lng: number };

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 도보 약 67m/분 기준 */
export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 67));

export const hasCoord = (p: LatLng) =>
  Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0;

/** 카카오맵 길찾기 링크 (앱이 있으면 앱, 없으면 웹으로 열림) */
export const kakaoRouteUrl = (p: { name: string; lat: number; lng: number }) =>
  `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
