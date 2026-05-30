import { describe, expect, it } from "vitest";

import {
  extractDetailReasonLines,
  parseChonNgayDetailForView,
} from "./chon-ngay-detail";

describe("extractDetailReasonLines", () => {
  it("prefers breakdown[].reason_vi over reason_vi prose", () => {
    const lines = extractDetailReasonLines({
      reason_vi: "Trực Thành — ngày lành (+20).",
      breakdown: [
        { source: "Trực", points: 20, reason_vi: "Trực Thành thuận khai trương." },
        { source: "Sao", points: 10, reason_vi: "Sao Giác hỗ trợ việc nhỏ." },
      ],
    });
    expect(lines).toEqual([
      "Trực Thành thuận khai trương.",
      "Sao Giác hỗ trợ việc nhỏ.",
    ]);
  });

  it("reads layer3.breakdown from legacy chon-ngay/detail shape", () => {
    const lines = extractDetailReasonLines({
      status: "success",
      reason_vi: "Trực Thành — ngày lành (+20).",
      layer3: {
        breakdown: [
          { source: "X", points: 1, reason_vi: "Một dòng giải thích." },
          { source: "Y", points: 2, reason_vi: "Hai dòng giải thích." },
        ],
      },
    });
    expect(lines).toEqual([
      "Một dòng giải thích.",
      "Hai dòng giải thích.",
    ]);
  });
});

describe("parseChonNgayDetailForView", () => {
  it("re-exports the unified day-detail mapper", () => {
    const v = parseChonNgayDetailForView({
      lunar_date: "Ngày 1",
      can_chi: "Giáp Tý",
      score: 72,
      grade: "B",
      breakdown: [],
    });
    expect(v?.canChi).toBe("Giáp Tý");
    expect(v?.score).toBe(72);
  });
});
