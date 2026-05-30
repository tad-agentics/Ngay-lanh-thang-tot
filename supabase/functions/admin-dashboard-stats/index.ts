/**
 * Admin dashboard aggregates — service_role + email allowlist (ADMIN_EMAILS).
 * Direction C revenue buckets: subscription / add-on luận / legacy (incl. `le`).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";

const SUBSCRIPTION_SKUS = new Set(["goi_1thang", "goi_6thang", "goi_12thang"]);
const ADDON_SKUS = new Set(["luan_bat_tu", "luan_tieu_van"]);

type RevenueBucket = "subscription" | "addon" | "legacy";

type RowPay = {
  amount_vnd: number | null;
  created_at: string;
  package_sku: string;
};

type MonthBucket = {
  subscription: number;
  addon: number;
  legacy: number;
};

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

function classifySku(sku: string): RevenueBucket {
  if (SUBSCRIPTION_SKUS.has(sku)) return "subscription";
  if (ADDON_SKUS.has(sku)) return "addon";
  return "legacy";
}

async function fetchAllPaidOrders(
  admin: ReturnType<typeof createClient>,
): Promise<RowPay[]> {
  const out: RowPay[] = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await admin
      .from("payment_orders")
      .select("amount_vnd, created_at, package_sku")
      .eq("status", "paid")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...(data as RowPay[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
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

function emptyMonthBucket(): MonthBucket {
  return { subscription: 0, addon: 0, legacy: 0 };
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
    const nowIso = new Date().toISOString();
    const thirtyIso = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const sixtyIso = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      { count: profilesCount, error: pErr },
      paidOrders,
      { count: activeSubscribers, error: subActiveErr },
      { count: expiredSubscribers, error: subExpiredErr },
      { count: neverSubscribed, error: neverSubErr },
      { count: baziUnlocked, error: baziErr },
      { count: tieuVanActive, error: tvErr },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      fetchAllPaidOrders(admin),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("subscription_expires_at", nowIso),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("subscription_expires_at", "is", null)
        .lte("subscription_expires_at", nowIso),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .is("subscription_expires_at", null),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("bazi_reading_unlocked_at", "is", null),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("tieu_van_reading_expires_at", nowIso),
    ]);

    if (pErr) throw pErr;
    if (subActiveErr) throw subActiveErr;
    if (subExpiredErr) throw subExpiredErr;
    if (neverSubErr) throw neverSubErr;
    if (baziErr) throw baziErr;
    if (tvErr) throw tvErr;

    const { count: newProfilesLast30, error: n30Err } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyIso);
    if (n30Err) throw n30Err;

    const { count: newProfilesPrev30, error: nPrevErr } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyIso)
      .lt("created_at", thirtyIso);
    if (nPrevErr) throw nPrevErr;

    const revenueByBucket = { subscription: 0, addon: 0, legacy: 0 };
    const ordersBySku: Record<string, number> = {};

    for (const r of paidOrders) {
      const v = r.amount_vnd ?? 0;
      const bucket = classifySku(r.package_sku);
      revenueByBucket[bucket] += v;
      ordersBySku[r.package_sku] = (ordersBySku[r.package_sku] ?? 0) + 1;
    }

    const totalRevenueVnd = paidOrders.reduce(
      (s, r) => s + (r.amount_vnd ?? 0),
      0,
    );
    const paidOrdersCount = paidOrders.length;

    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth();
    const pm = cm === 0 ? 11 : cm - 1;
    const py = cm === 0 ? cy - 1 : cy;

    let revenueThisMonth = 0;
    let revenuePrevMonth = 0;
    let ordersThisMonth = 0;
    let ordersPrevMonth = 0;

    for (const r of paidOrders) {
      const d = new Date(r.created_at);
      const y = d.getFullYear();
      const m = d.getMonth();
      const v = r.amount_vnd ?? 0;
      if (y === cy && m === cm) {
        revenueThisMonth += v;
        ordersThisMonth += 1;
      } else if (y === py && m === pm) {
        revenuePrevMonth += v;
        ordersPrevMonth += 1;
      }
    }

    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(cy, cm - i, 1);
      monthKeys.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
    }

    const buckets = new Map<string, MonthBucket>();
    for (const k of monthKeys) {
      buckets.set(k, emptyMonthBucket());
    }

    for (const r of paidOrders) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets.has(key)) continue;
      const b = buckets.get(key)!;
      const v = r.amount_vnd ?? 0;
      const kind = classifySku(r.package_sku);
      b[kind] += v;
    }

    const monthly = monthKeys.map((key) => {
      const b = buckets.get(key)!;
      const [y, m] = key.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
      const subscriptionM = b.subscription / 1_000_000;
      const addonM = b.addon / 1_000_000;
      const legacyM = b.legacy / 1_000_000;
      return {
        key,
        label,
        subscriptionRevenueVnd: b.subscription,
        addonRevenueVnd: b.addon,
        legacyRevenueVnd: b.legacy,
        subscriptionM,
        addonM,
        legacyM,
        /** @deprecated use legacyRevenueVnd — kept for older admin UI builds */
        leRevenueVnd: b.legacy,
        leM: legacyM,
      };
    });

    const maxStackM = Math.max(
      0.000_001,
      ...monthly.map((m) => m.subscriptionM + m.addonM + m.legacyM),
    );

    const newU = newProfilesLast30 ?? 0;
    const newPrev = newProfilesPrev30 ?? 0;

    return json({
      totals: {
        totalRevenueVnd,
        paidOrdersCount,
        profilesCount: profilesCount ?? 0,
        newProfilesLast30Days: newU,
        activeSubscribers: activeSubscribers ?? 0,
        expiredSubscribers: expiredSubscribers ?? 0,
        neverSubscribed: neverSubscribed ?? 0,
        baziReadingUnlocked: baziUnlocked ?? 0,
        tieuVanReadingActive: tieuVanActive ?? 0,
        revenueByBucketVnd: revenueByBucket,
        ordersBySku,
        revenueMomPct: formatPct(pctChange(revenueThisMonth, revenuePrevMonth)),
        ordersMomPct: formatPct(pctChange(ordersThisMonth, ordersPrevMonth)),
        newUsersMomPct: formatPct(pctChange(newU, newPrev)),
      },
      monthly,
      chartScaleMaxM: maxStackM,
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
