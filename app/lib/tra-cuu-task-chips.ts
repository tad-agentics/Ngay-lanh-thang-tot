import type { TuTruIntent } from "~/lib/api-types";

/** Curated chips for Tra cứu v2 entry — 7 việc (no “Mua xe”; map MUA_NHA_DAT instead). */
export const TRA_CUU_TASK_CHIPS: readonly {
  label: string;
  intent: TuTruIntent;
}[] = [
  { label: "Khai trương", intent: "KHAI_TRUONG" },
  { label: "Ký hợp đồng", intent: "KY_HOP_DONG" },
  { label: "Cầu tài", intent: "CAU_TAI" },
  { label: "Đám cưới", intent: "DAM_CUOI" },
  { label: "Xuất hành", intent: "XUAT_HANH" },
  { label: "Động thổ", intent: "DONG_THO" },
  { label: "Mua nhà đất", intent: "MUA_NHA_DAT" },
] as const;
