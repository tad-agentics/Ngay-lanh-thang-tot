import type { GenerateReadingInput } from "~/lib/generate-reading";
import { isLuanContextPayload } from "~/lib/luan-context";

/** Prefer structured luan_context + day-detail inline (shorter prompt, today gate on server). */
export function buildInlineDayReadingInvoke(
  endpoint: "ngay-hom-nay" | "day-detail",
  data: unknown,
  mode: "teaser" | "inline",
): GenerateReadingInput {
  if (isLuanContextPayload(data)) {
    return {
      endpoint: "day-detail",
      data,
      variant: "inline",
    };
  }
  return {
    endpoint,
    data,
    variant: mode === "teaser" ? "teaser" : "inline",
  };
}
