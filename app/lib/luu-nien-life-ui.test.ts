import { describe, expect, it } from "vitest";

import {
  hasLuuNienLifeLuanFromSections,
  mergeLuuNienLifeAreasWithLuan,
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

describe("hasLuuNienLifeLuanFromSections", () => {
  const long = "x".repeat(2_500);

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
});
