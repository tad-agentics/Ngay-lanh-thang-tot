import type { TuTruIntent } from "~/lib/api-types";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import {
  matchesIntentVietnameseLabel,
  TU_TRU_INTENT_OPTIONS,
} from "~/lib/tu-tru-intents";

export const SAVED_PICK_GENERIC_LABEL = "Ngày lành";

export type SavedPickSource = "lich" | "tra_cuu" | "manual";

export function intentToLabel(intent: TuTruIntent | null | undefined): string | null {
  if (!intent || intent === "MAC_DINH") return SAVED_PICK_GENERIC_LABEL;
  return TU_TRU_INTENT_OPTIONS.find((o) => o.value === intent)?.label ?? null;
}

export function labelToIntent(label: string): TuTruIntent | null {
  const lc = label.trim().toLowerCase();
  if (!lc || lc === SAVED_PICK_GENERIC_LABEL.toLowerCase()) return "MAC_DINH";
  for (const o of TU_TRU_INTENT_OPTIONS) {
    if (o.value === "MAC_DINH") continue;
    if (matchesIntentVietnameseLabel(o.value, label)) return o.value;
  }
  return null;
}

/** Nav prefill — prefer stored label unless intent is a specific enum (not MAC_DINH). */
export function pickMarkLabelForNav(row: {
  intent: string | null;
  v: string;
}): string {
  if (row.intent && row.intent !== "MAC_DINH") {
    return intentToLabel(row.intent as TuTruIntent) ?? row.v;
  }
  return row.v;
}

/** `good_for` chips when editing a pick saved from day-detail. */
export function goodForFromSavedPickPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const detail = parseDayDetailForView(payload);
  return detail?.goodFor ?? [];
}

/** Chip gợi ý — prefill + good_for, không trùng. */
export function buildSuggestedPickLabels(args: {
  prefill?: string | null;
  goodFor?: readonly string[];
  limit?: number;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };

  if (args.prefill?.trim()) add(args.prefill);
  for (const g of args.goodFor ?? []) add(g);
  add(SAVED_PICK_GENERIC_LABEL);

  return out.slice(0, args.limit ?? 8);
}

export function resolveSavedPickSource(nav: {
  markLabel?: string | null;
  intentLabel?: string | null;
} | null): SavedPickSource {
  if (nav?.markLabel?.trim() || nav?.intentLabel?.trim()) return "tra_cuu";
  return "lich";
}
