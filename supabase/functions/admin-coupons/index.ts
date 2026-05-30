/**
 * Admin CRUD for discount_coupons — JWT + ADMIN_EMAILS + service_role.
 * Checkout on ngaylanhthangtot.vn validates via payos-create-checkout (quote_only).
 *
 * GET ?q=&active=&limit=&offset=     → { coupons, total }
 * POST { create fields }            → { coupon }
 * PATCH { code, active?, ... }      → { coupon }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import { adminJson, requireAdmin } from "../_shared/admin-auth.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const COUPON_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/u;

/** SKUs offered in Direction C checkout (no legacy `le`). */
const CHECKOUT_PACKAGE_SKUS = [
  "goi_1thang",
  "goi_6thang",
  "goi_12thang",
  "luan_bat_tu",
  "luan_tieu_van",
] as const;

type DiscountKind = "percent" | "fixed_vnd";

type CouponRow = {
  code: string;
  discount_kind: DiscountKind;
  discount_value: number;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  allowed_package_skus: string[] | null;
  note: string | null;
  created_at: string;
};

function clampInt(value: unknown, fallback: number, max: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(0, Math.floor(value)), max);
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.min(Math.max(0, n), max);
  }
  return fallback;
}

function normalizeCouponCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  if (!code || !COUPON_CODE_RE.test(code)) return null;
  return code;
}

function parseIsoDate(
  raw: unknown,
  label: string,
): { ok: true; iso: string | null } | { ok: false; message: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, iso: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, message: `${label} must be an ISO date string` };
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, message: `${label} is not a valid date` };
  }
  return { ok: true, iso: d.toISOString() };
}

function validateDiscount(
  kind: unknown,
  value: unknown,
): { ok: true; kind: DiscountKind; value: number } | { ok: false; message: string } {
  if (kind !== "percent" && kind !== "fixed_vnd") {
    return { ok: false, message: "discount_kind must be percent or fixed_vnd" };
  }
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    return { ok: false, message: "discount_value must be a positive integer" };
  }
  if (kind === "percent" && (n < 1 || n > 100)) {
    return { ok: false, message: "percent discount must be between 1 and 100" };
  }
  return { ok: true, kind, value: n };
}

function validateAllowedSkus(
  raw: unknown,
): { ok: true; skus: string[] | null } | { ok: false; message: string } {
  if (raw === undefined || raw === null) return { ok: true, skus: null };
  if (!Array.isArray(raw)) {
    return { ok: false, message: "allowed_package_skus must be an array or null" };
  }
  if (raw.length === 0) return { ok: true, skus: null };
  const skus: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") {
      return { ok: false, message: "allowed_package_skus must contain strings" };
    }
    const sku = item.trim();
    if (!CHECKOUT_PACKAGE_SKUS.includes(sku as typeof CHECKOUT_PACKAGE_SKUS[number])) {
      return {
        ok: false,
        message: `Unknown package_sku: ${sku}. Allowed: ${CHECKOUT_PACKAGE_SKUS.join(", ")}`,
      };
    }
    if (!skus.includes(sku)) skus.push(sku);
  }
  return { ok: true, skus };
}

function couponLifecycle(row: CouponRow, now = new Date()) {
  if (!row.active) return "inactive";
  if (row.valid_from && new Date(row.valid_from) > now) return "scheduled";
  if (row.valid_until && new Date(row.valid_until) < now) return "expired";
  if (
    row.max_redemptions != null &&
    row.redemption_count >= row.max_redemptions
  ) {
    return "exhausted";
  }
  return "active";
}

function enrichCoupon(row: CouponRow) {
  return {
    ...row,
    lifecycle: couponLifecycle(row),
    remaining_redemptions: row.max_redemptions == null
      ? null
      : Math.max(0, row.max_redemptions - row.redemption_count),
  };
}

async function listCoupons(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  params: {
    q?: string;
    active?: string;
    limit: number;
    offset: number;
  },
) {
  const limit = clampInt(params.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = clampInt(params.offset, 0, 10_000);

  let query = admin
    .from("discount_coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const q = params.q?.trim().toUpperCase();
  if (q) {
    query = query.ilike("code", `${q.replaceAll("%", "")}%`);
  }

  if (params.active === "true") query = query.eq("active", true);
  if (params.active === "false") query = query.eq("active", false);

  const { data, error, count } = await query;
  if (error) throw error;

  const coupons = ((data ?? []) as CouponRow[]).map(enrichCoupon);
  return { coupons, total: count ?? coupons.length, limit, offset };
}

async function createCoupon(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  body: Record<string, unknown>,
) {
  const code = normalizeCouponCode(String(body.code ?? ""));
  if (!code) {
    return {
      error: {
        code: "BAD_REQUEST",
        message:
          "code must be 3–32 chars: A–Z, 0–9, underscore, hyphen (stored uppercase).",
      },
      status: 400 as const,
    };
  }

  const discount = validateDiscount(body.discount_kind, body.discount_value);
  if (!discount.ok) {
    return { error: { code: "BAD_REQUEST", message: discount.message }, status: 400 as const };
  }

  const validFrom = parseIsoDate(body.valid_from, "valid_from");
  if (!validFrom.ok) {
    return { error: { code: "BAD_REQUEST", message: validFrom.message }, status: 400 as const };
  }
  const validUntil = parseIsoDate(body.valid_until, "valid_until");
  if (!validUntil.ok) {
    return { error: { code: "BAD_REQUEST", message: validUntil.message }, status: 400 as const };
  }
  if (
    validFrom.iso &&
    validUntil.iso &&
    new Date(validFrom.iso) > new Date(validUntil.iso)
  ) {
    return {
      error: { code: "BAD_REQUEST", message: "valid_from must be before valid_until" },
      status: 400 as const,
    };
  }

  let maxRedemptions: number | null = null;
  if (body.max_redemptions !== undefined && body.max_redemptions !== null) {
    const n = typeof body.max_redemptions === "number"
      ? body.max_redemptions
      : Number.parseInt(String(body.max_redemptions), 10);
    if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
      return {
        error: { code: "BAD_REQUEST", message: "max_redemptions must be a positive integer" },
        status: 400 as const,
      };
    }
    maxRedemptions = n;
  }

  const skus = validateAllowedSkus(body.allowed_package_skus);
  if (!skus.ok) {
    return { error: { code: "BAD_REQUEST", message: skus.message }, status: 400 as const };
  }

  const note = body.note == null || body.note === ""
    ? null
    : String(body.note).slice(0, 500);

  const { data, error } = await admin
    .from("discount_coupons")
    .insert({
      code,
      discount_kind: discount.kind,
      discount_value: discount.value,
      active: true,
      valid_from: validFrom.iso,
      valid_until: validUntil.iso,
      max_redemptions: maxRedemptions,
      allowed_package_skus: skus.skus,
      note,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: { code: "CONFLICT", message: `Coupon ${code} already exists` },
        status: 409 as const,
      };
    }
    throw error;
  }

  return { coupon: enrichCoupon(data as CouponRow) };
}

