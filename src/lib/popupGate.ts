/**
 * 팝업이 동시에 두 개 뜨지 않게 하는 작은 관리자.
 * 먼저 자리를 잡은 팝업만 열리고, 닫히면 기다리던 쪽에 알려 준다.
 */
let current: string | null = null;
const waiters = new Set<() => void>();

export function tryOpenPopup(name: string) {
  if (current && current !== name) return false;
  current = name;
  return true;
}

export function closePopup(name: string) {
  if (current !== name) return;
  current = null;
  [...waiters].forEach((f) => f());
}

export function onPopupFree(f: () => void) {
  waiters.add(f);
  return () => { waiters.delete(f); };
}
