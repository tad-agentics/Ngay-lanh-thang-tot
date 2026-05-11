/**
 * Landing CTA form options — shared by `landing.tsx` and signup prefill (`dang-ky`).
 * Labels must match the marketing `<select>` values exactly.
 */
export const LANDING_GIO_SINH = [
  "Chưa biết giờ sinh",
  "Giờ Tý (23:00–1:00)",
  "Giờ Sửu (1:00–3:00)",
  "Giờ Dần (3:00–5:00)",
  "Giờ Mão (5:00–7:00)",
  "Giờ Thìn (7:00–9:00)",
  "Giờ Tỵ (9:00–11:00)",
  "Giờ Ngọ (11:00–13:00)",
  "Giờ Mùi (13:00–15:00)",
  "Giờ Thân (15:00–17:00)",
  "Giờ Dậu (17:00–19:00)",
  "Giờ Tuất (19:00–21:00)",
  "Giờ Hợi (21:00–23:00)",
] as const;

export type LandingGioSinhLabel = (typeof LANDING_GIO_SINH)[number];

const LANDING_GIO_TO_PG: Partial<Record<LandingGioSinhLabel, string>> = {
  "Giờ Tý (23:00–1:00)": "23:00:00",
  "Giờ Sửu (1:00–3:00)": "01:00:00",
  "Giờ Dần (3:00–5:00)": "03:00:00",
  "Giờ Mão (5:00–7:00)": "05:00:00",
  "Giờ Thìn (7:00–9:00)": "07:00:00",
  "Giờ Tỵ (9:00–11:00)": "09:00:00",
  "Giờ Ngọ (11:00–13:00)": "11:00:00",
  "Giờ Mùi (13:00–15:00)": "13:00:00",
  "Giờ Thân (15:00–17:00)": "15:00:00",
  "Giờ Dậu (17:00–19:00)": "17:00:00",
  "Giờ Tuất (19:00–21:00)": "19:00:00",
  "Giờ Hợi (21:00–23:00)": "21:00:00",
};

/**
 * Representative `profiles.gio_sinh` for landing hour labels (Tý → 23h slot).
 * `Chưa biết` / unknown label → `null` (do not set column).
 */
export function landingGioLabelToGioSinh(label: string): string | null {
  if (!label || label === "Chưa biết giờ sinh") return null;
  const hit = LANDING_GIO_TO_PG[label as LandingGioSinhLabel];
  return hit ?? null;
}

export type LandingSignupPrefill = {
  displayName: string | null;
  ngaySinh: string | null;
  /** Raw `gio` query (landing `<select>` value). */
  rawGioLabel: string | null;
  gioSinh: string | null;
  gioiTinh: "nam" | "nu" | null;
};

const MAX_NAME = 200;

export type LandingDobParseResult =
  | { ok: true; iso: string }
  | { ok: false; message: string };

const DOB_DD_MM_YYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Parse user-typed `dd/mm/yyyy` (calendar Gregorian) to `YYYY-MM-DD` for profile / query.
 * Uses local date components so it matches `new Date(\`${iso}T12:00:00\`)` style checks elsewhere.
 */
export function parseLandingDobDdMmYyyy(input: string): LandingDobParseResult {
  const t = input.trim();
  if (!t) {
    return { ok: false, message: "Vui lòng nhập ngày sinh." };
  }
  const m = DOB_DD_MM_YYYY.exec(t);
  if (!m) {
    return {
      ok: false,
      message: "Nhập theo dd/mm/yyyy (ví dụ 15/08/1990).",
    };
  }
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) {
    return {
      ok: false,
      message: "Năm sinh nên từ 1900 đến 2100.",
    };
  }
  if (mm < 1 || mm > 12) {
    return { ok: false, message: "Tháng phải từ 01 đến 12." };
  }
  if (dd < 1 || dd > 31) {
    return { ok: false, message: "Ngày phải từ 01 đến 31." };
  }
  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return {
      ok: false,
      message: "Ngày không tồn tại trong lịch (kiểm tra tháng và năm nhuận).",
    };
  }
  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  return { ok: true, iso };
}

/** Read `?name=&dob=&gio=&gender=` from the landing CTA (or bookmarks). */
export function parseLandingSignupPrefill(
  sp: URLSearchParams,
): LandingSignupPrefill {
  const rawName = sp.get("name");
  const name =
    rawName != null && rawName.trim()
      ? rawName.trim().slice(0, MAX_NAME)
      : null;

  const dobRaw = sp.get("dob")?.trim() ?? "";
  let ngaySinh: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
    const d = new Date(`${dobRaw}T12:00:00`);
    if (!Number.isNaN(d.getTime())) ngaySinh = dobRaw;
  }

  const gioRaw = sp.get("gio")?.trim() ?? "";
  const rawGioLabel = gioRaw || null;
  const gioSinh = landingGioLabelToGioSinh(gioRaw);

  const g = sp.get("gender")?.trim();
  const gioiTinh = g === "nam" || g === "nu" ? g : null;

  return {
    displayName: name,
    ngaySinh,
    rawGioLabel,
    gioSinh,
    gioiTinh,
  };
}

export function landingSignupPrefillHasAny(p: LandingSignupPrefill): boolean {
  return Boolean(
    p.displayName ||
      p.ngaySinh ||
      p.rawGioLabel ||
      p.gioSinh ||
      p.gioiTinh,
  );
}
