import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "~/lib/supabase";

export type PinReadingResult =
  | { ok: true; pinned: boolean }
  | { ok: false; code: string; message: string };

export async function invokePin(params: {
  action: "pin" | "unpin";
  scope: string;
  day_iso: string;
  section?: string;
  reading_snapshot?: string | null;
}): Promise<PinReadingResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Cần đăng nhập để ghim luận giải.",
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke<unknown>(
      "pin-reading",
      {
        body: {
          action: params.action,
          scope: params.scope,
          day_iso: params.day_iso,
          section: params.section ?? "all",
          ...(params.reading_snapshot != null
            ? { reading_snapshot: params.reading_snapshot }
            : {}),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as Record<string, unknown>;
          return {
            ok: false,
            code: String(body.error_code ?? body.code ?? "PIN_ERROR"),
            message: String(body.message ?? error.message),
          };
        } catch {
          // ignore parse errors
        }
      }
      return {
        ok: false,
        code: "INVOKE_ERROR",
        message: error.message ?? "Không thể ghim lúc này.",
      };
    }

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      if (d.ok === true) {
        return { ok: true, pinned: Boolean(d.pinned) };
      }
      if (d.ok === false) {
        return {
          ok: false,
          code: String(d.error_code ?? "PIN_ERROR"),
          message: String(d.message ?? "Ghim thất bại."),
        };
      }
    }

    return { ok: false, code: "BAD_RESPONSE", message: "Phản hồi không hợp lệ." };
  } catch (e) {
    return {
      ok: false,
      code: "CLIENT_ERROR",
      message: e instanceof Error ? e.message : "Lỗi không xác định.",
    };
  }
}

/** Check if a reading is pinned for the given scope + day from the local DB (RLS SELECT). */
export async function fetchIsPinned(params: {
  scope: string;
  day_iso: string;
  section?: string;
}): Promise<boolean> {
  const { data } = await supabase
    .from("pinned_readings")
    .select("id")
    .eq("scope", params.scope)
    .eq("day_iso", params.day_iso)
    .eq("section", params.section ?? "all")
    .maybeSingle();
  return data != null;
}
