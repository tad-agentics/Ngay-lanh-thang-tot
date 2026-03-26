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

  it("reads recommended_dates[] (ISO date, lunar_date, time_slots)", () => {
    const rows = mapChonNgayPayloadToResultDays({
      status: "success",
      recommended_dates: [
        {
          date: "2026-03-09",
          lunar_date: "Ngày 21 tháng Giêng",
          score: 73,
          grade: "B",
          truc: "Kiến",
          reason_vi: "Trực Kiến — ngày lành.",
          time_slots: [{ chi_name: "Tý", range: "23:00-01:00" }],
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isoDate).toBe("2026-03-09");
    expect(rows[0]?.lunarLabel).toContain("Giêng");
    expect(rows[0]?.bestHour).toContain("Tý");
    expect(rows[0]?.reasons[0]).toContain("Trực Kiến");
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
