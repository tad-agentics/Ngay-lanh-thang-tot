import type { TuTruIntent } from "~/lib/api-types";

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
  { value: "AN_HOI", label: "Ăn hỏi" },
  { value: "CUOI_HOI", label: "Cưới hỏi" },
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
] as const;
