import type { DayDetailViewModel } from "~/lib/day-detail-view";

export type DayLuanSectionRow = {
  title: string;
  verdict: string;
  body: string;
  score: string;
  sourceRef: "[1]" | "[2]" | "[3]" | "[4]";
};

export type DayLuanSectionBundle = {
  rows: DayLuanSectionRow[];
  /** Legacy engine rows (Điểm cơ bản +50) — shown above Tổng điểm. */
  baseScore: number | null;
};

export const DAY_LUAN_SOURCES: readonly [string, string][] = [
  ["[1]", "Hiệp Kỷ Biện Phương — Trực ngày"],
  ["[2]", "Ngọc Hạp Thông Thư — Thần sát"],
  ["[3]", "Tứ trụ — tương sinh tương khắc với lá số"],
  ["[4]", "Lịch Vạn Niên — giờ Hoàng đạo"],
] as const;

type FactorKey = "truc" | "sao" | "can_chi" | "gio";

const CANONICAL_FACTORS: readonly {
  key: FactorKey;
  title: string;
  sourceRef: DayLuanSectionRow["sourceRef"];
}[] = [
  { key: "truc", title: "Trực ngày", sourceRef: "[1]" },
  { key: "sao", title: "Nhị thập bát tú", sourceRef: "[2]" },
  {
    key: "can_chi",
    title: "Can chi · tương sinh với lá số bạn",
    sourceRef: "[3]",
  },
  { key: "gio", title: "Giờ vàng trong ngày", sourceRef: "[4]" },
] as const;

const BASE_SCORE_RE =
  /điểm cơ bản|base score|^neutral$|nền cố định ban đầu|mọi ngày bắt đầu/i;

function formatScoreChip(points: number, showZero = false): string {
  if (points === 0) return showZero ? "0" : "";
  return points > 0 ? `+${points}` : String(points);
}

function isBaseScoreRow(row: {
  source: string;
  type: string;
  reasonVi: string;
  id?: string;
}): boolean {
  if (row.id?.toLowerCase() === "base" || row.id?.toLowerCase() === "base_score") {
    return true;
  }
  const hay = `${row.source} ${row.type} ${row.reasonVi}`.toLowerCase();
  return BASE_SCORE_RE.test(hay) && !/trực|truc/.test(hay);
}

function extractBaseScore(detail: DayDetailViewModel): number | null {
  let total = 0;
  let found = false;
  for (const row of detail.breakdown ?? []) {
    if (!isBaseScoreRow(row)) continue;
    total += row.points;
    found = true;
  }
  return found ? total : null;
}

function bucketBreakdownRow(row: {
  source: string;
  type: string;
  reasonVi: string;
  id?: string;
}): FactorKey | null {
  const id = row.id?.toLowerCase();
  if (id === "truc") return "truc";
  if (id === "sao28" || id === "sao_28") return "sao";
  if (id === "can_chi_laso" || id === "can_chi") return "can_chi";
  if (id === "gio_vang" || id === "gio") return "gio";

  const hay = `${row.source} ${row.type} ${row.reasonVi}`.toLowerCase();
  if (isBaseScoreRow(row)) return null;
  if (/trực|truc/.test(hay)) return "truc";
  if (/sao|28|tú|t\u00fa|thần|sat|star|hung|cat|thien|thiên|cương|cuong/.test(hay)) {
    return "sao";
  }
  if (/can|chi|mệnh|menh|sinh|khắc|khac|lá số|la so|laso|tứ trụ|tu tru/.test(hay)) {
    return "can_chi";
  }
  if (/giờ|gio|hoang|hoàng|vàng|hour|thìn|ty|tý|mui|mùi/.test(hay)) {
    return "gio";
  }
  if (/penalty|kỵ|ky|bonus/.test(hay)) return "sao";
  return null;
}

