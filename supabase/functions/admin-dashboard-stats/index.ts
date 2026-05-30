/**
 * Admin dashboard aggregates — service_role + ADMIN_EMAILS.
 * Uses admin_dashboard_stats_snapshot() RPC (single DB round-trip).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";

function corsFor(req: Request): Record<string, string> {
  return {
    ...corsHeadersForRequest(req),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function json(
  body: unknown,
  cors: Record<string, string>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatPct(p: number | null): string {
  if (p === null) return "—";
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(1).replace(".", ",")}%`;
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function bucketVnd(raw: unknown): { subscription: number; addon: number; legacy: number } {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    subscription: num(o.subscription),
    addon: num(o.addon),
    legacy: num(o.legacy),
  };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "GET/POST only" } },
      cors,
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(
      { error: { code: "SERVER_CONFIG", message: "Missing Supabase env" } },
      cors,
      500,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Missing JWT" } },
      cors,
      401,
    );
  }
  const jwt = authHeader.slice(7);

  const allow = parseAdminEmails(Deno.env.get("ADMIN_EMAILS"));
  if (allow.length === 0) {
    console.error("admin-dashboard-stats: ADMIN_EMAILS empty");
    return json(
      {
        error: {
          code: "ADMIN_NOT_CONFIGURED",
          message: "Set Edge secret ADMIN_EMAILS (comma-separated admin emails).",
        },
      },
      cors,
      503,
    );
  }

  const verifyClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: authErr } =
    await verifyClient.auth.getUser(jwt);
  if (authErr || !userData.user?.email) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Invalid session" } },
      cors,
      401,
    );
  }
  const email = userData.user.email.toLowerCase();
  if (!allow.includes(email)) {
    return json({ error: { code: "FORBIDDEN", message: "Not an admin" } }, cors, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: snap, error: rpcErr } = await admin.rpc(
      "admin_dashboard_stats_snapshot",
    );
    if (rpcErr) throw rpcErr;
    if (!snap || typeof snap !== "object") {
      throw new Error(
        "admin_dashboard_stats_snapshot missing — apply migration 20260531220000",
      );
    }

    const s = snap as Record<string, unknown>;
    const revenueByBucketVnd = bucketVnd(s.revenueByBucketVnd);
    const ordersBySku =
      s.ordersBySku && typeof s.ordersBySku === "object"
        ? (s.ordersBySku as Record<string, number>)
        : {};

    const newU = num(s.newProfilesLast30Days);
    const newPrev = num(s.newProfilesPrev30);

    return json({
      totals: {
        totalRevenueVnd: num(s.totalRevenueVnd),
        paidOrdersCount: num(s.paidOrdersCount),
        profilesCount: num(s.profilesCount),
        newProfilesLast30Days: newU,
        activeSubscribers: num(s.activeSubscribers),
        expiredSubscribers: num(s.expiredSubscribers),
        neverSubscribed: num(s.neverSubscribed),
        baziReadingUnlocked: num(s.baziReadingUnlocked),
        tieuVanReadingActive: num(s.tieuVanReadingActive),
        revenueByBucketVnd,
        ordersBySku,
        revenueMomPct: formatPct(
          pctChange(num(s.revenueThisMonth), num(s.revenuePrevMonth)),
        ),
        ordersMomPct: formatPct(
          pctChange(num(s.ordersThisMonth), num(s.ordersPrevMonth)),
        ),
        newUsersMomPct: formatPct(pctChange(newU, newPrev)),
      },
      monthly: Array.isArray(s.monthly) ? s.monthly : [],
      chartScaleMaxM: num(s.chartScaleMaxM) || 0.000_001,
    }, cors);
  } catch (e) {
    console.error("admin-dashboard-stats", e);
    return json(
      {
        error: {
          code: "INTERNAL",
          message: e instanceof Error ? e.message : "Query failed",
        },
      },
      cors,
      500,
    );
  }
});
