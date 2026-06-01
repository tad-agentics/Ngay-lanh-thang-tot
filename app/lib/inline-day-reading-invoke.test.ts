import { describe, expect, it } from "vitest";

import { buildInlineDayReadingInvoke } from "~/lib/inline-day-reading-invoke";

describe("buildInlineDayReadingInvoke", () => {
  it("uses day-detail teaser when payload is luan_context (never-sub home)", () => {
    const data = {
      date_iso: "2026-06-01",
      breakdown_summary: [{ source: "Trực", reason_vi: "—" }],
    };
    expect(buildInlineDayReadingInvoke("ngay-hom-nay", data, "teaser")).toEqual({
      endpoint: "day-detail",
      data,
      variant: "teaser",
    });
  });

  it("uses day-detail inline when payload is luan_context (subscriber home)", () => {
    const data = {
      date_iso: "2026-06-01",
      breakdown_summary: [{ source: "Trực", reason_vi: "—" }],
    };
    expect(buildInlineDayReadingInvoke("ngay-hom-nay", data, "inline")).toEqual({
      endpoint: "day-detail",
      data,
      variant: "inline",
    });
  });

  it("keeps ngay-hom-nay teaser for raw engine payload", () => {
    const data = { date: "2026-06-01", score: 70 };
    expect(buildInlineDayReadingInvoke("ngay-hom-nay", data, "teaser")).toEqual({
      endpoint: "ngay-hom-nay",
      data,
      variant: "teaser",
    });
  });
});
