import { sanitizeNlttLuanProse } from "../../nltt-luan-prose.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import {
  MIN_MENH_PREVIEW_CHARS,
  MIN_MENH_PREVIEW_PARAGRAPHS,
  MIN_MENH_PREVIEW_SENTENCE_ENDS,
  MIN_TINH_CACH_INTRO_CHARS,
  MIN_TINH_CACH_TRAIT_CHARS,
  MIN_TINH_CACH_TRAIT_PARAGRAPHS,
} from "../core/config.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";

export const LA_SO_FALLBACK_SECTION_ID = "tong_hop";
export const LA_SO_FALLBACK_TITLE = "Luận giải";

export const LA_SO_ASPECT_ORDER = [
  "menh_tong_quan",
  "tinh_cach",
  "su_nghiep",
  "tai_van",
  "suc_khoe",
  "tinh_duyen",
] as const;

export const LA_SO_ASPECT_TITLES: Record<string, string> = {
  menh_tong_quan: "Mệnh tổng quan",
  tinh_cach: "Tính cách",
  su_nghiep: "Sự nghiệp",
  tai_van: "Tài vận",
  suc_khoe: "Sức khỏe",
  tinh_duyen: "Tình duyên",
};

const LA_SO_KEY_ALIAS: Record<string, string> = {
  menhTongQuan: "menh_tong_quan",
  tongQuan: "menh_tong_quan",
  tinhCach: "tinh_cach",
  suNghiep: "su_nghiep",
  taiVan: "tai_van",
  sucKhoe: "suc_khoe",
  tinhDuyen: "tinh_duyen",
};

function stripViCombiningKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeLaSoAspectKey(key: string): string | null {
  const k = key.trim();
  if (LA_SO_KEY_ALIAS[k]) return LA_SO_KEY_ALIAS[k];
  if (LA_SO_ASPECT_ORDER.includes(k as (typeof LA_SO_ASPECT_ORDER)[number])) {
    return k;
  }
  const underscored = stripViCombiningKey(k).replace(/\s+/g, "_");
  if (
    LA_SO_ASPECT_ORDER.includes(
      underscored as (typeof LA_SO_ASPECT_ORDER)[number],
    )
  ) {
    return underscored;
  }
  const compact = underscored.replace(/_/g, "");
  for (const id of LA_SO_ASPECT_ORDER) {
    if (id.replace(/_/g, "") === compact) return id;
  }
  return null;
}

function coerceLaSoSectionText(v: unknown): string | null {
  if (typeof v === "string") {
    const t = sanitizeNlttLuanProse(
      v.trim().replace(/^\s*[-*•]\s+/gm, "").trim(),
    );
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(v)) {
    const parts = v
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (!parts.length) return null;
    return parts.join(" ");
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const nest = o.text ?? o.body ?? o.content ?? o.noi_dung;
    return coerceLaSoSectionText(nest);
  }
  return null;
}

function sectionsFromExplicitArray(raw: unknown): LaSoChiTietSection[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LaSoChiTietSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const idRaw = typeof r.id === "string" ? r.id.trim() : "";
    const canon = normalizeLaSoAspectKey(idRaw);
    if (!canon) continue;
    const title =
      typeof r.title === "string" && r.title.trim()
        ? r.title.trim()
        : (LA_SO_ASPECT_TITLES[canon] ?? canon);
    const text = coerceLaSoSectionText(r.text);
    if (!text) continue;
    out.push({ id: canon, title, text });
  }
  return out.length > 0 ? out : null;
}

const LA_SO_NESTED_ASPECT_WRAPPERS = [
  "luan_giai",
  "luanGiai",
  "luận_giải",
  "reading",
  "chi_tiet",
  "chiTiet",
  "noi_dung",
  "noiDung",
] as const;

function flattenLaSoChiTietRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  let flat = { ...record };
  for (const w of LA_SO_NESTED_ASPECT_WRAPPERS) {
    const v = flat[w];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flat = { ...flat, ...(v as Record<string, unknown>) };
    }
  }
  return flat;
}

export function parseLaSoChiTietSections(
  text: string,
): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(text);
  if (!record) return null;

  const fromArr = sectionsFromExplicitArray(record.sections);
  if (fromArr?.length) return fromArr;

  const flat = flattenLaSoChiTietRecord(record);
  const byId = new Map<string, string>();

  for (const key of Object.keys(flat)) {
    if (key === "sections") continue;
    if ((LA_SO_NESTED_ASPECT_WRAPPERS as readonly string[]).includes(key)) {
      continue;
    }
    const canon = normalizeLaSoAspectKey(key);
    if (!canon) continue;
    const t = coerceLaSoSectionText(flat[key]);
    if (!t) continue;
    byId.set(canon, t);
  }

  const out: LaSoChiTietSection[] = [];
  for (const id of LA_SO_ASPECT_ORDER) {
    const t = byId.get(id);
    if (!t) continue;
    out.push({
      id,
      title: LA_SO_ASPECT_TITLES[id] ?? id,
      text: t,
    });
  }
  return out.length > 0 ? out : null;
}

