import { describe, expect, it } from "vitest";

import {
  extractDayDetailHeaderMeta,
  extractDayDetailHeaderSubline,
} from "~/lib/day-detail-header";

describe("extractDayDetailHeaderSubline", () => {
  it("joins prioritized string fields", () => {
    const sub = extractDayDetailHeaderSubline({
      lunar_label: "1 tháng 2",
      can_chi: "Kỷ Tỵ",
      tu_hanh: "Thổ",
    });
    expect(sub).toBe("1 tháng 2 · Kỷ Tỵ · Thổ");
  });

  it("reads nested calendar object", () => {
    const sub = extractDayDetailHeaderSubline({
      calendar: { lunar_date: "Âm 3/2", can_chi: "Nhâm Dần" },
    });
    expect(sub).toContain("Âm 3/2");
    expect(sub).toContain("Nhâm Dần");
  });

  it("returns null when nothing matches", () => {
    expect(extractDayDetailHeaderSubline({ scores: [1, 2] })).toBe(null);
  });
});

describe("extractDayDetailHeaderMeta", () => {
  it("adds Hoàng Đạo chip from boolean flags", () => {
    const m = extractDayDetailHeaderMeta({
      is_hoang_dao: true,
      lunar_label: "Âm 1",
      can_chi: "Giáp Tý",
    });
    expect(m.chip).toEqual({
      label: "Hoàng Đạo",
      color: "success",
    });
    expect(m.subline).toContain("Âm 1");
  });

  it("adds Hắc Đạo from string field", () => {
    const m = extractDayDetailHeaderMeta({
      dao_type: "Hắc đạo",
    });
    expect(m.chip).toEqual({ label: "Hắc Đạo", color: "danger" });
  });

  it("defaults to Bình thường when subline exists but no dao signal", () => {
    const m = extractDayDetailHeaderMeta({
      lunar_label: "5 tháng giêng",
      can_chi: "Ất Sửu",
      tu_hanh: "Mộc",
    });
    expect(m.chip).toEqual({
      label: "Bình thường",
      color: "default",
    });
  });

  it("detects Hoàng đạo in nested explanation text", () => {
    const m = extractDayDetailHeaderMeta({
      note: "Đây là ngày hoàng đạo tốt cho khai trương.",
    });
    expect(m.chip?.label).toBe("Hoàng Đạo");
  });
});
