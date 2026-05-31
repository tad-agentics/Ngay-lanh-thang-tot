import { describe, expect, it } from "vitest";

import { parsePhongThuyFactsView } from "./phong-thuy-facts-ui";

describe("parsePhongThuyFactsView", () => {
  it("parses OpenAPI-style phong-thuy payload", () => {
    const view = parsePhongThuyFactsView({
      huong_tot_nam_nay: ["Nam", "Đông Nam"],
      huong_xau_nam_nay: ["Tây Bắc"],
      mau_may_man: [{ name: "Đỏ đô", hex: "#8B1A1A" }],
      phi_tinh: [
        { direction: "Bắc", star_name: "Nhất Bạch" },
        { direction: "Nam", star: "Cửu Tử" },
      ],
      phi_tinh_note_vi: "Ưu tiên bàn làm việc hướng Nam.",
    });
    expect(view?.huongTot).toHaveLength(2);
    expect(view?.huongXau).toContain("Tây Bắc");
    expect(view?.mauMay[0]?.name).toBe("Đỏ đô");
    expect(view?.phiTinh.length).toBeGreaterThanOrEqual(2);
  });

  it("returns null for empty API object", () => {
    expect(parsePhongThuyFactsView({})).toBeNull();
    expect(parsePhongThuyFactsView({ data: {} })).toBeNull();
  });

  it("falls back to huong_tot when year overlay missing", () => {
    const view = parsePhongThuyFactsView({
      huong_tot: ["Đông"],
      mau_may_man: ["Xanh lá"],
    });
    expect(view?.huongTot[0]?.name).toBe("Đông");
    expect(view?.mauMay[0]?.name).toBe("Xanh lá");
  });
});
