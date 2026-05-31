import type { LaSoChiTietSection } from "../core/types.ts";
import {
  MIN_LUU_NIEN_LIFE_AREA_CHARS,
  MIN_TIEU_VAN_SECTION_CHARS,
  MIN_TIEU_VAN_SECTION_SENTENCE_ENDS,
} from "../core/config.ts";
import { countViSentenceEndings } from "./la-so.ts";
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
  ung_xu: "Đại vận & cách ứng xử",
};

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

function coreSectionTooShort(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TIEU_VAN_SECTION_CHARS) return true;
  if (countViSentenceEndings(t) < MIN_TIEU_VAN_SECTION_SENTENCE_ENDS) {
    return true;
  }
  return false;
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
  return core.some((s) => coreSectionTooShort(s.text));
}

/** Cache hợp lệ chỉ khi đủ 4 life_areas LLM (khớp FE delivery gate). */
export function luuNienCachedSectionsValid(
  sections: LaSoChiTietSection[],
): boolean {
  const lifeOk = sections.filter(
    (s) =>
      s.id.startsWith(LUU_NIEN_LIFE_AREA_PREFIX) &&
      s.text.trim().length >= MIN_LUU_NIEN_LIFE_AREA_CHARS,
  ).length;
  return lifeOk >= LUU_NIEN_FULL_LIFE_AREA_COUNT;
}
