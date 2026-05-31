import type { LaSoChiTietSection } from "~/lib/generate-reading";
import {
  hasLuuNienLifeAreaDisplayLuan,
  hasLuuNienLifeLuanFromSections,
  mergeLuuNienLifeAreasWithLuan,
} from "~/lib/luu-nien-life-ui";
import { parseLuuNienFactsView } from "~/lib/luu-nien-facts-ui";
import { hasLuuNienQuyNhanLuanFromSections } from "~/lib/luu-nien-ui";
import { parsePhongThuyFactsView } from "~/lib/phong-thuy-facts-ui";
import { hasPhongThuyStructuredLuanFromSections } from "~/lib/phong-thuy-ui";
import {
  hasTinhCachDisplayLuanFromSections,
  hasTinhCachLuanFromSections,
} from "~/lib/personality-traits-ui";

/** Khớp `MIN_MENH_TONG_QUAN_LUAN_CHARS` trong `bazi-reading-outline.ts`. */
const MIN_MENH_TONG_QUAN_LUAN_CHARS = 600;

function hasMenhTongQuanLuan(sections: LaSoChiTietSection[]): boolean {
  const menh =
    sections.find((s) => s.id === "menh_tong_quan")?.text?.trim() ??
    sections.find((s) => s.id === "tong_hop")?.text?.trim() ??
    "";
  return menh.length >= MIN_MENH_TONG_QUAN_LUAN_CHARS;
}

export type BaziChapterLoadStatus = "idle" | "loading" | "done" | "failed";

export type BaziChapterLoadState = {
  menh_tong_quan: BaziChapterLoadStatus;
  tinh_cach: BaziChapterLoadStatus;
  van_nam: BaziChapterLoadStatus;
  phong_thuy: BaziChapterLoadStatus;
  quy_nhan: BaziChapterLoadStatus;
};

export function createInitialChapterLoadState(): BaziChapterLoadState {
  return {
    menh_tong_quan: "loading",
    tinh_cach: "loading",
    van_nam: "loading",
    phong_thuy: "loading",
    quy_nhan: "loading",
  };
}

/** Derive per-§ status from merged sections (staged generate). */
export function deriveChapterLoadState(
  sections: LaSoChiTietSection[],
  opts: {
    luuNienFactsRaw?: unknown | null;
    phongThuyFactsRaw?: unknown | null;
    phongThuyFetchError?: string | null;
    bundleFinished: boolean;
  },
): BaziChapterLoadState {
  const luuFacts = opts.luuNienFactsRaw
    ? parseLuuNienFactsView(opts.luuNienFactsRaw)
    : null;
  const expectedLife = Math.max(1, luuFacts?.lifeAreas.length ?? 4);
  const ptFacts = opts.phongThuyFactsRaw
    ? parsePhongThuyFactsView(opts.phongThuyFactsRaw)
    : null;

  const menhDone = hasMenhTongQuanLuan(sections);
  const lifeAreas = mergeLuuNienLifeAreasWithLuan(luuFacts, sections);
  const tinhDone =
    hasTinhCachLuanFromSections(sections) ||
    hasTinhCachDisplayLuanFromSections(sections);
  const vanDone =
    !luuFacts ||
    hasLuuNienLifeLuanFromSections(sections, expectedLife) ||
    hasLuuNienLifeAreaDisplayLuan(lifeAreas, expectedLife);
  const needsQuy = Boolean(luuFacts?.quyNhan || luuFacts?.daiVanNext);
  const quyDone = !needsQuy || hasLuuNienQuyNhanLuanFromSections(sections);
  const phongDone =
    opts.phongThuyFetchError != null
      ? false
      : opts.phongThuyFactsRaw == null
        ? true
        : hasPhongThuyStructuredLuanFromSections(sections, ptFacts);

  const status = (
    done: boolean,
    applicable: boolean,
  ): BaziChapterLoadStatus => {
    if (!applicable) return "idle";
    if (done) return "done";
    if (opts.bundleFinished) return "failed";
    return "loading";
  };

  return {
    menh_tong_quan: status(menhDone, true),
    tinh_cach: status(tinhDone, true),
    van_nam: status(vanDone, luuFacts != null),
    phong_thuy: status(phongDone, opts.phongThuyFactsRaw != null),
    quy_nhan: status(quyDone, needsQuy),
  };
}
