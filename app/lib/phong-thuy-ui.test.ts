import { describe, expect, it } from "vitest";

import {
  mergeBaziReadingWithPhongThuy,
  phongThuyFactsToProse,
  phongThuySectionsFromGenerateReading,
} from "./phong-thuy-ui";

describe("phongThuyFactsToProse", () => {
  it("builds prose from PhongThuyResponse fields", () => {
    const text = phongThuyFactsToProse({
      phi_tinh_note_vi: "Phi Tinh năm thuận cho bàn làm việc hướng Nam.",
      huong_tot_nam_nay: ["Nam", "Đông Nam"],
      mau_may_man: [{ name: "Đỏ đô" }, { name: "Cam đất" }],
    });
    expect(text).toContain("Phi Tinh");
    expect(text).toContain("Nam");
    expect(text).toContain("Màu may mắn");
  });
});

describe("mergeBaziReadingWithPhongThuy", () => {
  it("inserts phong thuy before tai_van", () => {
    const merged = mergeBaziReadingWithPhongThuy(
      [
        { id: "tinh_cach", title: "Tính cách", text: "A" },
        { id: "luu_nien_nhin_chung", title: "Nhịp năm", text: "B" },
        { id: "tai_van", title: "Tài vận", text: "C" },
      ],
      phongThuySectionsFromGenerateReading(null, "Phong thủy gợi ý."),
    );
    expect(merged.map((s) => s.id)).toEqual([
      "tinh_cach",
      "luu_nien_nhin_chung",
      "phong_thuy_van",
      "tai_van",
    ]);
  });
});
