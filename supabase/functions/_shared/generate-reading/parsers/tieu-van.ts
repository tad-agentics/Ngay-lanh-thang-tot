import type { LaSoChiTietSection } from "../core/types.ts";
import {
  MIN_TIEU_VAN_SECTION_CHARS,
  MIN_TIEU_VAN_SECTION_SENTENCE_ENDS,
} from "../core/config.ts";
import { countViSentenceEndings } from "./la-so.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";
import { pickFlowJsonField } from "./flow-json-sections.ts";

export const TIEU_VAN_SECTION_ORDER = [
  "nhin_chung",
  "thuc_tien",
  "ung_xu",
] as const;

const TIEU_VAN_TITLE: Record<(typeof TIEU_VAN_SECTION_ORDER)[number], string> =
  {
    nhin_chung: "Nhịp tháng & khung ngũ hành",
    thuc_tien: "Công việc, tài chính & quan hệ",
    ung_xu: "Đại vận & cách ứng xử",
  };

export function parseTieuVanSections(raw: string): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;
  const out: LaSoChiTietSection[] = [];
  for (const id of TIEU_VAN_SECTION_ORDER) {
    const t = pickFlowJsonField(record, id);
    if (!t) return null;
    out.push({
      id,
      title: TIEU_VAN_TITLE[id],
      text: t,
    });
  }
  return out;
}

function tieuVanSectionTooShort(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TIEU_VAN_SECTION_CHARS) return true;
  if (countViSentenceEndings(t) < MIN_TIEU_VAN_SECTION_SENTENCE_ENDS) {
    return true;
  }
  return false;
}

export function tieuVanSectionsNeedLengthRetry(
  sections: LaSoChiTietSection[] | null,
): boolean {
  if (!sections?.length) return false;
  const core = sections.filter((s) =>
    TIEU_VAN_SECTION_ORDER.includes(
      s.id as (typeof TIEU_VAN_SECTION_ORDER)[number],
    ),
  );
  if (core.length === 0) {
    return sections.some((s) => tieuVanSectionTooShort(s.text));
  }
  return core.some((s) => tieuVanSectionTooShort(s.text));
}
