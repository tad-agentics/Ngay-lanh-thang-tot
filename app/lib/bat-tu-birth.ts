import type { Database } from "~/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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
