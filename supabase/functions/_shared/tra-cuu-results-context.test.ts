import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  buildTraCuuSessionKey,
  parseTraCuuResultsPickMeta,
  validateTraCuuResultsPickMeta,
} from "./tra-cuu-results-context.ts";

const validMeta = {
  intent: "DAM_CUOI",
  intent_label: "Đám cưới",
  range_start: "2026-06-01",
  range_end: "2026-06-30",
};

Deno.test("buildTraCuuSessionKey matches DB length for real picks", () => {
  const key = buildTraCuuSessionKey(validMeta);
  assertEquals(key, "DAM_CUOI:2026-06-01:2026-06-30");
  assertEquals(validateTraCuuResultsPickMeta(validMeta), null);
});

Deno.test("parseTraCuuResultsPickMeta rejects short non-ISO ranges", () => {
  assertEquals(
    parseTraCuuResultsPickMeta({
      intent: "x",
      intent_label: "Việc",
      range_start: "a",
      range_end: "b",
    }),
    null,
  );
});

Deno.test("parseTraCuuResultsPickMeta accepts 1-char intent with ISO dates", () => {
  const meta = parseTraCuuResultsPickMeta({
    intent: "x",
    intent_label: "Việc",
    range_start: "2026-06-01",
    range_end: "2026-06-02",
  });
  assertEquals(meta?.intent, "x");
  assertEquals(buildTraCuuSessionKey(meta!).length >= 8, true);
});

Deno.test("validateTraCuuResultsPickMeta rejects overlong session keys", () => {
  const err = validateTraCuuResultsPickMeta({
    intent: "x".repeat(120),
    intent_label: "Việc",
    range_start: "2026-06-01",
    range_end: "2026-06-02",
  });
  assertEquals(err, "session_key không hợp lệ.");
});
