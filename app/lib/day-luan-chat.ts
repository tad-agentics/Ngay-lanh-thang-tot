import { FunctionsHttpError } from "@supabase/supabase-js";

import type { LuanThreadTurn } from "~/lib/generate-reading";
import { supabase } from "~/lib/supabase";

export const DAY_LUAN_MAX_FOLLOW_UPS = 10;

type ErrorBody = {
  ok?: boolean;
  error_code?: string;
  message?: string;
  follow_up_count?: number;
  follow_up_remaining?: number;
};

function parseError(body: unknown): { code: string; message: string } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const rec = body as ErrorBody;
  if (rec.ok === false && typeof rec.error_code === "string") {
    return {
      code: rec.error_code,
      message:
        typeof rec.message === "string" && rec.message.length
          ? rec.message
          : "Không kết nối được.",
    };
  }
  return null;
}

async function invokeDayLuanChat(
  body: Record<string, unknown>,
): Promise<{ data: unknown }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  try {
    const { data, error } = await supabase.functions.invoke<unknown>(
      "day-luan-chat",
      {
        body,
        ...(session?.access_token
          ? { headers: { Authorization: `Bearer ${session.access_token}` } }
          : {}),
      },
    );
    if (error) {
      if (error instanceof FunctionsHttpError) {
        try {
          const errBody = await error.context.json();
          return { data: errBody };
        } catch {
          return { data: null };
        }
      }
      return { data: null };
    }
    return { data };
  } catch {
    return { data: null };
  }
}

export type DayLuanChatOpenInput = {
  day_iso: string;
  birth_revision: string;
  luan_context_raw: unknown;
  anchor_reading?: string;
};

export type DayLuanChatOpenResult =
  | {
      ok: true;
      thread_id: string;
      follow_up_count: number;
      follow_up_remaining: number;
      messages: LuanThreadTurn[];
    }
  | { ok: false; code: string; message: string };

/** Fire-and-forget: bấm CTA đỏ "Hỏi tiếp về ngày này" trên lịch / chi tiết ngày. */
export function trackDayLuanFollowUpCtaClick(): void {
  void invokeDayLuanChat({ action: "cta_click" });
}

export type DayLuanDailyQuotaResult =
  | { ok: true; follow_up_count: number; follow_up_remaining: number }
  | { ok: false; code: string; message: string };

/** Shared pool 10/user/VN-day — no thread open required. */
export async function invokeDayLuanDailyQuota(): Promise<DayLuanDailyQuotaResult> {
  const { data } = await invokeDayLuanChat({ action: "quota" });

  const err = parseError(data);
  if (err) return { ok: false, code: err.code, message: err.message };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, code: "NETWORK", message: "Không kết nối được." };
  }

  const d = data as Record<string, unknown>;
  if (d.ok !== true) {
    return { ok: false, code: "BAD_RESPONSE", message: "Không đọc được quota." };
  }

  const count =
    typeof d.follow_up_count === "number" && Number.isFinite(d.follow_up_count)
      ? d.follow_up_count
      : 0;
  const remaining =
    typeof d.follow_up_remaining === "number" &&
    Number.isFinite(d.follow_up_remaining)
      ? d.follow_up_remaining
      : Math.max(0, DAY_LUAN_MAX_FOLLOW_UPS - count);

  return { ok: true, follow_up_count: count, follow_up_remaining: remaining };
}

export async function invokeDayLuanChatOpen(
  input: DayLuanChatOpenInput,
): Promise<DayLuanChatOpenResult> {
  const { data } = await invokeDayLuanChat({
    action: "open",
    day_iso: input.day_iso,
    birth_revision: input.birth_revision,
    luan_context_raw: input.luan_context_raw,
    ...(input.anchor_reading ? { anchor_reading: input.anchor_reading } : {}),
  });

  const err = parseError(data);
  if (err) return { ok: false, code: err.code, message: err.message };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      ok: false,
      code: "NETWORK",
      message: "Không kết nối được. Thử lại ›",
    };
  }

  const d = data as Record<string, unknown>;
  if (d.ok !== true || typeof d.thread_id !== "string") {
    return {
      ok: false,
      code: "BAD_RESPONSE",
      message: "Không mở được hội thoại.",
    };
  }

  const messages: LuanThreadTurn[] = [];
  if (Array.isArray(d.messages)) {
    for (const row of d.messages) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const r = row as Record<string, unknown>;
      if (r.role !== "user" && r.role !== "assistant") continue;
      if (typeof r.content !== "string" || !r.content.trim()) continue;
      messages.push({ role: r.role, content: r.content.trim() });
    }
  }

  const count =
    typeof d.follow_up_count === "number" && Number.isFinite(d.follow_up_count)
      ? d.follow_up_count
      : 0;
  const remaining =
    typeof d.follow_up_remaining === "number" &&
    Number.isFinite(d.follow_up_remaining)
      ? d.follow_up_remaining
      : Math.max(0, DAY_LUAN_MAX_FOLLOW_UPS - count);

  return {
    ok: true,
    thread_id: d.thread_id,
    follow_up_count: count,
    follow_up_remaining: remaining,
    messages,
  };
}

export type DayLuanChatAskInput = {
  thread_id: string;
  question: string;
  /** Client turn id — safe retry without duplicate LLM (8–64 chars). */
  idempotency_key: string;
};

export type DayLuanChatAskResult =
  | {
      ok: true;
      answer: string;
      follow_up_count: number;
      follow_up_remaining: number;
    }
  | { ok: false; code: string; message: string };

export async function invokeDayLuanChatAsk(
  input: DayLuanChatAskInput,
): Promise<DayLuanChatAskResult> {
  const key = input.idempotency_key.trim();
  if (key.length < 8) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      message: "Thiếu mã idempotency.",
    };
  }

  const { data } = await invokeDayLuanChat({
    action: "ask",
    thread_id: input.thread_id,
    question: input.question.trim(),
    idempotency_key: key,
  });

  const err = parseError(data);
  if (err) return { ok: false, code: err.code, message: err.message };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      ok: false,
      code: "NETWORK",
      message: "Không kết nối được. Thử lại ›",
    };
  }

  const d = data as Record<string, unknown>;
  if (d.ok !== true || typeof d.answer !== "string" || !d.answer.trim()) {
    return {
      ok: false,
      code: "BAD_RESPONSE",
      message: "Chưa nhận được câu trả lời.",
    };
  }

  const count =
    typeof d.follow_up_count === "number" && Number.isFinite(d.follow_up_count)
      ? d.follow_up_count
      : 0;
  const remaining =
    typeof d.follow_up_remaining === "number" &&
    Number.isFinite(d.follow_up_remaining)
      ? d.follow_up_remaining
      : Math.max(0, DAY_LUAN_MAX_FOLLOW_UPS - count);

  return {
    ok: true,
    answer: d.answer.trim(),
    follow_up_count: count,
    follow_up_remaining: remaining,
  };
}
