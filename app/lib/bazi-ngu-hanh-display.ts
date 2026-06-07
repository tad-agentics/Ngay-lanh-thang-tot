import { CT } from "~/lib/c-tokens";

export const BAZI_NGU_HANH_ORDER = ["moc", "hoa", "tho", "kim", "thuy"] as const;

export type BaziNguHanhKey = (typeof BAZI_NGU_HANH_ORDER)[number];

export const BAZI_NGU_HANH_BAR: Record<BaziNguHanhKey, string> = {
  kim: "#c8c5a0",
  moc: CT.greenMute,
  thuy: CT.forest,
  hoa: "#c5402a",
  tho: CT.goldDeep,
};

export const BAZI_NGU_HANH_LABEL: Record<BaziNguHanhKey, string> = {
  kim: "Kim",
  moc: "Mộc",
  thuy: "Thủy",
  hoa: "Hỏa",
  tho: "Thổ",
};

export type BaziNguHanhPercents = Partial<Record<BaziNguHanhKey, number>>;

export function buildBaziNguHanhBarRows(nguHanh: BaziNguHanhPercents) {
  return BAZI_NGU_HANH_ORDER.map((key) => ({
    key,
    label: BAZI_NGU_HANH_LABEL[key],
    v: Math.round(nguHanh[key] ?? 0),
    color: BAZI_NGU_HANH_BAR[key],
  }));
}
