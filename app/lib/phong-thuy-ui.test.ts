import { describe, expect, it } from "vitest";

import { phongThuyPayloadToView } from "./phong-thuy-ui";

describe("phongThuyPayloadToView", () => {
  it("maps tu-tru-api arrays (huong_tot, mau_may_man, …)", () => {
    const v = phongThuyPayloadToView({
      status: "success",
      huong_tot: [
        { direction: "Bắc", element: "Thủy", reason: "Dụng Thần" },
        { direction: "Tây", element: "Kim" },
      ],
      mau_may_man: [
        { color: "Đen", hex: "#1a1a1a" },
        { color: "Trắng", hex: "#f5f5f5" },
      ],
      so_may_man: [1, 6],
      huong_xau: [{ direction: "Nam", element: "Hỏa" }],
      mau_ky: [{ color: "Đỏ" }],
      so_ky: [2, 7],
      vat_pham: [
        {
          item: "Bể cá phong thủy",
          element: "Thủy",
          reason: "Tăng Thủy khí",
        },
      ],
    });
    expect(v?.huongTot).toBe("Bắc, Tây");
    expect(v?.mauTot).toBe("Đen, Trắng");
    expect(v?.soTot).toBe("1, 6");
    expect(v?.canKy).toContain("Nam");
    expect(v?.canKy).toContain("Đỏ");
    expect(v?.goiY.length).toBeGreaterThan(0);
    expect(v?.goiY[0]?.tieu_de).toContain("Bể cá");
  });

  it("returns null for non-object", () => {
    expect(phongThuyPayloadToView(null)).toBeNull();
  });
});
