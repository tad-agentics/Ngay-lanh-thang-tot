import { FunctionsHttpError } from "@supabase/supabase-js";

import type {
  CreatePayosCheckoutRequest,
  CreatePayosCheckoutResponse,
  PayosTransferDetails,
} from "~/lib/api-types";
import { supabase } from "~/lib/supabase";
import { getAccessTokenForEdgeInvoke } from "~/lib/supabase-edge-auth";

type EdgeErrorBody = {
  error?: { code?: string; message?: string };
};

async function parseFunctionsHttpError(
  error: FunctionsHttpError,
): Promise<{ code: string; message: string }> {
  const fallback =
    error.message ?? "Edge Function trả lỗi (không có chi tiết).";
  const res = error.context;
  if (!res || typeof res.text !== "function") {
    return { code: "INVOKE", message: fallback };
  }
  let text = "";
  try {
    text = await res.text();
  } catch {
    return { code: "INVOKE", message: fallback };
  }
  if (text) {
    try {
      const body = JSON.parse(text) as unknown;
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        (body as EdgeErrorBody).error != null
      ) {
        const e = (body as EdgeErrorBody).error!;
        const code = typeof e.code === "string" ? e.code : "EDGE";
        const msg =
          typeof e.message === "string" && e.message.length ? e.message : fallback;
        return { code, message: withPayosHint(code, msg) };
      }
    } catch {
      const short = text.length > 400 ? `${text.slice(0, 400)}…` : text;
      return { code: "INVOKE", message: short || fallback };
    }
  }
  return { code: "INVOKE", message: fallback };
}

function withPayosHint(code: string, message: string): string {
  if (code === "SERVER_CONFIG") {
    return `${message} Trên Supabase: Project Settings → Edge Functions → Secrets — cần PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY (và thường có SUPABASE_SERVICE_ROLE_KEY). Sau đó deploy lại function payos-create-checkout.`;
  }
  if (code === "UNAUTHORIZED") {
    return `${message} Thử đăng xuất và đăng nhập lại.`;
  }
  if (code === "PAYOS_ERROR" || code === "DB_ERROR") {
    return message;
  }
  return message;
}

export async function createPayosCheckout(
  req: CreatePayosCheckoutRequest,
): Promise<
  | { ok: true; data: CreatePayosCheckoutResponse }
  | { ok: false; code: string; message: string }
> {
  let accessToken = await getAccessTokenForEdgeInvoke();
  if (!accessToken) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: withPayosHint(
        "UNAUTHORIZED",
        "Chưa có phiên đăng nhập hợp lệ.",
      ),
    };
  }

  let data: CreatePayosCheckoutResponse | EdgeErrorBody | null = null;
  let error: unknown = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await supabase.functions.invoke<
      CreatePayosCheckoutResponse | EdgeErrorBody
    >("payos-create-checkout", {
      body: req,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    data = out.data;
    error = out.error;

    if (!error) break;

    if (error instanceof FunctionsHttpError) {
      const parsed = await parseFunctionsHttpError(error);
      if (parsed.code === "UNAUTHORIZED" && attempt === 0) {
        const { data: ref, error: refErr } =
          await supabase.auth.refreshSession();
        if (!refErr && ref.session?.access_token) {
          accessToken = ref.session.access_token;
          continue;
        }
      }
      return { ok: false, code: parsed.code, message: parsed.message };
    }

    return {
      ok: false,
      code: "INVOKE",
      message:
        error instanceof Error
          ? error.message
          : "Không mở được cổng thanh toán lúc này.",
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error != null
  ) {
    const e = data.error;
    return {
      ok: false,
      code: e.code ?? "PAYMENT_ERROR",
      message: e.message ?? "Thanh toán thất bại.",
    };
  }

  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (
      typeof d.checkout_url === "string" &&
      typeof d.order_id === "string" &&
      d.checkout_url.length > 0 &&
      d.order_id.length > 0
    ) {
      let transfer: PayosTransferDetails | null = null;
      const tr = d.transfer;
      if (tr && typeof tr === "object" && tr !== null) {
        const t = tr as Record<string, unknown>;
        transfer = {
          qr_code: typeof t.qr_code === "string" ? t.qr_code : null,
          bank_bin: typeof t.bank_bin === "string" ? t.bank_bin : null,
          account_number:
            typeof t.account_number === "string" ? t.account_number : null,
          account_name:
            typeof t.account_name === "string" ? t.account_name : null,
          amount_vnd:
            typeof t.amount_vnd === "number" && Number.isFinite(t.amount_vnd)
              ? t.amount_vnd
              : 0,
          transfer_content:
            typeof t.transfer_content === "string"
              ? t.transfer_content
              : "",
          provider_order_code:
            typeof t.provider_order_code === "string"
              ? t.provider_order_code
              : "",
        };
      }
      return {
        ok: true,
        data: {
          order_id: d.order_id,
          checkout_url: d.checkout_url,
          transfer,
        },
      };
    }
  }

  return {
    ok: false,
    code: "UNKNOWN",
    message: "Phản hồi thanh toán không hợp lệ.",
  };
}
