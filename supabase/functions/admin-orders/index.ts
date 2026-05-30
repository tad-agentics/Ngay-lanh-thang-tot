/**
 * Admin payment_orders list — JWT + ADMIN_EMAILS.
 *
 * GET ?status=&package_sku=&user_id=&from=&to=&limit=&offset=
 * POST { filters... } — same (for invoke)
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import { adminJson, isUuid, requireAdmin } from "../_shared/admin-auth.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type OrderFilters = {
  status?: string;
  package_sku?: string;
  user_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

function clampInt(
  value: unknown,
  fallback: number,
  max: number,
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(0, Math.floor(value)), max);
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.min(Math.max(0, n), max);
  }
  return fallback;
}

function readFiltersFromUrl(url: URL): OrderFilters {
  return {
    status: url.searchParams.get("status")?.trim() || undefined,
    package_sku: url.searchParams.get("package_sku")?.trim() || undefined,
    user_id: url.searchParams.get("user_id")?.trim() || undefined,
    from: url.searchParams.get("from")?.trim() || undefined,
    to: url.searchParams.get("to")?.trim() || undefined,
    limit: clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
    offset: clampInt(url.searchParams.get("offset"), 0, 10_000),
  };
}

async function listOrders(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  filters: OrderFilters,
) {
  const limit = clampInt(filters.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = clampInt(filters.offset, 0, 10_000);

  if (filters.user_id && !isUuid(filters.user_id)) {
    return {
      error: { code: "BAD_REQUEST", message: "user_id must be a UUID" },
      status: 400 as const,
    };
  }

  let query = admin
    .from("payment_orders")
    .select(
      "id, user_id, status, package_sku, list_amount_vnd, amount_vnd, coupon_code, checkout_referral_code, provider_order_code, referrer_profile_id, created_at, updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.package_sku) query = query.eq("package_sku", filters.package_sku);
  if (filters.user_id) query = query.eq("user_id", filters.user_id);
  if (filters.from) {
    const d = new Date(filters.from);
    if (Number.isNaN(d.getTime())) {
      return {
        error: { code: "BAD_REQUEST", message: "from is not a valid date" },
        status: 400 as const,
      };
    }
    query = query.gte("created_at", d.toISOString());
  }
  if (filters.to) {
    const d = new Date(filters.to);
    if (Number.isNaN(d.getTime())) {
      return {
        error: { code: "BAD_REQUEST", message: "to is not a valid date" },
        status: 400 as const,
      };
    }
    query = query.lte("created_at", d.toISOString());
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];
  const userIds = [...new Set(rows.map((r) => String(r.user_id)))];
  const emailByUser = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    if (pErr) throw pErr;
    for (const p of profiles ?? []) {
      emailByUser.set(
        (p as { id: string }).id,
        (p as { email: string | null }).email,
      );
    }
  }

  const orders = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    email: emailByUser.get(String(r.user_id)) ?? null,
    status: r.status,
    package_sku: r.package_sku,
    list_amount_vnd: r.list_amount_vnd,
    amount_vnd: r.amount_vnd,
    coupon_code: r.coupon_code,
    checkout_referral_code: r.checkout_referral_code,
    provider_order_code: r.provider_order_code,
    referrer_profile_id: r.referrer_profile_id,
    created_at: r.created_at,
    paid_at: r.status === "paid" ? r.updated_at : null,
  }));

  return { orders, total: count ?? orders.length, limit, offset };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeadersForRequest(req),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { admin, cors } = auth;

  try {
    let filters: OrderFilters;

    if (req.method === "GET") {
      filters = readFiltersFromUrl(new URL(req.url));
    } else if (req.method === "POST") {
      try {
        filters = (await req.json()) as OrderFilters;
      } catch {
        return adminJson(
          cors,
          { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
          400,
        );
      }
      filters.limit = clampInt(filters.limit, DEFAULT_LIMIT, MAX_LIMIT);
      filters.offset = clampInt(filters.offset, 0, 10_000);
    } else {
      return adminJson(
        cors,
        { error: { code: "METHOD_NOT_ALLOWED", message: "GET/POST only" } },
        405,
      );
    }

    const result = await listOrders(admin, filters);
    if ("error" in result && result.error) {
      return adminJson(cors, { error: result.error }, result.status);
    }

    return adminJson(cors, result);
  } catch (e) {
    console.error("admin-orders", e);
    return adminJson(
      cors,
      {
        error: {
          code: "INTERNAL",
          message: e instanceof Error ? e.message : "Query failed",
        },
      },
      500,
    );
  }
});
