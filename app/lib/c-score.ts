import type { DayType } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";

/** Score ramp dot color — Design System §04 / c-screens-a. */
export function scoreDotColor(score: number): string {
  if (score >= 85) return CT.greenMute;
  if (score >= 70) return CT.gold;
  if (score >= 55) return "#bfae7a";
  if (score >= 40) return CT.muted;
  return CT.red;
}

export function scoreFromDayType(dayType: DayType): number {
  if (dayType === "hoang-dao") return 82;
  if (dayType === "hac-dao") return 48;
  return 68;
}

export function verdictLabelFromScore(score: number): string {
  if (score >= 85) return "Ngày tốt";
  if (score >= 70) return "Ngày khá";
  if (score >= 55) return "Ngày bình";
  if (score >= 40) return "Cân nhắc";
  return "Ngày tránh";
}
