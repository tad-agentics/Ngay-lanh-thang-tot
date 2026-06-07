import type { ReactNode } from "react";

import type { NgayHomNayHome } from "~/lib/home-bat-tu";
import { yearCanChiFromLunarDisplay } from "~/lib/home-bat-tu";
import { CT } from "~/lib/c-tokens";
import { scoreFromDayType, verdictLabelFromScore } from "~/lib/c-score";
import type { LichRow } from "~/components/direction-c/LichToPageCard";
import { buildLichNenTranhRows } from "~/lib/lich-nen-tranh-rows";

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
  score: number | null;
  quote: string | null;
  rows: LichRow[];
} {
  const displayScore =
    data.score != null && Number.isFinite(data.score) ? data.score : null;
  const verdictScore = displayScore ?? scoreFromDayType(data.dayType);
  const weekday = weekdayFromIso(iso);
  const dayCanChi = data.canChi !== "—" ? data.canChi : null;
  const yearCanChi =
    data.yearCanChi && data.yearCanChi !== "—"
      ? data.yearCanChi
      : yearCanChiFromLunarDisplay(data.lunarLabel) || null;

  const goodFor =
    data.goodForChips.length > 0
      ? data.goodForChips
      : data.saoTotCsv && data.saoTotCsv !== "—"
        ? data.saoTotCsv.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  const avoidFor =
    data.avoidForChips.length > 0
      ? data.avoidForChips
      : data.saoXauCsv && data.saoXauCsv !== "—"
        ? data.saoXauCsv.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
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
    verdictLabel: verdictLabelFromScore(verdictScore),
    verdictSub: menh ? <>cho bản mệnh {menh}</> : null,
    score: displayScore,
    quote: data.homeSummaryLine || null,
    rows: buildLichNenTranhRows({ goodFor, avoidFor, gioTot: gio }),
  };
}
