import type { DayType } from "~/lib/api-types";
import { verdictLabelFromScore } from "~/lib/c-score";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import {
  extractChiLabelsFromGioSlots,
  formatGioTotChiCompactDisplayVi,
  formatHourRangeForDayDetailFigmaVi,
  formatHourRangeForDisplayVi,
} from "~/lib/format-gio-tot-display-vi";
import {
  parseScoreMethodology,
  type ScoreMethodologyView,
  SCORE_METHODOLOGY_DEFAULT_SUMMARY,
} from "~/lib/score-methodology";
import * as U from "~/lib/home-bat-tu-utils";

export interface NgayHomNayHome {
  dayType: DayType;
  solarDateVi: string;
  /** Maket header: `T2 · DD/MM/YYYY · Can Chi`. */
  headerSubline: string;
  lunarLabel: string;
  hourRange: string;
  canChi: string;
  /** Can Chi năm âm lịch — masthead `Tháng M · YYYY · Bính Ngọ`. */
  yearCanChi: string;
  /** Tên trực (không lặp tiền tố "Trực "). */
  trucDisplay: string;
  saoTotCsv: string;
  saoXauCsv: string;
  goodForChips: string[];
  avoidForChips: string[];
  gioTotChis: string[];
  /** Maket lịch tờ: `Thìn 7–9h, Mùi 13–15h`. */
  gioTotDisplay: string;
  gioXauChis: string[];
  homeSummaryLine: string;
  /** Personalized score 0–100 from day-detail when merged; ngay-hom-nay may omit. */
  score: number | null;
  scoreMethodology: ScoreMethodologyView | null;
}

/** Prose fallback for `/ngay` when NLTT inline is unavailable (non-sub teaser paths). */
export function pickDayDetailInlineLuanFallback(
  detail: NonNullable<ReturnType<typeof parseDayDetailForView>>,
): string {
  return pickInlineSummaryFromDayDetail(detail);
}

/** One-line upsell under lịch tờ when user chưa có gói — gợi bấm 「Hỏi tiếp」→ `/dat-lich`. */
export function buildCalendarLockedDayTeaser(
  detail: NonNullable<ReturnType<typeof parseDayDetailForView>>,
): string {
  const score = detail.score;
  const verdict =
    score != null && Number.isFinite(score)
      ? verdictLabelFromScore(score)
      : detail.grade?.trim() || "Ngày này";

  const good =
    detail.goodFor[0]?.trim() || detail.catThanLabels[0]?.trim() || "";
  const avoid =
    detail.avoidFor[0]?.trim() || detail.hungSatLabels[0]?.trim() || "";

  if (score != null && score >= 70 && good) {
    return `${verdict} — có thể thuận cho ${teaserLcFirst(good)}; đặt lịch để NLTT luận sâu hơn cho riêng bạn.`;
  }

  if (score != null && score < 55) {
    if (avoid) {
      return `${verdict}: nên cẩn trọng ${teaserLcFirst(avoid)} — hỏi tiếp để biết việc quan trọng có nên dời.`;
    }
    return `${verdict} theo lá số bạn — một câu hỏi tiếp sẽ rõ hơn con số trên lịch.`;
  }

  if (good && avoid) {
    return `Ngày vừa thuận ${teaserLcFirst(good)}, vừa cần tránh ${teaserLcFirst(avoid)} — xem luận riêng để chọn việc nên làm.`;
  }

  if (good) {
    return `${verdict}: có thể ưu tiên ${teaserLcFirst(good)} — mở lịch cá nhân để xem đủ luận ngày này.`;
  }

  return `${verdict} trên lịch của bạn — đặt lịch cát tường để hỏi tiếp và nhận luận đầy đủ.`;
}

function teaserLcFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function pickInlineSummaryFromDayDetail(
  detail: NonNullable<ReturnType<typeof parseDayDetailForView>>,
): string {
  for (const line of detail.reasonLines) {
    const t = line.trim();
    if (t && !isEngineScoreBreakdownLine(t)) return t;
  }
  for (const row of detail.breakdown) {
    const t = row.reasonVi.trim();
    if (t && t !== "—" && !isEngineScoreBreakdownLine(t)) return t;
  }
  const truc = detail.trucDescription.trim();
  if (truc && !isEngineScoreBreakdownLine(truc)) return truc;
  return "";
}

/** True when line is generic score-methodology copy, not day-specific luận. */
export function isScoreMethodologyBoilerplate(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return t === SCORE_METHODOLOGY_DEFAULT_SUMMARY;
}

/**
 * Engine breakdown / score helper copy — not NLTT luận giải.
 * Used to keep methodology out of inline luận and card quotes.
 */
export function isEngineScoreBreakdownLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (isScoreMethodologyBoilerplate(t)) return true;
  if (/cộng\s+[\d.]+\s*điểm/i.test(t)) return true;
  if (/trừ\s+[\d.]+\s*điểm/i.test(t)) return true;
  if (/tổng\s+điểm\s+ngày/i.test(t)) return true;
  if (/trong\s+tổng\s+điểm/i.test(t)) return true;
  if (/ảnh hưởng này được tính/i.test(t)) return true;
  if (/mục đích sự kiện chung/i.test(t)) return true;
  if (/^ngày\s+hắc\s+đạo.*\bsao\b/i.test(t)) return true;
  if (/^trực\s+.+\s+cộng\s+/iu.test(t)) return true;
  if (/mọi ngày (bắt đầu|đều có).*nền/i.test(t)) return true;
  return false;
}

/**
 * Teaser for inline luận block when DeepSeek (generate-reading-day) has not returned yet.
 * Never uses `score_methodology.summary_vi` (methodology helper — see parseNgayHomNayForHome).
 */
export function pickInlineLuanFallback(home: NgayHomNayHome): string {
  const line = home.homeSummaryLine.trim();
  const methodology = home.scoreMethodology?.summaryVi?.trim() ?? "";
  if (
    line &&
    !isEngineScoreBreakdownLine(line) &&
    (!methodology || line !== methodology)
  ) {
    return line;
  }
  return buildHomeInlineFallback(home);
}

/** Deterministic teaser when engine + LLM both omit prose. */
export function buildHomeInlineFallback(home: NgayHomNayHome): string {
  const parts: string[] = [];
  if (home.goodForChips.length > 0) {
    parts.push(`Ngày thuận cho ${home.goodForChips.slice(0, 3).join(", ")}.`);
  }
  if (home.avoidForChips.length > 0) {
    parts.push(`Nên tránh ${home.avoidForChips.slice(0, 2).join(", ")}.`);
  }
  return parts.join(" ").trim();
}

/** Canonical personalized score + inline summary live on day-detail; ngay-hom-nay often omits both. */
export function mergeDayDetailScoreIntoHome(
  home: NgayHomNayHome,
  dayDetailRaw: unknown,
): NgayHomNayHome {
  const detail = parseDayDetailForView(dayDetailRaw);
  if (!detail) return home;

  let next = home;
  if (detail.score != null && Number.isFinite(detail.score)) {
    next = { ...next, score: detail.score };
  }
  if (!next.homeSummaryLine.trim()) {
    const summary = pickInlineSummaryFromDayDetail(detail);
    if (summary) next = { ...next, homeSummaryLine: summary };
  }
  if (!next.scoreMethodology && detail.scoreMethodology) {
    next = { ...next, scoreMethodology: detail.scoreMethodology };
  }
  return next;
}