export function laSoChiTietPreviewSections(
  sections: LaSoChiTietSection[],
): LaSoChiTietSection[] {
  const menh = sections.find((s) => s.id === "menh_tong_quan");
  if (menh) return [menh];
  return sections.slice(0, 1);
}

export function menhTongQuanFallbackSection(text: string): LaSoChiTietSection {
  return {
    id: "menh_tong_quan",
    title: LA_SO_ASPECT_TITLES.menh_tong_quan ?? "Mệnh tổng quan",
    text,
  };
}

export function countViSentenceEndings(text: string): number {
  return (text.match(/[.!?…]/g) ?? []).length;
}

export function countMenhPreviewParagraphs(text: string): number {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

export function menhTongQuanProseTooShort(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_MENH_PREVIEW_CHARS) return true;
  if (countViSentenceEndings(t) < MIN_MENH_PREVIEW_SENTENCE_ENDS) {
    return true;
  }
  if (countMenhPreviewParagraphs(t) < MIN_MENH_PREVIEW_PARAGRAPHS) {
    return true;
  }
  return false;
}

export function menhSectionFromParsed(
  sections: LaSoChiTietSection[] | null,
): LaSoChiTietSection | null {
  if (!sections?.length) return null;
  const picked = laSoChiTietPreviewSections(sections)[0];
  return picked ?? null;
}

export const TINH_CACH_INTRO_SECTION_ID = "tinh_cach_intro";
export const TINH_CACH_TRAIT_SECTION_PREFIX = "tinh_cach_trait_";

export type TinhCachTraitsPayload = {
  intro: string | null;
  traits: LaSoChiTietSection[];
};

function normalizeTraitId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "trait";
}

export function countTinhCachParagraphs(text: string): number {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

export const MIN_TINH_CACH_TRAIT_CHARS_RELAXED = 320;
export const MIN_TINH_CACH_TRAIT_PARAGRAPHS_RELAXED = 2;

export function tinhCachTraitProseTooShort(
  text: string,
  relaxed = false,
): boolean {
  const t = text.trim();
  if (relaxed) {
    if (t.length < MIN_TINH_CACH_TRAIT_CHARS_RELAXED) return true;
    if (countTinhCachParagraphs(t) < MIN_TINH_CACH_TRAIT_PARAGRAPHS_RELAXED) {
      return true;
    }
    return false;
  }
  if (t.length < MIN_TINH_CACH_TRAIT_CHARS) return true;
  if (countTinhCachParagraphs(t) < MIN_TINH_CACH_TRAIT_PARAGRAPHS) return true;
  return false;
}

export function parseTinhCachTraitsResponse(
  raw: string,
  opts?: { relaxed?: boolean },
): TinhCachTraitsPayload | null {
  const relaxed = opts?.relaxed === true;
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;

  const introRaw = record.tinh_cach_intro ?? record.tinhCachIntro;
  const intro =
    typeof introRaw === "string" && introRaw.trim().length >= MIN_TINH_CACH_INTRO_CHARS
      ? sanitizeNlttLuanProse(introRaw.trim())
      : null;

  const readingsRaw = record.personality_readings ?? record.personalityReadings;
  if (!Array.isArray(readingsRaw)) {
    return intro ? { intro, traits: [] } : null;
  }

  const traits: LaSoChiTietSection[] = [];
  for (const row of readingsRaw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const title =
      typeof r.title === "string" && r.title.trim()
        ? r.title.trim()
        : "Tính cách";
    const id = normalizeTraitId(
      typeof r.id === "string" ? r.id : title,
    );
    const text = coerceLaSoSectionText(r.text);
    if (!text || tinhCachTraitProseTooShort(text, relaxed)) continue;
    traits.push({
      id: `${TINH_CACH_TRAIT_SECTION_PREFIX}${id}`,
      title,
      text,
    });
  }

  if (!intro && traits.length === 0) return null;
  return { intro, traits };
}

export function tinhCachTraitsToLaSoSections(
  payload: TinhCachTraitsPayload,
): LaSoChiTietSection[] {
  const out: LaSoChiTietSection[] = [];
  if (payload.intro) {
    out.push({
      id: TINH_CACH_INTRO_SECTION_ID,
      title: "Tổng quan tính cách",
      text: payload.intro,
    });
  }
  out.push(...payload.traits);
  return out;
}
