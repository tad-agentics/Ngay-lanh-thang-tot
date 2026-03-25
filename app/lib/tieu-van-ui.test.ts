import { describe, expect, it } from "vitest";

import { mapTieuVanPayload } from "./tieu-van-ui";

describe("mapTieuVanPayload", () => {
  it("uses prose fallbacks when string fields missing (same as former empty pickStr + ||)", () => {
    const ui = mapTieuVanPayload({
      tong_quan: "",
      can_luu: "",
      tru_thang: "",
    });
    expect(ui.tongQuan).toContain("biến động nhẹ");
    expect(ui.canLuu).toContain("Tránh quyết định");
    expect(ui.pillarHint).toBe("—");
    expect(ui.tags).toEqual([]);
  });

  it("keeps API strings when present", () => {
    const ui = mapTieuVanPayload({
      tong_quan: "  Tổng quan từ API  ",
      can_luu: "Gợi ý từ API",
      tru_thang: "Giáp Tý",
    });
    expect(ui.tongQuan).toBe("Tổng quan từ API");
    expect(ui.canLuu).toBe("Gợi ý từ API");
    expect(ui.pillarHint).toBe("Giáp Tý");
  });

  it("maps tu-tru-api tieu-van shape (reading + tieu_van_pillar + tags)", () => {
    const ui = mapTieuVanPayload({
      status: "success",
      month: "2026-03",
      tieu_van_pillar: {
        display: "Nhâm Thìn",
        can_name: "Nhâm",
        chi_name: "Thìn",
      },
      reading: "Tháng này bạn có ưu thế nhất định.",
      tags: ["Khá tốt", "Chủ động"],
      dai_van_context: "Đang trong vận Bính Tuất — cẩn trọng.",
    });
    expect(ui.tongQuan).toBe("Tháng này bạn có ưu thế nhất định.");
    expect(ui.pillarHint).toBe("Nhâm Thìn");
    expect(ui.canLuu).toContain("Bính Tuất");
    expect(ui.tags).toEqual(["Khá tốt", "Chủ động"]);
    expect(ui.cacGiai.length).toBe(0);
  });

  it("skips dimension rows with no real label", () => {
    const ui = mapTieuVanPayload({
      cac_giai: [{ label: "", value: 50, note: "x" }],
    });
    expect(ui.cacGiai.length).toBe(4);
    expect(ui.cacGiai[0]?.label).toBe("Tài vận");
  });

  it("maps details[] like hop-tuoi into cacGiai", () => {
    const ui = mapTieuVanPayload({
      details: [
        { category: "Tài vận", score: 80, description: "Tốt" },
        { category: "Sức khoẻ", score: 70, description: "Ổn" },
      ],
    });
    expect(ui.cacGiai).toHaveLength(2);
    expect(ui.cacGiai[0]?.label).toBe("Tài vận");
    expect(ui.cacGiai[0]?.value).toBe(80);
  });
});
