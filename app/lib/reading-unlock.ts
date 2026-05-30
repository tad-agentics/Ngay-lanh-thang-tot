import { FunctionsHttpError } from "@supabase/supabase-js";

import { isSubExpiredCode, notifySubExpired } from "~/lib/sub-expired";
import { supabase } from "~/lib/supabase";

export type ReadingUnlockScope = "home" | "day_detail";

export type ReadingUnlockOk = {
  ok: true;
  charged: boolean;
  already_unlocked: boolean;
  subscription_free?: boolean;
  /** Server: true when unlock is valid (subscription or prior ledger). */
  unlocked?: boolean;
};

export type ReadingUnlockErr = {
  ok: false;
  error_code: string;
  message: string;
};

export type ReadingUnlockResult = ReadingUnlockOk | ReadingUnlockErr;

/** True when user may call `generate-reading` for this scope/day. */
export function isReadingUnlockGranted(result: ReadingUnlockOk): boolean {
  return (
    result.unlocked === true ||
    result.already_unlocked === true ||
    result.subscription_free === true
  );
}

/** Idempotent unlock for inline/full day luận (active subscription required). */
export async function ensureReadingUnlocked(params: {
  scope: ReadingUnlockScope;
  day_iso: string;
}): Promise<ReadingUnlockResult> {
  return invokeReadingUnlock(params);
}

export async function invokeReadingUnlock(params: {
  scope: ReadingUnlockScope;
  day_iso: string;
}): Promise<ReadingUnlockResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return {
      ok: false,
      error_code: "UNAUTHORIZED",
      message: "Cần đăng nhập để mở khóa.",
    };
  }

  try {
    const { scope, day_iso } = params;
    const { data, error } = await supabase.functions.invoke<unknown>(
      "reading-unlock",
      {
        body: { scope, day_iso },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      if (d.ok === true) {
        return {
          ok: true,
          charged: Boolean(d.charged),
          already_unlocked: Boolean(d.already_unlocked),
          subscription_free: Boolean(d.subscription_free),
          unlocked:
            typeof d.unlocked === "boolean"
              ? d.unlocked
              : Boolean(d.already_unlocked) ||
                Boolean(d.subscription_free) ||
                Boolean(d.charged),
        };
      }
      if (d.ok === false) {
        const error_code = String(d.error_code ?? "UNKNOWN");
        if (isSubExpiredCode(error_code)) notifySubExpired();
        return {
          ok: false,
          error_code,
          message: String(d.message ?? "Không mở khóa được."),
        };
      }
    }

    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as Record<string, unknown>;
          if (body && body.ok === false) {
            const error_code = String(body.error_code ?? "ERROR");
            if (isSubExpiredCode(error_code)) notifySubExpired();
            return {
              ok: false,
              error_code,
              message: String(body.message ?? error.message),
            };
          }
        } catch {
          /* fall through */
        }
      }
      return {
        ok: false,
        error_code: "INVOKE_ERROR",
        message: error.message ?? "Gọi máy chủ thất bại.",
      };
    }

    return {
      ok: false,
      error_code: "BAD_RESPONSE",
      message: "Phản hồi không hợp lệ.",
    };
  } catch (e) {
    return {
      ok: false,
      error_code: "CLIENT_ERROR",
      message: e instanceof Error ? e.message : "Lỗi không xác định.",
    };
  }
}
