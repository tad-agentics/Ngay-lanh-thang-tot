import { describe, expect, it } from "vitest";

import { scoreToLetterGrade } from "./score-grade";

describe("scoreToLetterGrade", () => {
  it("matches chọn ngày thresholds: A ≥85, B ≥70, else C", () => {
    expect(scoreToLetterGrade(85)).toBe("A");
    expect(scoreToLetterGrade(100)).toBe("A");
    expect(scoreToLetterGrade(84)).toBe("B");
    expect(scoreToLetterGrade(70)).toBe("B");
    expect(scoreToLetterGrade(69)).toBe("C");
    expect(scoreToLetterGrade(0)).toBe("C");
  });
});
