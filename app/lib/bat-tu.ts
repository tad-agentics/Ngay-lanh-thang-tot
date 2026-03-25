import type { BatTuRequest } from "~/lib/api-types";
import { supabase } from "~/lib/supabase";

type EdgeErrorBody = {
  error?: { code?: string; message?: string };
};

type OkBody<T> = { data: T };

export async function invokeBatTu<T = unknown>(
  req: BatTuRequest,
): Promise<
  | { ok: true; data: T }
  | { ok: false; code: string; message: string }
> {
  const { data, error } = await supabase.functions.invoke<OkBody<T> | EdgeErrorBody>(
    "bat-tu",
    { body: req },
  );

  if (error) {
    return {
      ok: false,
      code: "INVOKE",
      message: error.message ?? "Không gọi được máy chủ Bát Tự.",
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    (data as EdgeErrorBody).error != null
  ) {
    const e = (data as EdgeErrorBody).error!;
    return {
      ok: false,
      code: e.code ?? "BAT_TU",
      message: e.message ?? "Lỗi Bát Tự.",
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
