/** Tra cứu full-bleed modes — hides floating bottom nav (thinking + chat screens). */

let active = false;
const listeners = new Set<() => void>();

export function isTraCuuThinkingOverlayActive(): boolean {
  return active;
}

export function setTraCuuThinkingOverlayActive(value: boolean): void {
  if (active === value) return;
  active = value;
  for (const fn of listeners) fn();
}

export function subscribeTraCuuThinkingOverlay(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
