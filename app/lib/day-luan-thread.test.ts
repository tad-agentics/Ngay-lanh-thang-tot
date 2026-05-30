import { describe, expect, it } from "vitest";

import {
  appendThreadTurns,
  findCachedAnswerInMessages,
  followUpRemaining,
  MAX_DAY_LUAN_FOLLOW_UPS,
  mergeAnchorReading,
  parseIdempotencyKey,
  parseThreadUuid,
} from "../../supabase/functions/_shared/day-luan-thread";

describe("day-luan-thread", () => {
  it("caps stored messages at 8 entries", () => {
    let history = appendThreadTurns([], "q1", "a1");
    for (let i = 2; i <= 6; i++) {
      history = appendThreadTurns(history, `q${i}`, `a${i}`);
    }
    expect(history).toHaveLength(8);
    expect(history[0]?.content).toBe("q3");
  });

  it("computes follow-up remaining", () => {
    expect(followUpRemaining(0)).toBe(MAX_DAY_LUAN_FOLLOW_UPS);
    expect(followUpRemaining(10)).toBe(0);
  });

  it("keeps longer anchor reading", () => {
    expect(mergeAnchorReading("short", "much longer anchor")).toBe(
      "much longer anchor",
    );
    expect(mergeAnchorReading("already long enough", "tiny")).toBe(
      "already long enough",
    );
  });

  it("parses UUID thread ids", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(parseThreadUuid(id)).toBe(id);
    expect(parseThreadUuid("not-a-uuid")).toBeNull();
  });

  it("parses idempotency keys", () => {
    expect(parseIdempotencyKey("1730000000123")).toBe("1730000000123");
    expect(parseIdempotencyKey("ab")).toBeNull();
  });

  it("finds cached answer in message history", () => {
    const messages = [
      { role: "user" as const, content: "Hỏi 1" },
      { role: "assistant" as const, content: "Trả lời 1" },
      { role: "user" as const, content: "Hỏi 2" },
      { role: "assistant" as const, content: "Trả lời 2" },
    ];
    expect(findCachedAnswerInMessages(messages, "Hỏi 2")).toBe("Trả lời 2");
    expect(findCachedAnswerInMessages(messages, "Khác")).toBeNull();
  });
});
