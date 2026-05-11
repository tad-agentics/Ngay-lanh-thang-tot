/** Map Make / UI feature keys → `feature_credit_costs.feature_key` (tech-spec §4). */
export const FEATURE_KEY_MAP: Record<string, string> = {
  ngay_hom_nay: "ngay_hom_nay",
  weekly_summary: "weekly_summary",
  lich_thang_overview: "lich_thang_overview",
  lich_thang: "lich_thang_overview",
  convert_date: "convert_date",
  chon_ngay_30: "chon_ngay_30",
  chon_ngay_60: "chon_ngay_60",
  chon_ngay_90: "chon_ngay_90",
  chon_ngay_detail: "chon_ngay_detail",
  ngay_chi_tiet: "day_detail",
  day_detail: "day_detail",
  la_so: "tu_tru",
  van_thang: "tieu_van",
  hop_tuoi: "hop_tuoi",
  phong_thuy: "phong_thuy",
  /** Luận giải chi tiết lá số — canonical key (miễn phí; bat-tu op `la-so`). */
  la_so_diengiai: "la_so_diengiai",
  chia_se: "share_card",
};

export function toDbFeatureKey(uiKey: string): string {
  return FEATURE_KEY_MAP[uiKey] ?? uiKey;
}
