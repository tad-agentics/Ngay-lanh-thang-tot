import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export type ReferralClaimErrorCode =
  | "invalid_code"
  | "already_redeemed"
  | "self"
  | "success"
  | "unauthorized"
  | "bad_request"
  | "method_not_allowed"
  | "server_error";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { ok: false, error_code: "method_not_allowed" as ReferralClaimErrorCode },
      405,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("referral-claim: missing Supabase env");
    return json({ ok: false, error_code: "server_error" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error_code: "unauthorized" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json({ ok: false, error_code: "unauthorized" }, 401);
  }

  let body: { code?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* invalid JSON */
  }

  const codeNorm = String(body.code ?? "").trim().toUpperCase();
  if (!codeNorm) {
    return json({ ok: false, error_code: "invalid_code" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: refereeRow, error: refErr } = await admin
    .from("profiles")
    .select("id, referred_by, referral_code")
    .eq("id", user.id)
    .maybeSingle();

  if (refErr) {
    console.error("referral-claim profile read", refErr);
    return json({ ok: false, error_code: "server_error" }, 500);
  }
  if (!refereeRow) {
    return json({ ok: false, error_code: "server_error" }, 500);
  }

  if (refereeRow.referred_by != null) {
    return json({ ok: false, error_code: "already_redeemed" }, 200);
  }

  if (
    refereeRow.referral_code &&
    refereeRow.referral_code.toUpperCase() === codeNorm
  ) {
    return json({ ok: false, error_code: "self" }, 200);
  }

  const { data: referrerRow, error: refRerr } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", codeNorm)
    .neq("id", user.id)
    .maybeSingle();

  if (refRerr) {
    console.error("referral-claim referrer lookup", refRerr);
    return json({ ok: false, error_code: "server_error" }, 500);
  }
  if (!referrerRow) {
    return json({ ok: false, error_code: "invalid_code" }, 200);
  }

  const { error: rpcErr } = await admin.rpc("apply_referral_pair", {
    p_referee_id: user.id,
    p_referrer_id: referrerRow.id,
  });

  if (rpcErr) {
    console.error("apply_referral_pair", rpcErr);
    return json({ ok: false, error_code: "server_error" }, 500);
  }

  const { data: after } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .maybeSingle();

  if (after?.referred_by == null) {
    return json({ ok: false, error_code: "already_redeemed" }, 200);
  }

  return json({ ok: true, error_code: "success" }, 200);
});
