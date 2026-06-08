import {
  parseAnchorReading,
  parseThreadHistory,
  type ThreadTurn,
} from "./generate-reading/core/thread-history.ts";
import { stableStringify } from "./generate-reading/core/cache.ts";
import type { ChatMessage } from "./generate-reading/core/thread-history.ts";
import {
  TRA_CUU_RESULTS_FOLLOW_UP_SYSTEM,
} from "./generate-reading/prompts/tra-cuu.ts";
import {
  TRA_CUU_SESSION_KEY_MAX_LEN,
  TRA_CUU_SESSION_KEY_MIN_LEN,
} from "./tra-cuu-results-context.ts";

export function parseTraCuuSessionKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.length < TRA_CUU_SESSION_KEY_MIN_LEN || t.length > TRA_CUU_SESSION_KEY_MAX_LEN) {
    return null;
  }
  return t;
}

export function parseStoredTraCuuMessages(raw: unknown): ThreadTurn[] {
  return parseThreadHistory(raw);
}

export function appendTraCuuThreadTurns(
  history: ThreadTurn[],
  question: string,
  answer: string,
): ThreadTurn[] {
  const next = [
    ...history,
    { role: "user" as const, content: question.trim() },
    { role: "assistant" as const, content: answer.trim() },
  ];
  return next.length > 8 ? next.slice(-8) : next;
}

export function buildTraCuuResultsFollowUpMessages(
  pickContext: unknown,
  anchorIntro: string,
  threadHistory: ThreadTurn[],
  currentQuestion: string,
): ChatMessage[] {
  const contextUser = stableStringify({
    endpoint: "tra-cuu-results",
    pick_context: pickContext,
  });
  const messages: ChatMessage[] = [
    { role: "system", content: TRA_CUU_RESULTS_FOLLOW_UP_SYSTEM },
    { role: "user", content: contextUser },
  ];
  const anchor = parseAnchorReading(anchorIntro);
  if (anchor) {
    messages.push({ role: "assistant", content: anchor });
  }
  for (const turn of threadHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({
    role: "user",
    content: currentQuestion.trim().slice(0, 500),
  });
  return messages;
}

export type TraCuuIntentParse = {
  action: "answer" | "change_task" | "open_day";
  intent: string | null;
  intent_label: string | null;
  day_iso: string | null;
  refined_question: string;
};

export function parseTraCuuIntentLlmJson(raw: string | null): TraCuuIntentParse | null {
  if (!raw?.trim()) return null;
  try {
    const d = JSON.parse(raw.trim()) as Record<string, unknown>;
    const action = d.action;
    if (action !== "answer" && action !== "change_task" && action !== "open_day") {
      return null;
    }
    const refined =
      typeof d.refined_question === "string" && d.refined_question.trim()
        ? d.refined_question.trim().slice(0, 500)
        : "";
    return {
      action,
      intent: typeof d.intent === "string" ? d.intent.trim() : null,
      intent_label:
        typeof d.intent_label === "string" ? d.intent_label.trim() : null,
      day_iso:
        typeof d.day_iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.day_iso.trim())
          ? d.day_iso.trim()
          : null,
      refined_question: refined,
    };
  } catch {
    return null;
  }
}
