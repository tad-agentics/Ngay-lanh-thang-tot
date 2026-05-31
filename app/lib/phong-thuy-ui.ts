import {
  coalesceGenerateReadingSections,
  type LaSoChiTietSection,
} from "~/lib/generate-reading";
import type { PhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";
import { splitNlttLuanParagraphs } from "~/lib/nltt-luan-prose";

export const PHONG_THUY_HUONG_SECTION_ID = "phong_thuy_huong";
export const PHONG_THUY_MAU_SECTION_ID = "phong_thuy_mau";
export const PHONG_THUY_PHI_TINH_SECTION_ID = "phong_thuy_phi_tinh";
/** Legacy single-block prose. */
export const PHONG_THUY_VAN_SECTION_ID = "phong_thuy_van";

export const MIN_PHONG_THUY_HUONG_LUAN_CHARS = 320;
export const MIN_PHONG_THUY_MAU_LUAN_CHARS = 320;
export const MIN_PHONG_THUY_PHI_TINH_LUAN_CHARS = 560;

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

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) out.push(x.trim());
    else {
      const o = asRecord(x);
      if (o) {
        const n = pickStr(o, ["name", "label", "direction", "huong"]);
        if (n) out.push(n);
      }
    }
  }
  return out;
}

/** Deterministic §04 copy from `PhongThuyResponse` when Gemini omits prose. */
export function phongThuyFactsToProse(facts: unknown): string {
  const root = asRecord(facts);
  if (!root) return "";

  const parts: string[] = [];
  const note = pickStr(root, ["phi_tinh_note_vi", "phiTinhNoteVi"]);
  if (note) parts.push(note);

  const huongTot = stringList(
    root.huong_tot_nam_nay ?? root.huong_tot ?? root.huongTot,
  );
  if (huongTot.length > 0) {
    parts.push(`Hướng thuận năm nay: ${huongTot.join(", ")}.`);
  }

  const huongXau = stringList(
    root.huong_xau_nam_nay ?? root.huong_xau ?? root.huongXau,
  );
  if (huongXau.length > 0) {
    parts.push(`Hướng nên hạn chế: ${huongXau.join(", ")}.`);
  }

  const mauMay = stringList(root.mau_may_man ?? root.mauMayMan);
  if (mauMay.length > 0) {
    parts.push(`Màu may mắn: ${mauMay.slice(0, 4).join(", ")}.`);
  }

  const hoaGiai = root.hoa_giai ?? root.hoaGiai;
  if (Array.isArray(hoaGiai)) {
    for (const item of hoaGiai.slice(0, 2)) {
      const o = asRecord(item);
      if (!o) continue;
      const dir = pickStr(o, ["direction", "huong", "label"]);
      const remedy = pickStr(o, ["remedy_vi", "remedyVi", "note", "text"]);
      if (dir && remedy) parts.push(`${dir}: ${remedy}`);
      else if (remedy) parts.push(remedy);
    }
  }

  return parts.join("\n\n");
}

function sectionText(sections: LaSoChiTietSection[], id: string): string {
  return sections.find((s) => s.id === id)?.text?.trim() ?? "";
}

export function phongThuyHuongLuanFromSections(
  sections: LaSoChiTietSection[],
): string {
  return sectionText(sections, PHONG_THUY_HUONG_SECTION_ID);
}

export function phongThuyMauLuanFromSections(
  sections: LaSoChiTietSection[],
): string {
  return sectionText(sections, PHONG_THUY_MAU_SECTION_ID);
}

export function phongThuyPhiTinhLuanFromSections(
  sections: LaSoChiTietSection[],
): string {
  return sectionText(sections, PHONG_THUY_PHI_TINH_SECTION_ID);
}

