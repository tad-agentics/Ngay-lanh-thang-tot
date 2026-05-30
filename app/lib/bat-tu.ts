import { FunctionsHttpError } from "@supabase/supabase-js";

import type { BatTuRequest } from "~/lib/api-types";
import { isSubExpiredCode, notifySubExpired } from "~/lib/sub-expired";
import { supabase } from "~/lib/supabase";

type EdgeErrorInner = {
  code?: string;
  message?: string;
  /** Unix giây — Bát Tự trả khi RATE_LIMITED (Edge forward từ upstream). */
  reset_at?: number;
};

type EdgeErrorBody = {
  error?: EdgeErrorInner;
};

type OkBody<T> = { data: T };

export async function invokeBatTu<T = unknown>(
  req: BatTuRequest,
): Promise<
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; reset_at?: number }
> {
  const { data, error } = await supabase.functions.invoke<OkBody<T> | EdgeErrorBody>(
    "bat-tu",
    { body: req },
  );

  if (error) {
    if (error instanceof FunctionsHttpError) {
      let raw = "";
      try {
        raw = await error.context.text();
      } catch {
        // ignore read errors
      }
      if (raw) {
        try {
          const body = JSON.parse(raw) as unknown;
          if (
            body &&
            typeof body === "object" &&
            "error" in body &&
            (body as EdgeErrorBody).error != null
          ) {
            const e = (body as EdgeErrorBody).error!;
            const resetAt =
              typeof e.reset_at === "number" && Number.isFinite(e.reset_at)
                ? e.reset_at
                : undefined;
            const code = typeof e.code === "string" ? e.code : "BAT_TU";
            if (isSubExpiredCode(code)) notifySubExpired();
            return {
              ok: false,
              code,
              message:
                typeof e.message === "string" && e.message.length
                  ? e.message
                  : (error.message ??
                    "Edge Function trả lỗi (không có chi tiết)."),
              ...(resetAt != null ? { reset_at: resetAt } : {}),
            };
          }
        } catch {
          // not JSON — fall through
        }
      }
    }
    return {
      ok: false,
      code: "INVOKE",
      message: error.message ?? "Không kết nối được dịch vụ Bát Tự lúc này.",
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    (data as EdgeErrorBody).error != null
  ) {
    const e = (data as EdgeErrorBody).error!;
    const resetAt =
      typeof e.reset_at === "number" && Number.isFinite(e.reset_at)
        ? e.reset_at
        : undefined;
    const code = e.code ?? "BAT_TU";
    if (isSubExpiredCode(code)) notifySubExpired();
    return {
      ok: false,
      code,
      message: e.message ?? "Lỗi Bát Tự.",
      ...(resetAt != null ? { reset_at: resetAt } : {}),
    };
  }

  if (data && typeof data === "object" && "data" in data) {
    return { ok: true, data: (data as OkBody<T>).data };
  }

  return {
    ok: false,
    code: "UNKNOWN",
    message: "Phản hồi Bát Tự không hợp lệ.",
  };
}
