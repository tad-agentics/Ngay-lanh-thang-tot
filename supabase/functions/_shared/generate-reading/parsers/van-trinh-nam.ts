import type { LaSoChiTietSection } from "../core/types.ts";
import { tryParseLaSoChiTietRecord } from "./json.ts";

function asRecord(x: unknown): Record<string, unknown> | null {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return x as Record<string, unknown>;
  }
  return null;
}

export function parseVanTrinhNamSections(raw: string): LaSoChiTietSection[] | null {
  const record = tryParseLaSoChiTietRecord(raw);
  if (!record) return null;

  const sectionsRaw = record.sections;
  if (Array.isArray(sectionsRaw)) {
    const out: LaSoChiTietSection[] = [];
    for (const row of sectionsRaw) {
      const r = asRecord(row);
      if (!r) continue;
      const id = typeof r.id === "string" ? r.id.trim() : "";
      const title = typeof r.title === "string" ? r.title.trim() : "";
      const text = typeof r.text === "string" ? r.text.trim() : "";
      if (!id || !text) continue;
      out.push({ id, title: title || id, text });
    }
    return out.length > 0 ? out : null;
  }

  const out: LaSoChiTietSection[] = [];
  for (const [id, value] of Object.entries(record)) {
    if (id === "sections") continue;
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) continue;
    out.push({ id, title: id, text });
  }
  return out.length > 0 ? out : null;
}

const MIN_PART_A = 120;
const MIN_MONTH = 80;
const MIN_CLOSING = 120;

function sectionTooShort(id: string, text: string): boolean {
  const t = text.trim();
  if (id === "c_closing") return t.length < MIN_CLOSING;
  if (id.startsWith("b") && id.includes("_")) return t.length < MIN_MONTH;
  if (id.startsWith("a")) return t.length < MIN_PART_A;
  return t.length < 60;
}

export function vanTrinhNamSectionsNeedLengthRetry(
  sections: LaSoChiTietSection[] | null,
): boolean {
  if (!sections?.length) return true;
  return sections.some((s) => sectionTooShort(s.id, s.text));
}
