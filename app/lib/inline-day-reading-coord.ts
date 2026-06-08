/** Dedupe + backoff for subscriber inline NLTT — avoid Edge retry storms on 503. */

export const INLINE_READING_FAIL_COOLDOWN_MS = 60_000;

function failCooldownKey(userId: string, dayIso: string): string {
  return `ngaytot_inline_reading_fail_until:${userId}:${dayIso}`;
}

export function isInlineReadingFailCooldown(
  userId: string,
  dayIso: string,
  nowMs = Date.now(),
): boolean {
  try {
    const raw = sessionStorage.getItem(failCooldownKey(userId, dayIso));
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && nowMs < until;
  } catch {
    return false;
  }
}

export function markInlineReadingFailCooldown(
  userId: string,
  dayIso: string,
  nowMs = Date.now(),
): void {
  try {
    sessionStorage.setItem(
      failCooldownKey(userId, dayIso),
      String(nowMs + INLINE_READING_FAIL_COOLDOWN_MS),
    );
  } catch {
    /* private mode */
  }
}

export function clearInlineReadingFailCooldown(
  userId: string,
  dayIso: string,
): void {
  try {
    sessionStorage.removeItem(failCooldownKey(userId, dayIso));
  } catch {
    /* ignore */
  }
}

export type InlineReadingRunResult = {
  text: string | null;
  failed: boolean;
  /** Daily shared-quota cap reached — FE shows the limit state, no retry. */
  dailyLimit?: boolean;
};

const inflight = new Map<string, Promise<InlineReadingRunResult>>();

export function inlineReadingRunKey(
  userId: string,
  iso: string,
  endpoint: string,
  payloadHash: string,
): string {
  return `${userId}:${iso}:${endpoint}:${payloadHash}`;
}

/** One in-flight unlock+generate per user/day/endpoint/payload hash. */
export function runInlineReadingDeduped(
  key: string,
  run: () => Promise<InlineReadingRunResult>,
): Promise<InlineReadingRunResult> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

/** Test helper — reset module inflight map. */
export function resetInlineReadingInflightForTests(): void {
  inflight.clear();
}
