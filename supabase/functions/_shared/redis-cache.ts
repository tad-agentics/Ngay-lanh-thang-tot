/**
 * Upstash Redis REST — optional; if env vars missing, callers skip cache / rate limit.
 * @see https://upstash.com/docs/redis/features/restapi
 */

export function redisRestConfigured(): boolean {
  const u = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const t = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  return Boolean(u?.trim() && t?.trim());
}

function restBase(): string {
  return Deno.env.get("UPSTASH_REDIS_REST_URL")!.replace(/\/$/, "");
}

function bearer(): string {
  return Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!;
}

export async function redisGetString(key: string): Promise<string | null> {
  if (!redisRestConfigured()) return null;
  const res = await fetch(`${restBase()}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${bearer()}` },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { result?: string | null; error?: string };
  if (j.error) return null;
  if (j.result == null) return null;
  if (typeof j.result !== "string") return null;
  return j.result;
}

/** Large JSON payloads: value in POST body, TTL via query (per Upstash docs). */
export async function redisSetExString(
  key: string,
  value: string,
  ttlSec: number,
): Promise<void> {
  if (!redisRestConfigured()) return;
  const res = await fetch(
    `${restBase()}/set/${encodeURIComponent(key)}?EX=${ttlSec}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer()}` },
      body: value,
    },
  );
  if (!res.ok) {
    console.error("redisSetExString", res.status, await res.text());
  }
}

/** SET key value EX ttl NX — returns true when the key was set (slot acquired). */
export async function redisSetNxEx(
  key: string,
  value: string,
  ttlSec: number,
): Promise<boolean> {
  if (!redisRestConfigured()) return true;
  const res = await fetch(
    `${restBase()}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSec}&NX=true`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer()}` },
    },
  );
  if (!res.ok) {
    console.error("redisSetNxEx", res.status, await res.text());
    return true;
  }
  const j = (await res.json()) as { result?: string | null; error?: string };
  if (j.error) {
    console.error("redisSetNxEx", j.error);
    return true;
  }
  return j.result === "OK";
}
