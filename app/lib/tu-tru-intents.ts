import type { TuTruIntent } from "~/lib/api-types";

/**
 * Legacy / upstream Vietnamese strings for `good_for` / `avoid_for` matching.
 * `CUOI_HOI` displays as Dạm ngõ until API ships `DAM_NGO` (OpenAPI 0.1.2 still `CUOI_HOI`).
 */
export const INTENT_VIETNAMESE_ALIASES: Partial<
  Record<TuTruIntent, readonly string[]>
> = {
  CUOI_HOI: ["cưới hỏi"],
  DAM_CUOI: ["lễ cưới"],
};

/** Labels for Chọn ngày — value matches OpenAPI `IntentEnum`. */
export const TU_TRU_INTENT_OPTIONS: readonly {
  value: TuTruIntent;
  label: string;
}[] = [
  { value: "MAC_DINH", label: "Mặc định" },
  { value: "KHAI_TRUONG", label: "Khai trương" },
  { value: "KY_HOP_DONG", label: "Ký hợp đồng" },
  { value: "CAU_TAI", label: "Cầu tài" },
  { value: "NHAM_CHUC", label: "Nhậm chức" },
  { value: "CUOI_HOI", label: "Dạm ngõ" },
  { value: "AN_HOI", label: "Ăn hỏi" },
  { value: "DAM_CUOI", label: "Đám cưới" },
  { value: "CAU_TU", label: "Cầu tự" },
  { value: "DONG_THO", label: "Động thổ" },
  { value: "NHAP_TRACH", label: "Nhập trạch" },
  { value: "LAM_NHA", label: "Làm nhà" },
  { value: "MUA_NHA_DAT", label: "Mua nhà đất" },
  { value: "XAY_BEP", label: "Xây bếp" },
  { value: "LAM_GIUONG", label: "Làm giường" },
  { value: "DAO_GIENG", label: "Đào giếng" },
  { value: "AN_TANG", label: "An táng" },
  { value: "CAI_TANG", label: "Cải táng" },
  { value: "XUAT_HANH", label: "Xuất hành" },
  { value: "DI_CHUYEN_NGOAI", label: "Di chuyển xa" },
  { value: "TE_TU", label: "Tế tự" },
  { value: "GIAI_HAN", label: "Giải hạn" },
  { value: "KHAM_BENH", label: "Khám bệnh" },
  { value: "PHAU_THUAT", label: "Phẫu thuật" },
  { value: "NHAP_HOC_THI_CU", label: "Nhập học / thi cử" },
  { value: "KIEN_TUNG", label: "Kiện tụng" },
  { value: "TRONG_CAY", label: "Trồng cây" },
  { value: "CAT_TOC", label: "Cắt tóc" },
  { value: "XAM_MINH", label: "Xăm hình" },
] as const;

export function matchesIntentVietnameseLabel(
  intentValue: TuTruIntent,
  vietnameseLabel: string,
): boolean {
  const opt = TU_TRU_INTENT_OPTIONS.find((o) => o.value === intentValue);
  if (!opt) return false;
  const lc = vietnameseLabel.trim().toLowerCase();
  if (!lc) return false;
  if (opt.label.toLowerCase() === lc) return true;
  const aliases = INTENT_VIETNAMESE_ALIASES[intentValue];
  return aliases?.some((a) => a.toLowerCase() === lc) ?? false;
}
