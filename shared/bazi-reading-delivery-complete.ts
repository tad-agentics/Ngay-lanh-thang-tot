/**
 * Bát Tự delivery completeness — shared by app, tests, and Edge prewarm.
 * No browser/Deno APIs.
 */

export type DeliverySection = {
  id: string;
  title: string;
  text: string;
};

export const MIN_MENH_TONG_QUAN_LUAN_CHARS = 600;

const TINH_CACH_TRAIT_PREFIX = "tinh_cach_trait_";
const MIN_TINH_CACH_TRAIT_LUAN_CHARS = 420;
const MIN_TINH_CACH_TRAIT_LUAN_PARAGRAPHS = 2;
const MIN_TINH_CACH_TRAITS_WITH_LUAN = 2;

const LUU_NIEN_LIFE_AREA_PREFIX = "luu_nien_life_";
const MIN_LUU_NIEN_LIFE_LUAN_CHARS = 420;
const MIN_LUU_NIEN_LIFE_LUAN_PARAGRAPHS = 3;

const MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS = 720;
const MIN_LUU_NIEN_QUY_NHAN_LUAN_PARAGRAPHS = 4;

export const PHONG_THUY_HUONG_SECTION_ID = "phong_thuy_huong";
export const PHONG_THUY_MAU_SECTION_ID = "phong_thuy_mau";
export const PHONG_THUY_PHI_TINH_SECTION_ID = "phong_thuy_phi_tinh";
export const PHONG_THUY_VAN_SECTION_ID = "phong_thuy_van";

const MIN_PHONG_THUY_HUONG_LUAN_CHARS = 320;
const MIN_PHONG_THUY_MAU_LUAN_CHARS = 320;
const MIN_PHONG_THUY_PHI_TINH_LUAN_CHARS = 560;

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

function splitParagraphs(text: string): string[] {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function unwrapFactsRoot(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) return null;
  return asRecord(root.data) ?? asRecord(root.result) ?? root;
}

export type LuuNienFactsMinimal = {
  lifeAreas: { id: string }[];
  quyNhan: { tuoiHop: string[] } | null;
  daiVanNext: unknown | null;
};

export type PhongThuyFactsMinimal = {
  huongTot: unknown[];
  mauMay: unknown[];
  phiTinh: unknown[];
};

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim()) out.push(x.trim());
    else {
      const o = asRecord(x);
      if (o) {
        const n = pickStr(o, ["name", "label", "tuoi", "chi"]);
        if (n) out.push(n);
      }
    }
  }
  return out;
}

/** Minimal parser for completeness checks only. */
export function parseLuuNienFactsMinimal(data: unknown): LuuNienFactsMinimal | null {
  const root = unwrapFactsRoot(data);
  if (!root) return null;

  const lifeRaw = root.life_areas ?? root.lifeAreas;
  const lifeAreas: { id: string }[] = [];
  if (Array.isArray(lifeRaw)) {
    for (const item of lifeRaw) {
      const o = asRecord(item);
      if (!o) continue;
      const id =
        pickStr(o, ["id", "key"]) ||
        pickStr(o, ["label_vi", "label", "title", "name"]) ||
        `area-${lifeAreas.length}`;
      lifeAreas.push({ id });
    }
  }

  const block =
    asRecord(root.quy_nhan) ??
    asRecord(root.quyNhan) ??
    asRecord(root.quy_nhan_luu_y) ??
    null;
  const tuoiHop = stringList(
    block?.tuoi_hop ?? block?.tuoiHop ?? root.tuoi_hop ?? root.tuoiHop,
  );
  const quyNhan =
    tuoiHop.length > 0 ||
    stringList(block?.tuoi_xung ?? block?.tuoiXung).length > 0 ||
    pickStr(block ?? root, ["huong_quy_nhan", "huongQuyNhan"])
      ? { tuoiHop }
      : null;

  const daiVanNext = root.dai_van_next ?? root.daiVanNext ?? null;

  return { lifeAreas, quyNhan, daiVanNext };
}

export function parsePhongThuyFactsMinimal(data: unknown): PhongThuyFactsMinimal | null {
  const root = unwrapFactsRoot(data);
  if (!root) return null;

  const huongTot = root.huong_tot_nam_nay ?? root.huong_tot ?? root.huongTot;
  const mauMay = root.mau_may_man ?? root.mauMayMan;
  const phiTinh = root.phi_tinh ?? root.phiTinh;

  return {
    huongTot: Array.isArray(huongTot) ? huongTot : [],
    mauMay: Array.isArray(mauMay) ? mauMay : [],
    phiTinh: Array.isArray(phiTinh) ? phiTinh : [],
  };
}

function sectionText(sections: DeliverySection[], id: string): string {
  return sections.find((s) => s.id === id)?.text?.trim() ?? "";
}

