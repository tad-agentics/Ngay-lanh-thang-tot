import type { LaSoChiTietSection } from "~/lib/generate-reading";

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

export function phongThuyProseFromSections(
  sections: LaSoChiTietSection[],
): string {
  return sections
    .filter((s) => s.id.startsWith("phong_thuy_"))
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** §04 — có luận LLM (không chỉ facts deterministic). */
export function hasPhongThuyLuanFromSections(
  sections: LaSoChiTietSection[],
): boolean {
  return phongThuyProseFromSections(sections).length >= 80;
}

export function phongThuySectionsFromGenerateReading(
  facts: unknown,
  reading: string | null,
): LaSoChiTietSection[] {
  const text = reading?.trim() || phongThuyFactsToProse(facts);
  if (!text) return [];
  return [{ id: "phong_thuy_van", title: "Phong thủy năm", text }];
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
