import { sanitizeNlttLuanProse } from "../../nltt-luan-prose.ts";
import {
  MIN_PHONG_THUY_HUONG_CHARS,
  MIN_PHONG_THUY_HUONG_PARAGRAPHS,
  MIN_PHONG_THUY_MAU_CHARS,
  MIN_PHONG_THUY_MAU_PARAGRAPHS,
  MIN_PHONG_THUY_PHI_TINH_CHARS,
  MIN_PHONG_THUY_PHI_TINH_PARAGRAPHS,
} from "../core/config.ts";
import type { LaSoChiTietSection } from "../core/types.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";
import { countMenhPreviewParagraphs } from "./la-so.ts";

export const PHONG_THUY_HUONG_SECTION_ID = "phong_thuy_huong";
export const PHONG_THUY_MAU_SECTION_ID = "phong_thuy_mau";
export const PHONG_THUY_PHI_TINH_SECTION_ID = "phong_thuy_phi_tinh";

/** Legacy single-block prose. */
export const PHONG_THUY_VAN_SECTION_ID = "phong_thuy_van";

export const PHONG_THUY_SECTION_IDS = [
  PHONG_THUY_HUONG_SECTION_ID,
  PHONG_THUY_MAU_SECTION_ID,
  PHONG_THUY_PHI_TINH_SECTION_ID,
] as const;

const TITLE_BY_ID: Record<(typeof PHONG_THUY_SECTION_IDS)[number], string> = {
  [PHONG_THUY_HUONG_SECTION_ID]: "Hướng tốt cho bạn",
  [PHONG_THUY_MAU_SECTION_ID]: "Màu sắc hợp",
  [PHONG_THUY_PHI_TINH_SECTION_ID]: "Sao bay trong nhà",
};

export const MIN_PHONG_THUY_HUONG_CHARS_RELAXED = 320;
export const MIN_PHONG_THUY_MAU_CHARS_RELAXED = 320;
export const MIN_PHONG_THUY_PHI_TINH_CHARS_RELAXED = 560;
export const MIN_PHONG_THUY_PHI_TINH_PARAGRAPHS_RELAXED = 3;

type BlockSpec = {
  minChars: number;
  minParagraphs: number;
  relaxedChars: number;
  relaxedParagraphs: number;
};

const BLOCK_SPECS: Record<(typeof PHONG_THUY_SECTION_IDS)[number], BlockSpec> = {
  [PHONG_THUY_HUONG_SECTION_ID]: {
    minChars: MIN_PHONG_THUY_HUONG_CHARS,
    minParagraphs: MIN_PHONG_THUY_HUONG_PARAGRAPHS,
    relaxedChars: MIN_PHONG_THUY_HUONG_CHARS_RELAXED,
    relaxedParagraphs: 2,
  },
  [PHONG_THUY_MAU_SECTION_ID]: {
    minChars: MIN_PHONG_THUY_MAU_CHARS,
    minParagraphs: MIN_PHONG_THUY_MAU_PARAGRAPHS,
    relaxedChars: MIN_PHONG_THUY_MAU_CHARS_RELAXED,
    relaxedParagraphs: 2,
  },
  [PHONG_THUY_PHI_TINH_SECTION_ID]: {
    minChars: MIN_PHONG_THUY_PHI_TINH_CHARS,
    minParagraphs: MIN_PHONG_THUY_PHI_TINH_PARAGRAPHS,
    relaxedChars: MIN_PHONG_THUY_PHI_TINH_CHARS_RELAXED,
    relaxedParagraphs: MIN_PHONG_THUY_PHI_TINH_PARAGRAPHS_RELAXED,
  },
};

export function phongThuyBlockProseTooShort(
  text: string,
  sectionId: (typeof PHONG_THUY_SECTION_IDS)[number],
  relaxed = false,
): boolean {
  const spec = BLOCK_SPECS[sectionId];
  const t = text.trim();
  const minChars = relaxed ? spec.relaxedChars : spec.minChars;
  const minParagraphs = relaxed ? spec.relaxedParagraphs : spec.minParagraphs;
  if (t.length < minChars) return true;
  if (countMenhPreviewParagraphs(t) < minParagraphs) return true;
  return false;
}

function parseBlockText(raw: string): string | null {
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;
  const text = record.text ?? record.noi_dung ?? record.body;
  if (typeof text !== "string") return null;
  const t = sanitizeNlttLuanProse(text.trim());
  return t.length > 0 ? t : null;
}

export function parsePhongThuyBlockResponse(
  raw: string,
  sectionId: (typeof PHONG_THUY_SECTION_IDS)[number],
  relaxed = false,
): LaSoChiTietSection | null {
  const text = parseBlockText(raw);
  if (!text || phongThuyBlockProseTooShort(text, sectionId, relaxed)) return null;
  return {
    id: sectionId,
    title: TITLE_BY_ID[sectionId],
    text,
  };
}

export function phongThuyBlockFromSections(
  sections: LaSoChiTietSection[],
  sectionId: (typeof PHONG_THUY_SECTION_IDS)[number],
): LaSoChiTietSection | null {
  const s = sections.find((x) => x.id === sectionId);
  if (!s || phongThuyBlockProseTooShort(s.text, sectionId)) return null;
  return s;
}

/** Cache read — partial OK (≥1 block hợp lệ); FE/generator bổ sung block thiếu. */
export function phongThuyCachedSectionsValid(
  sections: LaSoChiTietSection[],
): boolean {
  return PHONG_THUY_SECTION_IDS.some(
    (id) => phongThuyBlockFromSections(sections, id) != null,
  );
}

/** Cache hit đủ 3 khối — trả thẳng, không gọi LLM. */
export function phongThuyAllBlocksCachedValid(
  sections: LaSoChiTietSection[],
): boolean {
  return PHONG_THUY_SECTION_IDS.every(
    (id) => phongThuyBlockFromSections(sections, id) != null,
  );
}

export function phongThuyMissingBlockIds(
  sections: LaSoChiTietSection[],
): (typeof PHONG_THUY_SECTION_IDS)[number][] {
  return PHONG_THUY_SECTION_IDS.filter(
    (id) => phongThuyBlockFromSections(sections, id) == null,
  );
}
