import type { VanTrinhNamLuanContext } from "~/lib/van-trinh-nam-types";

export type VanTrinhSectionSlice = { id: string; text?: string | null };

const REQUIRED_A3 = ["a3_su_nghiep", "a3_tai_loc", "a3_tinh_cam", "a3_suc_khoe"];

function sectionText(
  sections: VanTrinhSectionSlice[],
  id: string,
): string {
  return sections.find((s) => s.id === id)?.text?.trim() ?? "";
}

export function vanTrinhNamPartAComplete(sections: VanTrinhSectionSlice[]): boolean {
  if (sectionText(sections, "a1_hook").length < 80) return false;
  if (sectionText(sections, "a2_you").length < 80) return false;
  return REQUIRED_A3.every((id) => sectionText(sections, id).length >= 60);
}

export function vanTrinhNamMonthComplete(
  sections: VanTrinhSectionSlice[],
  month: number,
): boolean {
  const p = `b${month}_`;
  return (
    sectionText(sections, `${p}theme`).length >= 40 &&
    sectionText(sections, `${p}emphasis`).length >= 40 &&
    sectionText(sections, `${p}actions`).length >= 30
  );
}

export function vanTrinhNamClosingComplete(sections: VanTrinhSectionSlice[]): boolean {
  return sectionText(sections, "c_closing").length >= 80;
}

export type VanTrinhWaveTarget =
  | { kind: "part_a" }
  | { kind: "month"; monthNum: number }
  | { kind: "closing" };

export function listMissingVanTrinhWaves(
  sections: VanTrinhSectionSlice[],
  ctx: VanTrinhNamLuanContext | null,
): VanTrinhWaveTarget[] {
  if (!ctx || ctx.part_b.luu_nguyet_months.length !== 12) return [];
  const missing: VanTrinhWaveTarget[] = [];
  if (!vanTrinhNamPartAComplete(sections)) missing.push({ kind: "part_a" });
  for (let m = 1; m <= 12; m += 1) {
    if (!vanTrinhNamMonthComplete(sections, m)) {
      missing.push({ kind: "month", monthNum: m });
    }
  }
  if (!vanTrinhNamClosingComplete(sections)) missing.push({ kind: "closing" });
  return missing;
}

export function vanTrinhNamDeliveryIsComplete(
  sections: VanTrinhSectionSlice[],
  ctx: VanTrinhNamLuanContext | null,
): boolean {
  if (!ctx || ctx.part_b.luu_nguyet_months.length !== 12) return false;
  return listMissingVanTrinhWaves(sections, ctx).length === 0;
}
