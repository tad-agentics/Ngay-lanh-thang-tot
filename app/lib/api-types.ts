/**
 * Canonical API + DB-aligned types for Ngày Lành Tháng Tốt.
 * DB column names use snake_case; Edge/Bát Tự responses may use camelCase — map at boundaries.
 */

// ─── Database entities (public schema) ─────────────────────────────────────

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  ngay_sinh: string | null;
  gio_sinh: string | null;
  gioi_tinh: "nam" | "nu" | null;
  la_so: LaSoJson | null;
  credits_balance: number;
  subscription_expires_at: string | null;
  birth_data_locked_at: string | null;
  onboarding_completed_at: string | null;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/** Stored in profiles.la_so — shape aligns with Make `MOCK_LASO` + pillars from Bát Tự API */
export interface LaSoJson {
  nhat_chu?: string;
  nhat_chu_han?: string;
  hanh?: string;
  menh?: string;
  dung_than?: string;
  ky_than?: string;
  /** Chuỗi tóm tắt hoặc object tu-tru-api (`current` / `cycles`). */
  dai_van?: string | Record<string, unknown>;
  ngu_hanh?: Record<string, number>;
  thien_can?: string[];
  dia_chi?: string[];
  [key: string]: unknown;
}

export interface FeatureCreditCost {
  feature_key: string;
  credit_cost: number;
  is_free: boolean;
  updated_at: string;
}

export interface AppConfigRow {
  config_key: string;
  value: string;
  updated_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  reason: string;
  feature_key: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type PaymentOrderStatus = "pending" | "paid" | "cancelled" | "failed";

export interface PaymentOrder {
  id: string;
  user_id: string;
  provider: string;
  provider_order_code: string | null;
  status: PaymentOrderStatus;
  package_sku: string;
  credits_to_add: number | null;
  subscription_months: number | null;
  amount_vnd: number | null;
  checkout_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareToken {
  id: string;
  token: string;
  user_id: string | null;
  result_type: string;
  payload: SharePayload;
  expires_at: string | null;
  created_at: string;
}

/** No birth dates or raw PII — northstar §10 */
export interface SharePayload {
  headline: string;
  summary?: string;
  preview_image_path?: string;
  [key: string]: unknown;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
}

// ─── Make-aligned view types (UI) ──────────────────────────────────────────

export type DayType = "hoang-dao" | "hac-dao" | "neutral";

export interface CalendarDay {
  isoDate: string;
  dayType: DayType;
  isToday: boolean;
  lunarDay: number;
  lunarMonth: number;
}

export type ResultGrade = "A" | "B" | "C";

export interface ResultDay {
  grade: ResultGrade;
  isoDate: string;
  dateLabel: string;
  lunarLabel: string;
  truc: string;
  bestHour: string;
  reasons: string[];
}

export interface CreditPackage {
  id: string;
  type: "credit" | "sub";
  label: string;
  gia: string;
  credits: number | null;
  description: string | null;
  subMonths: number | null;
}

// ─── tu-tru-api ChonNgay `intent` (OpenAPI IntentEnum) ─────────────────────

export type TuTruIntent =
  | "KHAI_TRUONG"
  | "KY_HOP_DONG"
  | "CAU_TAI"
  | "NHAM_CHUC"
  | "AN_HOI"
  | "CUOI_HOI"
  | "DAM_CUOI"
  | "CAU_TU"
  | "DONG_THO"
  | "NHAP_TRACH"
  | "LAM_NHA"
  | "MUA_NHA_DAT"
  | "XAY_BEP"
  | "LAM_GIUONG"
  | "DAO_GIENG"
  | "AN_TANG"
  | "CAI_TANG"
  | "XUAT_HANH"
  | "DI_CHUYEN_NGOAI"
  | "TE_TU"
  | "GIAI_HAN"
  | "KHAM_BENH"
  | "PHAU_THUAT"
  | "NHAP_HOC_THI_CU"
  | "KIEN_TUNG"
  | "TRONG_CAY"
  | "MAC_DINH";

// ─── Edge: Bát Tự proxy ───────────────────────────────────────────────────

export type BatTuOperation =
  | "ngay-hom-nay"
  | "weekly-summary"
  | "chon-ngay"
  | "chon-ngay/detail"
  | "lich-thang"
  | "day-detail"
  | "convert-date"
  | "tu-tru"
  | "profile"
  | "tieu-van"
  | "hop-tuoi"
  | "phong-thuy"
  | "share";

/**
 * `body` fields match tu-tru-api where applicable — see https://tu-tru-api.fly.dev/openapi.json
 * Edge-only: `first_la_so_free` (boolean) skips credit charge for `op: "tu-tru"` when the profile has no lá số yet; it is not forwarded upstream.
 */
export interface BatTuRequest {
  op: BatTuOperation;
  body: Record<string, unknown>;
}

export interface BatTuResponse<T = unknown> {
  data: T;
}

// ─── Edge: PayOS ───────────────────────────────────────────────────────────

export type PackageSku = "le" | "goi_6thang" | "goi_12thang";

export interface CreatePayosCheckoutRequest {
  package_sku: PackageSku;
  return_url: string;
  cancel_url: string;
}

export interface CreatePayosCheckoutResponse {
  order_id: string;
  checkout_url: string;
}
