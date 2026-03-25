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
    return {
      ok: false,
      code: "INVOKE",
      message: error.message ?? "Không gọi được máy chủ thanh toán.",
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

  if (
    data &&
    typeof data === "object" &&
    "checkout_url" in data &&
    "order_id" in data &&
    typeof (data as CreatePayosCheckoutResponse).checkout_url === "string"
  ) {
    return { ok: true, data: data as CreatePayosCheckoutResponse };
  }

  return {
    ok: false,
    code: "UNKNOWN",
    message: "Phản hồi thanh toán không hợp lệ.",
  };
}
