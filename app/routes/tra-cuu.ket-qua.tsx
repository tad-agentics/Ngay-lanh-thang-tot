import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { CTraCuuSegmentedNav } from "~/components/direction-c/CTraCuuSegmentedNav";
import { CTopStrip } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import type { ResultDay, ResultGrade } from "~/lib/api-types";
import { scoreDotColor } from "~/lib/c-score";
import { CT } from "~/lib/c-tokens";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import { mapChonNgayPayloadToResultDays } from "~/lib/chon-ngay-result";

function formatIsoDotShort(iso: string): string {
  const dt = new Date(`${iso}T12:00:00`);
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${d}.${m}`;
}

function weekdayShort(iso: string): string {
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
  const dt = new Date(`${iso}T12:00:00`);
  return labels[dt.getDay()] ?? "";
}

function gradeToScore(grade: ResultGrade, index: number): number {
  if (grade === "A") return Math.max(85, 92 - index * 2);
  if (grade === "B") return Math.max(70, 88 - index * 3);
  return Math.max(55, 78 - index * 3);
}

function extractScoreFromPayload(
  payload: unknown,
  isoDate: string,
  fallback: number,
): number {
  if (!payload || typeof payload !== "object") return fallback;
  const root = payload as Record<string, unknown>;
  const arrays = [
    root.recommended_dates,
    root.top_dates,
    root.days,
    root.results,
    root.top_days,
  ];
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const dateKeys = ["iso_date", "solar_date", "date", "ngay"];
      let match = false;
      for (const k of dateKeys) {
        const v = row[k];
        if (typeof v === "string" && v.includes(isoDate.slice(0, 10))) {
          match = true;
          break;
        }
      }
      if (!match) continue;
      const score = row.score ?? row.total_score ?? row.rank_score;
      if (typeof score === "number" && Number.isFinite(score)) {
        return Math.round(score);
      }
    }
  }
  return fallback;
}

function formatRangeRecap(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}`;
  };
  return `từ ${fmt(start)} đến ${fmt(end)}`;
}

export default function TraCuuKetQuaRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ChonNgayKetQuaState | null;

  useEffect(() => {
    if (!state?.payload) {
      navigate("/tra-cuu", { replace: true });
    }
  }, [state, navigate]);

  const days = useMemo(
    () => (state?.payload ? mapChonNgayPayloadToResultDays(state.payload, 5) : []),
    [state?.payload],
  );

  useEffect(() => {
    if (state?.payload && days.length === 0) {
      navigate("/app/loi/khong-tim-thay-ngay", {
        state: {
          intentLabel: state.intentLabel,
          daysInclusive: state.daysInclusive,
        },
        replace: true,
      });
    }
  }, [state, days.length, navigate]);

  if (!state) return null;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <CTopStrip />
      <CTraCuuSegmentedNav />

      <div className="flex-1 overflow-auto px-6 pb-24 pt-0">
        <div
          className="font-serif text-[12.5px] leading-snug"
          style={{ color: CT.muted }}
        >
          Cho việc{" "}
          <strong className="font-semibold" style={{ color: CT.ink }}>
            {state.intentLabel.toLowerCase()}
          </strong>{" "}
          · {formatRangeRecap(state.rangeStart, state.rangeEnd)} ·{" "}
          <Link
            to="/tra-cuu"
            className="no-underline"
            style={{ color: CT.goldDeep }}
          >
            sửa
          </Link>
        </div>

        <div
          className="mt-5 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[-0.005em]"
          style={{ color: CT.ink }}
        >
          {days.length} ngày tốt nhất
        </div>

        {days.length === 0 ? (
          <div className="mt-4">
            <ErrorBanner message="Chưa đọc được danh sách ngày từ API." />
          </div>
        ) : (
          <div className="mt-1">
            {days.map((day, i) => (
              <ResultRow
                key={day.isoDate}
                day={day}
                index={i}
                total={days.length}
                payload={state.payload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  day,
  index,
  total,
  payload,
}: {
  day: ResultDay;
  index: number;
  total: number;
  payload: unknown;
}) {
  const navigate = useNavigate();
  const isTop = index === 0;
  const fallback = gradeToScore(day.grade, index);
  const score = extractScoreFromPayload(payload, day.isoDate, fallback);
  const why =
    day.reasons[0] ??
    (day.truc !== "—" ? `${day.truc} · giờ tốt ${day.bestHour}` : "Phù hợp với lá số của bạn");
  const chi =
    day.truc !== "—" ? day.truc : day.lunarLabel.split("·")[0]?.trim() ?? "—";

  return (
    <button
      type="button"
      onClick={() => void navigate(`/ngay/${day.isoDate}`)}
      className="relative flex w-full cursor-pointer items-baseline gap-4 border-none px-3.5 py-4 text-left"
      style={{
        background: isTop ? "rgba(154,124,34,0.12)" : "transparent",
        borderBottom: index < total - 1 ? `1px solid ${CT.hairline2}` : "none",
        borderLeft: isTop ? `3px solid ${CT.goldDeep}` : "3px solid transparent",
      }}
    >
      {isTop ? (
        <span
          className="absolute right-3.5 top-2 font-[family-name:var(--font-mono)] text-[9px] font-extrabold uppercase tracking-[0.2em]"
          style={{ color: CT.goldDeep, background: CT.gold, padding: "2px 6px" }}
        >
          ★ ĐỀ XUẤT
        </span>
      ) : null}
      <div className="min-w-[54px]">
        <div
          className="font-[family-name:var(--font-display)] text-2xl font-extrabold leading-none tabular-nums tracking-[-0.02em]"
          style={{ color: isTop ? CT.red : CT.ink }}
        >
          {formatIsoDotShort(day.isoDate).split(".")[0]}
        </div>
        <div className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
          Th {formatIsoDotShort(day.isoDate).split(".")[1]} · {weekdayShort(day.isoDate)}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 font-serif text-[11.5px]" style={{ color: CT.muted }}>
          {chi} · {day.lunarLabel}
        </div>
        <div
          className="font-serif text-[13px] italic leading-snug"
          style={{ color: CT.ink2 }}
        >
          {why}
        </div>
      </div>
      <div className="min-w-[38px] text-right">
        <span
          className="font-[family-name:var(--font-display)] text-[22px] font-extrabold tabular-nums tracking-[-0.02em]"
          style={{ color: scoreDotColor(score) }}
        >
          {score}
        </span>
      </div>
    </button>
  );
}
