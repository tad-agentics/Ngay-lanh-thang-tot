/**
 * Admin referral ops — JWT + ADMIN_EMAILS + service_role.
 *
 * GET ?view=summary
 * GET ?view=events&referrer_id=&referee_id=&q=&from=&to=&limit=&offset=
 * GET ?view=leaders&limit=
 * GET ?view=links&referrer_id=&q=&limit=&offset=
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import { adminJson, isUuid, requireAdmin } from "../_shared/admin-auth.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_LEADERS = 50;

type ReferralFilters = {
  view?: string;
  referrer_id?: string;
  referee_id?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
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

function readFiltersFromUrl(url: URL): ReferralFilters {
  return {
    view: url.searchParams.get("view")?.trim() || "summary",
    referrer_id: url.searchParams.get("referrer_id")?.trim() || undefined,
    referee_id: url.searchParams.get("referee_id")?.trim() || undefined,
    q: url.searchParams.get("q")?.trim() || undefined,
    from: url.searchParams.get("from")?.trim() || undefined,
    to: url.searchParams.get("to")?.trim() || undefined,
    limit: clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
    offset: clampInt(url.searchParams.get("offset"), 0, 10_000),
  };
}

function parseDateBound(raw: string | undefined, label: string) {
  if (!raw) return { ok: true as const, iso: undefined };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return {
      ok: false as const,
      error: { code: "BAD_REQUEST", message: `${label} is not a valid date` },
    };
  }
  return { ok: true as const, iso: d.toISOString() };
}

async function resolveProfileIdsFromQ(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  q: string,
): Promise<string[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  if (isUuid(trimmed)) return [trimmed];

  if (/^[a-z0-9_-]+$/iu.test(trimmed) && trimmed.length <= 32) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", trimmed.toLowerCase())
      .limit(5);
    const ids = (data ?? []).map((r) => (r as { id: string }).id);
    if (ids.length > 0) return ids;
  }

  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", `%${trimmed.replaceAll("%", "")}%`)
    .limit(20);

  return (data ?? []).map((r) => (r as { id: string }).id);
}

type ProfileMini = {
  id: string;
  email: string | null;
  referral_code: string | null;
};

async function loadProfileMinis(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  ids: string[],
): Promise<Map<string, ProfileMini>> {
  const map = new Map<string, ProfileMini>();
  if (ids.length === 0) return map;

  const unique = [...new Set(ids)];
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, referral_code")
    .in("id", unique);
  if (error) throw error;

  for (const row of data ?? []) {
    const p = row as ProfileMini;
    map.set(p.id, p);
  }
  return map;
}

async function fetchSummary(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    { data: allEvents, error: e1 },
    { count: referredProfiles, error: e2 },
    { data: discountRow, error: e3 },
  ] = await Promise.all([
    admin.from("referral_reward_events").select("reward_vnd, created_at"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("referred_by", "is", null),
    admin
      .from("app_config")
      .select("value")
      .eq("config_key", "checkout_referral_discount_percent")
      .maybeSingle(),
  ]);

  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;

  let totalRewardVnd = 0;
  let last30DaysRewardVnd = 0;
  const referrerIds = new Set<string>();
  for (const row of allEvents ?? []) {
    const v = (row as { reward_vnd: number }).reward_vnd;
    const created = (row as { created_at: string }).created_at;
    totalRewardVnd += v;
    if (created >= sinceIso) last30DaysRewardVnd += v;
  }

  const { data: eventRows } = await admin
    .from("referral_reward_events")
    .select("referrer_profile_id");
  for (const r of eventRows ?? []) {
    referrerIds.add((r as { referrer_profile_id: string }).referrer_profile_id);
  }

  const eventCount = (allEvents ?? []).length;
  const checkoutReferralDiscountPercent = discountRow?.value != null
    ? Number.parseInt(String(discountRow.value), 10)
    : 0;

  return {
    totalRewardVnd,
    last30DaysRewardVnd,
    eventCount,
    activeReferrersCount: referrerIds.size,
    referredProfilesCount: referredProfiles ?? 0,
    checkoutReferralDiscountPercent: Number.isFinite(
        checkoutReferralDiscountPercent,
      )
      ? checkoutReferralDiscountPercent
      : 0,
    rewardRules: [
      { package_sku: "goi_1thang", reward_vnd: 10_000 },
      { package_sku: "goi_6thang", reward_vnd: 30_000 },
      { package_sku: "goi_12thang", reward_vnd: 50_000 },
    ],
  };
}

async function fetchEvents(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  filters: ReferralFilters,
) {
  const limit = clampInt(filters.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = clampInt(filters.offset, 0, 10_000);

  if (filters.referrer_id && !isUuid(filters.referrer_id)) {
    return {
      error: { code: "BAD_REQUEST", message: "referrer_id must be a UUID" },
      status: 400 as const,
    };
  }
  if (filters.referee_id && !isUuid(filters.referee_id)) {
    return {
      error: { code: "BAD_REQUEST", message: "referee_id must be a UUID" },
      status: 400 as const,
    };
  }

  const fromParsed = parseDateBound(filters.from, "from");
  if (!fromParsed.ok) return { error: fromParsed.error, status: 400 as const };
  const toParsed = parseDateBound(filters.to, "to");
  if (!toParsed.ok) return { error: toParsed.error, status: 400 as const };

  let query = admin
    .from("referral_reward_events")
    .select(
      "id, referrer_profile_id, referee_profile_id, payment_order_id, package_sku, reward_vnd, checkout_referral_code, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.referrer_id) {
    query = query.eq("referrer_profile_id", filters.referrer_id);
  }
  if (filters.referee_id) {
    query = query.eq("referee_profile_id", filters.referee_id);
  }
  if (fromParsed.iso) query = query.gte("created_at", fromParsed.iso);
  if (toParsed.iso) query = query.lte("created_at", toParsed.iso);

  if (filters.q) {
    const ids = await resolveProfileIdsFromQ(admin, filters.q);
    if (ids.length === 0) {
      return { events: [], total: 0, limit, offset };
    }
    const orParts = ids.flatMap((id) => [
      `referrer_profile_id.eq.${id}`,
      `referee_profile_id.eq.${id}`,
    ]);
    query = query.or(orParts.join(","));
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const profileIds = [
    ...rows.map((r) => (r as { referrer_profile_id: string }).referrer_profile_id),
    ...rows.map((r) => (r as { referee_profile_id: string }).referee_profile_id),
  ];
  const profiles = await loadProfileMinis(admin, profileIds);

  const events = rows.map((r) => {
    const row = r as {
      id: string;
      referrer_profile_id: string;
      referee_profile_id: string;
      payment_order_id: string;
      package_sku: string;
      reward_vnd: number;
      checkout_referral_code: string | null;
      created_at: string;
    };
    const referrer = profiles.get(row.referrer_profile_id);
    const referee = profiles.get(row.referee_profile_id);
    return {
      ...row,
      referrer_email: referrer?.email ?? null,
      referrer_code: referrer?.referral_code ?? null,
      referee_email: referee?.email ?? null,
    };
  });

  return { events, total: count ?? events.length, limit, offset };
}

async function fetchLeaders(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  filters: ReferralFilters,
) {
  const limit = clampInt(filters.limit, 20, MAX_LEADERS);

  const { data: leaders, error } = await admin
    .from("profiles")
    .select(
      "id, email, referral_code, referral_reward_total_vnd, created_at",
    )
    .gt("referral_reward_total_vnd", 0)
    .order("referral_reward_total_vnd", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const leaderRows = leaders ?? [];
  const ids = leaderRows.map((r) => (r as { id: string }).id);

  const refereeCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: referred } = await admin
      .from("profiles")
      .select("referred_by")
      .in("referred_by", ids);
    for (const row of referred ?? []) {
      const rid = (row as { referred_by: string }).referred_by;
      refereeCounts.set(rid, (refereeCounts.get(rid) ?? 0) + 1);
    }
  }

  const eventCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: events } = await admin
      .from("referral_reward_events")
      .select("referrer_profile_id")
      .in("referrer_profile_id", ids);
    for (const row of events ?? []) {
      const rid = (row as { referrer_profile_id: string }).referrer_profile_id;
      eventCounts.set(rid, (eventCounts.get(rid) ?? 0) + 1);
    }
  }

  return {
    leaders: leaderRows.map((r) => {
      const row = r as {
        id: string;
        email: string | null;
        referral_code: string | null;
        referral_reward_total_vnd: number;
        created_at: string;
      };
      return {
        ...row,
        linked_referees_count: refereeCounts.get(row.id) ?? 0,
        reward_events_count: eventCounts.get(row.id) ?? 0,
      };
    }),
  };
}

async function fetchLinks(
  admin: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient>,
  filters: ReferralFilters,
) {
  const limit = clampInt(filters.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = clampInt(filters.offset, 0, 10_000);

  if (filters.referrer_id && !isUuid(filters.referrer_id)) {
    return {
      error: { code: "BAD_REQUEST", message: "referrer_id must be a UUID" },
      status: 400 as const,
    };
  }

  let query = admin
    .from("profiles")
    .select(
      "id, email, referral_code, referred_by, subscription_expires_at, created_at",
      { count: "exact" },
    )
    .not("referred_by", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.referrer_id) {
    query = query.eq("referred_by", filters.referrer_id);
  }

  if (filters.q) {
    const ids = await resolveProfileIdsFromQ(admin, filters.q);
    if (ids.length === 0) {
      return { links: [], total: 0, limit, offset };
    }
    const orParts = ids.flatMap((id) => [
      `id.eq.${id}`,
      `referred_by.eq.${id}`,
    ]);
    query = query.or(orParts.join(","));
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const referrerIds = rows.map((r) => (r as { referred_by: string }).referred_by);
  const referrers = await loadProfileMinis(admin, referrerIds);

  const links = rows.map((r) => {
    const row = r as {
      id: string;
      email: string | null;
      referral_code: string | null;
      referred_by: string;
      subscription_expires_at: string | null;
      created_at: string;
    };
    const referrer = referrers.get(row.referred_by);
    return {
      referee_id: row.id,
      referee_email: row.email,
      referee_code: row.referral_code,
      referee_created_at: row.created_at,
      subscription_expires_at: row.subscription_expires_at,
      referrer_id: row.referred_by,
      referrer_email: referrer?.email ?? null,
      referrer_code: referrer?.referral_code ?? null,
    };
  });

  return { links, total: count ?? links.length, limit, offset };
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
    let filters: ReferralFilters;
    if (req.method === "GET") {
      filters = readFiltersFromUrl(new URL(req.url));
    } else if (req.method === "POST") {
      try {
        filters = (await req.json()) as ReferralFilters;
        filters.view = filters.view ?? "summary";
        filters.limit = clampInt(filters.limit, DEFAULT_LIMIT, MAX_LIMIT);
        filters.offset = clampInt(filters.offset, 0, 10_000);
      } catch {
        return adminJson(
          cors,
          { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
          400,
        );
      }
    } else {
      return adminJson(
        cors,
        { error: { code: "METHOD_NOT_ALLOWED", message: "GET/POST only" } },
        405,
      );
    }

    const view = filters.view ?? "summary";

    if (view === "summary") {
      return adminJson(cors, await fetchSummary(admin));
    }

    if (view === "events") {
      const result = await fetchEvents(admin, filters);
      if ("error" in result && result.error) {
        return adminJson(cors, { error: result.error }, result.status);
      }
      return adminJson(cors, result);
    }

    if (view === "leaders") {
      return adminJson(cors, await fetchLeaders(admin, filters));
    }

    if (view === "links") {
      const result = await fetchLinks(admin, filters);
      if ("error" in result && result.error) {
        return adminJson(cors, { error: result.error }, result.status);
      }
      return adminJson(cors, result);
    }

    return adminJson(
      cors,
      {
        error: {
          code: "BAD_REQUEST",
          message: "view must be summary, events, leaders, or links",
        },
      },
      400,
    );
  } catch (e) {
    console.error("admin-referrals", e);
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