function sumBreakdownPoints(
  detail: DayDetailViewModel,
): Record<FactorKey, number | null> {
  const sums: Record<FactorKey, number | null> = {
    truc: null,
    sao: null,
    can_chi: null,
    gio: null,
  };

  for (const row of detail.breakdown ?? []) {
    if (isBaseScoreRow(row)) continue;
    const bucket = bucketBreakdownRow(row);
    if (!bucket) continue;
    sums[bucket] = (sums[bucket] ?? 0) + row.points;
  }

  return sums;
}

function resolveFactorPoints(
  detail: DayDetailViewModel,
  pointsByFactor: Record<FactorKey, number | null>,
  baseScore: number | null,
): Record<FactorKey, number> {
  const resolved: Record<FactorKey, number> = {
    truc: 0,
    sao: 0,
    can_chi: 0,
    gio: 0,
  };

  const hasCanonicalFour = CANONICAL_FACTORS.every(
    ({ key }) => pointsByFactor[key] != null,
  );

  if (hasCanonicalFour) {
    for (const { key } of CANONICAL_FACTORS) {
      resolved[key] = pointsByFactor[key]!;
    }
    return resolved;
  }

  if (baseScore != null) {
    for (const { key } of CANONICAL_FACTORS) {
      resolved[key] = pointsByFactor[key] ?? 0;
    }
    return resolved;
  }

  for (const { key } of CANONICAL_FACTORS) {
    if (pointsByFactor[key] != null) {
      resolved[key] = pointsByFactor[key]!;
    }
  }

  const mappedSum = Object.values(resolved).reduce((a, b) => a + b, 0);
  const total = detail.score;
  if (
    total != null &&
    mappedSum !== total &&
    CANONICAL_FACTORS.every(({ key }) => pointsByFactor[key] == null)
  ) {
    return resolved;
  }

  return resolved;
}

function pickCanChiBody(detail: DayDetailViewModel): string {
  for (const line of detail.reasonLines) {
    const l = line.toLowerCase();
    if (/can|chi|mệnh|menh|sinh|khắc|khac|thủy|tho|hoa|moc|kim/.test(l)) {
      return line;
    }
  }
  if (detail.goodFor.length > 0) {
    return `Ngày này thuận cho: ${detail.goodFor.slice(0, 3).join(", ")}.`;
  }
  return "Can Chi ngày được đối chiếu với mệnh và Dụng Thần trên lá số của bạn.";
}

function pickGioBody(detail: DayDetailViewModel): string {
  if (detail.gioTot !== "—") {
    const avoid =
      detail.gioXau !== "—"
        ? ` Nên tránh ${detail.gioXau}.`
        : "";
    return `Giờ Hoàng đạo: ${detail.gioTot}.${avoid}`.trim();
  }
  if (detail.gioXau !== "—") {
    return `Giờ nên tránh: ${detail.gioXau}.`;
  }
  return "Chưa có bảng giờ vàng cho ngày này — xem lại trên lịch tờ.";
}

function findBreakdownByFactor(
  detail: DayDetailViewModel,
  key: FactorKey,
): DayDetailViewModel["breakdown"][number] | null {
  const idMap: Record<FactorKey, string[]> = {
    truc: ["truc"],
    sao: ["sao28", "sao_28"],
    can_chi: ["can_chi_laso", "can_chi"],
    gio: ["gio_vang", "gio"],
  };
  for (const row of detail.breakdown ?? []) {
    const id = row.id?.toLowerCase();
    if (id && idMap[key].includes(id)) return row;
  }
  return null;
}

