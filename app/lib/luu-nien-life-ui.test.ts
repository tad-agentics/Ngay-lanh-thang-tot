import { describe, expect, it } from "vitest";

import { deriveChapterLoadState } from "./bazi-chapter-load";
import {
  hasLuuNienLifeLuanFromSections,
  mergeLuuNienLifeAreasWithLuan,
  MIN_LUU_NIEN_LIFE_LUAN_CHARS,
  MIN_LUU_NIEN_LIFE_LUAN_PARAGRAPHS,
  parseLifeAreaLuanFromSections,
} from "./luu-nien-life-ui";

describe("parseLifeAreaLuanFromSections", () => {
  it("reads luu_nien_life_* sections", () => {
    const areas = parseLifeAreaLuanFromSections([
      {
        id: "luu_nien_life_tai_loc",
        title: "Tài lộc",
        text: "Đoạn một.\n\nĐoạn hai.",
      },
    ]);
    expect(areas).toHaveLength(1);
    expect(areas[0]?.id).toBe("tai_loc");
    expect(areas[0]?.text).toContain("Đoạn hai");
  });
});

describe("mergeLuuNienLifeAreasWithLuan", () => {
  it("prefers LLM luan over API detail", () => {
    const merged = mergeLuuNienLifeAreasWithLuan(
      {
        yearCanChi: "Bính Ngọ",
        yearRating: null,
        yearTheme: null,
        lifeAreas: [
          {
            id: "tai_loc",
            label: "Tài lộc",
            verdict: "Thuận",
            detail: "Câu ngắn API.",
          },
        ],
        warnings: [],
        monthScores: [],
        quyNhan: null,
        daiVanNext: null,
      },
      [
        {
          id: "luu_nien_life_tai_loc",
          title: "Tài lộc",
          text: "Luận dài từ DeepSeek.",
        },
      ],
    );
    expect(merged[0]?.luan).toBe("Luận dài từ DeepSeek.");
    expect(merged[0]?.detail).toBe("Câu ngắn API.");
  });
});

const fourLifeFacts = {
  year_can_chi: "Bính Ngọ",
  life_areas: [
    { id: "tai_loc", label: "Tài lộc", verdict: "Thuận", detail: "API." },
    { id: "su_nghiep", label: "Sự nghiệp", verdict: "Trung", detail: "API." },
    { id: "tinh_cam", label: "Tình cảm", verdict: "Thuận", detail: "API." },
    { id: "suc_khoe", label: "Sức khỏe", verdict: "Hạn", detail: "API." },
  ],
};

function completeLifeLuan(id: string, title: string): {
  id: string;
  title: string;
  text: string;
} {
  const long = `p1\n\np2\n\n${"x".repeat(MIN_LUU_NIEN_LIFE_LUAN_CHARS)}`;
  return { id: `luu_nien_life_${id}`, title, text: long };
}

describe("deriveChapterLoadState (van_nam)", () => {
  const long = `p1\n\np2\n\n${"x".repeat(MIN_LUU_NIEN_LIFE_LUAN_CHARS)}`;

  it("keeps §03 loading when only one of four life areas has LLM luan", () => {
    const sections = [completeLifeLuan("tai_loc", "Tài lộc")];
    const load = deriveChapterLoadState(sections, {
      luuNienFactsRaw: fourLifeFacts,
      bundleFinished: false,
    });
    expect(load.van_nam).toBe("loading");
    expect(hasLuuNienLifeLuanFromSections(sections, 4)).toBe(false);
  });

  it("marks §03 failed when bundle ends with incomplete life luan", () => {
    const load = deriveChapterLoadState([completeLifeLuan("tai_loc", "Tài lộc")], {
      luuNienFactsRaw: fourLifeFacts,
      bundleFinished: true,
    });
    expect(load.van_nam).toBe("failed");
  });

  it("marks §03 done when all expected life areas have complete luan", () => {
    const sections = [
      completeLifeLuan("tai_loc", "Tài lộc"),
      completeLifeLuan("su_nghiep", "Sự nghiệp"),
      completeLifeLuan("tinh_cam", "Tình cảm"),
      completeLifeLuan("suc_khoe", "Sức khỏe"),
    ];
    const load = deriveChapterLoadState(sections, {
      luuNienFactsRaw: fourLifeFacts,
      bundleFinished: true,
    });
    expect(load.van_nam).toBe("done");
    expect(hasLuuNienLifeLuanFromSections(sections, 4)).toBe(true);
  });
});

describe("hasLuuNienLifeLuanFromSections", () => {
  const long = `p1\n\np2\n\n${"x".repeat(MIN_LUU_NIEN_LIFE_LUAN_CHARS)}`;

  it("requires expected life area count with min length", () => {
    expect(
      hasLuuNienLifeLuanFromSections(
        [
          { id: "luu_nien_life_a", title: "A", text: long },
          { id: "luu_nien_life_b", title: "B", text: long },
          { id: "luu_nien_life_c", title: "C", text: long },
          { id: "luu_nien_life_d", title: "D", text: long },
        ],
        4,
      ),
    ).toBe(true);
  });

  it("rejects one long area when four expected", () => {
    expect(
      hasLuuNienLifeLuanFromSections(
        [{ id: "luu_nien_life_a", title: "A", text: long }],
        4,
      ),
    ).toBe(false);
  });

  it("rejects four areas below min length", () => {
    expect(
      hasLuuNienLifeLuanFromSections(
        [
          { id: "luu_nien_life_a", title: "A", text: "ngắn" },
          { id: "luu_nien_life_b", title: "B", text: "ngắn" },
          { id: "luu_nien_life_c", title: "C", text: "ngắn" },
          { id: "luu_nien_life_d", title: "D", text: "ngắn" },
        ],
        4,
      ),
    ).toBe(false);
  });

  it("rejects long single-paragraph life luan", () => {
    const onePara = "x".repeat(MIN_LUU_NIEN_LIFE_LUAN_CHARS);
    expect(
      hasLuuNienLifeLuanFromSections(
        [{ id: "luu_nien_life_a", title: "A", text: onePara }],
        1,
      ),
    ).toBe(false);
    expect(MIN_LUU_NIEN_LIFE_LUAN_PARAGRAPHS).toBe(3);
  });
});
