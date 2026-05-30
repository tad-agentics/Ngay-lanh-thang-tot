import type { LaSoChiTietSection } from "../core/types.ts";
import {
  MIN_TIEU_VAN_SECTION_CHARS,
  MIN_TIEU_VAN_SECTION_SENTENCE_ENDS,
} from "../core/config.ts";
import { countViSentenceEndings } from "./la-so.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";

export const TIEU_VAN_LUU_NIEN_SECTION_ORDER = [
  "nhin_chung",
  "thuc_tien",
  "ung_xu",
] as const;

const TIEU_VAN_LUU_NIEN_TITLE: Record<
  (typeof TIEU_VAN_LUU_NIEN_SECTION_ORDER)[number],
  (endpoint: string) => string
> = {
  nhin_chung: (endpoint) =>
    endpoint === "luu-nien"
      ? "Nhịp năm & khung ngũ hành"
      : "Nhịp tháng & khung ngũ hành",
  thuc_tien: () => "Công việc, tài chính & quan hệ",
  ung_xu: () => "Đại vận & cách ứng xử",
};

function tieuVanLuuNienSectionTitle(
  id: (typeof TIEU_VAN_LUU_NIEN_SECTION_ORDER)[number],
  endpoint: string,
): string {
  return TIEU_VAN_LUU_NIEN_TITLE[id](endpoint);
}

function snakeToCamelAlias(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function coerceLaSoSectionText(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim().replace(/^\s*[-*•]\s+/gm, "").trim();
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

function pickTieuVanLuuNienField(
  record: Record<string, unknown>,
  snake: string,
): string | null {
  const camel = snakeToCamelAlias(snake);
  return (
    coerceLaSoSectionText(record[snake]) ??
    coerceLaSoSectionText(record[camel])
  );
}

export function parseTieuVanLuuNienSections(
  raw: string,
  endpoint: string,
): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;
  const out: LaSoChiTietSection[] = [];
  for (const id of TIEU_VAN_LUU_NIEN_SECTION_ORDER) {
    const t = pickTieuVanLuuNienField(record, id);
    if (!t) return null;
    out.push({
      id,
      title: tieuVanLuuNienSectionTitle(id, endpoint),
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
  return sections.some((s) => tieuVanSectionTooShort(s.text));
}
