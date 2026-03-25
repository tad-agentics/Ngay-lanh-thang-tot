import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateOrderCode,
  isPackageSku,
  PACKAGES,
  PAYOS_API_BASE,
  signPaymentRequest,
} from "../_shared/payos.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      },
      500,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(
      { error: { code: "UNAUTHORIZED", message: "Authorization required." } },
      401,
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
    );
  }

  let body: {
    package_sku?: string;
    return_url?: string;
    cancel_url?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, 400);
  }

  const { package_sku, return_url, cancel_url } = body;
  if (!package_sku || !return_url || !cancel_url) {
    return json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "package_sku, return_url, cancel_url required.",
        },
      },
      400,
    );
  }

  if (!isPackageSku(package_sku)) {
    return json(
      {
        error: {
          code: "INVALID_SKU",
          message: `Unknown package_sku: ${package_sku}`,
        },
      },
      422,
    );
  }

  const pkg = PACKAGES[package_sku];
  const orderCode = generateOrderCode();
  const signature = await signPaymentRequest({
    amount: pkg.amountVnd,
    cancelUrl: cancel_url,
    description: pkg.description,
    orderCode,
    returnUrl: return_url,
    checksumKey: payosChecksum,
  });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: orderRow, error: insErr } = await admin
    .from("payment_orders")
    .insert({
      user_id: user.id,
      provider: "payos",
      provider_order_code: String(orderCode),
      status: "pending",
      package_sku: pkg.sku,
      credits_to_add: pkg.creditsToAdd,
      subscription_months: pkg.subscriptionMonths,
      amount_vnd: pkg.amountVnd,
      raw_request: {
        orderCode,
        amount: pkg.amountVnd,
        description: pkg.description,
      },
    })
    .select("id")
    .single();

  if (insErr || !orderRow) {
    console.error("payment_orders insert", insErr);
    return json(
      { error: { code: "DB_ERROR", message: "Could not create order." } },
      500,
    );
  }

  const payosBody = {
    orderCode,
    amount: pkg.amountVnd,
    description: pkg.description,
    cancelUrl: cancel_url,
    returnUrl: return_url,
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
    data?: { checkoutUrl?: string; paymentLinkId?: string };
  };

  await admin
    .from("payment_orders")
    .update({
      raw_request: { request: payosBody, response: payosJson },
      checkout_url: payosJson.data?.checkoutUrl ?? null,
    })
    .eq("id", orderRow.id);

  if (!payosRes.ok || payosJson.code !== "00" || !payosJson.data?.checkoutUrl) {
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
      },
      502,
    );
  }

  return json({
    order_id: orderRow.id,
    checkout_url: payosJson.data.checkoutUrl,
  });
});
