import { describe, expect, it } from "vitest";

import {
  phongThuyPayloadToTeaserView,
  phongThuyPayloadToView,
  unwrapPhongThuyPayload,
} from "./phong-thuy-ui";

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
    expect(v?.mauTot).toContain("Đen");
    expect(v?.mauTot).toContain("Trắng");
    expect(v?.mauTot).not.toMatch(/#1a1a1a/i);
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
    expect(v?.mauTot).toContain("Xanh lá");
    expect(v?.mauTot).not.toMatch(/#3A6B35/i);
  });

  it("returns null for non-object", () => {
    expect(phongThuyPayloadToView(null)).toBeNull();
  });

  it("teaser strips paywall fields and keeps tốt + meta", () => {
    const v = phongThuyPayloadToTeaserView({
      status: "success",
      version: 2,
      purpose: "VAN_PHONG",
      user_menh: { hanh: "Thổ", name: "Lộ Bàng Thổ" },
      dung_than: "Thủy",
      ky_than: "Thổ",
      huong_tot: [{ direction: "Bắc", element: "Thủy", reason: "Dụng Thần" }],
      mau_may_man: [{ color: "Đen", hex: "#1a1a1a" }],
      so_may_man: [1, 6],
      huong_xau: [{ direction: "Nam" }],
      mau_ky: [{ color: "Đỏ" }],
      vat_pham: [{ item: "X", reason: "Y" }],
      purpose_specific: { a: 1 },
    });
    expect(v?.purpose).toBe("VAN_PHONG");
    expect(v?.version).toBe(2);
    expect(v?.huongTotItems[0]?.direction).toBe("Bắc");
    expect(v?.soTotNumbers).toEqual([1, 6]);
    expect(v?.huongXau).toBe("—");
    expect(v?.mauKy).toBe("—");
    expect(v?.goiY).toEqual([]);
    expect(v?.purposeSpecific).toBeNull();
    expect(v?.kyThanApi).toBeNull();
  });

  it("maps full sample: phi tinh + couple + purpose_specific", () => {
    const v = phongThuyPayloadToView({
      status: "success",
      purpose: "VAN_PHONG",
      phi_tinh_year: 2026,
      phi_tinh: [
        { direction: "Bắc", star: 1, star_name: "A", hanh: "Thủy", nature: "tốt", meaning: "OK" },
      ],
      huong_tot_nam_nay: ["Bắc"],
      huong_xau_nam_nay: ["Nam"],
      hoa_giai: [{ direction: "Đông", star: 3, remedy: "Đèn" }],
      phi_tinh_note_vi: "Ghi chú",
      purpose_specific: {
        huong_ngoi: { tot: "Bắc", reason: "Thủy" },
      },
      couple_harmony: {
        person1_hanh: "Thổ",
        person2_hanh: "Mộc",
        relation: "Khắc",
        explanation: "Hỏa trung gian",
        remedies: [{ item: "Đèn", vi_tri: "Phòng", reason: "Hóa" }],
      },
      huong_tot: [{ direction: "Bắc" }],
      mau_may_man: [],
      so_may_man: [1],
      huong_xau: [],
      mau_ky: [],
      so_ky: [],
    });
    expect(v?.phiTinhYear).toBe(2026);
    expect(v?.phiTinh.length).toBe(1);
    expect(v?.hoaGiai[0]?.remedy).toBe("Đèn");
    expect(v?.purposeSpecific?.huong_ngoi).toEqual({
      tot: "Bắc",
      reason: "Thủy",
    });
    expect(v?.coupleHarmony?.relation).toBe("Khắc");
  });

  it("unwrapPhongThuyPayload prefers nested object when root is only envelope", () => {
    const inner = {
      huong_tot: [{ direction: "Đông" }],
      mau_may_man: [{ color: "Xanh" }],
      so_may_man: [2],
    };
    const u = unwrapPhongThuyPayload({ status: "ok", data: inner });
    expect((u as { huong_tot?: unknown }).huong_tot).toEqual(inner.huong_tot);
  });

  it("unwrapPhongThuyPayload keeps root when data is empty but root has payload", () => {
    const u = unwrapPhongThuyPayload({
      data: {},
      huong_tot: [{ direction: "Nam" }],
      mau_may_man: [],
      so_may_man: [],
    });
    expect(u?.huong_tot).toEqual([{ direction: "Nam" }]);
  });

  it("maps couple_harmony with explanation or colors only", () => {
    const v = phongThuyPayloadToView({
      huong_tot: [{ direction: "Bắc" }],
      mau_may_man: [],
      so_may_man: [1],
      huong_xau: [],
      mau_ky: [],
      so_ky: [],
      couple_harmony: {
        explanation: "Gợi ý chung.",
        colors_for_shared_space: [{ color: "Đỏ", hex: "#ff0000", element: "Hỏa" }],
      },
    });
    expect(v?.coupleHarmony?.explanation).toBe("Gợi ý chung.");
    expect(v?.coupleHarmony?.colors_for_shared_space[0]?.color).toBe("Đỏ");
  });
});