async function patchCoupon(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  body: Record<string, unknown>,
) {
  const code = normalizeCouponCode(String(body.code ?? ""));
  if (!code) {
    return {
      error: { code: "BAD_REQUEST", message: "code is required" },
      status: 400 as const,
    };
  }

  const { data: existing, error: loadErr } = await admin
    .from("discount_coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (loadErr) throw loadErr;
  if (!existing) {
    return {
      error: { code: "NOT_FOUND", message: "Coupon not found" },
      status: 404 as const,
    };
  }

  const row = existing as CouponRow;
  const patch: Record<string, unknown> = {};

  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return {
        error: { code: "BAD_REQUEST", message: "active must be boolean" },
        status: 400 as const,
      };
    }
    patch.active = body.active;
  }

  if (body.valid_from !== undefined) {
    const parsed = parseIsoDate(body.valid_from, "valid_from");
    if (!parsed.ok) {
      return { error: { code: "BAD_REQUEST", message: parsed.message }, status: 400 as const };
    }
    patch.valid_from = parsed.iso;
  }

  if (body.valid_until !== undefined) {
    const parsed = parseIsoDate(body.valid_until, "valid_until");
    if (!parsed.ok) {
      return { error: { code: "BAD_REQUEST", message: parsed.message }, status: 400 as const };
    }
    patch.valid_until = parsed.iso;
  }

  if (body.max_redemptions !== undefined) {
    if (body.max_redemptions === null) {
      patch.max_redemptions = null;
    } else {
      const n = typeof body.max_redemptions === "number"
        ? body.max_redemptions
        : Number.parseInt(String(body.max_redemptions), 10);
      if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
        return {
          error: { code: "BAD_REQUEST", message: "max_redemptions must be a positive integer" },
          status: 400 as const,
        };
      }
      if (n < row.redemption_count) {
        return {
          error: {
            code: "BAD_REQUEST",
            message: `max_redemptions cannot be below redemption_count (${row.redemption_count})`,
          },
          status: 400 as const,
        };
      }
      patch.max_redemptions = n;
    }
  }

  if (body.note !== undefined) {
    patch.note = body.note == null || body.note === ""
      ? null
      : String(body.note).slice(0, 500);
  }

  const nextFrom = (patch.valid_from ?? row.valid_from) as string | null;
  const nextUntil = (patch.valid_until ?? row.valid_until) as string | null;
  if (nextFrom && nextUntil && new Date(nextFrom) > new Date(nextUntil)) {
    return {
      error: { code: "BAD_REQUEST", message: "valid_from must be before valid_until" },
      status: 400 as const,
    };
  }

  if (Object.keys(patch).length === 0) {
    return {
      error: { code: "BAD_REQUEST", message: "No fields to update" },
      status: 400 as const,
    };
  }

  const { data, error } = await admin
    .from("discount_coupons")
    .update(patch)
    .eq("code", code)
    .select("*")
    .single();

  if (error) throw error;
  return { coupon: enrichCoupon(data as CouponRow) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeadersForRequest(req),
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      },
    });
  }

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { admin, cors } = auth;

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const result = await listCoupons(admin, {
        q: url.searchParams.get("q") ?? undefined,
        active: url.searchParams.get("active") ?? undefined,
        limit: clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
        offset: clampInt(url.searchParams.get("offset"), 0, 10_000),
      });
      return adminJson(cors, {
        ...result,
        checkout_package_skus: [...CHECKOUT_PACKAGE_SKUS],
      });
    }

    if (req.method === "POST") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return adminJson(
          cors,
          { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
          400,
        );
      }
      const result = await createCoupon(admin, body);
      if ("error" in result && result.error) {
        return adminJson(cors, { error: result.error }, result.status);
      }
      return adminJson(cors, result, 201);
    }

    if (req.method === "PATCH") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return adminJson(
          cors,
          { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
          400,
        );
      }
      const result = await patchCoupon(admin, body);
      if ("error" in result && result.error) {
        return adminJson(cors, { error: result.error }, result.status);
      }
      return adminJson(cors, result);
    }

    return adminJson(
      cors,
      { error: { code: "METHOD_NOT_ALLOWED", message: "GET/POST/PATCH only" } },
      405,
    );
  } catch (e) {
    console.error("admin-coupons", e);
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
