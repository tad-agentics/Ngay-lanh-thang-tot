import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  payCheckoutExpiredAtUnix,
  payCheckoutExpiresAtIso,
} from "../_shared/pay-checkout-timeout.ts";
import { acquireCheckoutQuoteRateLimit } from "../_shared/checkout-quote-rate-limit.ts";
import type { CheckoutDiscountBreakdown } from "../_shared/checkout-pricing.ts";
import { resolveCheckoutPricingForUser } from "../_shared/checkout-pricing-resolve.ts";
import {
  CHECKOUT_PACKAGE_SKUS,
  generateOrderCode,
  isPackageSku,
  PACKAGES,
  PAYOS_API_BASE,
  signPaymentRequest,
} from "../_shared/payos.ts";
import { isValidRedirectUrl } from "../_shared/allowed-origin.ts";
import { corsHeadersForRequest } from "../_shared/cors.ts";

function json(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}

function appendOrderIdToUrl(raw: string, orderId: string): string {
  const u = new URL(raw);
  u.searchParams.set("order_id", orderId);
  return u.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersForRequest(req) });
  }

  if (req.method !== "POST") {
    return json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } }, 405, req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const payosClientId = Deno.env.get("PAYOS_CLIENT_ID");
  const payosApiKey = Deno.env.get("PAYOS_API_KEY");
  const payosChecksum = Deno.env.get("PAYOS_CHECKSUM_KEY");

  if (
    !supabaseUrl || !anonKey || !serviceKey || !payosClientId ||
    !payosApiKey || !payosChecksum
  ) {
    console.error("Missing Edge secrets for payos-create-checkout");
    return json(
      {
        error: {
          code: "SERVER_CONFIG",
          message: "Payment server not configured.",
        },
      }, 500, req);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Authorization required." } }, 401, req);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Invalid session." } }, 401, req);
  }

  let body: {
    package_sku?: string;
    return_url?: string;
    cancel_url?: string;
    quote_only?: boolean;
    coupon_code?: string;
    referral_code?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, 400, req);
  }

  const {
    package_sku,
    return_url,
    cancel_url,
    quote_only = false,
    coupon_code,
    referral_code,
  } = body;

  if (!package_sku) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "package_sku required.",
        },
      },
      400,
      req,
    );
  }

  if (!quote_only && (!return_url || !cancel_url)) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "return_url and cancel_url required for checkout.",
        },
      },
      400,
      req,
    );
  }

  if (
    !quote_only &&
    (!isValidRedirectUrl(return_url!) || !isValidRedirectUrl(cancel_url!))
  ) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message:
            "return_url and cancel_url must use the app origin (ALLOWED_ORIGIN).",
        },
      }, 400, req);
  }

  if (!isPackageSku(package_sku)) {
    return json(
      {
        error: {
          code: "INVALID_SKU",
          message: `Unknown package_sku: ${package_sku}`,
        },
      }, 422, req);
  }

  if (!CHECKOUT_PACKAGE_SKUS.includes(package_sku)) {
    return json(
      {
        error: {
          code: "SKU_RETIRED",
          message: "Gói này không còn bán. Chọn gói lịch mới.",
        },
      }, 422, req);
  }

  const pkg = PACKAGES[package_sku];
  const admin = createClient(supabaseUrl, serviceKey);

  if (quote_only) {
    const allowed = await acquireCheckoutQuoteRateLimit(user.id);
    if (!allowed) {
      return json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Vui lòng đợi vài giây rồi thử lại.",
          },
        },
        429,
        req,
      );
    }

    const pricing = await resolveCheckoutPricingForUser(admin, {
      userId: user.id,
      packageSku: package_sku,
      couponCode: coupon_code ?? null,
      referralCode: referral_code ?? null,
    });

    if (!pricing.ok) {
      return json(
        { error: { code: pricing.code, message: pricing.message } },
        422,
        req,
      );
    }

    const { breakdown, referrerProfileId } = pricing;
    return json(
      {
        quote: {
          package_sku,
          ...breakdown,
          referrer_profile_id: referrerProfileId,
        },
      },
      200,
      req,
    );
  }

  const orderCode = generateOrderCode();
  const checkoutStartedAt = Date.now();
  const expiresAtIso = payCheckoutExpiresAtIso(checkoutStartedAt);
  const expiredAtUnix = payCheckoutExpiredAtUnix(checkoutStartedAt);

  const { data: createRaw, error: createErr } = await admin.rpc(
    "create_checkout_payment_order",
    {
      p_user_id: user.id,
      p_package_sku: pkg.sku,
      p_list_amount_vnd: pkg.amountVnd,
      p_credits_to_add: pkg.creditsToAdd,
      p_subscription_months: pkg.subscriptionMonths,
      p_coupon_code: coupon_code ?? null,
      p_referral_code: referral_code ?? null,
      p_provider_order_code: String(orderCode),
      p_expires_at: expiresAtIso,
      p_raw_request: {
        orderCode,
        list_amount_vnd: pkg.amountVnd,
        description: pkg.description,
        expiredAt: expiredAtUnix,
        quoted_at: new Date().toISOString(),
      },
    },
  );

  if (createErr) {
    console.error("create_checkout_payment_order", createErr);
    return json(
      { error: { code: "DB_ERROR", message: "Could not create order." } },
      500,
      req,
    );
  }

  const created = createRaw as {
    ok?: boolean;
    code?: string;
    message?: string;
    order_id?: string;
    amount_vnd?: number;
    breakdown?: CheckoutDiscountBreakdown;
    referrer_profile_id?: string | null;
  } | null;

  if (!created?.ok || !created.order_id) {
    const code = typeof created?.code === "string" ? created.code : "DB_ERROR";
    const message =
      typeof created?.message === "string" && created.message.length
        ? created.message
        : "Không tạo được đơn thanh toán.";
    return json({ error: { code, message } }, 422, req);
  }

  const orderRow = { id: created.order_id };
  const chargeVnd = created.amount_vnd as number;
  const orderBreakdown = created.breakdown as Record<string, unknown>;
  const orderReferrerId = created.referrer_profile_id ?? null;

  await admin
    .from("payment_orders")
    .update({
      raw_request: {
        orderCode,
        amount: chargeVnd,
        list_amount_vnd: orderBreakdown.list_amount_vnd as number,
        description: pkg.description,
        expiredAt: expiredAtUnix,
        discount_breakdown: orderBreakdown,
      },
    })
    .eq("id", orderRow.id);

  const returnWithOrder = appendOrderIdToUrl(return_url, orderRow.id);

  const signature = await signPaymentRequest({
    amount: chargeVnd,
    cancelUrl: cancel_url!,
    description: pkg.description,
    orderCode,
    returnUrl: returnWithOrder,
    checksumKey: payosChecksum,
  });

  const payosBody = {
    orderCode,
    amount: chargeVnd,
    description: pkg.description,
    cancelUrl: cancel_url,
    returnUrl: returnWithOrder,
    expiredAt: expiredAtUnix,
    signature,
  };

  const payosRes = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": payosClientId,
      "x-api-key": payosApiKey,
    },
    body: JSON.stringify(payosBody),
  });

  const payosJson = await payosRes.json().catch(() => ({})) as {
    code?: string;
    desc?: string;
    data?: {
      checkoutUrl?: string;
      paymentLinkId?: string;
      qrCode?: string;
      bin?: string;
      accountNumber?: string;
      accountName?: string;
      amount?: number;
      description?: string;
      orderCode?: number;
    };
  };

  await admin
    .from("payment_orders")
    .update({
      raw_request: { request: payosBody, response: payosJson },
      checkout_url: payosJson.data?.checkoutUrl ?? null,
    })
    .eq("id", orderRow.id);

  if (
    !payosRes.ok ||
    payosJson.code !== "00" ||
    !payosJson.data ||
    typeof payosJson.data.checkoutUrl !== "string" ||
    payosJson.data.checkoutUrl.length === 0
  ) {
    console.error("PayOS error", payosRes.status, payosJson);
    await admin
      .from("payment_orders")
      .update({ status: "failed" })
      .eq("id", orderRow.id);
    return json(
      {
        error: {
          code: "PAYOS_ERROR",
          message: payosJson.desc ?? "PayOS checkout failed.",
        },
      }, 502, req);
  }

  const pdata = payosJson.data;

  const amountVnd =
    typeof pdata.amount === "number" && Number.isFinite(pdata.amount)
      ? pdata.amount
      : chargeVnd;

  const hasTransfer =
    (typeof pdata.qrCode === "string" && pdata.qrCode.length > 0) ||
    (typeof pdata.accountNumber === "string" &&
      pdata.accountNumber.length > 0);

  const transfer = hasTransfer
    ? {
      qr_code:
        typeof pdata.qrCode === "string" && pdata.qrCode.length > 0
          ? pdata.qrCode
          : null,
      bank_bin: typeof pdata.bin === "string" ? pdata.bin : null,
      account_number:
        typeof pdata.accountNumber === "string" && pdata.accountNumber.length > 0
          ? pdata.accountNumber
          : null,
      account_name:
        typeof pdata.accountName === "string" && pdata.accountName.length > 0
          ? pdata.accountName
          : null,
      amount_vnd: amountVnd,
      transfer_content:
        typeof pdata.description === "string" && pdata.description.length > 0
          ? pdata.description
          : pkg.description,
      provider_order_code: String(pdata.orderCode ?? orderCode),
    }
    : null;

  return json({
    order_id: orderRow.id,
    checkout_url: pdata.checkoutUrl,
    transfer,
    quote: {
      package_sku,
      ...orderBreakdown,
      referrer_profile_id: orderReferrerId,
    },
  }, 200, req);
});
