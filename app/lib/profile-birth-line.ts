import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  gioSinhToBatTuBirthTime,
  ngaySinhToBatTuBirthDate,
} from "~/lib/bat-tu-birth";
import { yearCanChiFromLaSo } from "~/lib/pay-commerce-ui";

export type ProfileBirthSublineInput = {
  display_name?: string | null;
  ngay_sinh?: string | null;
  gio_sinh?: string | null;
  gioi_tinh?: string | null;
  la_so?: unknown;
};

/** `1990-05-20` → `20.05.1990` (Direction C maket). */
export function formatNgaySinhDisplayDot(ngaySinh: string | null | undefined): string | null {
  const d = ngaySinhToBatTuBirthDate(ngaySinh ?? null);
  return d?.replace(/\//g, ".") ?? null;
}

/** `profiles.gio_sinh` → canh label, e.g. `Mão`. */
export function gioSinhToCanhNameVi(gioSinh: string | null | undefined): string | null {
  const code = gioSinhToBatTuBirthTime(gioSinh ?? null);
  if (code === undefined) return null;
  const opt = BAT_TU_BIRTH_TIME_OPTIONS.find((o) => o.value === code);
  if (!opt) return null;
  const short = opt.label.replace(/^Giờ\s+/i, "").split("(")[0]?.trim();
  return short || null;
}

function birthYearFromNgaySinh(ngaySinh: string | null | undefined): string | null {
  if (!ngaySinh?.trim()) return null;
  const y = ngaySinh.trim().slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

/** Maket `PROFILE.tuoi` — e.g. `Canh Ngọ 1990`. */
export function birthYearCanChiTuoiLabel(
  laSo: unknown,
  ngaySinh: string | null | undefined,
): string | null {
  const canChi = yearCanChiFromLaSo(laSo);
  const year = birthYearFromNgaySinh(ngaySinh);
  if (canChi && year) return `${canChi} ${year}`;
  return canChi ?? year;
}

/**
 * Direction C profile subline — e.g.
 * `Nguyễn Thị Minh · sinh 20.05.1990 · giờ Mão · Canh Ngọ 1990`
 */
export function formatProfileBirthSubline(
  profile: ProfileBirthSublineInput,
  options?: { includeGender?: boolean },
): string {
  const parts: string[] = [];
  const name = profile.display_name?.trim();
  if (name) parts.push(name);
  if (options?.includeGender) {
    if (profile.gioi_tinh === "nam") parts.push("Nam");
    if (profile.gioi_tinh === "nu") parts.push("Nữ");
  }
  const date = formatNgaySinhDisplayDot(profile.ngay_sinh);
  if (date) parts.push(`sinh ${date}`);
  const gio = gioSinhToCanhNameVi(profile.gio_sinh);
  if (gio) parts.push(`giờ ${gio}`);
  const tuoi = birthYearCanChiTuoiLabel(profile.la_so, profile.ngay_sinh);
  if (tuoi) parts.push(tuoi);
  return parts.join(" · ");
}
