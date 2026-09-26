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
  purpose?: string; // PurposeKey
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
  time?: string;
  memo?: string;
}

export type CourseStatus = 'planning' | 'done';

export interface Course {
  id: string;
  name: string;
  stops: CourseStop[];
  status: CourseStatus;
  purpose?: string;
  sourceKey?: string;
  createdAt: number;
  updatedAt: number;
}

export type FeedbackKind = 'hide' | 'dislike';

/** 방문 후기 (F-BAYAZZ, F-UZFCSU, F-OVVLRA) */
export interface Review {
  id: string;
  placeId: string;
  placeName: string;
  satisfaction: number; // 1~5
  visitedMonth: string; // YYYY-MM
  mood: string;
  priceFeel: string;
  companion: string;
  revisit: boolean;
  text: string;
  verified: boolean;
  createdAt: number;
  updatedAt: number;
}

/** 장소 정보 오류 신고 (F-RXNEQL) */
export interface InfoReport {
  id: string;
  placeId: string;
  placeName: string;
  field: string;
  content: string;
  status: 'received' | 'resolved';
  createdAt: number;
}

/** 운영자가 관리하는 장소 정보 (F-TLOBFA) */
export interface PlaceInfo {
  open?: string; // HH:MM
  close?: string; // HH:MM
  closedDays: number[]; // 0=일 ~ 6=토
  menu?: string;
  intro?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

/** 매장 운영 권한 신청 (F-DGSIXX) */
export interface OwnerRequest {
  id: string;
  place: Place;
  applicant: string;
  contact: string;
  proof: string;
  status: ReviewStatus;
  createdAt: number;
  decidedAt?: number;
}

/** 운영자 정보 변경 요청과 이력 (F-TLOBFA) */
export interface InfoEdit {
  id: string;
  placeId: string;
  placeName: string;
  before: PlaceInfo | null;
  after: PlaceInfo;
  status: ReviewStatus;
  createdAt: number;
  decidedAt?: number;
}

export interface HiddenPlace {
  name: string;
  reason: string;
  at: number;
}

export type Role = 'user' | 'owner' | 'admin';
