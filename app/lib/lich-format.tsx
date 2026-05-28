import type { ReactNode } from "react";

import type { NgayHomNayHome } from "~/lib/home-bat-tu";
import { yearCanChiFromLunarDisplay } from "~/lib/home-bat-tu";
import { CT } from "~/lib/c-tokens";
import { scoreFromDayType, verdictLabelFromScore } from "~/lib/c-score";
import type { LichRow } from "~/components/direction-c/LichToPageCard";

const WEEKDAY_VI = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
] as const;

export function weekdayFromIso(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return WEEKDAY_VI[d.getDay()] ?? "";
}

export function dayNumberFromSolarVi(solarDateVi: string): string {
  const m = solarDateVi.match(/(\d{1,2})[./](\d{1,2})/);
  return m?.[1] ?? "—";
}

/** Big red numeral on lịch tờ — from ISO `YYYY-MM-DD` (design: `26`, not `026`). */
export function dayNumberFromIso(iso: string): string {
  const parts = iso.trim().slice(0, 10).split("-");
  if (parts.length !== 3) return "—";
  const d = Number(parts[2]);
  return Number.isFinite(d) ? String(d) : "—";
}

export function mastheadFromIso(iso: string, yearCanChi?: string | null): string {
  const d = new Date(`${iso}T12:00:00`);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const cc = yearCanChi?.trim();
  if (!cc || cc === "—") return `Tháng ${month} · ${year}`;
  return `Tháng ${month} · ${year}  ·  ${cc}`;
}

export function ngayHomNayToLichCard(
  data: NgayHomNayHome,
  menh: string | null,
  iso: string,
): {
  masthead: string;
  dayNumber: string;
  weekday: string;
  lunarLine: ReactNode;
  verdictLabel: string;
  verdictSub: ReactNode;
  score: number;
  quote: string | null;
  rows: LichRow[];
} {
  const score =
    data.score != null && Number.isFinite(data.score)
      ? data.score
      : scoreFromDayType(data.dayType);
  const weekday = weekdayFromIso(iso);
  const dayCanChi = data.canChi !== "—" ? data.canChi : null;
  const yearCanChi =
    data.yearCanChi && data.yearCanChi !== "—"
      ? data.yearCanChi
      : yearCanChiFromLunarDisplay(data.lunarLabel) || null;

  const nen =
    data.goodForChips.length > 0
      ? data.goodForChips.join(", ")
      : data.saoTotCsv || "—";
  const tranh = data.saoXauCsv || "—";
  const gio =
    data.gioTotDisplay && data.gioTotDisplay !== "—"
      ? data.gioTotDisplay
      : data.gioTotChis.length > 0
        ? data.gioTotChis.join(", ")
        : data.hourRange || "—";

  return {
    masthead: mastheadFromIso(iso, yearCanChi),
    dayNumber: dayNumberFromIso(iso),
    weekday,
    lunarLine: (
      <>
        {data.lunarLabel}
        {dayCanChi ? (
          <>
            {" "}
            · ngày{" "}
            <strong style={{ color: CT.ink, fontWeight: 600 }}>{dayCanChi}</strong>
          </>
        ) : null}
        {data.trucDisplay && data.trucDisplay !== "—" ? (
          <> · tiết {data.trucDisplay}</>
        ) : null}
      </>
    ),
    verdictLabel: verdictLabelFromScore(score),
    verdictSub: menh ? <>cho mệnh {menh}</> : null,
    score,
    quote: data.homeSummaryLine || null,
    rows: [
      { key: "Nên", value: nen, color: CT.forest },
      { key: "Tránh", value: tranh, color: CT.red },
      { key: "Giờ tốt", value: gio, color: CT.goldDeep },
    ],
  };
}
