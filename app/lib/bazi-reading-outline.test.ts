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
    { id: "menh_tong_quan", title: "Mệnh tổng quan", text: "MQ" },
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
    const menh = chapters.find((c) => c.key === "menh_tong_quan");
    expect(menh?.kind).toBe("menh");
    if (menh?.kind === "menh") {
      expect(menh.prose).toBe("MQ");
    }
    const van = chapters.find((c) => c.key === "van_nam");
    expect(van?.kind).toBe("van_nam");
    if (van?.kind === "van_nam") {
      expect(van.prose).toContain("VN");
    }
    const tinh = chapters.find((c) => c.key === "tinh_cach");
    expect(tinh?.kind).toBe("tinh_cach");
    if (tinh?.kind === "tinh_cach") {
      expect(tinh.prose).toBe("TC");
      expect(tinh.traits).toEqual([]);
    }
    const quy = chapters.find((c) => c.key === "quy_nhan");
    expect(quy?.kind).toBe("quy_nhan");
    if (quy?.kind === "quy_nhan") {
      expect(quy.prose).toBe("QX");
      expect(quy.prose).not.toContain("VN");
    }
    expect(baziOutlineSections("Bính Ngọ")[2]?.title).toBe("Vận năm Bính Ngọ");
  });

  it("maps personality_traits on la-so to §02 sub-blocks", () => {
    const chapters = buildBaziDisplayChapters({
      sections: [{ id: "tinh_cach", title: "Tính cách", text: "Intro Gemini" }],
      laSo: {
        personality_traits: [
          { id: "strength", title: "Điểm mạnh", text: "Kiên trì." },
        ],
      },
      luuNienFactsRaw: null,
      phongThuyFactsRaw: null,
      yearCanChi: "",
    });
    const tinh = chapters.find((c) => c.key === "tinh_cach");
    if (tinh?.kind === "tinh_cach") {
      expect(tinh.traits).toHaveLength(1);
      expect(tinh.introProse).toBe("Intro Gemini");
      expect(tinh.prose).toBe("");
    }
  });

  it("maps dai_van_next to §05 quy_nhan chapter", () => {
    const chapters = buildBaziDisplayChapters({
      sections: [],
      laSo: null,
      luuNienFactsRaw: {
        dai_van_next: {
          display: "Đinh Mùi 2027",
          theme_vi: "Kim sinh Thủy — thời cơ lớn.",
          age_range: [41, 50],
        },
      },
      phongThuyFactsRaw: null,
      yearCanChi: "",
    });
    const quy = chapters.find((c) => c.key === "quy_nhan");
    if (quy?.kind === "quy_nhan") {
      expect(quy.daiVanNext?.display).toBe("Đinh Mùi 2027");
      expect(quy.daiVanNext?.yearsLabel).toBe("41–50");
      expect(quy.emptyReason).toBeNull();
    }
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
