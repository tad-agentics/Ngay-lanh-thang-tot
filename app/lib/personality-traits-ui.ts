import type { LaSoJson } from "~/lib/api-types";
import type { LaSoChiTietSection } from "~/lib/generate-reading";

const TINH_CACH_INTRO_SECTION_ID = "tinh_cach_intro";
const TINH_CACH_TRAIT_PREFIX = "tinh_cach_trait_";

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

/** §02 — luận dài từ generate-reading (không dùng nhãn ngắn API). */
export function parsePersonalityTraitsFromSections(
  sections: LaSoChiTietSection[],
): PersonalityTraitView[] {
  const out: PersonalityTraitView[] = [];
  for (const s of sections) {
    if (!s.id.startsWith(TINH_CACH_TRAIT_PREFIX)) continue;
    const text = s.text?.trim() ?? "";
    if (!text) continue;
    out.push({
      id: s.id.slice(TINH_CACH_TRAIT_PREFIX.length),
      title: s.title?.trim() || s.id,
      text,
    });
  }
  return out;
}

export function tinhCachIntroFromSections(
  sections: LaSoChiTietSection[],
): string {
  const intro = sections.find((s) => s.id === TINH_CACH_INTRO_SECTION_ID);
  if (intro?.text?.trim()) return intro.text.trim();
  const legacy = sections.find((s) => s.id === "tinh_cach");
  return legacy?.text?.trim() ?? "";
}

export function hasTinhCachLuanFromSections(
  sections: LaSoChiTietSection[],
): boolean {
  if (parsePersonalityTraitsFromSections(sections).length > 0) return true;
  if (tinhCachIntroFromSections(sections).length > 0) return true;
  return false;
}
