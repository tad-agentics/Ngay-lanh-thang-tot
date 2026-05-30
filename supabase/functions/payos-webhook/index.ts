import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  applyPackageEntitlements,
  parseWebhookAmountVnd,
  validateWebhookSkuAmount,
  verifyWebhookSignature,
} from "../_shared/payos.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

  const webhookAmountVnd = parseWebhookAmountVnd(data.amount);
  const skuValidation = validateWebhookSkuAmount(
    {
      package_sku: order.package_sku as string | null,
      amount_vnd: order.amount_vnd as number | null,
      credits_to_add: order.credits_to_add as number | null,
      subscription_months: order.subscription_months as number | null,
    },
    webhookAmountVnd,
  );
  if (!skuValidation.ok) {
    console.error(
      "payos-webhook: fulfillment rejected",
      skuValidation.reason,
      {
        orderCode,
        package_sku: order.package_sku,
        webhookAmountVnd,
        amount_vnd: order.amount_vnd,
        credits_to_add: order.credits_to_add,
        subscription_months: order.subscription_months,
      },
    );
    return ok({ rejected: true, reason: skuValidation.reason });
  }

  const { sku, pkg } = skuValidation;

  // Single winner: pending|expired → paid (late webhook after cron expire is OK)
  const { data: claimed, error: claimErr } = await admin
    .from("payment_orders")
    .update({
      status: "paid",
      raw_webhook: payload as unknown as Record<string, unknown>,
    })
    .eq("id", order.id)
    .in("status", ["pending", "expired"])
    .select("*")
    .maybeSingle();

  if (claimErr) {
    console.error("claim", claimErr);
    return new Response("DB error", { status: 500 });
  }

  if (!claimed) {
    return ok({ already_processed: true });
  }

  const paidCoupon =
    typeof claimed.coupon_code === "string" ? claimed.coupon_code.trim() : "";
  if (paidCoupon.length > 0) {
    const { error: couponIncErr } = await admin.rpc("increment_coupon_redemption", {
      p_code: paidCoupon.toUpperCase(),
    });
    if (couponIncErr) {
      console.error("increment_coupon_redemption", couponIncErr);
    }
  }

  const { data: referralGrant, error: referralErr } = await admin.rpc(
    "grant_referral_subscription_reward",
    { p_order_id: claimed.id },
  );
  if (referralErr) {
    console.error("grant_referral_subscription_reward", referralErr);
  } else if (
    referralGrant &&
    typeof referralGrant === "object" &&
    (referralGrant as { ok?: boolean }).ok === false &&
    (referralGrant as { reason?: string }).reason !== "no_referrer" &&
    (referralGrant as { reason?: string }).reason !== "package_not_eligible" &&
    (referralGrant as { reason?: string }).reason !== "already_granted"
  ) {
    console.error("grant_referral_subscription_reward result", referralGrant);
  }

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select(
      "credits_balance, subscription_expires_at, bazi_reading_unlocked_at, tieu_van_reading_expires_at",
    )
    .eq("id", order.user_id)
    .single();

  if (profErr || !profile) {
    console.error("profile", profErr);
    // Mark paid but unfulfilled — ops must reconcile; 500 triggers PayOS retry
    return new Response("Profile missing", { status: 500 });
  }

  if (pkg.creditsToAdd != null && pkg.creditsToAdd > 0) {
    const { data: creditResult, error: creditErr } = await admin.rpc(
      "add_credits_atomic",
      {
        p_user_id: order.user_id,
        p_credits_to_add: pkg.creditsToAdd,
        p_idempotency_key: `payos:${eventId}:credits`,
        p_order_id: order.id,
        p_package_sku: sku,
      },
    );
    if (creditErr) {
      console.error("add_credits_atomic", creditErr);
      return new Response("DB error", { status: 500 });
    }
    const cr = creditResult as { ok: boolean; error_code?: string };
    if (!cr.ok) {
      console.error("add_credits_atomic result", cr);
      return new Response("DB error", { status: 500 });
    }
  }

  const entitlementPatch = applyPackageEntitlements(
    {
      subscription_expires_at: profile.subscription_expires_at as string | null,
      bazi_reading_unlocked_at: profile.bazi_reading_unlocked_at as string | null,
      tieu_van_reading_expires_at: profile.tieu_van_reading_expires_at as string | null,
    },
    sku,
  );

  if (Object.keys(entitlementPatch).length > 0) {
    const { error: u2 } = await admin
      .from("profiles")
      .update(entitlementPatch)
      .eq("id", order.user_id);

    if (u2) {
      console.error("entitlement update", u2);
      return new Response("DB error", { status: 500 });
    }

    const { error: l2 } = await admin.from("credit_ledger").insert({
      user_id: order.user_id,
      delta: 0,
      balance_after: profile.credits_balance,
      reason: "payos_entitlement",
      idempotency_key: `payos:${eventId}:ent`,
      metadata: {
        order_id: order.id,
        package_sku: sku,
        ...entitlementPatch,
      },
    });
    if (l2 && (l2 as { code?: string }).code !== "23505") {
      console.error("ledger entitlement", l2);
    }
  }

  await admin.from("webhook_events").insert({
    provider: "payos",
    event_id: eventId,
  }).then(() => {}, () => {});

  return ok({ fulfilled: true });
});
