import type { Database } from "~/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Bát Tự API accepts 0,2,4,6,8,10,11,14,16,18,20,22,23 — see OpenAPI. */
const ALLOWED_BIRTH_HOURS = new Set([
  0, 2, 4, 6, 8, 10, 11, 14, 16, 18, 20, 22, 23,
]);

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

export function gioSinhToBatTuBirthTime(
  gioSinh: string | null,
): number | undefined {
  if (!gioSinh) return undefined;
  const h = Number.parseInt(gioSinh.slice(0, 2), 10);
  if (!Number.isFinite(h)) return undefined;
  if (!ALLOWED_BIRTH_HOURS.has(h)) return undefined;
  return h;
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
