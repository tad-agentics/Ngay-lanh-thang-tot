import type { TuTruIntent } from "~/lib/api-types";
import {
  matchesIntentVietnameseLabel,
  TU_TRU_INTENT_OPTIONS,
} from "~/lib/tu-tru-intents";

export type ResolvedTraCuuIntent = {
  intent: TuTruIntent;
  label: string;
};

/** Fuzzy match free-text pill input → canonical `TuTruIntent`. */
export function resolveTraCuuIntentFromText(
  raw: string,
): ResolvedTraCuuIntent | null {
  const q = raw.trim().toLowerCase();
  if (!q) return null;

  for (const opt of TU_TRU_INTENT_OPTIONS) {
    if (opt.value === "MAC_DINH") continue;
    const labelLc = opt.label.toLowerCase();
    if (matchesIntentVietnameseLabel(opt.value, q)) {
      return { intent: opt.value, label: opt.label };
    }
    if (labelLc === q || labelLc.includes(q) || q.includes(labelLc)) {
      return { intent: opt.value, label: opt.label };
    }
  }

  return null;
}
