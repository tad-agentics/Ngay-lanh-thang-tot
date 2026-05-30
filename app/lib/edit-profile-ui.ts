import { CANH_HOURS } from "~/components/auth/c-auth-ui";
import { BAT_TU_BIRTH_TIME_OPTIONS } from "~/lib/bat-tu-birth";
import { formatCanhRangeDetail } from "~/lib/first-run-ui";

const LUNAR_MONTH_NAMES = [
  "Giêng",
  "Hai",
  "Ba",
  "Tư",
  "Năm",
  "Sáu",
  "Bảy",
  "Tám",
  "Chín",
  "Mười",
  "Mười Một",
  "Chạp",
] as const;

const UNSET_BIRTH_TIME = "__unset__";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function formatLunarDayVi(day: number): string {
  if (day >= 1 && day <= 10) return `Mùng ${day}`;
  return String(day);
}

/** Make-style lunar hint from `convert-date` payload — e.g. Mùng 26 · Tháng Tư · Canh Ngọ. */
export function formatConvertDateLunarHint(data: unknown): string | null {
  const root = asRecord(data);
  if (!root) return null;

  const nested =
    asRecord(root.result) ?? asRecord(root.data) ?? asRecord(root.payload) ?? root;

  const displayVi = pickString(nested, ["display_vi", "display", "label"]);
  const canChi = pickString(nested, [
    "can_chi_year",
    "year_can_chi",
    "can_chi",
    "lunar_year_can_chi",
    "nap_am",
  ]);

  const lunarDay =
    typeof nested.lunar_day === "number" ? nested.lunar_day : null;
  const lunarMonth =
    typeof nested.lunar_month === "number" ? nested.lunar_month : null;

  if (lunarDay != null && lunarMonth != null && lunarMonth >= 1 && lunarMonth <= 12) {
    const monthName = LUNAR_MONTH_NAMES[lunarMonth - 1];
    const parts = [
      formatLunarDayVi(lunarDay),
      `Tháng ${monthName}`,
      canChi,
    ].filter(Boolean);
    return parts.join(" · ");
  }

  if (displayVi && canChi) return `${displayVi} · ${canChi}`;
  return displayVi;
}

/** Make-style canh label — e.g. Mão · 5–7h sáng. */
export function formatEditProfileBirthTime(
  birthTimeCode: string,
  unsetValue = UNSET_BIRTH_TIME,
): string {
  if (birthTimeCode === unsetValue) return "Không rõ giờ sinh";

  const code = Number.parseInt(birthTimeCode, 10);
  if (!Number.isFinite(code)) return "Chọn canh giờ";

  const canh = CANH_HOURS.find((c) => c.code === code);
  if (canh) {
    return `${canh.name} · ${formatCanhRangeDetail(canh.range, canh.name)}`;
  }

  const opt = BAT_TU_BIRTH_TIME_OPTIONS.find((o) => o.value === code);
  return opt?.label ?? "Chọn canh giờ";
}

export { UNSET_BIRTH_TIME as EDIT_PROFILE_UNSET_BIRTH_TIME };
