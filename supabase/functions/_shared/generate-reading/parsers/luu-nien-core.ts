import type { LaSoChiTietSection } from "../core/types.ts";
import {
  MIN_LUU_NIEN_LIFE_AREA_CHARS,
  MIN_LUU_NIEN_UNG_XU_CHARS,
  MIN_LUU_NIEN_UNG_XU_CHARS_RELAXED,
  MIN_LUU_NIEN_UNG_XU_PARAGRAPHS,
  MIN_LUU_NIEN_UNG_XU_PARAGRAPHS_RELAXED,
  MIN_TIEU_VAN_SECTION_CHARS,
  MIN_TIEU_VAN_SECTION_SENTENCE_ENDS,
} from "../core/config.ts";
import { countMenhPreviewParagraphs, countViSentenceEndings } from "./la-so.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";
import { pickFlowJsonField } from "./flow-json-sections.ts";
import { LUU_NIEN_LIFE_AREA_PREFIX } from "./luu-nien-life.ts";

/** Số life_areas LLM tối thiểu để coi cache lưu niên hợp lệ — khớp FE. */
export const LUU_NIEN_FULL_LIFE_AREA_COUNT = 4;

export const LUU_NIEN_CORE_SECTION_ORDER = [
  "nhin_chung",
  "thuc_tien",
  "ung_xu",
] as const;

const LUU_NIEN_CORE_TITLE: Record<
  (typeof LUU_NIEN_CORE_SECTION_ORDER)[number],
  string
> = {
  nhin_chung: "Nhịp năm & khung ngũ hành",
  thuc_tien: "Công việc, tài chính & quan hệ",
  ung_xu: "Quý nhân · lưu ý",
};

function isUngXuSectionId(id: string): boolean {
  return id === "ung_xu" || id === "luu_nien_ung_xu";
}

function coreNhipSectionTooShort(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TIEU_VAN_SECTION_CHARS) return true;
  if (countViSentenceEndings(t) < MIN_TIEU_VAN_SECTION_SENTENCE_ENDS) {
    return true;
  }
  return false;
}

function ungXuSectionTooShort(text: string, relaxed = false): boolean {
  const t = text.trim();
  const minChars = relaxed
    ? MIN_LUU_NIEN_UNG_XU_CHARS_RELAXED
    : MIN_LUU_NIEN_UNG_XU_CHARS;
  const minParagraphs = relaxed
    ? MIN_LUU_NIEN_UNG_XU_PARAGRAPHS_RELAXED
    : MIN_LUU_NIEN_UNG_XU_PARAGRAPHS;
  if (t.length < minChars) return true;
  if (countMenhPreviewParagraphs(t) < minParagraphs) return true;
  return false;
}

function coreSectionTooShort(sectionId: string, text: string): boolean {
  const bare = sectionId.replace(/^luu_nien_/, "");
  if (isUngXuSectionId(bare) || isUngXuSectionId(sectionId)) {
    return ungXuSectionTooShort(text);
  }
  return coreNhipSectionTooShort(text);
}

export function parseLuuNienCoreSections(
  raw: string,
): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;
  const out: LaSoChiTietSection[] = [];
  for (const id of LUU_NIEN_CORE_SECTION_ORDER) {
    const t = pickFlowJsonField(record, id);
    if (!t) return null;
    out.push({
      id: `luu_nien_${id}`,
      title: LUU_NIEN_CORE_TITLE[id],
      text: t,
    });
  }
  return out;
}

export function luuNienCoreSectionsNeedLengthRetry(
  sections: LaSoChiTietSection[] | null,
): boolean {
  if (!sections?.length) return false;
  const core = sections.filter(
    (s) =>
      s.id === "luu_nien_nhin_chung" ||
      s.id === "luu_nien_thuc_tien" ||
      s.id === "luu_nien_ung_xu" ||
      s.id === "nhin_chung" ||
      s.id === "thuc_tien" ||
      s.id === "ung_xu",
  );
  if (core.length === 0) return false;
  return core.some((s) => coreSectionTooShort(s.id, s.text));
}

/** Cache read — trả partial nếu có ≥1 life_area đủ dài (FE bổ sung mục thiếu). */
export function luuNienLifeCachedSectionsValid(
  sections: LaSoChiTietSection[],
): boolean {
  return sections.some(
    (s) =>
      s.id.startsWith(LUU_NIEN_LIFE_AREA_PREFIX) &&
      s.text.trim().length >= MIN_LUU_NIEN_LIFE_AREA_CHARS,
  );
}

/** @deprecated Use luuNienLifeCachedSectionsValid */
export const luuNienCachedSectionsValid = luuNienLifeCachedSectionsValid;

/** Cache `only_luu_nien_core` — đủ 3 phần nhịp năm. */
export function luuNienCoreCachedSectionsValid(
  sections: LaSoChiTietSection[],
): boolean {
  const coreIds = new Set(
    LUU_NIEN_CORE_SECTION_ORDER.map((id) => `luu_nien_${id}`),
  );
  const ok = sections.filter(
    (s) =>
      coreIds.has(s.id) &&
      !coreSectionTooShort(s.id, s.text),
  ).length;
  return ok >= LUU_NIEN_CORE_SECTION_ORDER.length;
}
