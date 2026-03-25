/**
 * Bát Tự Edge proxy — maps `{ op, body }` to real HTTP calls per OpenAPI:
 * https://tu-tru-api.fly.dev/openapi.json (Swagger: https://tu-tru-api.fly.dev/docs)
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Ops callable without Supabase session (caller may still send birth_* in `body`). */
const ANONYMOUS_OPS = new Set([
  "ngay-hom-nay",
  "weekly-summary",
  "convert-date",
  "lich-thang",
]);

const VALID_OPS = new Set([
  "ngay-hom-nay",
  "weekly-summary",
  "chon-ngay",
  "chon-ngay/detail",
  "lich-thang",
  "day-detail",
  "convert-date",
  "tu-tru",
  "profile",
  "tieu-van",
  "hop-tuoi",
  "phong-thuy",
  "share",
]);

/** Pick only defined JSON fields for POST bodies (avoid leaking internal keys). */
function pickJson(
  body: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (body[k] === undefined) continue;
    out[k] = body[k];
  }
  return out;
}

function appendQuery(
  params: URLSearchParams,
  body: Record<string, unknown>,
  keys: string[],
): void {
  for (const k of keys) {
    const v = body[k];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "boolean") {
      params.set(k, v ? "true" : "false");
    } else {
      params.set(k, String(v));
    }
  }
}

function parseDdMmYyyy(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return dt;
}

function chonNgayRangeDays(body: Record<string, unknown>): number | null {
  const rs = body.range_start;
  const re = body.range_end;
  if (typeof rs !== "string" || typeof re !== "string") return null;
  const a = parseDdMmYyyy(rs);
  const b = parseDdMmYyyy(re);
  if (!a || !b) return null;
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  const inclusive = diff + 1;
  return inclusive > 0 ? inclusive : null;
}

type Upstream =
  | {
    method: "GET";
    path: string;
    queryKeys: string[];
  }
  | {
    method: "GET";
    path: string;
    pathSuffix: string;
  }
  | {
    method: "POST";
    path: string;
    queryKeys: string[];
    jsonKeys: string[] | null;
  };

