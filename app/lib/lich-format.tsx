import type { ReactNode } from "react";

import type { NgayHomNayHome } from "~/lib/home-bat-tu";
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

export function mastheadFromIso(iso: string, canChi?: string | null): string {
  const d = new Date(`${iso}T12:00:00`);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const cc = canChi?.trim();
  return `Tháng ${month} · ${year}${cc ? `  ·  ${cc.split(" ").slice(-1)[0] ?? cc}` : ""}`;
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
  const score = scoreFromDayType(data.dayType);
  const weekday =
    data.headerSubline.split("·")[0]?.trim() || weekdayFromIso(iso);

  const nen =
    data.goodForChips.length > 0
      ? data.goodForChips.join(", ")
      : data.saoTotCsv || "—";
  const tranh = data.saoXauCsv || "—";
  const gio =
    data.gioTotChis.length > 0
      ? data.gioTotChis.join(", ")
      : data.hourRange || "—";

  return {
    masthead: mastheadFromIso(iso, data.canChi),
    dayNumber: dayNumberFromSolarVi(data.solarDateVi),
    weekday,
    lunarLine: (
      <>
        {data.lunarLabel}
        {data.canChi ? (
          <>
            {" "}
            · ngày <strong style={{ color: CT.ink, fontWeight: 600 }}>{data.canChi}</strong>
          </>
        ) : null}
        {data.trucDisplay && data.trucDisplay !== "—" ? (
          <> · tiết {data.trucDisplay}</>
        ) : null}
      </>
    ),
    verdictLabel: verdictLabelFromScore(score),
    verdictSub: menh ? (
      <>
        cho mệnh {menh} ·{" "}
        <span style={{ color: CT.goldDeep }}>tại sao? ›</span>
      </>
    ) : (
      <span style={{ color: CT.goldDeep }}>tại sao? ›</span>
    ),
    score,
    quote: data.homeSummaryLine || null,
    rows: [
      { key: "Nên", value: nen, color: CT.forest },
      { key: "Tránh", value: tranh, color: CT.red },
      { key: "Giờ tốt", value: gio, color: CT.goldDeep },
    ],
  };
}
