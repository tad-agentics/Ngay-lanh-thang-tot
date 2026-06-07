import { buildDayLuanPromptContext } from "./day-luan-prompt-context.ts";
import { todayIsoVietnam } from "./generate-reading/core/dates.ts";
import { isLuanContextPayload } from "./luan-context.ts";
import {
  parseAnchorReading,
  parseThreadHistory,
  type ThreadTurn,
} from "./generate-reading/core/thread-history.ts";

/** Max follow-up Q/A turns per user per day (server-enforced). */
export const MAX_DAY_LUAN_FOLLOW_UPS = 10;

export const DAY_LUAN_FOLLOW_UP_TODAY_ONLY_MESSAGE =
  "Hỏi thêm chỉ dùng cho hôm nay (giờ Việt Nam). Ngày này chỉ xem luận giải.";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IDEMPOTENCY_KEY_RE = /^[\w-]{8,64}$/;

export function parseDayIso(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return ISO_DAY.test(t) ? t : null;
}

export function parseBirthRevision(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, 256);
}

export function parseThreadUuid(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return UUID_RE.test(t) ? t : null;
}

export function parseIdempotencyKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().slice(0, 64);
  if (!IDEMPOTENCY_KEY_RE.test(t)) return null;
  return t;
}

/** Last user+assistant pair in stored messages matching question (post-LLM recovery). */
export function findCachedAnswerInMessages(
  messages: ThreadTurn[],
  question: string,
): string | null {
  const q = question.trim();
  if (!q) return null;
  for (let i = messages.length - 2; i >= 0; i -= 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    if (user?.role === "user" && user.content.trim() === q &&
      assistant?.role === "assistant" && assistant.content.trim()) {
      return assistant.content.trim();
    }
  }
  return null;
}

export function freezeLuanContext(raw: unknown): Record<string, unknown> {
  if (isLuanContextPayload(raw)) {
    return raw as Record<string, unknown>;
  }
  return buildDayLuanPromptContext(raw) as unknown as Record<string, unknown>;
}

export function followUpRemaining(count: number): number {
  return Math.max(0, MAX_DAY_LUAN_FOLLOW_UPS - Math.max(0, count));
}

/** @deprecated Today-only gate removed — kept for compare-with-tomorrow UX on Lịch. */
export function dayLuanFollowUpAllowed(dayIso: string): boolean {
  const d = parseDayIso(dayIso);
  if (!d) return false;
  return d === todayIsoVietnam();
}

export function parseStoredMessages(raw: unknown): ThreadTurn[] {
  return parseThreadHistory(raw);
}

export function appendThreadTurns(
  existing: ThreadTurn[],
  question: string,
  answer: string,
): ThreadTurn[] {
  const q = question.trim().slice(0, 500);
  const a = answer.trim();
  if (!q || !a) return existing;
  return parseThreadHistory([
    ...existing,
    { role: "user", content: q },
    { role: "assistant", content: a },
  ]);
}

export function mergeAnchorReading(
  current: string,
  incoming: unknown,
): string {
  const next = parseAnchorReading(incoming);
  if (!next) return current;
  if (!current.trim()) return next;
  return next.length >= current.length ? next : current;
}
