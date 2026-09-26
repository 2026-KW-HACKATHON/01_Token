import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Course, FeedbackKind, Place } from '../types';

interface State {
  courses: Course[];
  saved: Place[];
  /** 장소 id 또는 `course:<key>` → 숨김/관심 없음 */
  feedback: Record<string, FeedbackKind>;
}

type AddResult = 'added' | 'duplicate' | 'missing';

interface Store extends State {
  ready: boolean;
  isSaved: (id: string) => boolean;
  toggleSave: (p: Place) => void;
  giveFeedback: (id: string, kind: FeedbackKind) => void;
  undoFeedback: (id: string) => void;
  createCourse: (name: string, places?: Place[], sourceKey?: string) => string;
  updateCourse: (id: string, fn: (c: Course) => Course) => void;
  deleteCourse: (id: string) => void;
  addPlaceToCourse: (courseId: string, p: Place) => AddResult;
}

const STORAGE_KEY = '@datecourse/state/v1';
const initial: State = { courses: [], saved: [], feedback: {} };
const Ctx = createContext<Store | null>(null);

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
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

  const toggleSave = useCallback((p: Place) => setState((s) => ({
    ...s,
    saved: s.saved.some((x) => x.id === p.id) ? s.saved.filter((x) => x.id !== p.id) : [p, ...s.saved],
  })), []);

  const giveFeedback = useCallback((id: string, kind: FeedbackKind) =>
    setState((s) => ({ ...s, feedback: { ...s.feedback, [id]: kind } })), []);

  const undoFeedback = useCallback((id: string) => setState((s) => {
    const feedback = { ...s.feedback };
    delete feedback[id];
    return { ...s, feedback };
  }), []);

  const createCourse = useCallback((name: string, places: Place[] = [], sourceKey?: string) => {
    if (sourceKey) {
      const existing = ref.current.courses.find((c) => c.sourceKey === sourceKey);
      if (existing) return existing.id; // 같은 추천 코스는 중복 저장하지 않음
    }
    const id = newId();
    const now = Date.now();
    const course: Course = {
      id, name, sourceKey, status: 'planning', createdAt: now, updatedAt: now,
      stops: uniq(places).map((place) => ({ place })),
    };
    setState((s) => ({ ...s, courses: [course, ...s.courses] }));
    return id;
  }, []);

  const updateCourse = useCallback((id: string, fn: (c: Course) => Course) => setState((s) => ({
    ...s,
    courses: s.courses.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)),
  })), []);

  const deleteCourse = useCallback((id: string) =>
    setState((s) => ({ ...s, courses: s.courses.filter((c) => c.id !== id) })), []);

  const addPlaceToCourse = useCallback((courseId: string, p: Place): AddResult => {
    const course = ref.current.courses.find((c) => c.id === courseId);
    if (!course) return 'missing';
    if (course.stops.some((s) => s.place.id === p.id)) return 'duplicate';
    updateCourse(courseId, (c) => ({ ...c, stops: [...c.stops, { place: p }] }));
    return 'added';
  }, [updateCourse]);

  const value = useMemo<Store>(() => ({
    ...state,
    ready,
    isSaved: (id) => state.saved.some((p) => p.id === id),
    toggleSave, giveFeedback, undoFeedback, createCourse, updateCourse, deleteCourse, addPlaceToCourse,
  }), [state, ready, toggleSave, giveFeedback, undoFeedback, createCourse, updateCourse, deleteCourse, addPlaceToCourse]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore는 AppStoreProvider 안에서 사용해야 합니다.');
  return v;
}
