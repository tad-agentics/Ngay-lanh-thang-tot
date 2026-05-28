import type { DayDetailViewModel } from "~/lib/day-detail-view";

export type DayLuanSectionRow = {
  title: string;
  verdict: string;
  body: string;
  score: string;
};

export const DAY_LUAN_SOURCES: readonly [string, string][] = [
  ["[1]", "Hiệp Kỷ Biện Phương — Trực ngày"],
  ["[2]", "Ngọc Hạp Thông Thư — Thần sát"],
  ["[3]", "Tứ trụ — tương sinh tương khắc với lá số"],
  ["[4]", "Lịch Vạn Niên — giờ Hoàng đạo"],
] as const;

export function buildDayLuanSectionRows(
  detail: DayDetailViewModel | null,
): DayLuanSectionRow[] {
  if (!detail) return [];

  const rows: DayLuanSectionRow[] = (detail.breakdown ?? []).map((row) => ({
    title: row.source,
    verdict: row.type || "—",
    body: row.reasonVi,
    score: row.points >= 0 ? `+${row.points}` : String(row.points),
  }));

  if (rows.length === 0) {
    if (detail.trucTitle) {
      rows.push({
        title: "Trực ngày",
        verdict: detail.trucTitle,
        body: detail.trucDescription || detail.trucLine,
        score: "",
      });
    }
    if (detail.starLine) {
      rows.push({
        title: "Nhị thập bát tú",
        verdict: detail.starLine.split("·")[0]?.trim() ?? detail.starLine,
        body: detail.starLine,
        score: "",
      });
    }
    for (const line of detail.reasonLines.slice(0, 2)) {
      rows.push({
        title: "Luận giải",
        verdict: detail.grade,
        body: line,
        score: "",
      });
    }
  }

  return rows.slice(0, 4);
}

export function anchorQuestionForScore(score: number | null): string {
  if (score != null) {
    return `Tại sao hôm nay được ${score} điểm với mệnh của tôi?`;
  }
  return "Tại sao hôm nay được chấm như vậy với mệnh của tôi?";
}

export const DAY_LUAN_SUGGESTED_CHIPS = [
  "Giờ nào trong ngày tốt nhất?",
  "Hôm nay có nên ký hợp đồng không?",
  "So sánh với ngày mai",
] as const;

/** `YYYY-MM-DD` → `DD.MM` for input placeholder / BackBar. */
export function formatDayIsoShort(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim().slice(0, 10));
  if (!m) return iso.slice(5, 10).replace("-", ".");
  return `${m[3]}.${m[2]}`;
}
