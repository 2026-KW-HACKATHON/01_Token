import { CAT_GROUPS, findRegion, searchNearby } from '../api/kakao';
import {
  BUDGET_HINTS, DEFAULT_TIME_SLOT, MOOD_KEYWORD, PURPOSE_HINTS, SEARCH_RADIUS_M, SLOT_ORDER,
} from '../constants';
import type { Category, Place, Prefs, RecCourse, ScoredPlace } from '../types';
import { distanceM, walkMinutes } from './geo';

export interface RecommendResult {
  center: { lat: number; lng: number; label: string };
  places: ScoredPlace[];
  courses: RecCourse[];
  order: Category[];
}

const CATS: Category[] = ['FOOD', 'CAFE', 'SPOT'];
const firstHit = (path: string, hints?: string[]) => hints?.find((h) => path.includes(h));

/** 개인화 장소 점수 (F-IBCYQW). 근거는 실제로 점수에 반영된 것만 남긴다 */
function scorePlace(
  place: Place, center: { lat: number; lng: number }, prefs: Prefs, moodHit: boolean, saved: boolean
): ScoredPlace {
  const distance = distanceM(center, place);
  const reasons: string[] = [];
  let score = Math.max(0, 1 - distance / SEARCH_RADIUS_M) * 40;
  reasons.push(
    distance <= 1000 ? `기준 위치에서 도보 ${walkMinutes(distance)}분` : `기준 위치에서 ${(distance / 1000).toFixed(1)}km`
  );

  const p = prefs.purpose ? firstHit(place.categoryPath, PURPOSE_HINTS[prefs.purpose]) : undefined;
  if (p) { score += 20; reasons.push(`${prefs.purpose}에 어울리는 ${p}`); }

  const b = prefs.budget ? firstHit(place.categoryPath, BUDGET_HINTS[prefs.budget]) : undefined;
  if (b) { score += 10; reasons.push(`'${prefs.budget}' 예산에 맞는 ${b}`); }

  if (moodHit && prefs.mood) { score += 25; reasons.push(`'${prefs.mood}' 분위기 검색에 포함`); }
  if (saved) { score += 10; reasons.push('내가 저장한 장소'); }

  return { place, score, reasons, distance };
}

/** 첫 장소를 고정하고, 다음 장소는 점수와 이동 거리를 함께 고려해 고른다 (F-CZKUBF) */
function buildCourses(scored: ScoredPlace[], order: Category[]): RecCourse[] {
  const pools = {} as Record<Category, ScoredPlace[]>;
  for (const c of order) pools[c] = scored.filter((s) => s.place.category === c).slice(0, 8);
  if (order.some((c) => pools[c].length === 0)) return [];

  const courses: RecCourse[] = [];
  const seen = new Set<string>();
  for (const anchor of pools[order[0]].slice(0, 4)) {
    const stops: ScoredPlace[] = [anchor];
    let walk = 0;
    for (const cat of order.slice(1)) {
      const prev = stops[stops.length - 1].place;
      let best: ScoredPlace | undefined;
      let bestVal = -Infinity;
      let bestD = 0;
      for (const cand of pools[cat]) {
        if (stops.some((s) => s.place.id === cand.place.id)) continue;
        const d = distanceM(prev, cand.place);
        const v = cand.score - d / 20; // 1km 떨어질 때마다 50점 감점
        if (v > bestVal) { bestVal = v; best = cand; bestD = d; }
      }
      if (!best) break;
      stops.push(best);
      walk += bestD;
    }
    if (stops.length !== order.length) continue;
    const key = stops.map((s) => s.place.id).join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    const extra = Array.from(new Set(stops.flatMap((s) => s.reasons.slice(1))));
    courses.push({
      key,
      stops: stops.map((s) => s.place),
      reasons: [`장소 사이 도보 합계 약 ${walkMinutes(walk)}분`, ...extra].slice(0, 3),
      walkMinutes: walkMinutes(walk),
    });
    if (courses.length >= 3) break;
  }
  return courses;
}

export async function getRecommendations(
  prefs: Prefs, savedIds: Set<string>, excludedIds: Set<string>
): Promise<RecommendResult> {
  let center: RecommendResult['center'];
  if (prefs.lat != null && prefs.lng != null) {
    center = { lat: prefs.lat, lng: prefs.lng, label: '현재 위치' };
  } else {
    if (!prefs.region) throw new Error('지역을 입력하거나 현재 위치를 사용해 주세요.');
    const r = await findRegion(prefs.region);
    if (!r) throw new Error(`'${prefs.region}'을(를) 찾지 못했어요. 동 이름이나 역 이름으로 다시 입력해 보세요.`);
    center = r;
  }

  const common = { lat: center.lat, lng: center.lng, radius: SEARCH_RADIUS_M };
  const groups = CATS.flatMap((c) => CAT_GROUPS[c]);
  const base = await Promise.all(groups.map((group) => searchNearby({ ...common, group, pages: 2 })));

  const moodKw = prefs.mood ? MOOD_KEYWORD[prefs.mood] : undefined;
  const moodHits: Place[][] = moodKw
    ? await Promise.all(groups.map((group) => searchNearby({ ...common, group, keyword: moodKw }).catch(() => [])))
    : [];
  const moodIds = new Set(moodHits.flat().map((p) => p.id));

  const all = new Map<string, Place>();
  [...base.flat(), ...moodHits.flat()].forEach((p) => all.set(p.id, p));

  const places = [...all.values()]
    .filter((p) => !excludedIds.has(p.id))
    .map((p) => scorePlace(p, center, prefs, moodIds.has(p.id), savedIds.has(p.id)))
    .sort((a, b) => b.score - a.score);

  const order = SLOT_ORDER[prefs.timeSlot ?? DEFAULT_TIME_SLOT];
  return { center, places, courses: buildCourses(places, order), order };
}
