import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildDayDetailFollowUpMessages,
  parseThreadHistory,
} from "./thread-history.ts";

Deno.test("parseThreadHistory caps messages and trims", () => {
  const raw = Array.from({ length: 12 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `turn-${i}`,
  }));
  const out = parseThreadHistory(raw);
  assertEquals(out.length, 8);
  assertEquals(out[0]?.content, "turn-4");
  assertEquals(out[out.length - 1]?.content, "turn-11");
});

Deno.test("buildDayDetailFollowUpMessages orders context anchor history question", () => {
  const messages = buildDayDetailFollowUpMessages(
    "system",
    { date_iso: "2026-05-01" },
    "anchor text",
    [{ role: "user", content: "Q1" }, { role: "assistant", content: "A1" }],
    "Q2",
  );
  assertEquals(messages[0]?.role, "system");
  assertEquals(messages[1]?.role, "user");
  assertEquals(messages[2]?.role, "assistant");
  assertEquals(messages[2]?.content, "anchor text");
  assertEquals(messages[messages.length - 1]?.content, "Q2");
});
