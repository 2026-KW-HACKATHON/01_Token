import type { Category } from './types';

export const colors = {
  paper: '#F4F7F4',
  card: '#FFFFFF',
  ink: '#173D30',
  muted: '#63766D',
  line: '#DEE7DF',
  rose: '#236C4C',
  roseSoft: '#E6F2E8',
  route: '#306A72',
  routeSoft: '#E7F2F3',
  done: '#236C4C',
  doneSoft: '#E6F2E8',
  accent: '#D4F479',
  danger: '#AD3845',
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
