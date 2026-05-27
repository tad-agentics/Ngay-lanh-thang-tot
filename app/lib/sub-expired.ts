/** Client-side latch when Edge returns SUB_EXPIRED (until profile reload clears). */

export const SUB_EXPIRED_CODE = "SUB_EXPIRED";
export const SUB_EXPIRED_EVENT = "ngaytot:sub-expired";

let blocked = false;
const listeners = new Set<() => void>();

export function isSubExpiredCode(code: string | undefined): boolean {
  return code === SUB_EXPIRED_CODE;
}

export function isSubExpiredBlocked(): boolean {
  return blocked;
}

export function setSubExpiredBlocked(value: boolean): void {
  if (blocked === value) return;
  blocked = value;
  for (const fn of listeners) fn();
}

export function subscribeSubExpired(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySubExpired(): void {
  setSubExpiredBlocked(true);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SUB_EXPIRED_EVENT));
  }
}
