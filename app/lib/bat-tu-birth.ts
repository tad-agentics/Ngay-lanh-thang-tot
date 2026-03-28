import type { Database } from "~/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** tu-tru-api `birth_time` codes — labels match the in-app birth-time dropdown. */
export const BAT_TU_BIRTH_TIME_OPTIONS: readonly { value: number; label: string }[] =
  [
    { value: 0, label: "Giờ Tý sớm (0h – 0h59)" },
    { value: 2, label: "Giờ Sửu (1h – 2h59)" },
    { value: 4, label: "Giờ Dần (3h – 4h59)" },
    { value: 6, label: "Giờ Mão (5h – 6h59)" },
    { value: 8, label: "Giờ Thìn (7h – 8h59)" },
    { value: 10, label: "Giờ Tỵ (9h – 10h59)" },
    { value: 11, label: "Giờ Ngọ (11h – 12h59)" },
    { value: 14, label: "Giờ Mùi (13h – 14h59)" },
    { value: 16, label: "Giờ Thân (15h – 16h59)" },
    { value: 18, label: "Giờ Dậu (17h – 18h59)" },
    { value: 20, label: "Giờ Tuất (19h – 20h59)" },
    { value: 22, label: "Giờ Hợi (21h – 22h59)" },
    { value: 23, label: "Giờ Tý muộn (23h – 23h59)" },
  ] as const;

/**
 * Representative `time` for Postgres `profiles.gio_sinh` per API code (start of slot).
 * Round-trip: `gioSinhToBatTuBirthTime(batTuBirthTimeCodeToGioSinh(code)) === code`.
 */
const BIRTH_TIME_CODE_TO_PG_TIME: Record<number, string> = {
  0: "00:00:00",
  2: "01:00:00",
  4: "03:00:00",
  6: "05:00:00",
  8: "07:00:00",
  10: "09:00:00",
  11: "11:00:00",
  14: "13:00:00",
  16: "15:00:00",
  18: "17:00:00",
  20: "19:00:00",
  22: "21:00:00",
  23: "23:00:00",
};

export function batTuBirthTimeCodeToGioSinh(code: number): string | null {
  return BIRTH_TIME_CODE_TO_PG_TIME[code] ?? null;
}

/**
 * Maps wall-clock hour (0–23) to `birth_time` for tu-tru-api (can chi giờ).
 * Giờ Tý sớm 0h–0h59 → 0; Tý muộn 23h–23h59 → 23; Giờ Ngọ 11h–12h59 → 11; …
 */
export function clockHourToBatTuBirthTime(hour: number): number | undefined {
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return undefined;
  const h = Math.floor(hour);
  if (h === 0) return 0;
  if (h <= 2) return 2;
  if (h <= 4) return 4;
  if (h <= 6) return 6;
  if (h <= 8) return 8;
  if (h <= 10) return 10;
  if (h <= 12) return 11;
  if (h <= 14) return 14;
  if (h <= 16) return 16;
  if (h <= 18) return 18;
  if (h <= 20) return 20;
  if (h <= 22) return 22;
  return 23;
}

/** ISO date (YYYY-MM-DD) or Postgres date string → dd/mm/yyyy for tu-tru-api. */
export function ngaySinhToBatTuBirthDate(ngaySinh: string | null): string | null {
  if (!ngaySinh) return null;
  const ymd = ngaySinh.includes("T") ? ngaySinh.slice(0, 10) : ngaySinh.slice(0, 10);
  const parts = ymd.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

/**
 * Chuỗi nhập tay dd/mm/yyyy (ngày và tháng 1–2 chữ số) → dd/mm/yyyy cho tu-tru-api.
 * Kiểm tra ngày tồn tại trên lịch. Sai định dạng hoặc không hợp lệ → null.
 */
export function ddMmYyyyInputToBatTuBirthDate(raw: string): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10);
  const y = Number.parseInt(m[3]!, 10);
  if (!Number.isFinite(d) || !Number.isFinite(mo) || !Number.isFinite(y)) {
    return null;
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1000 || y > 9999) {
    return null;
  }
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return `${String(d).padStart(2, "0")}/${String(mo).padStart(2, "0")}/${y}`;
}

/** Giới hạn ký tự khi gõ ô DD/MM/YYYY (chỉ số và /, tối đa 10). */
export function sanitizeDdMmYyyyInput(raw: string): string {
  return raw.replace(/[^\d/]/g, "").slice(0, 10);
}

/**
 * ISO/Postgres `YYYY-MM-DD` (hoặc tiền tố) → chuỗi hiển thị DD/MM/YYYY cho ô nhập.
 */
export function isoYmdToDdMmYyyyInput(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const head = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) return "";
  const [y, m, d] = head.split("-");
  if (!y || !m || !d) return "";
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

/**
 * DD/MM/YYYY hợp lệ (theo `ddMmYyyyInputToBatTuBirthDate`) → `YYYY-MM-DD` cho Postgres.
 */
export function ddMmYyyyInputToIsoDate(raw: string): string | null {
  const api = ddMmYyyyInputToBatTuBirthDate(raw);
  if (!api) return null;
  const parts = api.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y) return null;
  return `${y}-${m}-${d}`;
}

export function gioiTinhToBatTuGender(
  gioiTinh: ProfileRow["gioi_tinh"],
): number | undefined {
  if (gioiTinh === "nam") return 1;
  if (gioiTinh === "nu") return -1;
  return undefined;
}

/** Parses `profiles.gio_sinh` (e.g. `14:30:00`) and maps to API `birth_time`. */
export function gioSinhToBatTuBirthTime(
  gioSinh: string | null,
): number | undefined {
  if (!gioSinh) return undefined;
  const part = gioSinh.trim().split(":")[0];
  const h = Number.parseInt(part ?? "", 10);
  return clockHourToBatTuBirthTime(h);
}

/** HTML `<input type="time">` value (`HH:mm` / `HH:mm:ss`) → tu-tru-api `birth_time`. */
export function timeInputToBatTuBirthTime(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const h = Number.parseInt(value.trim().split(":")[0] ?? "", 10);
  return clockHourToBatTuBirthTime(h);
}

/** Query fields shared by many GET endpoints in https://tu-tru-api.fly.dev/openapi.json */
export function profileToBatTuPersonQuery(profile: ProfileRow | null): {
  birth_date?: string;
  birth_time?: number;
  gender?: number;
  tz?: string;
} {
  if (!profile) return { tz: "Asia/Ho_Chi_Minh" };
  const birth_date = ngaySinhToBatTuBirthDate(profile.ngay_sinh) ?? undefined;
  const birth_time = gioSinhToBatTuBirthTime(profile.gio_sinh);
  const gender = gioiTinhToBatTuGender(profile.gioi_tinh);
  return {
    ...(birth_date ? { birth_date } : {}),
    ...(birth_time !== undefined ? { birth_time } : {}),
    ...(gender !== undefined ? { gender } : {}),
    tz: "Asia/Ho_Chi_Minh",
  };
}
