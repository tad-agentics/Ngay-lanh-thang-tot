/**
 * Wave 7 — Habit reminder cron: 3x/day (scheduled via Supabase cron / dashboard).
 * Reads push_subscriptions table (endpoint + p256dh + auth keys).
 * Filters to users with push_notifications_enabled = true who have NOT checked in today.
 * Sends Web Push via VAPID (RFC 8030 / RFC 8292).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const PAGE = 500;
const IN_CHUNK = 200;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** YYYY-MM-DD in Asia/Ho_Chi_Minh (ICT, UTC+7). */
function vietnamDayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function verifyCronAuth(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return true;
  const h = req.headers.get("Authorization");
  const token = h?.startsWith("Bearer ") ? h.slice(7).trim() : null;
  return token === secret;
}

/** Convert base64url string to Uint8Array (for VAPID keys). */
function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Build a VAPID JWT for the given audience (push service origin). */
async function buildVapidJwt(
  audience: string,
  vapidSubject: string,
  privateKeyBytes: Uint8Array,
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: vapidSubject,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const signingInput = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    enc.encode(signingInput),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${signingInput}.${sigB64}`;
}

interface PushSubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Send a single Web Push notification. Returns true on success (201). */
async function sendWebPush(
  sub: PushSubscriptionRow,
  title: string,
  body: string,
  vapidPublicKey: string,
  vapidPrivateKeyDer: Uint8Array,
  vapidSubject: string,
): Promise<boolean> {
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  let jwt: string;
  try {
    jwt = await buildVapidJwt(audience, vapidSubject, vapidPrivateKeyDer);
  } catch (e) {
    console.error("cron-push-habit: VAPID JWT build failed", e);
    return false;
  }

  const notifPayload = JSON.stringify({ title, body });
  const enc = new TextEncoder();

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt},k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(enc.encode(notifPayload).byteLength),
      TTL: "86400",
    },
    body: enc.encode(notifPayload),
  });

  if (res.status === 201 || res.status === 200) return true;
  if (res.status === 410 || res.status === 404) {
    // Subscription expired — caller should delete it
    console.warn(`cron-push-habit: expired subscription ${sub.endpoint} → ${res.status}`);
    return false;
  }
  console.warn(`cron-push-habit: push send failed ${res.status} for ${sub.user_id}`);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "GET/POST only" } },
      405,
    );
  }

  if (!verifyCronAuth(req)) {
    console.error("cron-push-habit: invalid CRON_SECRET");
    return json({ error: { code: "UNAUTHORIZED", message: "Invalid cron token" } }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKeyB64 = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@ngaylanhthangtot.vn";

  if (!supabaseUrl || !serviceKey) {
    console.error("cron-push-habit: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ sent: 0, skipped: 0, date: vietnamDayIso() }, 200);
  }

  const vapidReady = !!(vapidPublicKey && vapidPrivateKeyB64);
  if (!vapidReady) {
    console.warn("cron-push-habit: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — will log only");
  }

  let vapidPrivateDer: Uint8Array | null = null;
  if (vapidPrivateKeyB64) {
    try {
      vapidPrivateDer = base64UrlToUint8Array(vapidPrivateKeyB64);
    } catch (e) {
      console.error("cron-push-habit: invalid VAPID_PRIVATE_KEY", e);
    }
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const date = vietnamDayIso();
  let sent = 0;
  let skipped = 0;
  const expiredEndpoints: string[] = [];

  try {
    // 1. Collect all push subscriptions for users with push enabled.
    //    Join profiles.push_notifications_enabled via a separate lookup to avoid
    //    cross-table joins in PostgREST — page push_subscriptions, then filter.
    const allSubs: PushSubscriptionRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data: rows, error } = await admin
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth")
        .range(from, from + PAGE - 1);

      if (error) {
        console.error("cron-push-habit: push_subscriptions page error", from, error.message);
        break;
      }
      if (!rows?.length) break;
      for (const r of rows) {
        allSubs.push(r as PushSubscriptionRow);
      }
      if (rows.length < PAGE) break;
    }

    if (allSubs.length === 0) {
      return json({ sent: 0, skipped: 0, date }, 200);
    }

    // 2. Fetch push_notifications_enabled for these user_ids.
    const uniqueUserIds = [...new Set(allSubs.map((s) => s.user_id))];
    const enabledSet = new Set<string>();
    for (let i = 0; i < uniqueUserIds.length; i += IN_CHUNK) {
      const slice = uniqueUserIds.slice(i, i + IN_CHUNK);
      const { data: profileRows, error } = await admin
        .from("profiles")
        .select("id, push_notifications_enabled")
        .in("id", slice);

      if (error) {
        console.error("cron-push-habit: profiles chunk error", error.message);
        continue;
      }
      for (const p of profileRows ?? []) {
        if (p.push_notifications_enabled) enabledSet.add(p.id as string);
      }
    }

    const eligibleSubs = allSubs.filter((s) => enabledSet.has(s.user_id));
    if (eligibleSubs.length === 0) {
      return json({ sent: 0, skipped: 0, date }, 200);
    }

    // 3. Find users who already checked in today — skip them.
    const eligibleUserIds = [...new Set(eligibleSubs.map((s) => s.user_id))];
    const checkedIn = new Set<string>();
    for (let i = 0; i < eligibleUserIds.length; i += IN_CHUNK) {
      const slice = eligibleUserIds.slice(i, i + IN_CHUNK);
      const { data: ins, error } = await admin
        .from("daily_check_ins")
        .select("user_id")
        .eq("day_iso", date)
        .in("user_id", slice);

      if (error) {
        console.error("cron-push-habit: daily_check_ins chunk error", error.message);
        continue;
      }
      for (const row of ins ?? []) {
        if (typeof row.user_id === "string") checkedIn.add(row.user_id);
      }
    }

    // 4. Send push to each eligible subscription that hasn't checked in.
    for (const sub of eligibleSubs) {
      if (checkedIn.has(sub.user_id)) {
        skipped += 1;
        continue;
      }

      if (!vapidReady || !vapidPrivateDer) {
        console.log(`cron-push-habit: would send push to ${sub.user_id} (VAPID not configured)`);
        sent += 1;
        continue;
      }

      try {
        const ok = await sendWebPush(
          sub,
          "Nhịp hôm nay chưa điểm 🌿",
          "Mở Ngày Lành để xem ngày và ghi nhịp.",
          vapidPublicKey!,
          vapidPrivateDer,
          vapidSubject,
        );
        if (ok) {
          sent += 1;
        } else {
          // Track expired subscriptions for cleanup
          expiredEndpoints.push(sub.endpoint);
        }
      } catch (e) {
        console.error("cron-push-habit: send error for", sub.user_id, e);
      }
    }

    // 5. Clean up expired subscriptions (410/404 responses).
    if (expiredEndpoints.length > 0) {
      for (let i = 0; i < expiredEndpoints.length; i += IN_CHUNK) {
        const slice = expiredEndpoints.slice(i, i + IN_CHUNK);
        await admin
          .from("push_subscriptions")
          .delete()
          .in("endpoint", slice);
      }
      console.log(`cron-push-habit: removed ${expiredEndpoints.length} expired subscriptions`);
    }
  } catch (e) {
    console.error("cron-push-habit: unexpected", e);
  }

  return json({ sent, skipped, expired: expiredEndpoints.length, date }, 200);
});
