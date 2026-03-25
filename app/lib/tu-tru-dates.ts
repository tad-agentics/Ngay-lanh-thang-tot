/** Helpers for tu-tru-api date fields (dd/mm/yyyy) and chọn ngày credit tiers. */

/** `YYYY-MM-DD` (HTML date input) → `dd/mm/yyyy` for API body. */
export function isoDateToDdMmYyyy(iso: string): string | null {
  const raw = iso.trim().slice(0, 10);
  const parts = raw.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d || y.length !== 4) return null;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

function parseLocalYmd(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim().slice(0, 10));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d, 12, 0, 0);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Inclusive day count between two `YYYY-MM-DD` dates (local calendar). */
export function inclusiveDaysBetweenIsoDates(
  startIso: string,
  endIso: string,
): number | null {
  const a = parseLocalYmd(startIso);
  const b = parseLocalYmd(endIso);
  if (!a || !b || b < a) return null;
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return diff + 1;
}

/** Aligns with `supabase/functions/bat-tu` resolveFeatureKey for chon-ngay. */
export function chonNgayInclusiveDaysToFeatureKey(days: number):
  | "chon_ngay_30"
  | "chon_ngay_60"
  | "chon_ngay_90" {
  if (!Number.isFinite(days) || days <= 0) return "chon_ngay_30";
  if (days <= 30) return "chon_ngay_30";
  if (days <= 60) return "chon_ngay_60";
  return "chon_ngay_90";
}

export function localTodayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(startIso: string, addDays: number): string | null {
  const a = parseLocalYmd(startIso);
  if (!a || !Number.isFinite(addDays)) return null;
  const t = new Date(a);
  t.setDate(t.getDate() + addDays);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const day = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
