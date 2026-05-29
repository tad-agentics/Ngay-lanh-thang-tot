import { describe, expect, it } from "vitest";

import { mapChonNgayPayloadToResultDays } from "./chon-ngay-result";

describe("mapChonNgayPayloadToResultDays", () => {
  it("reads ranked_days[] with dd/mm/yyyy date field", () => {
    const rows = mapChonNgayPayloadToResultDays({
      ranked_days: [
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

  it("reads ranked_days[] (ISO date, lunar_date, time_slots)", () => {
    const rows = mapChonNgayPayloadToResultDays({
      status: "success",
      ranked_days: [
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

  it("ignores legacy recommended_dates[] when ranked_days is absent", () => {
    const rows = mapChonNgayPayloadToResultDays({
      recommended_dates: [
        { date: "2026-01-01", score: 50, reason_vi: "Fallback row" },
      ],
    });
    expect(rows).toEqual([]);
  });

  it("prefers reason_vi over reasons[] for ket-qua body", () => {
    const rows = mapChonNgayPayloadToResultDays({
      ranked_days: [
        {
          date: "2026-06-06",
          score: 88,
          reason_vi: "Ngày thuận ký kết với nhật chủ Ất Mộc — buổi sáng có giờ Hoàng đạo.",
          reasons: [
            "Trực Mãn — ngày tốt (+20). Trực Mãn — hợp với Ký kết hợp đồng (+15).",
          ],
        },
      ],
    });
    expect(rows[0]?.reasons[0]).toContain("nhật chủ");
    expect(rows[0]?.reasons[0]).not.toContain("(+20)");
  });

  it("returns empty when payload has no ranked_days array", () => {
    expect(mapChonNgayPayloadToResultDays({ foo: 1 })).toEqual([]);
    expect(mapChonNgayPayloadToResultDays({ days: [{ date: "2026-01-01" }] })).toEqual([]);
  });

  it("grades by API row index, not count of successfully parsed rows", () => {
    const rows = mapChonNgayPayloadToResultDays({
      ranked_days: [
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
