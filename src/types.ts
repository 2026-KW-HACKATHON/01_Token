export type Category = 'FOOD' | 'CAFE' | 'SPOT';

export interface Place {
  id: string;
  name: string;
  category: Category;
  categoryName: string; // 마지막 분류 (예: 이탈리안)
  categoryPath: string; // 전체 분류 (예: 음식점 > 양식 > 이탈리안)
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  url: string; // 카카오맵 장소 페이지
}

/** 추천 조건 (F-OZVLQS). 비어 있는 항목은 '상관없음'으로 건너뛴 것 */
export interface Prefs {
  region?: string;
  lat?: number;
  lng?: number;
  purpose?: string;
  mood?: string;
  budget?: string;
  timeSlot?: string;
}

export interface ScoredPlace {
  place: Place;
  score: number;
  reasons: string[]; // 실제 적용된 추천 근거만 담는다
  distance: number;
}

export interface RecCourse {
  key: string;
  stops: Place[];
  reasons: string[];
  walkMinutes: number;
}

export interface CourseStop {
  place: Place;
  time?: string; // 방문 예정 시간 "14:00"
  memo?: string; // 개인 메모 (공유 시 제외)
}

export type CourseStatus = 'planning' | 'done';

export interface Course {
  id: string;
  name: string;
  stops: CourseStop[];
  status: CourseStatus;
  sourceKey?: string; // 추천 코스에서 저장한 경우 중복 저장 방지용
  createdAt: number;
  updatedAt: number;
}

export type FeedbackKind = 'hide' | 'dislike';
