import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { demoReading, readTodaySteps, type StepReading } from '../lib/steps';
import { claim, emptyState, exchange, useCoupon, type Coupon, type RewardState } from '../lib/rewards';

/**
 * 월계 들름길 걷기 보상 상태 (기존 AppStore와 분리된 저장 키)
 * - 걸음수는 앱을 열거나 다시 돌아올 때 조회한다(기기가 기록 → 앱이 조회).
 * - 시연 모드 값은 화면에 '시연용 데이터'로 표시한다.
 * - 기기 로컬 저장이라 서버 검증·여러 기기 동기화는 하지 않는다.
 */
const KEY = '@walk/state/v1';

export interface StepLog { at: string; trigger: string; status: string; steps: number | null; demo: boolean }

/**
 * 제휴 가게 성과 이벤트. 걸음수·보상 잔액 등 걷기 데이터는 넣지 않는다(가게용 집계와 분리).
 * shown: 지도·목록·추천 카드 노출, view: 가게 상세 조회, exchanged: 쿠폰 교환, used: 매장 사용 확인
 */
export type StoreEventType = 'shown' | 'view' | 'exchanged' | 'used';
export interface StoreEvent { t: StoreEventType; at: string }

interface Saved {
  rewards: RewardState;
  demo: boolean;
  demoSteps: number;
  log: StepLog[];
  storeEvents: Record<string, StoreEvent[]>;
}

interface WalkStoreValue extends Saved {
  ready: boolean;
  reading: StepReading | null;
  refresh: (trigger?: string) => Promise<void>;
  setDemo: (on: boolean) => void;
  setDemoSteps: (n: number) => void;
  setDemoBalance: (n: number) => void;
  claimToday: () => number;
  exchangeFor: (storeId: string, validDays?: number) => Coupon | null;
  useCouponById: (id: string) => boolean;
  resetWalk: () => void;
  logStore: (storeIds: string[], t: StoreEventType, dedupeKey?: string) => void;
  resetStoreEvents: () => void;
}

const initial: Saved = { rewards: emptyState(), demo: false, demoSteps: 990, log: [], storeEvents: {} };
const MAX_STORE_EVENTS = 500;

function addStoreEvents(cur: Record<string, StoreEvent[]>, ids: string[], t: StoreEventType) {
  const at = new Date().toISOString();
  const next = { ...cur };
  ids.forEach((id) => { next[id] = [...(next[id] ?? []), { t, at }].slice(-MAX_STORE_EVENTS); });
  return next;
}
const Ctx = createContext<WalkStoreValue | null>(null);

export function WalkStoreProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Saved>(initial);
  const [ready, setReady] = useState(false);
  const [reading, setReading] = useState<StepReading | null>(null);
  const ref = useRef(saved);
  ref.current = saved;
  const readingRef = useRef(reading);
  readingRef.current = reading;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setSaved({ ...initial, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved, ready]);

  const refresh = useCallback(async (trigger = '수동 조회') => {
    const { demo, demoSteps } = ref.current;
    const r = demo ? demoReading(demoSteps) : await readTodaySteps();
    setReading(r);
    setSaved((s) => ({
      ...s,
      log: [{ at: r.queriedAt, trigger, status: r.status, steps: r.steps, demo }, ...s.log].slice(0, 30),
    }));
  }, []);

  // 앱 시작·복귀 시 조회
  useEffect(() => {
    if (!ready) return;
    refresh('앱 시작');
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') refresh('앱 복귀'); });
    return () => sub.remove();
  }, [ready, refresh]);

  const setDemo = useCallback((on: boolean) => {
    setSaved((s) => ({ ...s, demo: on }));
    ref.current = { ...ref.current, demo: on };
    refresh(on ? '시연 모드 켬' : '실제 측정으로 전환');
  }, [refresh]);

  const setDemoSteps = useCallback((n: number) => {
    setSaved((s) => ({ ...s, demoSteps: n }));
    ref.current = { ...ref.current, demoSteps: n };
    if (ref.current.demo) setReading(demoReading(n));
  }, []);

  const setDemoBalance = useCallback((n: number) => {
    if (!ref.current.demo) return; // 시연 모드에서만 잔액 조정
    setSaved((s) => ({ ...s, rewards: { ...s.rewards, balance: n } }));
  }, []);

  // 받기: 현재 조회값 기준으로 그날 아직 안 받은 만큼만
  const claimToday = useCallback(() => {
    const r = readingRef.current;
    if (!r || r.status !== 'ok' || r.steps == null) return 0;
    const res = claim(ref.current.rewards, r.dateKey, r.steps);
    if (res.added) {
      ref.current = { ...ref.current, rewards: res.state };
      setSaved((s) => ({ ...s, rewards: res.state }));
    }
    return res.added;
  }, []);

  const exchangeFor = useCallback((storeId: string, validDays?: number) => {
    const res = exchange(ref.current.rewards, storeId, `W${Date.now().toString(36).toUpperCase()}`, new Date(), validDays);
    if (res.coupon) {
      ref.current = { ...ref.current, rewards: res.state };
      setSaved((s) => ({ ...s, rewards: res.state, storeEvents: addStoreEvents(s.storeEvents, [storeId], 'exchanged') }));
    }
    return res.coupon;
  }, []);

  const useCouponById = useCallback((id: string) => {
    const res = useCoupon(ref.current.rewards, id);
    if (res.ok) {
      const storeId = res.state.coupons.find((c) => c.id === id)?.storeId;
      ref.current = { ...ref.current, rewards: res.state };
      setSaved((s) => ({
        ...s, rewards: res.state,
        storeEvents: storeId ? addStoreEvents(s.storeEvents, [storeId], 'used') : s.storeEvents,
      }));
    }
    return res.ok;
  }, []);

  // 같은 화면을 다시 그릴 때 노출이 중복 집계되지 않도록 dedupeKey당 한 번만 기록
  const seenKeys = useRef(new Set<string>());
  const logStore = useCallback((storeIds: string[], t: StoreEventType, dedupeKey?: string) => {
    if (!storeIds.length) return;
    if (dedupeKey) {
      if (seenKeys.current.has(dedupeKey)) return;
      seenKeys.current.add(dedupeKey);
    }
    setSaved((s) => ({ ...s, storeEvents: addStoreEvents(s.storeEvents, storeIds, t) }));
  }, []);

  // 걷기 기록만 초기화(가게 성과 기록은 유지)
  const resetWalk = useCallback(() => {
    const keep = ref.current.storeEvents;
    const next = { ...initial, storeEvents: keep };
    ref.current = next;
    setSaved(next);
    refresh('초기화');
  }, [refresh]);

  const resetStoreEvents = useCallback(() => {
    seenKeys.current.clear();
    setSaved((s) => ({ ...s, storeEvents: {} }));
  }, []);

  const value = useMemo<WalkStoreValue>(() => ({
    ...saved, ready, reading, refresh, setDemo, setDemoSteps, setDemoBalance, claimToday, exchangeFor, useCouponById, resetWalk, logStore, resetStoreEvents,
  }), [saved, ready, reading, refresh, setDemo, setDemoSteps, setDemoBalance, claimToday, exchangeFor, useCouponById, resetWalk, logStore, resetStoreEvents]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWalk() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWalk는 WalkStoreProvider 안에서 사용해야 합니다.');
  return v;
}
