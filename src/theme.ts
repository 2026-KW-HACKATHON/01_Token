import type { Category } from './types';

export const colors = {
  paper: '#FBF8FF',
  card: '#FFFFFF',
  ink: '#22223B',
  muted: '#77738A',
  line: '#E7E1F0',
  rose: '#C0396B',
  roseSoft: '#F8E3EC',
  route: '#3A6EA5',
  routeSoft: '#E4EDF7',
  done: '#4F7D52',
  doneSoft: '#E4F0E4',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  FOOD: '식사',
  CAFE: '카페',
  SPOT: '산책·관광',
};

export const CATEGORY_ICON: Record<Category, string> = {
  FOOD: '🍽',
  CAFE: '☕',
  SPOT: '🌿',
};
