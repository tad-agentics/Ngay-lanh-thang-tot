import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verifyWebhookSignature } from "../_shared/payos.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function ok(body: unknown = { received: true }): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const checksumKey = Deno.env.get("PAYOS_CHECKSUM_KEY");

  if (!supabaseUrl || !serviceKey || !checksumKey) {
    console.error("payos-webhook: missing env");
    return new Response("Server misconfigured", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  let payload: {
    code?: string;
    desc?: string;
    success?: boolean;
    data?: Record<string, unknown>;
    signature?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const data = payload.data;
  const signature = payload.signature;
  if (
    !data ||
    typeof signature !== "string" ||
    typeof data.orderCode === "undefined"
  ) {
    return new Response("Invalid webhook payload", { status: 400 });
  }

  const valid = await verifyWebhookSignature(
    data as Record<string, unknown>,
    signature,
    checksumKey,
  );
  if (!valid) {
    console.error("payos-webhook: bad signature");
    return new Response("Invalid signature", { status: 401 });
  }

  if (payload.code !== "00") {
    return ok({ ignored: true, reason: "not_success" });
  }

  const innerCode = data.code;
  if (innerCode !== "00" && innerCode !== 0) {
    return ok({ ignored: true, reason: "inner_not_success" });
  }

  const orderCode = String(data.orderCode);
  const eventId = String(
    data.reference ?? `${data.paymentLinkId ?? "noref"}-${orderCode}`,
  );

  const { data: order, error: ordErr } = await admin
    .from("payment_orders")
    .select("*")
    .eq("provider_order_code", orderCode)
    .eq("provider", "payos")
    .maybeSingle();

  if (ordErr || !order) {
    console.error("order lookup", ordErr, orderCode);
    return ok({ missing_order: true });
  }

  const amount = typeof data.amount === "number"
    ? data.amount
    : Number(data.amount);
  if (order.amount_vnd != null && amount !== order.amount_vnd) {
    console.error("amount mismatch", amount, order.amount_vnd);
    return ok({ amount_mismatch: true });
  }

  // Single winner: pending → paid (PayOS retries get empty update)
  const { data: claimed, error: claimErr } = await admin
    .from("payment_orders")
    .update({
      status: "paid",
      raw_webhook: payload as unknown as Record<string, unknown>,
    })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimErr) {
    console.error("claim", claimErr);
    return new Response("DB error", { status: 500 });
  }

  if (!claimed) {
    return ok({ already_processed: true });
  }

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("credits_balance, subscription_expires_at")
    .eq("id", order.user_id)
    .single();

  if (profErr || !profile) {
    console.error("profile", profErr);
    // Mark paid but unfulfilled — ops must reconcile; 500 triggers PayOS retry
    return new Response("Profile missing", { status: 500 });
  }

  if (order.credits_to_add != null && order.credits_to_add > 0) {
    const newBal = profile.credits_balance + order.credits_to_add;
    const { error: u1 } = await admin.from("profiles").update({
      credits_balance: newBal,
    }).eq("id", order.user_id);
    if (u1) {
      console.error("credit update", u1);
      return new Response("DB error", { status: 500 });
    }
    const { error: l1 } = await admin.from("credit_ledger").insert({
      user_id: order.user_id,
      delta: order.credits_to_add,
      balance_after: newBal,
      reason: "payos_purchase",
      idempotency_key: `payos:${eventId}:credits`,
      metadata: {
        order_id: order.id,
        package_sku: order.package_sku,
      },
    });
    if (l1 && (l1 as { code?: string }).code !== "23505") {
      console.error("ledger", l1);
      return new Response("DB error", { status: 500 });
    }
  }

  if (order.subscription_months != null && order.subscription_months > 0) {
    const now = new Date();
    const current = profile.subscription_expires_at
      ? new Date(profile.subscription_expires_at)
      : null;
    const base = current && current > now ? current : now;
    const expires = new Date(base);
    expires.setMonth(expires.getMonth() + order.subscription_months);

    const { error: u2 } = await admin.from("profiles").update({
      subscription_expires_at: expires.toISOString(),
    }).eq("id", order.user_id);

    if (u2) {
      console.error("sub update", u2);
      return new Response("DB error", { status: 500 });
    }

    const { error: l2 } = await admin.from("credit_ledger").insert({
      user_id: order.user_id,
      delta: 0,
      balance_after: profile.credits_balance,
      reason: "payos_subscription",
      idempotency_key: `payos:${eventId}:sub`,
      metadata: {
        order_id: order.id,
        package_sku: order.package_sku,
        months: order.subscription_months,
        subscription_expires_at: expires.toISOString(),
      },
    });
    if (l2 && (l2 as { code?: string }).code !== "23505") {
      console.error("ledger sub", l2);
    }
  }

  await admin.from("webhook_events").insert({
    provider: "payos",
    event_id: eventId,
  }).then(() => {}, () => {});

  return ok({ fulfilled: true });
});
