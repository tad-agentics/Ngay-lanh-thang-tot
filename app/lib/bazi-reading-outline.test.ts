import { describe, expect, it } from "vitest";

import {
  baziOutlineSections,
  buildBaziDisplayChapters,
  flowYearCanChiFromFacts,
} from "./bazi-reading-outline";
import type { LaSoChiTietSection } from "./generate-reading";

describe("flowYearCanChiFromFacts", () => {
  it("reads year_can_chi from facts payload", () => {
    expect(
      flowYearCanChiFromFacts({ year_can_chi: "Bính Ngọ", year: 2026 }),
    ).toBe("Bính Ngọ");
  });
});

describe("buildBaziDisplayChapters", () => {
  const sections: LaSoChiTietSection[] = [
    { id: "tinh_cach", title: "Tính cách", text: "TC" },
    { id: "luu_nien_van", title: "Vận năm", text: "VN" },
    { id: "phong_thuy_van", title: "Phong thủy năm", text: "PT" },
    { id: "luu_nien_ung_xu", title: "Ứng xử", text: "QX" },
  ];

  it("maps API sections to five Direction C chapters", () => {
    const chapters = buildBaziDisplayChapters({
      sections,
      laSo: { pillars: {} },
      luuNienFactsRaw: null,
      phongThuyFactsRaw: null,
      yearCanChi: "Bính Ngọ",
    });
    expect(chapters.map((c) => c.key)).toEqual([
      "menh_tong_quan",
      "tinh_cach",
      "van_nam",
      "phong_thuy",
      "quy_nhan",
    ]);
    const van = chapters.find((c) => c.key === "van_nam");
    expect(van?.kind).toBe("van_nam");
    if (van?.kind === "van_nam") {
      expect(van.prose).toContain("VN");
    }
    const quy = chapters.find((c) => c.key === "quy_nhan");
    expect(quy?.kind).toBe("quy_nhan");
    if (quy?.kind === "quy_nhan") {
      expect(quy.prose).toBe("QX");
      expect(quy.prose).not.toContain("VN");
    }
    expect(baziOutlineSections("Bính Ngọ")[2]?.title).toBe("Vận năm Bính Ngọ");
  });

  it("does not duplicate luu-nien prose across van_nam and quy_nhan", () => {
    const sections: LaSoChiTietSection[] = [
      { id: "luu_nien_nhin_chung", title: "Nhịp", text: "A" },
      { id: "luu_nien_thuc_tien", title: "Thực", text: "B" },
      { id: "luu_nien_ung_xu", title: "Ứng xử", text: "C" },
    ];
    const chapters = buildBaziDisplayChapters({
      sections,
      laSo: null,
      luuNienFactsRaw: null,
      phongThuyFactsRaw: null,
      yearCanChi: "",
    });
    const van = chapters.find((c) => c.key === "van_nam");
    const quy = chapters.find((c) => c.key === "quy_nhan");
    if (van?.kind === "van_nam" && quy?.kind === "quy_nhan") {
      expect(van.prose).toBe("A\n\nB");
      expect(quy.prose).toBe("C");
    }
  });
});