function hasMenhTongQuanLuan(sections: DeliverySection[]): boolean {
  const menh = sectionText(sections, "menh_tong_quan");
  return menh.length >= MIN_MENH_TONG_QUAN_LUAN_CHARS;
}

function isTraitLuanComplete(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_TINH_CACH_TRAIT_LUAN_CHARS) return false;
  return splitParagraphs(t).length >= MIN_TINH_CACH_TRAIT_LUAN_PARAGRAPHS;
}

function hasTinhCachLuan(sections: DeliverySection[]): boolean {
  let count = 0;
  for (const s of sections) {
    if (!s.id.startsWith(TINH_CACH_TRAIT_PREFIX)) continue;
    if (isTraitLuanComplete(s.text)) count += 1;
  }
  return count >= MIN_TINH_CACH_TRAITS_WITH_LUAN;
}

function isLifeAreaLuanComplete(text: string): boolean {
  const t = text.trim();
  return (
    t.length >= MIN_LUU_NIEN_LIFE_LUAN_CHARS &&
    splitParagraphs(t).length >= MIN_LUU_NIEN_LIFE_LUAN_PARAGRAPHS
  );
}

function hasLuuNienLifeLuan(
  sections: DeliverySection[],
  expectedCount: number,
): boolean {
  let count = 0;
  for (const s of sections) {
    if (!s.id.startsWith(LUU_NIEN_LIFE_AREA_PREFIX)) continue;
    if (isLifeAreaLuanComplete(s.text)) count += 1;
  }
  return count >= expectedCount;
}

function hasLuuNienQuyNhanLuan(sections: DeliverySection[]): boolean {
  const text = sectionText(sections, "luu_nien_ung_xu");
  if (text.length < MIN_LUU_NIEN_QUY_NHAN_LUAN_CHARS) return false;
  return splitParagraphs(text).length >= MIN_LUU_NIEN_QUY_NHAN_LUAN_PARAGRAPHS;
}

function hasPhongThuyStructuredLuan(
  sections: DeliverySection[],
  facts?: PhongThuyFactsMinimal | null,
): boolean {
  const huong = sectionText(sections, PHONG_THUY_HUONG_SECTION_ID);
  const mau = sectionText(sections, PHONG_THUY_MAU_SECTION_ID);
  const phi = sectionText(sections, PHONG_THUY_PHI_TINH_SECTION_ID);

  const needsHuong = (facts?.huongTot.length ?? 0) > 0;
  const needsMau = (facts?.mauMay.length ?? 0) > 0;
  const needsPhi = (facts?.phiTinh.length ?? 0) > 0;

  if (!needsHuong && !needsMau && !needsPhi) {
    return (
      huong.length >= MIN_PHONG_THUY_HUONG_LUAN_CHARS ||
      mau.length >= MIN_PHONG_THUY_MAU_LUAN_CHARS ||
      (phi.length >= MIN_PHONG_THUY_PHI_TINH_LUAN_CHARS &&
        splitParagraphs(phi).length >= 3)
    );
  }

  if (needsHuong && huong.length < MIN_PHONG_THUY_HUONG_LUAN_CHARS) return false;
  if (needsMau && mau.length < MIN_PHONG_THUY_MAU_LUAN_CHARS) return false;
  if (
    needsPhi &&
    (phi.length < MIN_PHONG_THUY_PHI_TINH_LUAN_CHARS ||
      splitParagraphs(phi).length < 3)
  ) {
    return false;
  }
  return true;
}

function hasPhongThuyLuan(
  sections: DeliverySection[],
  facts?: PhongThuyFactsMinimal | null,
): boolean {
  const legacy = sectionText(sections, PHONG_THUY_VAN_SECTION_ID);
  if (legacy.length >= 80) return true;
  return hasPhongThuyStructuredLuan(sections, facts);
}

/** Đủ 5 § màn 18 để persist DB / fast-path cache. */
export function baziReadingDeliveryIsComplete(
  sections: DeliverySection[],
  opts?: {
    luuNienFactsRaw?: unknown | null;
    phongThuyFactsRaw?: unknown | null;
  },
): boolean {
  const luuFacts = opts?.luuNienFactsRaw
    ? parseLuuNienFactsMinimal(opts.luuNienFactsRaw)
    : null;
  const expectedLife = Math.max(1, luuFacts?.lifeAreas.length ?? 4);

  if (!hasMenhTongQuanLuan(sections)) return false;
  if (!hasTinhCachLuan(sections)) return false;
  if (!hasLuuNienLifeLuan(sections, expectedLife)) return false;

  const needsQuy = Boolean(luuFacts?.quyNhan || luuFacts?.daiVanNext);
  if (needsQuy && !hasLuuNienQuyNhanLuan(sections)) return false;

  if (opts?.phongThuyFactsRaw != null) {
    const ptFacts = parsePhongThuyFactsMinimal(opts.phongThuyFactsRaw);
    if (!hasPhongThuyLuan(sections, ptFacts)) return false;
  }

  return true;
}
