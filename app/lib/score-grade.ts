export type LetterGrade = "A" | "B" | "C";

/**
 * Letter grade from a 0–100 score. Matches chọn ngày (`chon-ngay-result`) thresholds:
 * A ≥ 85, B ≥ 70, else C.
 */
export function scoreToLetterGrade(score: number): LetterGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  return "C";
}
