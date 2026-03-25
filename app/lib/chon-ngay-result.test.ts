import { describe, expect, it } from "vitest";

import { mapChonNgayPayloadToResultDays } from "./chon-ngay-result";

describe("mapChonNgayPayloadToResultDays", () => {
  it("reads days[] with dd/mm/yyyy date field", () => {
    const rows = mapChonNgayPayloadToResultDays({
      days: [
        {
          date: "05/04/2026",
          truc: "Trực Thành",
          lunar_label: "8/3 âm",
          good_hours: "7h–9h",
        },
        {
          date: "06/04/2026",
          truc: "Trực Khai",
          lunar_label: "9/3 âm",
          good_hours: "9h–11h",
        },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.isoDate).toBe("2026-04-05");
    expect(rows[0]?.grade).toBe("A");
    expect(rows[1]?.grade).toBe("B");
  });

  it("returns empty when payload has no recognizable array", () => {
    expect(mapChonNgayPayloadToResultDays({ foo: 1 })).toEqual([]);
  });

  it("grades by API row index, not count of successfully parsed rows", () => {
    const rows = mapChonNgayPayloadToResultDays({
      days: [
        { date: "not-a-date", truc: "X" },
        {
          date: "06/04/2026",
          truc: "Trực Khai",
          lunar_label: "9/3 âm",
          good_hours: "9h–11h",
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isoDate).toBe("2026-04-06");
    expect(rows[0]?.grade).toBe("B");
  });
});
