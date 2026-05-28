import { describe, expect, it } from "vitest";

import type { SavedPick } from "~/hooks/useSavedPicks";
import {
  daysUntilIso,
  findSavedPickForDay,
  pickScoreNumber,
  upcomingSavedPicks,
} from "~/lib/saved-picks-upcoming";

function pick(overrides: Partial<SavedPick> & Pick<SavedPick, "id">): SavedPick {
  return {
    saved_at: "2026-05-01T00:00:00Z",
    source_endpoint: "day-detail",
    payload: {},
    label: null,
    day_iso: null,
    score: null,
    ...overrides,
  };
}

describe("pickScoreNumber", () => {
  it("coerces numeric strings from Postgres", () => {
    expect(pickScoreNumber("92")).toBe(92);
    expect(pickScoreNumber(85)).toBe(85);
  });
});

describe("upcomingSavedPicks", () => {
  const now = new Date("2026-05-27T08:00:00");

  it("filters past days and sorts soonest first", () => {
    const rows = upcomingSavedPicks(
      [
        pick({ id: "a", day_iso: "2026-06-17", label: "Ký HĐ", score: 85 }),
        pick({ id: "b", day_iso: "2026-05-20", label: "Past" }),
        pick({ id: "c", day_iso: "2026-06-06", label: "Khai trương", score: "92" }),
      ],
      { now, limit: 3 },
    );
    expect(rows.map((r) => r.iso)).toEqual(["2026-06-06", "2026-06-17"]);
    expect(rows[0]?.s).toBe(92);
    expect(rows[0]?.in).toBe("10 ngày nữa");
  });

  it("ignores picks without day_iso", () => {
    const rows = upcomingSavedPicks(
      [pick({ id: "x", label: "Hợp tuổi · A × B" })],
      { now },
    );
    expect(rows).toHaveLength(0);
  });
});

describe("daysUntilIso", () => {
  it("returns hôm nay for same calendar day", () => {
    const now = new Date("2026-06-06T09:00:00");
    expect(daysUntilIso("2026-06-06", now)).toBe("hôm nay");
  });
});

describe("findSavedPickForDay", () => {
  it("finds by day_iso", () => {
    const saved = pick({ id: "1", day_iso: "2026-06-06" });
    expect(findSavedPickForDay([saved], "2026-06-06")).toBe(saved);
  });
});
