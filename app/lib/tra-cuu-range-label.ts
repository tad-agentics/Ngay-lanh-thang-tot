import type { TraCuuRefineFilter } from "~/lib/tra-cuu-flow-types";

export const TRA_CUU_DEFAULT_RANGE_LABEL = "1 tháng tới";

export function traCuuRangeLabelForDays(days: number): string {
  if (days >= 90) return "mở rộng · 3 tháng tới";
  return TRA_CUU_DEFAULT_RANGE_LABEL;
}

export function traCuuWeekendRangeLabel(daysInclusive: number): string {
  if (daysInclusive >= 90) return "chỉ cuối tuần · 3 tháng";
  return "chỉ cuối tuần · 1 tháng";
}

export function isTraCuuRefineChipActive(
  chipId: TraCuuRefineFilter,
  filter: TraCuuRefineFilter,
  rangeLabel: string,
): boolean {
  if (chipId === "weekend") return filter === "weekend";
  if (chipId === "extended90") {
    return rangeLabel.includes("3 tháng") && filter === "all";
  }
  return filter === "all" && rangeLabel === TRA_CUU_DEFAULT_RANGE_LABEL;
}
