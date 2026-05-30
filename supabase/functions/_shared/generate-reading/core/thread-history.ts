import { stableStringify } from "./cache.ts";

export type ThreadTurn = { role: "user" | "assistant"; content: string };

/** FE-HANDOFF: max last 4 Q/A pairs = 8 messages. */
export const MAX_THREAD_MESSAGES = 8;
const MAX_THREAD_CONTENT_CHARS = 4_000;
const MAX_ANCHOR_READING_CHARS = 12_000;

export function parseThreadHistory(raw: unknown): ThreadTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ThreadTurn[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const role =
      r.role === "user" || r.role === "assistant" ? r.role : null;
    const content =
      typeof r.content === "string"
        ? r.content.trim().slice(0, MAX_THREAD_CONTENT_CHARS)
        : "";
    if (!role || !content) continue;
    out.push({ role, content });
  }
  return out.length > MAX_THREAD_MESSAGES
    ? out.slice(-MAX_THREAD_MESSAGES)
    : out;
}

export function parseAnchorReading(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, MAX_ANCHOR_READING_CHARS);
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Multi-turn day follow-up: static context → anchor → prior Q/A → current question. */
export function buildDayDetailFollowUpMessages(
  system: string,
  luanContext: unknown,
  anchorReading: string,
  threadHistory: ThreadTurn[],
  currentQuestion: string,
): ChatMessage[] {
  const contextUser = stableStringify({
    endpoint: "day-detail",
    luan_context: luanContext,
  });
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: contextUser },
  ];
  const anchor = anchorReading.trim();
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
