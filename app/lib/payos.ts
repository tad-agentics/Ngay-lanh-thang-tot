import { FunctionsHttpError } from "@supabase/supabase-js";

import type {
  CreatePayosCheckoutRequest,
  CreatePayosCheckoutResponse,
} from "~/lib/api-types";
import { supabase } from "~/lib/supabase";

type EdgeErrorBody = {
  error?: { code?: string; message?: string };
};

export async function createPayosCheckout(
  req: CreatePayosCheckoutRequest,
): Promise<
  | { ok: true; data: CreatePayosCheckoutResponse }
  | { ok: false; code: string; message: string }
> {
  const { data, error } = await supabase.functions.invoke<
    CreatePayosCheckoutResponse | EdgeErrorBody
  >("payos-create-checkout", { body: req });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as unknown;
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          (body as EdgeErrorBody).error != null
        ) {
          const e = (body as EdgeErrorBody).error!;
          return {
            ok: false,
            code: typeof e.code === "string" ? e.code : "PAYOS",
            message:
              typeof e.message === "string" && e.message.length
                ? e.message
                : (error.message ??
                  "Không mở được cổng thanh toán lúc này."),
          };
        }
      } catch {
        // ignore parse errors
      }
    }
    return {
      ok: false,
      code: "INVOKE",
      message: error.message ?? "Không mở được cổng thanh toán lúc này.",
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
      return {
        ok: true,
        data: {
          order_id: d.order_id,
          checkout_url: d.checkout_url,
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
