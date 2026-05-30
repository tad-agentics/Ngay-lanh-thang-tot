import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeadersForRequest } from "../_shared/cors.ts";
import {
  packageSkuDisplayLabel,
  REFERRAL_REWARD_TIERS,
} from "../_shared/referral-rewards.ts";

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

function publicAppOrigin(): string {
  const raw =
    Deno.env.get("APP_PUBLIC_URL") ??
    Deno.env.get("ALLOWED_ORIGIN") ??
    "https://ngaylanhthangtot.vn";
  return raw.replace(/\/+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "GET") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "GET only" } },
      405,
      req,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(
      { error: { code: "SERVER_CONFIG", message: "Server not configured." } },
      500,
      req,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Authorization required." } },
      401,
      req,
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Invalid session." } },
      401,
      req,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("referral_code, referral_reward_total_vnd")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile?.referral_code) {
    console.error("referral-dashboard profile", profErr);
    return json(
      { error: { code: "DB_ERROR", message: "Could not load profile." } },
      500,
      req,
    );
  }

  const { data: refereesCount, error: countErr } = await admin.rpc(
    "count_distinct_referral_referees",
    { p_referrer_id: user.id },
  );

  if (countErr) {
    console.error("referral-dashboard count", countErr);
    return json(
      { error: { code: "DB_ERROR", message: "Could not load stats." } },
      500,
      req,
    );
  }

  const { data: totalReward, error: totalErr } = await admin.rpc(
    "reconcile_referral_reward_total",
    { p_referrer_id: user.id },
  );

  if (totalErr) {
    console.error("referral-dashboard reconcile total", totalErr);
  }

  const { data: events, error: evErr } = await admin
    .from("referral_reward_events")
    .select(
      "id, referee_profile_id, package_sku, reward_vnd, created_at, checkout_referral_code",
    )
    .eq("referrer_profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (evErr) {
    console.error("referral-dashboard events", evErr);
    return json(
      { error: { code: "DB_ERROR", message: "Could not load rewards." } },
      500,
      req,
    );
  }

  const list = events ?? [];

  const inviteUrl =
    `${publicAppOrigin()}/dang-ky?ref=${encodeURIComponent(profile.referral_code)}`;

  const totalVnd =
    typeof totalReward === "number" && Number.isFinite(totalReward)
      ? totalReward
      : (profile.referral_reward_total_vnd ?? 0);

  return json(
    {
      referral_code: profile.referral_code,
      invite_url: inviteUrl,
      total_reward_vnd: totalVnd,
      referees_count:
        typeof refereesCount === "number" && Number.isFinite(refereesCount)
          ? refereesCount
          : 0,
      reward_tiers: REFERRAL_REWARD_TIERS,
      recent_rewards: list.map((e) => ({
        id: e.id,
        package_sku: e.package_sku,
        package_label: packageSkuDisplayLabel(String(e.package_sku)),
        reward_vnd: e.reward_vnd,
        created_at: e.created_at,
      })),
    },
    200,
    req,
  );
});
