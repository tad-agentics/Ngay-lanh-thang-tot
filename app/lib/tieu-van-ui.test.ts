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

  it("skips dimension rows with no real label", () => {
    const ui = mapTieuVanPayload({
      cac_giai: [{ label: "", value: 50, note: "x" }],
    });
    expect(ui.cacGiai.length).toBe(4);
    expect(ui.cacGiai[0]?.label).toBe("Tài vận");
  });
});
