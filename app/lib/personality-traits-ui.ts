import type { LaSoJson } from "~/lib/api-types";

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export type PersonalityTraitView = {
  id: string;
  title: string;
  text: string;
};

/** `LaSoResponse.personality_traits[]` (OpenAPI 0.1.3) — §02 Direction C màn 18. */
export function parsePersonalityTraitsFromLaSo(
  laSo: LaSoJson | null | undefined,
): PersonalityTraitView[] {
  const root = asRecord(laSo);
  if (!root) return [];

  const raw = root.personality_traits ?? root.personalityTraits;
  if (!Array.isArray(raw)) return [];

  const out: PersonalityTraitView[] = [];
  for (const item of raw) {
    const o = asRecord(item);
    if (!o) continue;
    const text = pickStr(o, ["text", "body_vi", "body", "detail_vi", "detail"]);
    const title =
      pickStr(o, ["title", "title_vi", "label_vi", "label", "name"]) ||
      pickStr(o, ["id"]) ||
      `trait-${out.length}`;
    if (!text && !title) continue;
    out.push({
      id: pickStr(o, ["id", "key"]) || title,
      title,
      text,
    });
  }
  return out;
}
