import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { newId } from '../lib/nav';
import type {
  Course, FeedbackKind, HiddenPlace, Home, InfoEdit, InfoReport, OwnerRequest, Place, PlaceInfo, Review, Role,
  StatEvent, StatType,
} from '../types';

/**
 * 로그인·서버 도입 전 단계라 모든 데이터는 이 기기에만 저장한다.
 * 역할(일반/운영자/관리자)은 시연을 위해 직접 전환한다.
 */
interface State {
  courses: Course[];
  saved: Place[];
  feedback: Record<string, FeedbackKind>; // 장소 id 또는 `course:<key>`
  reviews: Review[];
  reports: InfoReport[];
  ownerRequests: OwnerRequest[];
  infoEdits: InfoEdit[];
  placeInfo: Record<string, PlaceInfo>; // 관리자가 게시한 운영 정보
  hidden: Record<string, HiddenPlace>; // 관리자 비공개 장소
  role: Role;
  home: Home | null; // 내 동네
  events: Record<string, StatEvent[]>; // 가게별 노출·저장·코스 담기·방문 인증 기록
}

type AddResult = 'added' | 'duplicate' | 'missing';
type Result = 'ok' | 'duplicate';

interface Store extends State {
  ready: boolean;
  isSaved: (id: string) => boolean;
  toggleSave: (p: Place) => void;
  giveFeedback: (id: string, kind: FeedbackKind) => void;
  undoFeedback: (id: string) => void;
  createCourse: (name: string, places?: Place[], sourceKey?: string, purpose?: string) => string;
  updateCourse: (id: string, fn: (c: Course) => Course) => void;
  deleteCourse: (id: string) => void;
  addPlaceToCourse: (courseId: string, p: Place) => AddResult;
  saveReview: (r: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => Result;
  verifyReview: (id: string) => void;
  addReport: (p: Place, field: string, content: string) => Result;
  resolveReport: (id: string) => void;
  requestOwner: (p: Place, applicant: string, contact: string, proof: string) => Result;
  decideOwner: (id: string, approve: boolean) => void;
  isOwnerOf: (placeId: string) => boolean;
  submitInfoEdit: (p: Place, after: PlaceInfo) => Result;
  decideInfoEdit: (id: string, publish: boolean) => void;
  hidePlace: (p: Place, reason: string) => void;
  unhidePlace: (id: string) => void;
  setRole: (r: Role) => void;
  setHome: (h: Home | null) => void;
  logShown: (placeIds: string[], sessionKey: string) => void;
  stampStop: (courseId: string, placeId: string) => void;
}

const STORAGE_KEY = '@datecourse/state/v1';
const initial: State = {
  courses: [], saved: [], feedback: {}, reviews: [], reports: [], ownerRequests: [], infoEdits: [],
  placeInfo: {}, hidden: {}, role: 'user', home: null, events: {},
};

const MAX_EVENTS = 300;
function addEvents(events: State['events'], ids: string[], t: StatType): State['events'] {
  const now = Date.now();
  const next = { ...events };
  ids.forEach((id) => { next[id] = [...(next[id] ?? []), { t, at: now }].slice(-MAX_EVENTS); });
  return next;
}
const Ctx = createContext<Store | null>(null);

function uniq(places: Place[]) {
  const seen = new Set<string>();
  return places.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setState({ ...initial, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const patch = useCallback((fn: (s: State) => Partial<State>) => setState((s) => ({ ...s, ...fn(s) })), []);

  const toggleSave = useCallback((p: Place) => patch((s) => {
    const had = s.saved.some((x) => x.id === p.id);
    return {
      saved: had ? s.saved.filter((x) => x.id !== p.id) : [p, ...s.saved],
      events: had ? s.events : addEvents(s.events, [p.id], 'saved'),
    };
  }), [patch]);

  const giveFeedback = useCallback((id: string, kind: FeedbackKind) =>
    patch((s) => ({ feedback: { ...s.feedback, [id]: kind } })), [patch]);

  const undoFeedback = useCallback((id: string) => patch((s) => {
    const feedback = { ...s.feedback };
    delete feedback[id];
    return { feedback };
  }), [patch]);

  const createCourse = useCallback((name: string, places: Place[] = [], sourceKey?: string, purpose?: string) => {
    if (sourceKey) {
      const existing = ref.current.courses.find((c) => c.sourceKey === sourceKey);
      if (existing) return existing.id;
    }
    const id = newId('c');
    const now = Date.now();
    const course: Course = {
      id, name, sourceKey, purpose, status: 'planning', createdAt: now, updatedAt: now,
      stops: uniq(places).map((place) => ({ place })),
    };
    patch((s) => ({ courses: [course, ...s.courses], events: addEvents(s.events, course.stops.map((x) => x.place.id), 'coursed') }));
    return id;
  }, [patch]);

  const updateCourse = useCallback((id: string, fn: (c: Course) => Course) => patch((s) => ({
    courses: s.courses.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)),
  })), [patch]);

  const deleteCourse = useCallback((id: string) =>
    patch((s) => ({ courses: s.courses.filter((c) => c.id !== id) })), [patch]);

  const addPlaceToCourse = useCallback((courseId: string, p: Place): AddResult => {
    const course = ref.current.courses.find((c) => c.id === courseId);
    if (!course) return 'missing';
    if (course.stops.some((s) => s.place.id === p.id)) return 'duplicate';
    updateCourse(courseId, (c) => ({ ...c, stops: [...c.stops, { place: p }] }));
    patch((s) => ({ events: addEvents(s.events, [p.id], 'coursed') }));
    return 'added';
  }, [updateCourse, patch]);

  // 후기: 같은 장소는 방문 월이 다를 때만 새로 쓸 수 있다 (S-DHVYXI)
  const saveReview = useCallback((r: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>, editId?: string): Result => {
    const dup = ref.current.reviews.find(
      (x) => x.placeId === r.placeId && x.visitedMonth === r.visitedMonth && x.id !== editId
    );
    if (dup) return 'duplicate';
    const now = Date.now();
    const prev = ref.current.reviews.find((x) => x.id === editId);
    const newlyVerified = r.verified && !prev?.verified;
    patch((s) => ({
      events: newlyVerified ? addEvents(s.events, [r.placeId], 'verified') : s.events,
      reviews: editId
        ? s.reviews.map((x) => (x.id === editId ? { ...x, ...r, updatedAt: now } : x))
        : [{ ...r, id: newId('r'), createdAt: now, updatedAt: now }, ...s.reviews],
    }));
    return 'ok';
  }, [patch]);

  const verifyReview = useCallback((id: string) => patch((s) => {
    const r = s.reviews.find((x) => x.id === id);
    if (!r || r.verified) return {};
    return {
      reviews: s.reviews.map((x) => (x.id === id ? { ...x, verified: true } : x)),
      events: addEvents(s.events, [r.placeId], 'verified'),
    };
  }), [patch]);

  const addReport = useCallback((p: Place, field: string, content: string): Result => {
    if (ref.current.reports.some((r) => r.placeId === p.id && r.field === field && r.status === 'received')) {
      return 'duplicate';
    }
    const report: InfoReport = {
      id: newId('p'), placeId: p.id, placeName: p.name, field, content, status: 'received', createdAt: Date.now(),
    };
    patch((s) => ({ reports: [report, ...s.reports] }));
    return 'ok';
  }, [patch]);

  const resolveReport = useCallback((id: string) =>
    patch((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r)) })), [patch]);

  const requestOwner = useCallback((p: Place, applicant: string, contact: string, proof: string): Result => {
    if (ref.current.ownerRequests.some((r) => r.place.id === p.id && r.status !== 'rejected')) return 'duplicate';
    const req: OwnerRequest = {
      id: newId('o'), place: p, applicant, contact, proof, status: 'pending', createdAt: Date.now(),
    };
    patch((s) => ({ ownerRequests: [req, ...s.ownerRequests] }));
    return 'ok';
  }, [patch]);

  const decideOwner = useCallback((id: string, approve: boolean) => patch((s) => ({
    ownerRequests: s.ownerRequests.map((r) =>
      r.id === id ? { ...r, status: approve ? 'approved' : 'rejected', decidedAt: Date.now() } : r),
  })), [patch]);

  const isOwnerOf = useCallback((placeId: string) =>
    state.ownerRequests.some((r) => r.place.id === placeId && r.status === 'approved'), [state.ownerRequests]);

  // 운영자 변경은 관리자 검수 후에만 공개 정보에 반영한다 (S-PHPZRM, S-PAHDDO)
  const submitInfoEdit = useCallback((p: Place, after: PlaceInfo): Result => {
    if (ref.current.infoEdits.some((e) => e.placeId === p.id && e.status === 'pending')) return 'duplicate';
    const edit: InfoEdit = {
      id: newId('e'), placeId: p.id, placeName: p.name, before: ref.current.placeInfo[p.id] ?? null, after,
      status: 'pending', createdAt: Date.now(),
    };
    patch((s) => ({ infoEdits: [edit, ...s.infoEdits] }));
    return 'ok';
  }, [patch]);

  const decideInfoEdit = useCallback((id: string, publish: boolean) => patch((s) => {
    const edit = s.infoEdits.find((e) => e.id === id);
    if (!edit) return {};
    return {
      infoEdits: s.infoEdits.map((e) =>
        e.id === id ? { ...e, status: publish ? 'approved' : 'rejected', decidedAt: Date.now() } : e),
      placeInfo: publish ? { ...s.placeInfo, [edit.placeId]: edit.after } : s.placeInfo,
    };
  }), [patch]);

  const hidePlace = useCallback((p: Place, reason: string) =>
    patch((s) => ({ hidden: { ...s.hidden, [p.id]: { name: p.name, reason, at: Date.now() } } })), [patch]);

  const unhidePlace = useCallback((id: string) => patch((s) => {
    const hidden = { ...s.hidden };
    delete hidden[id];
    return { hidden };
  }), [patch]);

  const setRole = useCallback((role: Role) => patch(() => ({ role })), [patch]);
  const setHome = useCallback((home: Home | null) => patch(() => ({ home })), [patch]);

  // 같은 결과 화면을 다시 볼 때는 노출을 한 번만 센다
  const shownKeys = useRef(new Set<string>());
  const logShown = useCallback((placeIds: string[], sessionKey: string) => {
    if (!placeIds.length || shownKeys.current.has(sessionKey)) return;
    shownKeys.current.add(sessionKey);
    patch((s) => ({ events: addEvents(s.events, placeIds, 'shown') }));
  }, [patch]);

  const stampStop = useCallback((courseId: string, placeId: string) => patch((s) => ({
    courses: s.courses.map((c) => (c.id === courseId
      ? { ...c, updatedAt: Date.now(), stops: c.stops.map((st) => (st.place.id === placeId && !st.stampedAt ? { ...st, stampedAt: Date.now() } : st)) }
      : c)),
    events: addEvents(s.events, [placeId], 'verified'),
  })), [patch]);

  const value = useMemo<Store>(() => ({
    ...state,
    ready,
    isSaved: (id) => state.saved.some((p) => p.id === id),
    toggleSave, giveFeedback, undoFeedback, createCourse, updateCourse, deleteCourse, addPlaceToCourse,
    saveReview, verifyReview, addReport, resolveReport, requestOwner, decideOwner, isOwnerOf,
    submitInfoEdit, decideInfoEdit, hidePlace, unhidePlace, setRole, setHome, logShown, stampStop,
  }), [state, ready, toggleSave, giveFeedback, undoFeedback, createCourse, updateCourse, deleteCourse,
    addPlaceToCourse, saveReview, verifyReview, addReport, resolveReport, requestOwner, decideOwner, isOwnerOf,
    submitInfoEdit, decideInfoEdit, hidePlace, unhidePlace, setRole, setHome, logShown, stampStop]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore는 AppStoreProvider 안에서 사용해야 합니다.');
  return v;
}

/** 추천·검색에서 빼야 할 장소 id (숨김, 관심 없음, 관리자 비공개) */
export const excludedIds = (s: Pick<State, 'feedback' | 'hidden'>) =>
  new Set([...Object.keys(s.feedback), ...Object.keys(s.hidden)]);