export function phongThuyProseFromSections(
  sections: LaSoChiTietSection[],
): string {
  const structured = [
    phongThuyHuongLuanFromSections(sections),
    phongThuyMauLuanFromSections(sections),
    phongThuyPhiTinhLuanFromSections(sections),
  ]
    .filter(Boolean)
    .join("\n\n");
  if (structured) return structured;
  return sections
    .filter((s) => s.id.startsWith("phong_thuy_"))
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function meetsHuongLuan(text: string): boolean {
  return text.length >= MIN_PHONG_THUY_HUONG_LUAN_CHARS;
}

function meetsMauLuan(text: string): boolean {
  return text.length >= MIN_PHONG_THUY_MAU_LUAN_CHARS;
}

function meetsPhiTinhLuan(text: string): boolean {
  return (
    text.length >= MIN_PHONG_THUY_PHI_TINH_LUAN_CHARS &&
    splitNlttLuanParagraphs(text).length >= 3
  );
}

/** §04 — 3 khối LLM (hướng · màu · phi tinh) — dùng cho UI từng mục, không gồm legacy. */
export function hasPhongThuyStructuredLuanFromSections(
  sections: LaSoChiTietSection[],
  facts?: PhongThuyFactsView | null,
): boolean {
  const needsHuong = (facts?.huongTot.length ?? 0) > 0;
  const needsMau = (facts?.mauMay.length ?? 0) > 0;
  const needsPhi = (facts?.phiTinh.length ?? 0) > 0;

  if (!needsHuong && !needsMau && !needsPhi) {
    return (
      meetsHuongLuan(phongThuyHuongLuanFromSections(sections)) ||
      meetsMauLuan(phongThuyMauLuanFromSections(sections)) ||
      meetsPhiTinhLuan(phongThuyPhiTinhLuanFromSections(sections))
    );
  }

  if (needsHuong && !meetsHuongLuan(phongThuyHuongLuanFromSections(sections))) {
    return false;
  }
  if (needsMau && !meetsMauLuan(phongThuyMauLuanFromSections(sections))) {
    return false;
  }
  if (needsPhi && !meetsPhiTinhLuan(phongThuyPhiTinhLuanFromSections(sections))) {
    return false;
  }
  return true;
}

export function phongThuyLegacyVanFromSections(
  sections: LaSoChiTietSection[],
): string {
  return sectionText(sections, PHONG_THUY_VAN_SECTION_ID);
}

/** §04 — đủ luận LLM theo facts (3 khối hoặc legacy `phong_thuy_van`). */
export function hasPhongThuyLuanFromSections(
  sections: LaSoChiTietSection[],
  facts?: PhongThuyFactsView | null,
): boolean {
  const legacy = phongThuyLegacyVanFromSections(sections);
  if (legacy.length >= 80) return true;
  return hasPhongThuyStructuredLuanFromSections(sections, facts);
}

/** Cache cũ / lỗi Edge: `reading` là JSON `{"sections":[...]}` thay vì `sections` riêng. */
export function parsePhongThuySectionsFromReadingJson(
  reading: string | null | undefined,
): LaSoChiTietSection[] {
  const raw = reading?.trim() ?? "";
  if (!raw.startsWith("{")) return [];
  try {
    const o = JSON.parse(raw) as { sections?: unknown };
    if (!Array.isArray(o.sections)) return [];
    const out: LaSoChiTietSection[] = [];
    for (const row of o.sections) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id.trim() : "";
      const text = typeof r.text === "string" ? r.text.trim() : "";
      if (!id || !text) continue;
      const title = typeof r.title === "string" ? r.title.trim() : id;
      out.push({
        id: id.startsWith("phong_thuy_") ? id : `phong_thuy_${id}`,
        title: title.length > 0 ? title : id,
        text,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function phongThuySectionsFromGenerateReading(
  facts: unknown,
  sections: LaSoChiTietSection[] | null,
  reading: string | null,
): LaSoChiTietSection[] {
  const coalesced = coalesceGenerateReadingSections(sections, reading, {
    idPrefix: "phong_thuy_",
    legacyId: "van",
    legacyTitle: "Phong thủy năm",
  });
  if (coalesced.length > 0) return coalesced;
  const text = phongThuyFactsToProse(facts);
  if (!text) return [];
  return [{ id: PHONG_THUY_VAN_SECTION_ID, title: "Phong thủy năm", text }];
}

/** Chèn §04 sau block lưu niên, trước `tai_van`. */
export function mergeBaziReadingWithPhongThuy(
  sections: LaSoChiTietSection[],
  phongThuySections: LaSoChiTietSection[],
): LaSoChiTietSection[] {
  if (phongThuySections.length === 0) return sections;

  const prefixed = phongThuySections.map((s) => ({
    ...s,
    id: s.id.startsWith("phong_thuy_") ? s.id : `phong_thuy_${s.id}`,
  }));

  let insertAt = sections.findIndex((s) => s.id === "tai_van");
  if (insertAt < 0) {
    const lastLuuNien = sections.reduce(
      (acc, s, i) => (s.id.startsWith("luu_nien_") ? i : acc),
      -1,
    );
    insertAt = lastLuuNien >= 0 ? lastLuuNien + 1 : sections.length;
  }

  return [
    ...sections.slice(0, insertAt),
    ...prefixed,
    ...sections.slice(insertAt),
  ];
}
