import { FunctionsHttpError } from "@supabase/supabase-js";

import type { TuTruIntent } from "~/lib/api-types";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import type { LuanThreadTurn } from "~/lib/generate-reading";
import { supabase } from "~/lib/supabase";

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

async function invokeTraCuuResultsChat(
  body: Record<string, unknown>,
): Promise<{ data: unknown }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  try {
    const { data, error } = await supabase.functions.invoke<unknown>(
      "tra-cuu-results-chat",
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

export type TraCuuResultsChatOpenInput = {
  state: ChonNgayKetQuaState;
  birth_revision: string;
  anchor_intro?: string | null;
};

export type TraCuuResultsChatOpenResult =
  | {
      ok: true;
      thread_id: string;
      messages: LuanThreadTurn[];
      follow_up_remaining: number;
    }
  | { ok: false; code: string; message: string };

export async function invokeTraCuuResultsChatOpen(
  input: TraCuuResultsChatOpenInput,
): Promise<TraCuuResultsChatOpenResult> {
  const { state, birth_revision, anchor_intro } = input;
  const { data } = await invokeTraCuuResultsChat({
    action: "open",
    intent: state.intent,
    intent_label: state.intentLabel,
    range_start: state.rangeStart,
    range_end: state.rangeEnd,
    chon_ngay_payload: state.payload,
    birth_revision,
    ...(anchor_intro ? { anchor_intro } : {}),
  });

  const err = parseError(data);
  if (err) return { ok: false, code: err.code, message: err.message };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, code: "NETWORK", message: "Không kết nối được." };
  }

  const d = data as Record<string, unknown>;
  if (d.ok !== true || typeof d.thread_id !== "string") {
    return { ok: false, code: "BAD_RESPONSE", message: "Không mở được hội thoại." };
  }

  const messages = parseMessages(d.messages);
  const remaining =
    typeof d.follow_up_remaining === "number" ? d.follow_up_remaining : 10;

  return {
    ok: true,
    thread_id: d.thread_id,
    messages,
    follow_up_remaining: remaining,
  };
}

export type TraCuuResultsClientAction =
  | { type: "answer"; answer: string }
  | { type: "change_task"; intent: TuTruIntent; intentLabel: string }
  | { type: "open_day"; dayIso: string };

export type TraCuuResultsChatAskInput = {
  thread_id: string;
  question: string;
  idempotency_key: string;
};

export type TraCuuResultsChatAskResult =
  | ({
      ok: true;
      follow_up_remaining: number;
    } & TraCuuResultsClientAction)
  | { ok: false; code: string; message: string };

export async function invokeTraCuuResultsChatAsk(
  input: TraCuuResultsChatAskInput,
): Promise<TraCuuResultsChatAskResult> {
  const key = input.idempotency_key.trim();
  if (key.length < 8) {
    return { ok: false, code: "BAD_REQUEST", message: "Thiếu mã idempotency." };
  }

  const { data } = await invokeTraCuuResultsChat({
    action: "ask",
    thread_id: input.thread_id,
    question: input.question.trim(),
    idempotency_key: key,
  });

  const err = parseError(data);
  if (err) return { ok: false, code: err.code, message: err.message };

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, code: "NETWORK", message: "Không kết nối được." };
  }

  const d = data as Record<string, unknown>;
  if (d.ok !== true) {
    return { ok: false, code: "BAD_RESPONSE", message: "Chưa nhận được phản hồi." };
  }

  const remaining =
    typeof d.follow_up_remaining === "number" ? d.follow_up_remaining : 0;
  const clientAction = d.client_action;

  if (clientAction === "change_task" && typeof d.intent === "string") {
    return {
      ok: true,
      type: "change_task",
      intent: d.intent as TuTruIntent,
      intentLabel:
        typeof d.intent_label === "string" ? d.intent_label : d.intent,
      follow_up_remaining: remaining,
    };
  }

  if (clientAction === "open_day" && typeof d.day_iso === "string") {
    return {
      ok: true,
      type: "open_day",
      dayIso: d.day_iso,
      follow_up_remaining: remaining,
    };
  }

  if (typeof d.answer === "string" && d.answer.trim()) {
    return {
      ok: true,
      type: "answer",
      answer: d.answer.trim(),
      follow_up_remaining: remaining,
    };
  }

  return { ok: false, code: "BAD_RESPONSE", message: "Chưa nhận được câu trả lời." };
}

function parseMessages(raw: unknown): LuanThreadTurn[] {
  const out: LuanThreadTurn[] = [];
  if (!Array.isArray(raw)) return out;
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    if (r.role !== "user" && r.role !== "assistant") continue;
    if (typeof r.content !== "string" || !r.content.trim()) continue;
    out.push({ role: r.role, content: r.content.trim() });
  }
  return out;
}
