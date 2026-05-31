import type { LaSoJson } from "~/lib/api-types";
import type { LaSoChiTietSection } from "~/lib/generate-reading";
import { splitNlttLuanParagraphs } from "~/lib/nltt-luan-prose";

const TINH_CACH_INTRO_SECTION_ID = "tinh_cach_intro";
const TINH_CACH_TRAIT_PREFIX = "tinh_cach_trait_";

/** Khớp Edge `MIN_TINH_CACH_TRAIT_CHARS`. */
export const MIN_TINH_CACH_TRAIT_LUAN_CHARS = 420;
export const MIN_TINH_CACH_TRAIT_LUAN_PARAGRAPHS = 2;
/** Tối thiểu số mục trait có luận đủ dài — tránh chỉ có intro. */
export const MIN_TINH_CACH_TRAITS_WITH_LUAN = 2;
/** Hiển thị UI — chấp nhận luận ngắn/partial từ LLM. */
export const MIN_TINH_CACH_DISPLAY_CHARS = 80;

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

function traitLuanMeetsMin(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TINH_CACH_TRAIT_LUAN_CHARS) return false;
  if (splitNlttLuanParagraphs(t).length < MIN_TINH_CACH_TRAIT_LUAN_PARAGRAPHS) {
    return false;
  }
  return true;
}

export function countTinhCachTraitsWithLuan(
  sections: LaSoChiTietSection[],
): number {
  return parsePersonalityTraitsFromSections(sections).filter((t) =>
    traitLuanMeetsMin(t.text),
  ).length;
}

/** §02 — cần ít nhất 2 mục trait LLM đủ dài; intro một mình không đủ. */
export function hasTinhCachLuanFromSections(
  sections: LaSoChiTietSection[],
): boolean {
  return (
    countTinhCachTraitsWithLuan(sections) >= MIN_TINH_CACH_TRAITS_WITH_LUAN
  );
}

function normalizeTraitId(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/** Trait id API chưa có luận đủ delivery — gọi supplement `tinh_cach_trait_ids`. */
export function missingTinhCachTraitIds(
  laSo: LaSoJson | null | undefined,
  sections: LaSoChiTietSection[],
): string[] {
  const expected =
    parsePersonalityTraitsFromLaSo(laSo).length > 0
      ? parsePersonalityTraitsFromLaSo(laSo).map((t) => normalizeTraitId(t.id))
      : ["diem_manh", "ca_tinh", "can_luu", "tinh_cam"];
  const have = new Set(
    parsePersonalityTraitsFromSections(sections)
      .filter((t) => traitLuanMeetsMin(t.text))
      .map((t) => normalizeTraitId(t.id)),
  );
  return expected.filter((id) => !have.has(id));
}

/** §02 — có ít nhất một trait LLM đủ dài để hiển thị (không chỉ intro API). */
export function hasTinhCachDisplayLuanFromSections(
  sections: LaSoChiTietSection[],
): boolean {
  return parsePersonalityTraitsFromSections(sections).some(
    (t) => t.text.trim().length >= MIN_TINH_CACH_DISPLAY_CHARS,
  );
}

/**
 * Upsert §02 supplement theo id (gap-fill chỉ trả subset trait — không xóa
 * trait đã có). Drop legacy `tinh_cach` (singular) khi có supplement mới.
 */
export function mergeLaSoTinhCachSections(
  existing: LaSoChiTietSection[],
  tinhCach: LaSoChiTietSection[],
): LaSoChiTietSection[] {
  if (tinhCach.length === 0) return existing;
  const supplementIds = new Set(tinhCach.map((s) => s.id));
  const kept = existing.filter(
    (s) => s.id !== "tinh_cach" && !supplementIds.has(s.id),
  );
  return [...kept, ...tinhCach];
}
