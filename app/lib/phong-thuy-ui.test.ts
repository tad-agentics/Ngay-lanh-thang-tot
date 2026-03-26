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
    expect(v?.huongTot).toContain("Bắc");
    expect(v?.huongTot).toContain("Dụng Thần");
    expect(v?.mauTot).toMatch(/Đen.*#1a1a1a/i);
    expect(v?.mauTot).toContain("Trắng");
    expect(v?.soTot).toBe("1, 6");
    expect(v?.huongXau).toContain("Nam");
    expect(v?.mauKy).toContain("Đỏ");
    expect(v?.soKy).toContain("7");
    expect(v?.goiY.length).toBeGreaterThan(0);
    expect(v?.goiY[0]?.tieu_de).toContain("Bể cá");
  });

  it("falls back mauKy from string field when arrays absent", () => {
    const fromText = phongThuyPayloadToView({
      mau_ky_text: "Trắng, Bạc",
      huong_tot: [{ direction: "Đông" }],
      mau_may_man: [{ color: "Xanh" }],
      so_may_man: [1],
    });
    expect(fromText?.mauKy).toContain("Trắng");
    expect(fromText?.mauKy).toContain("Bạc");

    const fromPlainString = phongThuyPayloadToView({
      mau_ky: " Trắng · Bạc ",
      huong_tot: [{ direction: "Nam" }],
      mau_may_man: [],
      so_may_man: [2],
    });
    expect(fromPlainString?.mauKy).toBe("Trắng · Bạc");
  });

  it("maps user_menh, dung_than, ky_than from /v1/phong-thuy shape", () => {
    const v = phongThuyPayloadToView({
      user_menh: { hanh: "Thủy", name: "Tuyền Trung Thủy" },
      dung_than: "Mộc",
      ky_than: "Kim",
      huong_tot: [{ direction: "Đông", reason: "Sinh khí" }],
      mau_may_man: [{ color: "Xanh lá", hex: "#3A6B35" }],
      so_may_man: [1, 2, 6],
      huong_xau: [{ direction: "Tây" }],
      mau_ky: [{ color: "Trắng" }],
      so_ky: [4, 9],
    });
    expect(v?.userMenhLabel).toContain("Tuyền Trung Thủy");
    expect(v?.userMenhLabel).toContain("Thủy");
    expect(v?.dungThanApi).toBe("Mộc");
    expect(v?.kyThanApi).toBe("Kim");
    expect(v?.mauTot).toContain("#3A6B35");
  });

  it("returns null for non-object", () => {
    expect(phongThuyPayloadToView(null)).toBeNull();
  });
});
