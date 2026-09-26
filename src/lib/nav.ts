import { router } from 'expo-router';
import type { Place } from '../types';

export const openPlace = (place: Place) =>
  router.push({ pathname: '/place/[id]', params: { id: place.id, p: JSON.stringify(place) } });

export function parsePlace(raw?: string | string[]): Place | null {
  try {
    return raw ? (JSON.parse(Array.isArray(raw) ? raw[0] : raw) as Place) : null;
  } catch {
    return null;
  }
}

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${y}년 ${Number(m)}월`;
};

export const newId = (prefix = 'x') => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
