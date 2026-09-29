import type { PlaceInfo } from '../types';

export const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
export type OpenState = 'open' | 'closed' | 'unknown';

export const toMin = (s?: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s ?? '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

export const isValidTime = (s?: string) => !Number.isNaN(toMin(s)) && toMin(s) <= 24 * 60;

/** 운영자가 등록하고 관리자가 게시한 영업시간 기준. 정보가 없으면 'unknown' */
export function openState(info?: PlaceInfo, now = new Date()): OpenState {
  if (!info) return 'unknown';
  const o = toMin(info.open);
  const c = toMin(info.close);
  if (Number.isNaN(o) || Number.isNaN(c)) return 'unknown';
  if (info.closedDays.includes(now.getDay())) return 'closed';
  const t = now.getHours() * 60 + now.getMinutes();
  const inside = c > o ? t >= o && t < c : t >= o || t < c;
  return inside ? 'open' : 'closed';
}

export const OPEN_LABEL: Record<OpenState, string> = {
  open: '영업 중', closed: '영업 종료', unknown: '영업시간 미확인',
};

export const hoursText = (info?: PlaceInfo) =>
  info?.open && info?.close ? `${info.open} ~ ${info.close}` : undefined;

export const closedDaysText = (info?: PlaceInfo) =>
  info && (info.open || info.closedDays.length)
    ? info.closedDays.length ? info.closedDays.map((d) => DAYS[d]).join(', ') + '요일' : '없음'
    : undefined;

/** 동네 혜택이 지금 적용되는지 (시간대가 없으면 항상 적용) */
export function perkActive(info?: PlaceInfo, now = new Date()): boolean {
  if (!info?.perk) return false;
  const o = toMin(info.perkStart);
  const c = toMin(info.perkEnd);
  if (Number.isNaN(o) || Number.isNaN(c)) return true;
  const t = now.getHours() * 60 + now.getMinutes();
  return c > o ? t >= o && t < c : t >= o || t < c;
}

export const perkWindow = (info?: PlaceInfo) =>
  info?.perkStart && info?.perkEnd ? `${info.perkStart} ~ ${info.perkEnd}` : undefined;

export const PAYMENTS = [
  { key: 'local', label: '지역화폐' },
  { key: 'onnuri', label: '온누리' },
  { key: 'zeropay', label: '제로페이' },
] as const;
export const paymentLabel = (k: string) => PAYMENTS.find((p) => p.key === k)?.label ?? k;