/** Map engine /v1/ngay-hom-nay JSON → home cards (flexible keys). */
export function parseNgayHomNayForHome(raw: unknown): NgayHomNayHome | null {
  const root = U.asRecord(raw);
  if (!root) return null;
  const nested =
    U.asRecord(root.data) ?? U.asRecord(root.result) ?? U.asRecord(root.payload) ?? root;

  const fallbackIso = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const iso = U.pickIsoFromUnknown(nested) ?? U.pickIsoFromUnknown(root);
  const canChi =
    U.pickCanChiLabel(nested, [
      "can_chi",
      "canChi",
      "can_chi_day",
      "can_chi_ngay",
    ]) || U.pickCanChiLabel(root, ["can_chi", "canChi"]);
  let solarDateVi = iso
    ? U.formatViDateFromIso(iso)
    : U.pickStr(nested, [
        "solar_label",
        "label_duong",
        "ngay_duong_text",
        "solar_text",
      ]) || U.pickStr(root, ["solar_label", "solar_text"]);

  if (!solarDateVi) {
    solarDateVi = U.formatViDateFromIso(iso ?? fallbackIso);
  }

  let lunarLabel =
    U.pickStr(nested, [
      "lunar_label",
      "ngay_am_text",
      "am_lich",
      "lunar_text",
      "label_am",
      "lunar_date",
    ]) || U.pickStr(root, ["lunar_label", "lunar_text", "lunar_date"]);
  if (!lunarLabel) {
    const lunarObj = U.asRecord(nested.lunar) ?? U.asRecord(root.lunar);
    if (lunarObj) {
      lunarLabel = U.pickStr(lunarObj, ["display", "label", "text", "full"]);
    }
  }

  const yearCanChi =
    U.pickYearCanChiFromLunar(nested) ||
    U.pickYearCanChiFromLunar(root) ||
    (lunarLabel ? U.yearCanChiFromLunarDisplay(lunarLabel) : "") ||
    "—";

  let dayType = U.inferDayType(nested);
  if (dayType === "neutral") dayType = U.inferDayType(root);

  let hourRange = U.pickStr(nested, [
    "good_hours",
    "gio_tot",
    "hours_tot",
    "best_hours",
    "gio_hoang_dao",
  ]) || U.pickStr(root, ["good_hours", "gio_tot"]);
  if (!hourRange) {
    const fromNested =
      U.formatChiRangeHourSlots(nested.gio_tot) ||
      U.formatChiRangeHourSlots(nested.gio_hoang_dao) ||
      U.formatChiRangeHourSlots(root.gio_tot);
    if (fromNested) hourRange = fromNested;
  }

  const slotSources =
    nested.gio_tot ?? nested.gio_hoang_dao ?? root.gio_tot;
  const hourDisplay = formatHourRangeForDisplayVi(hourRange, slotSources);

  const headerIso = iso ?? fallbackIso;
  const headerSubline = U.formatHomeHeaderSubline(headerIso, canChi);

  const trucRaw =
    U.pickStr(nested, ["truc_name", "truc"]) ||
    U.pickStr(U.asRecord(nested.truc) ?? {}, ["name"]);
  const trucDisplay =
    (trucRaw.replace(/^trực\s+/i, "").trim() || trucRaw.trim()) || "—";

  const hoangDao = U.asRecord(nested.hoang_dao ?? nested.hoangDao);
  const starName = hoangDao ? U.pickStr(hoangDao, ["star_name", "starName"]) : "";
  const isHoangDao = hoangDao?.is_hoang_dao === true;
  const isHacDao = hoangDao?.is_hoang_dao === false;

  const catThanLabels = U.dedupeLabels([
    ...U.labelsFromMixedArray(nested.cat_than ?? nested.catThan),
    ...U.labelsFromMixedArray(nested.than_sat ?? nested.thanSat),
    ...U.labelsFromMixedArray(nested.cai_than ?? nested.caiThan),
    ...U.labelsFromSummaryBlock(nested, "tot"),
    ...(starName && (isHoangDao || (!isHacDao && dayType === "hoang-dao"))
      ? [starName]
      : []),
  ]);
  const hungSatLabels = U.dedupeLabels([
    ...U.labelsFromMixedArray(
      nested.hung_ngay ?? nested.hungNgay ?? nested.hung_sat ?? nested.hungSat,
    ),
    ...U.labelsFromSummaryBlock(nested, "xau"),
    ...(starName && isHacDao ? [`Hắc Đạo (${starName})`] : []),
  ]);
  const saoTotCsv = catThanLabels.length ? catThanLabels.join(", ") : "—";
  const saoXauCsv = hungSatLabels.length ? hungSatLabels.join(", ") : "—";

  const dailyAdvice =
    U.asRecord(nested.daily_advice ?? nested.dailyAdvice) ?? {};

  const goodForChips = U.dedupeLabels([
    ...U.parseActivityList(nested.good_for ?? nested.goodFor),
    ...U.parseActivityList(dailyAdvice.nen_lam ?? dailyAdvice.nenLam),
    ...U.parseActivityList(nested.nen_lam ?? nested.nenLam),
  ]);

  const avoidForChips = U.dedupeLabels([
    ...U.parseActivityList(nested.avoid_for ?? nested.avoidFor ?? nested.tranh),
    ...U.parseActivityList(dailyAdvice.nen_tranh ?? dailyAdvice.nenTranh),
    ...U.parseActivityList(nested.nen_tranh ?? nested.nenTranh),
  ]);

  const gioTotChis = extractChiLabelsFromGioSlots(
    nested.gio_tot ?? nested.gioTot ?? nested.gio_hoang_dao ?? nested.gioHoangDao,
  );
  const gioTotDisplay =
    formatGioTotChiCompactDisplayVi(slotSources) ||
    formatHourRangeForDayDetailFigmaVi(hourRange, slotSources) ||
    hourDisplay ||
    (gioTotChis.length > 0 ? gioTotChis.join(", ") : "—");
  const gioXauChis = extractChiLabelsFromGioSlots(
    nested.gio_xau ?? nested.gioXau ?? nested.bad_hours ?? nested.gio_hung,
  );

  const homeSummaryLine =
    U.pickStr(nested, [
      "summary_vi",
      "summaryVi",
      "one_liner",
      "oneLiner",
      "reason_vi",
      "reasonVi",
      "hint_vi",
    ]) ||
    U.pickStr(root, ["summary_vi", "one_liner", "reason_vi"]) ||
    U.pickStr(U.asRecord(nested.daily_advice) ?? {}, [
      "summary_vi",
      "hint_vi",
      "one_liner",
    ]);

  let score =
    U.pickNumber(nested, ["score", "diem", "total_score", "totalScore"]) ??
    U.pickNumber(U.asRecord(nested.scores) ?? {}, ["total", "value", "score"]) ??
    U.pickNumber(root, ["score", "diem"]);

  const scoreMethodology = parseScoreMethodology(
    nested.score_methodology ?? root.score_methodology,
  );

  return {
    dayType,
    solarDateVi,
    headerSubline,
    lunarLabel: lunarLabel || "—",
    hourRange: hourDisplay || "—",
    canChi: canChi || "—",
    yearCanChi,
    trucDisplay,
    saoTotCsv,
    saoXauCsv,
    goodForChips,
    avoidForChips,
    gioTotChis,
    gioTotDisplay,
    gioXauChis,
    homeSummaryLine,
    score,
    scoreMethodology,
  };
}