function buildUpstream(
  op: string,
  body: Record<string, unknown>,
  baseUrl: string,
): { ok: true; url: string; init: RequestInit } | { ok: false; message: string } {
  const base = baseUrl.replace(/\/$/, "");
  const headers: Record<string, string> = {
    "X-API-Key": "", // set by caller
  };

  let spec: Upstream;

  switch (op) {
    case "ngay-hom-nay":
      if (!body.birth_date) {
        return {
          ok: false,
          message: "Thiếu birth_date dd/mm/yyyy (OpenAPI /v1/ngay-hom-nay).",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/ngay-hom-nay",
        queryKeys: ["birth_date", "birth_time", "gender", "date", "tz"],
      };
      break;

    case "weekly-summary":
      if (!body.birth_date && !body.profile_id) {
        return {
          ok: false,
          message: "Thiếu birth_date hoặc profile_id (OpenAPI /v1/weekly-summary).",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/weekly-summary",
        queryKeys: [
          "birth_date",
          "birth_time",
          "gender",
          "intent",
          "profile_id",
          "tz",
        ],
      };
      break;

    case "lich-thang":
      if (!body.birth_date || !body.month) {
        return {
          ok: false,
          message: "Thiếu birth_date hoặc month YYYY-MM (OpenAPI /v1/lich-thang).",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/lich-thang",
        queryKeys: [
          "birth_date",
          "birth_time",
          "gender",
          "month",
          "tz",
        ],
      };
      break;

    case "convert-date": {
      const hasSolar = typeof body.solar === "string" && body.solar.length > 0;
      const hasLunar =
        body.lunar_year != null &&
        body.lunar_month != null &&
        body.lunar_day != null;
      if (!hasSolar && !hasLunar) {
        return {
          ok: false,
          message: "Cần solar=YYYY-MM-DD hoặc lunar_year, lunar_month, lunar_day.",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/convert-date",
        queryKeys: [
          "solar",
          "lunar_year",
          "lunar_month",
          "lunar_day",
          "is_leap_month",
        ],
      };
      break;
    }

    case "chon-ngay":
      if (!body.intent || !body.range_start || !body.range_end) {
        return {
          ok: false,
          message: "Thiếu intent, range_start, range_end (POST /v1/chon-ngay).",
        };
      }
      spec = {
        method: "POST",
        path: "/v1/chon-ngay",
        queryKeys: [],
        jsonKeys: [
          "birth_date",
          "birth_time",
          "gender",
          "profile_id",
          "intent",
          "range_start",
          "range_end",
          "top_n",
          "tz",
        ],
      };
      break;

    case "chon-ngay/detail":
      if (!body.birth_date || !body.intent || !body.date) {
        return {
          ok: false,
          message: "Thiếu birth_date, intent, date (POST /v1/chon-ngay/detail).",
        };
      }
      spec = {
        method: "POST",
        path: "/v1/chon-ngay/detail",
        queryKeys: [],
        jsonKeys: [
          "birth_date",
          "birth_time",
          "gender",
          "intent",
          "date",
          "tz",
        ],
      };
      break;

    case "day-detail":
      if (!body.birth_date || !body.date) {
        return {
          ok: false,
          message: "Thiếu birth_date hoặc date (GET /v1/day-detail).",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/day-detail",
        queryKeys: ["birth_date", "birth_time", "gender", "date", "tz"],
      };
      break;

    case "tieu-van":
      if (!body.birth_date || !body.month) {
        return {
          ok: false,
          message: "Thiếu birth_date hoặc month (GET /v1/tieu-van).",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/tieu-van",
        queryKeys: [
          "birth_date",
          "birth_time",
          "gender",
          "month",
          "tz",
        ],
      };
      break;

    case "phong-thuy":
      if (!body.birth_date) {
        return {
          ok: false,
          message: "Thiếu birth_date (GET /v1/phong-thuy).",
        };
      }
      spec = {
        method: "GET",
        path: "/v1/phong-thuy",
        queryKeys: ["birth_date", "birth_time", "gender", "tz"],
      };
      break;

    case "tu-tru":
      if (!body.birth_date) {
        return {
          ok: false,
          message: "Thiếu birth_date (POST /v1/tu-tru).",
        };
      }
      spec = {
        method: "POST",
        path: "/v1/tu-tru",
        queryKeys: [],
        jsonKeys: ["birth_date", "birth_time", "gender"],
      };
      break;

    case "hop-tuoi":
      if (!body.person1_birth_date || !body.person2_birth_date) {
        return {
          ok: false,
          message:
            "Thiếu person1_birth_date hoặc person2_birth_date (POST /v1/hop-tuoi).",
        };
      }
      spec = {
        method: "POST",
        path: "/v1/hop-tuoi",
        queryKeys: [],
        jsonKeys: [
          "person1_birth_date",
          "person1_birth_time",
          "person1_gender",
          "person2_birth_date",
          "person2_birth_time",
          "person2_gender",
        ],
      };
      break;

    case "share": {
      const token = body.token;
      if (typeof token !== "string" || !token.length) {
        return { ok: false, message: "Thiếu token (GET /v1/share/{token})." };
      }
      const enc = encodeURIComponent(token);
      spec = { method: "GET", path: "/v1/share", pathSuffix: enc };
      break;
    }

    case "profile": {
      const pid = body.profile_id;
      const bd = body.birth_date;
      if (typeof pid === "string" && pid.length && !bd) {
        spec = { method: "GET", path: "/v1/profile", pathSuffix: pid };
        break;
      }
      if (typeof bd === "string" && bd.length) {
        spec = {
          method: "POST",
          path: "/v1/profile",
          queryKeys: ["birth_date", "birth_time", "gender"],
          jsonKeys: null,
        };
        break;
      }
      return {
        ok: false,
        message:
          "profile: gửi profile_id (lấy hồ sơ) hoặc birth_date (lưu hồ sơ).",
      };
    }

    default:
      return { ok: false, message: `Unsupported op: ${op}` };
  }

  if (spec.method === "GET" && "pathSuffix" in spec) {
    const url = `${base}${spec.path}/${spec.pathSuffix}`;
    return {
      ok: true,
      url,
      init: { method: "GET", headers: { ...headers } },
    };
  }

  const params = new URLSearchParams();
  if (spec.method === "GET") {
    appendQuery(params, body, spec.queryKeys);
    const qs = params.toString();
    const url = qs.length ? `${base}${spec.path}?${qs}` : `${base}${spec.path}`;
    return { ok: true, url, init: { method: "GET", headers: { ...headers } } };
  }

  // POST
  appendQuery(params, body, spec.queryKeys);
  const qs = params.toString();
  const url = qs.length ? `${base}${spec.path}?${qs}` : `${base}${spec.path}`;
  const init: RequestInit = {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
  };
  if (spec.jsonKeys) {
    init.body = JSON.stringify(pickJson(body, spec.jsonKeys));
  } else {
    init.body = JSON.stringify({});
  }
  return { ok: true, url, init };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveFeatureKey(
  op: string,
  body: Record<string, unknown>,
): string | null {
  switch (op) {
    case "ngay-hom-nay":
      return "ngay_hom_nay";
    case "weekly-summary":
      return "weekly_summary";
    case "convert-date":
      return "convert_date";
    case "lich-thang":
      return "lich_thang_overview";
    case "chon-ngay": {
      const days =
        chonNgayRangeDays(body) ??
        Number(body.windowDays ?? body.days ?? body.range);
      if (!Number.isFinite(days)) return "chon_ngay_30";
      const d = days as number;
      if (d <= 30) return "chon_ngay_30";
      if (d <= 60) return "chon_ngay_60";
      return "chon_ngay_90";
    }
    case "chon-ngay/detail":
      return "chon_ngay_detail";
    case "day-detail":
      return "day_detail";
    case "tu-tru":
      return "tu_tru";
    case "tieu-van":
      return "tieu_van";
    case "hop-tuoi":
      return "hop_tuoi";
    case "phong-thuy":
      return "phong_thuy";
    case "share":
      return "share_card";
    case "profile":
      return null;
    default:
      return null;
  }
}

function subscriptionActive(expires: string | null): boolean {
  if (!expires) return false;
  return new Date(expires) > new Date();
}

type SupabaseAdmin = ReturnType<typeof createClient>;

async function refundCredits(
  admin: SupabaseAdmin,
  userId: string,
  featureKey: string,
  charged: number,
  op: string,
): Promise<void> {
  if (charged <= 0) return;
  const { data: profile } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return;
  const bal = profile.credits_balance as number;
  const newBal = bal + charged;
  await admin
    .from("profiles")
    .update({ credits_balance: newBal })
    .eq("id", userId);
  await admin.from("credit_ledger").insert({
    user_id: userId,
    delta: charged,
    balance_after: newBal,
    reason: "bat_tu_refund",
    feature_key: featureKey,
    metadata: { op, note: "upstream_failure" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } },
      405,
    );
  }

  const batUrl = Deno.env.get("BAT_TU_API_URL");
  const batKey = Deno.env.get("BAT_TU_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!batUrl || !batKey) {
    return json(
      {
        error: {
          code: "SERVER_CONFIG",
          message: "Bát Tự API not configured.",
        },
      },
      503,
    );
  }
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(
      {
        error: { code: "SERVER_CONFIG", message: "Supabase not configured." },
      },
      500,
    );
  }

  let payload: { op?: string; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, 400);
  }

  const op = payload.op;
  const body =
    payload.body && typeof payload.body === "object" && !Array.isArray(payload.body)
      ? (payload.body as Record<string, unknown>)
      : {};

  if (!op || typeof op !== "string" || !VALID_OPS.has(op)) {
    return json(
      {
        error: {
          code: "INVALID_OP",
          message: `Unknown or unsupported op: ${String(op)}`,
        },
      },
      422,
    );
  }

  const upstream = buildUpstream(op, body, batUrl);
  if (!upstream.ok) {
    return json({ error: { code: "BAD_REQUEST", message: upstream.message } }, 400);
  }

  const { url: upstreamUrl, init: upstreamInit } = upstream;
  (upstreamInit.headers as Record<string, string>)["X-API-Key"] = batKey;

  const admin = createClient(supabaseUrl, serviceKey);
  let userId: string | null = null;

  if (!ANONYMOUS_OPS.has(op)) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Đăng nhập để dùng tính năng này.",
          },
        },
        401,
      );
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const u = userData?.user;
    if (userErr || !u) {
      return json(
        { error: { code: "UNAUTHORIZED", message: "Phiên không hợp lệ." } },
        401,
      );
    }
    userId = u.id;
  }

  const featureKey = resolveFeatureKey(op, body);
  let chargedAmount = 0;

  if (featureKey && userId) {
    const { data: costRow } = await admin
      .from("feature_credit_costs")
      .select("credit_cost, is_free")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (
      costRow && !costRow.is_free && (costRow.credit_cost as number) > 0
    ) {
      const cost = costRow.credit_cost as number;
      const { data: profile, error: pErr } = await admin
        .from("profiles")
        .select("credits_balance, subscription_expires_at")
        .eq("id", userId)
        .maybeSingle();

      if (pErr || !profile) {
        return json(
          {
            error: {
              code: "PROFILE_MISSING",
              message: "Chưa có hồ sơ. Đăng xuất và đăng nhập lại.",
            },
          },
          400,
        );
      }

      if (!subscriptionActive(profile.subscription_expires_at as string | null)) {
        const bal = profile.credits_balance as number;
        if (bal < cost) {
          return json(
            {
              error: {
                code: "INSUFFICIENT_CREDITS",
                message: "Không đủ lượng để dùng tính năng này.",
              },
            },
            402,
          );
        }

        const newBal = bal - cost;
        const { error: uErr } = await admin
          .from("profiles")
          .update({ credits_balance: newBal })
          .eq("id", userId);

        if (uErr) {
          console.error("bat-tu deduct", uErr);
          return json(
            { error: { code: "DB_ERROR", message: "Không trừ lượng được." } },
            500,
          );
        }

        const { error: lErr } = await admin.from("credit_ledger").insert({
          user_id: userId,
          delta: -cost,
          balance_after: newBal,
          reason: "bat_tu",
          feature_key: featureKey,
          metadata: { op },
        });

        if (lErr) {
          console.error("bat-tu ledger", lErr);
          await admin
            .from("profiles")
            .update({ credits_balance: bal })
            .eq("id", userId);
          return json(
            { error: { code: "DB_ERROR", message: "Ghi sổ lượng thất bại." } },
            500,
          );
        }

        chargedAmount = cost;
      }
    }
  }

  let upstreamRes: Response;

  try {
    upstreamRes = await fetch(upstreamUrl, upstreamInit);
  } catch (e) {
    console.error("bat-tu fetch", e);
    if (userId && featureKey) {
      await refundCredits(admin, userId, featureKey, chargedAmount, op);
    }
    return json(
      {
        error: {
          code: "BAT_TU_UPSTREAM",
          message: "Không kết nối được máy chủ Bát Tự.",
        },
      },
      502,
    );
  }

  const rawText = await upstreamRes.text();

  if (!upstreamRes.ok) {
    console.error("bat-tu upstream", upstreamRes.status, rawText);
    if (userId && featureKey) {
      await refundCredits(admin, userId, featureKey, chargedAmount, op);
    }
    return json(
      {
        error: {
          code: "BAT_TU_ERROR",
          message: rawText.slice(0, 500) || "Bát Tự từ chối yêu cầu.",
        },
      },
      502,
    );
  }

  let data: unknown;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  return json({ data });
});
