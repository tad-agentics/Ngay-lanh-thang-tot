import {
  redisGetString,
  redisRestConfigured,
  redisSetExString,
  redisDelKey,
} from "./redis-cache.ts";

const L2_PREFIX = "reading:v1:";

function l2Key(cacheKey: string): string {
  return `${L2_PREFIX}${cacheKey}`;
}

export async function getReadingCacheL2(
  cacheKey: string,
): Promise<string | null> {
  if (!redisRestConfigured()) return null;
  try {
    return await redisGetString(l2Key(cacheKey));
  } catch {
    return null;
  }
}

export async function setReadingCacheL2(
  cacheKey: string,
  reading: string,
  ttlSec: number,
): Promise<void> {
  if (!redisRestConfigured()) return;
  try {
    await redisSetExString(l2Key(cacheKey), reading, ttlSec);
  } catch (e) {
    console.error("reading-cache-l2 set", e);
  }
}

export async function deleteReadingCacheL2(cacheKey: string): Promise<void> {
  if (!redisRestConfigured()) return;
  try {
    await redisDelKey(l2Key(cacheKey));
  } catch (e) {
    console.error("reading-cache-l2 del", e);
  }
}

/** TTL from Postgres expires_at — cap at 24h for Redis. */
export function readingCacheL2TtlSec(expiresAtIso: string): number {
  const ms = new Date(expiresAtIso).getTime() - Date.now();
  const sec = Math.floor(ms / 1000);
  if (!Number.isFinite(sec) || sec <= 0) return 60;
  return Math.min(sec, 24 * 3600);
}

/** After Postgres upsert — mirror reading blob to Redis L2. */
export async function syncReadingCacheL2(
  cacheKey: string,
  reading: string,
  expiresAtIso: string,
): Promise<void> {
  await setReadingCacheL2(
    cacheKey,
    reading,
    readingCacheL2TtlSec(expiresAtIso),
  );
}
