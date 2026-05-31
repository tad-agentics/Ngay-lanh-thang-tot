import { describe, expect, it } from "vitest";

import {
  createInitialChapterLoadState,
  type BaziChapterLoadState,
} from "./bazi-chapter-load";
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

  it("sets §01 proseFailed when menh chapter load is failed", () => {
    const load: BaziChapterLoadState = {
      menh_tong_quan: "failed",
      tinh_cach: "done",
      van_nam: "done",
      phong_thuy: "done",
      quy_nhan: "done",
    };
    const chapters = buildBaziDisplayChapters({
      sections: [],
      laSo: { pillars: {} },
      luuNienFactsRaw: null,
      phongThuyFactsRaw: null,
      yearCanChi: "",
      chapterLoad: load,
    });
    const menh = chapters.find((c) => c.key === "menh_tong_quan");
    if (menh?.kind === "menh") {
      expect(menh.proseFailed).toBe(true);
      expect(menh.proseLoading).toBe(false);
    }
  });

  it("does not map phong_thuy or luu_nien into §01 during partial load", () => {
    const chapters = buildBaziDisplayChapters({
      sections: [
        {
          id: "phong_thuy_van",
          title: "Phong thủy",
          text: "Hướng tốt/xấu năm nay theo phi tinh seed — không lọc Dụng Thần.",
        },
      ],
      laSo: { pillars: {} },
      luuNienFactsRaw: null,
      phongThuyFactsRaw: { huong_tot: ["Đông"] },
      yearCanChi: "",
      chapterLoad: createInitialChapterLoadState(),
    });
    const menh = chapters.find((c) => c.key === "menh_tong_quan");
    if (menh?.kind === "menh") {
      expect(menh.prose).toBe("");
      expect(menh.proseLoading).toBe(true);
    }
  });

  it("uses tong_hop prose for §01 when menh_tong_quan missing", () => {
    const chapters = buildBaziDisplayChapters({
      sections: [{ id: "tong_hop", title: "Luận giải", text: "Fallback prose" }],
      laSo: { pillars: {} },
      luuNienFactsRaw: null,
      phongThuyFactsRaw: null,
      yearCanChi: "",
    });
    const menh = chapters.find((c) => c.key === "menh_tong_quan");
    if (menh?.kind === "menh") {
      expect(menh.prose).toBe("Fallback prose");
      expect(menh.emptyReason).toBeNull();
    }
  });

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

  it("maps LLM personality_readings sections to §02 sub-blocks", () => {
    const longBody = `Đoạn một.\n\n${"x".repeat(420)}`;
    const chapters = buildBaziDisplayChapters({
      sections: [
        { id: "tinh_cach_intro", title: "Tổng quan", text: "Intro LLM ba câu." },
        {
          id: "tinh_cach_trait_diem_manh",
          title: "Điểm mạnh",
          text: longBody,
        },
        {
          id: "tinh_cach_trait_ca_tinh",
          title: "Cá tính",
          text: longBody,
        },
      ],
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
      expect(tinh.traits).toHaveLength(2);
      expect(tinh.traits[0]?.title).toBe("Điểm mạnh");
      expect(tinh.luanLoading).toBe(false);
      expect(tinh.introProse).toBe("Intro LLM ba câu.");
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

  it("maps luu_nien_life_* into §03 life areas with LLM luan", () => {
    const longBody = "Đoạn vận năm. ".repeat(350).trim();
    const chapters = buildBaziDisplayChapters({
      sections: [
        {
          id: "luu_nien_year_intro",
          title: "Nhịp năm",
          text: "Tổng quan năm Bính Ngọ.",
        },
        {
          id: "luu_nien_life_tai_loc",
          title: "Tài lộc",
          text: `${longBody}\n\n${longBody}`,
        },
        { id: "luu_nien_nhin_chung", title: "Nhịp", text: "Nhịp năm LLM." },
      ],
      laSo: null,
      luuNienFactsRaw: {
        life_areas: [
          {
            id: "tai_loc",
            label: "Tài lộc",
            verdict: "Thuận",
            detail: "Câu API ngắn.",
          },
        ],
      },
      phongThuyFactsRaw: null,
      yearCanChi: "Bính Ngọ",
    });
    const van = chapters.find((c) => c.key === "van_nam");
    if (van?.kind === "van_nam") {
      expect(van.yearIntroProse).toContain("Bính Ngọ");
      expect(van.lifeAreas[0]?.luan).toContain("Đoạn vận năm");
      expect(van.prose).toBe("Nhịp năm LLM.");
      expect(van.prose).not.toContain(longBody.slice(0, 40));
    }
  });

  it("keeps life-area loading when only year intro exists (no life LLM yet)", () => {
    const chapters = buildBaziDisplayChapters({
      sections: [
        {
          id: "luu_nien_year_intro",
          title: "Nhịp năm",
          text: "Chỉ có nhịp năm, chưa có 4 lĩnh vực.",
        },
      ],
      laSo: null,
      luuNienFactsRaw: {
        life_areas: [
          { id: "tai_loc", label: "Tài lộc", verdict: "Thuận", detail: "API." },
          { id: "su_nghiep", label: "Sự nghiệp", verdict: "—", detail: "API." },
        ],
      },
      phongThuyFactsRaw: null,
      yearCanChi: "Bính Ngọ",
      chapterLoad: {
        menh_tong_quan: "done",
        tinh_cach: "loading",
        van_nam: "loading",
        phong_thuy: "loading",
        quy_nhan: "loading",
      },
    });
    const van = chapters.find((c) => c.key === "van_nam");
    if (van?.kind === "van_nam") {
      expect(van.lifeLuanLoading).toBe(true);
      expect(van.luanLoading).toBe(false);
      expect(van.lifeAreas[0]?.luan).toBe("");
    }
  });

  it("marks only incomplete life areas luanFailed when van_nam chapter failed", () => {
    const longLuan = `${"Đoạn một. ".repeat(60)}\n\n${"Đoạn hai. ".repeat(60)}\n\n${"Đoạn ba. ".repeat(60)}`;
    const chapters = buildBaziDisplayChapters({
      sections: [
        {
          id: "luu_nien_life_suc_khoe",
          title: "Sức khỏe",
          text: longLuan,
        },
      ],
      laSo: { pillars: {} },
      luuNienFactsRaw: {
        life_areas: [
          { id: "suc_khoe", label: "Sức khỏe", verdict: "Tốt", detail: "" },
          { id: "tai_loc", label: "Tài lộc", verdict: "Trung", detail: "" },
        ],
      },
      phongThuyFactsRaw: null,
      yearCanChi: "",
      chapterLoad: {
        menh_tong_quan: "done",
        tinh_cach: "done",
        van_nam: "failed",
        phong_thuy: "done",
        quy_nhan: "done",
      },
    });
    const van = chapters.find((c) => c.key === "van_nam");
    if (van?.kind === "van_nam") {
      expect(van.lifeAreas.find((a) => a.id === "suc_khoe")?.luanFailed).toBe(
        false,
      );
      expect(van.lifeAreas.find((a) => a.id === "tai_loc")?.luanFailed).toBe(
        true,
      );
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