function buildFactorRow(
  key: FactorKey,
  detail: DayDetailViewModel,
  points: number,
  showZeroScores: boolean,
): DayLuanSectionRow {
  const meta = CANONICAL_FACTORS.find((f) => f.key === key)!;
  const apiRow = findBreakdownByFactor(detail, key);
  if (apiRow?.reasonVi && apiRow.reasonVi !== "—") {
    const verdict =
      apiRow.type && apiRow.type !== "—"
        ? apiRow.type
        : apiRow.source !== "—"
          ? apiRow.source
          : meta.title;
    return {
      title: meta.title,
      sourceRef: meta.sourceRef,
      verdict,
      body: apiRow.reasonVi,
      score: formatScoreChip(points, showZeroScores),
    };
  }

  switch (key) {
    case "truc": {
      const verdict =
        detail.trucDisplay !== "—"
          ? detail.trucDisplay
          : detail.trucTitle.replace(/^Trực\s+/i, "").trim() || "—";
      return {
        title: meta.title,
        sourceRef: meta.sourceRef,
        verdict,
        body:
          detail.trucDescription ||
          (detail.trucLine !== "—" ? detail.trucLine : "—"),
        score: formatScoreChip(points, showZeroScores),
      };
    }
    case "sao": {
      const starHead =
        detail.starLine !== "—"
          ? (detail.starLine.split("·")[0]?.trim() ?? detail.starLine)
          : detail.catThanLabels[0] ??
            detail.hungSatLabels[0] ??
            "—";
      const bodyParts = [
        detail.starLine !== "—" ? detail.starLine : "",
        detail.catThanLabels.length
          ? `Sao tốt: ${detail.catThanLabels.join(", ")}.`
          : "",
        detail.hungSatLabels.length
          ? `Hung sát: ${detail.hungSatLabels.join(", ")}.`
          : "",
      ].filter(Boolean);
      return {
        title: meta.title,
        sourceRef: meta.sourceRef,
        verdict: starHead,
        body: bodyParts.join(" ").trim() || "—",
        score: formatScoreChip(points, showZeroScores),
      };
    }
    case "can_chi":
      return {
        title: meta.title,
        sourceRef: meta.sourceRef,
        verdict: detail.canChi !== "—" ? detail.canChi : "—",
        body: pickCanChiBody(detail),
        score: formatScoreChip(points, showZeroScores),
      };
    case "gio":
      return {
        title: meta.title,
        sourceRef: meta.sourceRef,
        verdict: detail.gioTot !== "—" ? detail.gioTot : "—",
        body: pickGioBody(detail),
        score: formatScoreChip(points, showZeroScores),
      };
  }
}

/** Always 4 canonical yếu tố — overlay API breakdown points when mappable. */
export function buildDayLuanSectionBundle(
  detail: DayDetailViewModel | null,
): DayLuanSectionBundle {
  if (!detail) return { rows: [], baseScore: null };

  const baseScore = extractBaseScore(detail);
  const pointsByFactor = sumBreakdownPoints(detail);
  const resolved = resolveFactorPoints(detail, pointsByFactor, baseScore);
  const hasCanonicalFour = CANONICAL_FACTORS.every(
    ({ key }) => pointsByFactor[key] != null,
  );
  const showZeroScores = baseScore != null || hasCanonicalFour;

  const rows = CANONICAL_FACTORS.map(({ key }) =>
    buildFactorRow(key, detail, resolved[key], showZeroScores),
  );

  return { rows, baseScore };
}

export function formatLuanBaseScoreNote(baseScore: number): string {
  return `Mọi ngày được chấm từ ${baseScore} điểm làm khởi điểm, rồi cộng hoặc trừ theo bốn yếu tố phía trên.`;
}

export function buildDayLuanSectionRows(
  detail: DayDetailViewModel | null,
): DayLuanSectionRow[] {
  return buildDayLuanSectionBundle(detail).rows;
}

export function anchorQuestionForScore(
  score: number | null,
  iso?: string,
): string {
  const dayRef = iso ? `ngày ${formatDayIsoShort(iso)}` : "hôm nay";
  if (score != null) {
    return `Tại sao ${dayRef} được ${score} điểm với mệnh của tôi?`;
  }
  return `Tại sao ${dayRef} được chấm như vậy với mệnh của tôi?`;
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

/** `YYYY-MM-DD` → `DD.MM.YYYY` for sectioned header. */
export function formatDayIsoLong(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim().slice(0, 10));
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export function formatDaySectionSubline(iso: string, canChi: string): string {
  const datePart = formatDayIsoLong(iso);
  if (canChi && canChi !== "—") return `${datePart} · ngày ${canChi}`;
  return datePart;
}
