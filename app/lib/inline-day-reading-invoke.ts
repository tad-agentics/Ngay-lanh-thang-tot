import type { GenerateReadingInput } from "~/lib/generate-reading";
import { isLuanContextPayload } from "~/lib/luan-context";

/**
 * Prefer `day-luan-context` on `day-detail` (same engine path as `/luan-ai/day-*`).
 * Never-sub must use `teaser` (production gate); subscribers use `inline` for shorter copy.
 */
export function buildInlineDayReadingInvoke(
  endpoint: "ngay-hom-nay" | "day-detail",
  data: unknown,
  mode: "teaser" | "inline",
): GenerateReadingInput {
  if (isLuanContextPayload(data)) {
    return {
      endpoint: "day-detail",
      data,
      variant: mode === "teaser" ? "teaser" : "inline",
    };
  }
  return {
    endpoint,
    data,
    variant: mode === "teaser" ? "teaser" : "inline",
  };
}
