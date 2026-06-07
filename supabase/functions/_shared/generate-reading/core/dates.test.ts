import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import { dayIsoFromDayDetailData } from "./dates.ts";

Deno.test("dayIsoFromDayDetailData reads top-level date", () => {
  assertEquals(
    dayIsoFromDayDetailData({ date: "2026-06-07", score: 38 }),
    "2026-06-07",
  );
});

Deno.test("dayIsoFromDayDetailData reads luan-context date_iso", () => {
  assertEquals(
    dayIsoFromDayDetailData({
      date_iso: "2026-06-07",
      breakdown_summary: [],
    }),
    "2026-06-07",
  );
});

Deno.test("dayIsoFromDayDetailData reads nested bat-tu envelope", () => {
  assertEquals(
    dayIsoFromDayDetailData({
      status: "success",
      data: { date: "2026-06-07", score: 38 },
    }),
    "2026-06-07",
  );
});

Deno.test("dayIsoFromDayDetailData returns null when iso missing", () => {
  assertEquals(dayIsoFromDayDetailData({ score: 38 }), null);
});
