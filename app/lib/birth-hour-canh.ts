import { CANH_HOURS } from "~/components/auth/c-auth-ui";
import { gioSinhToBatTuBirthTime } from "~/lib/bat-tu-birth";

/** Index into `CANH_HOURS` for onboarding picker, from `profiles.gio_sinh`. */
export function canhPickerIndexFromGioSinh(
  gioSinh: string | null | undefined,
): number | null {
  const code = gioSinhToBatTuBirthTime(gioSinh ?? null);
  if (code === undefined) return null;
  const idx = CANH_HOURS.findIndex((c) => c.code === code);
  return idx >= 0 ? idx : null;
}
