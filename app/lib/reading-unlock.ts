import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "~/lib/supabase";

export type ReadingUnlockScope = "home" | "day_detail";

export type ReadingUnlockOk = {
  ok: true;
  credits_balance: number;
  charged: boolean;
  already_unlocked: boolean;
  subscription_free?: boolean;
  /** Server: true when unlock is valid (paid, subscription, free cost, or ledger). */
  unlocked?: boolean;
  dry_run?: boolean;
};

export type ReadingUnlockErr = {
  ok: false;
  error_code: string;
  message: string;
  credits_balance?: number;
};

export type ReadingUnlockResult = ReadingUnlockOk | ReadingUnlockErr;

export async function invokeReadingUnlock(params: {
  scope: ReadingUnlockScope;
  day_iso: string;
  /** Chỉ kiểm tra đã mở khóa (ledger / gói / giá 0) — không trừ lượng. */
  dry_run?: boolean;
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
    const { scope, day_iso, dry_run } = params;
    const { data, error } = await supabase.functions.invoke<unknown>(
      "reading-unlock",
      {
        body: { scope, day_iso, ...(dry_run ? { dry_run: true } : {}) },
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
          credits_balance: Number(d.credits_balance) || 0,
          charged: Boolean(d.charged),
          already_unlocked: Boolean(d.already_unlocked),
          subscription_free: Boolean(d.subscription_free),
          unlocked:
            typeof d.unlocked === "boolean"
              ? d.unlocked
              : Boolean(d.already_unlocked) ||
                Boolean(d.subscription_free) ||
                Boolean(d.charged),
          dry_run: Boolean(d.dry_run),
        };
      }
      if (d.ok === false) {
        return {
          ok: false,
          error_code: String(d.error_code ?? "UNKNOWN"),
          message: String(d.message ?? "Không mở khóa được."),
          credits_balance:
            typeof d.credits_balance === "number"
              ? d.credits_balance
              : undefined,
        };
      }
    }

    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as Record<string, unknown>;
          if (body && body.ok === false) {
            return {
              ok: false,
              error_code: String(body.error_code ?? "ERROR"),
              message: String(body.message ?? error.message),
              credits_balance:
                typeof body.credits_balance === "number"
                  ? body.credits_balance
                  : undefined,
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
