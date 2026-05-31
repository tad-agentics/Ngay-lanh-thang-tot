/** Minimal profile → tu-tru body (khớp `app/lib/bat-tu-birth.ts`). */

export type PrewarmProfileRow = {
  ngay_sinh: string | null;
  gio_sinh: string | null;
  gioi_tinh: string | null;
  birth_data_locked_at: string | null;
  la_so: unknown;
};

export function baziReadingBirthRevision(p: PrewarmProfileRow): string {
  return [
    p.ngay_sinh ?? "",
    p.gio_sinh ?? "",
    p.gioi_tinh ?? "",
    p.birth_data_locked_at ?? "",
  ].join("\x1e");
}

function ngaySinhToBatTuBirthDate(ngaySinh: string | null): string | null {
  if (!ngaySinh) return null;
  const head = ngaySinh.trim().slice(0, 10);
  const parts = head.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

function clockHourToBatTuBirthTime(hour: number): number | undefined {
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

function gioSinhToBatTuBirthTime(gioSinh: string | null): number | undefined {
  if (!gioSinh) return undefined;
  const h = Number.parseInt(gioSinh.trim().split(":")[0] ?? "", 10);
  return clockHourToBatTuBirthTime(h);
}

function gioiTinhToBatTuGender(
  gioiTinh: string | null,
): number | undefined {
  if (gioiTinh === "nam") return 1;
  if (gioiTinh === "nu") return -1;
  return undefined;
}

export function profileToBatTuPersonQuery(profile: PrewarmProfileRow): {
  birth_date?: string;
  birth_time?: number;
  gender?: number;
  tz: string;
} {
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

export function currentYearVn(): number {
  return Number.parseInt(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
    }).format(new Date()),
    10,
  );
}
