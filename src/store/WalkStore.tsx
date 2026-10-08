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

interface Saved {
  rewards: RewardState;
  demo: boolean;
  demoSteps: number;
  log: StepLog[];
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
}

const initial: Saved = { rewards: emptyState(), demo: false, demoSteps: 990, log: [] };
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
      setSaved((s) => ({ ...s, rewards: res.state }));
    }
    return res.coupon;
  }, []);

  const useCouponById = useCallback((id: string) => {
    const res = useCoupon(ref.current.rewards, id);
    if (res.ok) {
      ref.current = { ...ref.current, rewards: res.state };
      setSaved((s) => ({ ...s, rewards: res.state }));
    }
    return res.ok;
  }, []);

  const resetWalk = useCallback(() => {
    ref.current = initial;
    setSaved(initial);
    refresh('초기화');
  }, [refresh]);

  const value = useMemo<WalkStoreValue>(() => ({
    ...saved, ready, reading, refresh, setDemo, setDemoSteps, setDemoBalance, claimToday, exchangeFor, useCouponById, resetWalk,
  }), [saved, ready, reading, refresh, setDemo, setDemoSteps, setDemoBalance, claimToday, exchangeFor, useCouponById, resetWalk]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWalk() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWalk는 WalkStoreProvider 안에서 사용해야 합니다.');
  return v;
}
