/**
 * bat-tu upstream Redis cache — Edge helpers + vitest-friendly re-exports.
 */
import {
  ANONYMOUS_OPS,
  bodyHasBirthDate,
  CALENDAR_GATE_OPS,
  isPersonalizedCalendarBody,
} from "../../../shared/bat-tu-cache-policy.ts";
import {
  redisDelKey,
  redisGetString,
  redisRestConfigured,
  redisSetExString,
} from "../redis-cache.ts";

export {
  ANONYMOUS_OPS,
  bodyHasBirthDate,
  CALENDAR_GATE_OPS,
  isPersonalizedCalendarBody,
};

/**
 * Không cache: ghi hồ sơ upstream (POST profile), hoặc tu-tru (persist lá số).
 */
export function isUpstreamCacheable(op: string, init: RequestInit): boolean {
  const m = (init.method ?? "GET").toUpperCase();
  if (op === "profile" && m === "POST") return false;
  if (op === "tu-tru" || op === "tu-tru-preview" || op === "recompute-la-so") {
    return false;
  }
  if (op === "tieu-van") return false;
  return true;
}

export function authCacheWriteEnabled(): boolean {
  return Deno.env.get("BAT_TU_AUTH_CACHE") === "1";
}

export function cacheKeyVersion(): string {
  return authCacheWriteEnabled() ? "v2" : "v1";
}

const CACHE_KEY_VERSIONS = ["v1", "v2"] as const;

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function batTuCacheKey(
  op: string,
  upstreamUrl: string,
  upstreamInit: RequestInit,
  version?: string,
): Promise<string> {
  const method = upstreamInit.method ?? "GET";
  const body =
    typeof upstreamInit.body === "string" ? upstreamInit.body : "";
  const raw = `${op}\n${method}\n${upstreamUrl}\n${body}`;
  const hash = await sha256Hex(raw);
  const v = version ?? cacheKeyVersion();
  return `bat-tu:${v}:${hash}`;
}

/** TTL tối đa 60 phút; BAT_TU_CACHE_TTL_SEC (giây), clamp 1…3600, mặc định 3600. */
export function cacheTtlSec(): number {
  const raw = Deno.env.get("BAT_TU_CACHE_TTL_SEC");
  const n = raw != null && raw !== "" ? Number.parseInt(raw, 10) : 3600;
  if (!Number.isFinite(n) || n <= 0) return 3600;
  return Math.min(3600, Math.max(1, n));
}

export async function readBatTuCachePayload(
  op: string,
  upstreamUrl: string,
  upstreamInit: RequestInit,
): Promise<unknown | null> {
  if (!isUpstreamCacheable(op, upstreamInit)) return null;
  if (!redisRestConfigured()) return null;
  try {
    const ck = await batTuCacheKey(op, upstreamUrl, upstreamInit);
    const raw = await redisGetString(ck);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as { data?: unknown };
    if (!("data" in parsed)) return null;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export async function writeBatTuCachePayload(
  op: string,
  upstreamUrl: string,
  upstreamInit: RequestInit,
  data: unknown,
): Promise<void> {
  if (!isUpstreamCacheable(op, upstreamInit)) return;
  if (!redisRestConfigured()) return;
  const ttl = cacheTtlSec();
  try {
    const ck = await batTuCacheKey(op, upstreamUrl, upstreamInit);
    await redisSetExString(ck, JSON.stringify({ data }), ttl);
  } catch (e) {
    console.error("bat-tu cache set", e);
  }
}

/** Invalidate cache keys for common ops after lá số recompute (v1 + v2). */
export async function invalidateBatTuCacheForBody(
  body: Record<string, unknown>,
  buildUpstream: (
    op: string,
    body: Record<string, unknown>,
    batUrl: string,
  ) => { ok: true; url: string; init: RequestInit } | { ok: false; message?: string },
  batUrl: string,
): Promise<void> {
  if (!redisRestConfigured()) return;
  const ops = [
    "ngay-hom-nay",
    "day-detail",
    "lich-thang",
    "la-so",
    "day-luan-context",
    "la-so-luu-nien",
    "phong-thuy",
  ];
  for (const op of ops) {
    const upstream = buildUpstream(op, body, batUrl);
    if (!upstream.ok) continue;
    if (!isUpstreamCacheable(op, upstream.init)) continue;
    for (const version of CACHE_KEY_VERSIONS) {
      try {
        const ck = await batTuCacheKey(
          op,
          upstream.url,
          upstream.init,
          version,
        );
        await redisDelKey(ck);
      } catch (e) {
        console.error("bat-tu cache invalidate", op, version, e);
      }
    }
  }
}
