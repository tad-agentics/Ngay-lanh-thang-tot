import { todayIsoInVn } from "~/lib/today-reading-cache";

/** Exclusive lower bound — matches `profiles_ngay_sinh_reasonable` in Postgres. */
export const NGAY_SINH_DB_MIN_EXCLUSIVE = "1900-01-01";

export type NgaySinhIsoValidation =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Validates `YYYY-MM-DD` for `profiles.ngay_sinh`
 * (`ngay_sinh > '1900-01-01'` and `ngay_sinh <= current_date`).
 */
export function validateProfileNgaySinhIso(
  iso: string,
  options?: { todayIso?: string },
): NgaySinhIsoValidation {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { ok: false, message: "Ngày sinh không hợp lệ." };
  }
  if (iso <= NGAY_SINH_DB_MIN_EXCLUSIVE) {
    return {
      ok: false,
      message: "Ngày sinh quá sớm — cần sau 01/01/1900.",
    };
  }
  const today = options?.todayIso ?? todayIsoInVn();
  if (iso > today) {
    return {
      ok: false,
      message: "Ngày sinh không được sau hôm nay.",
    };
  }
  return { ok: true };
}
