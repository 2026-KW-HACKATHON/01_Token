import { CAT_GROUPS, findRegion, regionName, searchNearby } from '../api/kakao';
import { BUDGET_HINTS, DEFAULT_TIME_SLOT, MOOD_KEYWORD, SEARCH_RADIUS_M, SLOT_ORDER } from '../constants';
import type { Category, Place, Prefs, RecCourse, Review, ScoredPlace } from '../types';
import { isChain } from './chains';
import { distanceM, walkMinutes } from './geo';
import { popularMap } from './popular';
import { hintHit, purposeOf } from './purpose';

export interface RecommendResult {
  center: Center;
  places: ScoredPlace[];
  popular: Set<string>;
  courses: RecCourse[];
  order: Category[];
  chainExcluded: number;
}

export interface RecommendContext {
  savedIds: Set<string>;
  excludedIds: Set<string>; // 숨김·관심 없음·관리자 비공개
  reviews: Review[];
}

const CATS: Category[] = ['FOOD', 'CAFE', 'SPOT'];

export interface Center { lat: number; lng: number; label: string; area: string | null }

/** 검색 기준 좌표와 지역 이름 (현재 위치면 동 이름을 찾아 붙인다) */
export async function resolveCenter(prefs: Pick<Prefs, 'region' | 'lat' | 'lng'>): Promise<Center> {
  if (prefs.lat != null && prefs.lng != null) {
    const area = await regionName(prefs.lat, prefs.lng);
    return { lat: prefs.lat, lng: prefs.lng, label: area ? `현재 위치(${area})` : '현재 위치', area };
  }
  if (!prefs.region) throw new Error('지역을 입력하거나 현재 위치를 사용해 주세요.');
  const r = await findRegion(prefs.region);
  if (!r) throw new Error(`'${prefs.region}'을(를) 찾지 못했어요. 동 이름이나 역 이름으로 다시 입력해 보세요.`);
  return { ...r, area: prefs.region };
}

/** 개인화 장소 점수 (F-IBCYQW). 근거는 실제로 점수에 반영된 것만 남긴다 */
function scorePlace(
  place: Place, center: { lat: number; lng: number }, prefs: Prefs, moodHit: boolean, ctx: RecommendContext
): ScoredPlace {
  const distance = distanceM(center, place);
  const reasons: string[] = [];
  let score = Math.max(0, 1 - distance / SEARCH_RADIUS_M) * 40;
  reasons.push(
    distance <= 1000 ? `기준 위치에서 도보 ${walkMinutes(distance)}분` : `기준 위치에서 ${(distance / 1000).toFixed(1)}km`
  );

  const purpose = purposeOf(prefs.purpose);
  const p = purpose ? hintHit(place.categoryPath, purpose.hints) : undefined;
  if (purpose && p) { score += 20; reasons.push(`${purpose.label}에 어울리는 ${p}`); }

  const b = prefs.budget ? hintHit(place.categoryPath, BUDGET_HINTS[prefs.budget] ?? []) : undefined;
  if (b) { score += 10; reasons.push(`'${prefs.budget}' 예산에 맞는 ${b}`); }

  if (moodHit && prefs.mood) { score += 25; reasons.push(`'${prefs.mood}' 분위기 검색에 포함`); }
  if (ctx.savedIds.has(place.id)) { score += 10; reasons.push('내가 저장한 장소'); }

  const mine = ctx.reviews.filter((r) => r.placeId === place.id);
  if (mine.some((r) => r.revisit)) { score += 10; reasons.push('다시 가고 싶다고 후기를 남긴 곳'); }
  if (mine.length && mine.every((r) => r.satisfaction <= 2)) score -= 25; // 불만족 후기는 순위만 낮춤

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
        const v = cand.score - d / 20;
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

/** 프랜차이즈를 걸러낸 공개 장소 목록 */
export function filterLocal(places: Place[], excludedIds: Set<string>) {
  const unique = new Map<string, Place>();
  places.forEach((p) => unique.set(p.id, p));
  let chainExcluded = 0;
  const list = [...unique.values()].filter((p) => {
    if (excludedIds.has(p.id)) return false;
    if (isChain(p.name, p.categoryPath)) { chainExcluded++; return false; }
    return true;
  });
  return { list, chainExcluded };
}

export async function getRecommendations(prefs: Prefs, ctx: RecommendContext): Promise<RecommendResult> {
  const center = await resolveCenter(prefs);
  const common = { lat: center.lat, lng: center.lng, radius: SEARCH_RADIUS_M };
  const groups = CATS.flatMap((c) => CAT_GROUPS[c]);
  const base = await Promise.all(groups.map((group) => searchNearby({ ...common, group, pages: 3 })));

  const moodKw = prefs.mood ? MOOD_KEYWORD[prefs.mood] : undefined;
  const moodHits: Place[][] = moodKw
    ? await Promise.all(groups.map((group) => searchNearby({ ...common, group, keyword: moodKw }).catch(() => [])))
    : [];
  const moodIds = new Set(moodHits.flat().map((p) => p.id));

  const { list, chainExcluded } = filterLocal([...base.flat(), ...moodHits.flat()], ctx.excludedIds);
  const avoid = purposeOf(prefs.purpose)?.avoid ?? [];

  const usable = list.filter((p) => !hintHit(p.categoryPath, avoid));
  const popular = await popularMap(center.area, usable, prefs.purpose);

  const places = usable
    .map((p) => {
      const sp = scorePlace(p, center, prefs, moodIds.has(p.id), ctx);
      const why = popular.get(p.id);
      return why ? { ...sp, score: sp.score + 15, reasons: [...sp.reasons, why] } : sp;
    })
    .sort((a, b) => b.score - a.score);

  const order = SLOT_ORDER[prefs.timeSlot ?? DEFAULT_TIME_SLOT];
  return {
    center, places, popular: new Set(popular.keys()), courses: buildCourses(places, order), order, chainExcluded,
  };
}
