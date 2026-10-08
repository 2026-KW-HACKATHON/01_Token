/**
 * 걷기 보상 규칙 (시제품 임시 기준, docs/WALK_REWARD_MAP_FINAL.md)
 * - 1,000보당 보상 1개, 하루 최대 5개
 * - 보상 10개 = 특정 가게 쿠폰 1장
 * - 잔액은 다음 날로 이월, 일별 지급 한도는 날짜마다 초기화
 * - 조회값 전체를 잔액에 더하지 않고, 해당 날짜에 이미 받은 개수와의 차이만 지급
 */
export const STEPS_PER_REWARD = 1000;
export const DAILY_MAX = 5;
export const COUPON_COST = 10;

export interface Coupon {
  id: string;
  storeId: string;
  issuedAt: string;
  expiresAt?: string;
  usedAt?: string;
}

export interface RewardState {
  balance: number;
  claimedByDate: Record<string, number>; // 날짜별 이미 받은 보상 개수
  coupons: Coupon[];
}

export const emptyState = (): RewardState => ({ balance: 0, claimedByDate: {}, coupons: [] });

export const earnedFor = (steps: number) =>
  Math.min(Math.floor(Math.max(0, steps) / STEPS_PER_REWARD), DAILY_MAX);

export const claimable = (s: RewardState, dateKey: string, steps: number) =>
  Math.max(0, earnedFor(steps) - (s.claimedByDate[dateKey] ?? 0));

/** 받기: 같은 걸음수로 여러 번 눌러도 추가 지급 없음. 걸음수가 줄어도 음수 지급 없음 */
export function claim(s: RewardState, dateKey: string, steps: number): { state: RewardState; added: number } {
  const added = claimable(s, dateKey, steps);
  if (added === 0) return { state: s, added: 0 };
  return {
    added,
    state: {
      ...s,
      balance: s.balance + added,
      claimedByDate: { ...s.claimedByDate, [dateKey]: (s.claimedByDate[dateKey] ?? 0) + added },
    },
  };
}

/** 교환: 잔액 차감과 쿠폰 생성을 한 번에. 잔액 부족이면 아무것도 바꾸지 않음 */
export function exchange(s: RewardState, storeId: string, id: string, now = new Date(), validDays?: number):
  { state: RewardState; coupon: Coupon | null } {
  if (s.balance < COUPON_COST) return { state: s, coupon: null };
  const coupon: Coupon = {
    id, storeId, issuedAt: now.toISOString(),
    expiresAt: validDays ? new Date(now.getTime() + validDays * 864e5).toISOString() : undefined,
  };
  return { coupon, state: { ...s, balance: s.balance - COUPON_COST, coupons: [coupon, ...s.coupons] } };
}

/** 사용 확인: 이미 사용한 쿠폰은 다시 사용 처리하지 않음 */
export function useCoupon(s: RewardState, id: string, now = new Date()): { state: RewardState; ok: boolean } {
  const c = s.coupons.find((x) => x.id === id);
  if (!c || c.usedAt) return { state: s, ok: false };
  if (c.expiresAt && new Date(c.expiresAt) < now) return { state: s, ok: false };
  return { ok: true, state: { ...s, coupons: s.coupons.map((x) => (x.id === id ? { ...x, usedAt: now.toISOString() } : x)) } };
}
