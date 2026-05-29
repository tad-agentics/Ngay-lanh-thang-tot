import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { TraCuuMethodologyCollapsible } from "~/components/direction-c/TraCuuMethodologyCollapsible";
import { BackBar } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import type { ResultDay, ResultGrade } from "~/lib/api-types";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import { scoreDotColor } from "~/lib/c-score";
import { CT } from "~/lib/c-tokens";
import { mapChonNgayPayloadToResultDays, parseChonNgayEmptyReasonVi, parseChonNgayScoreMethodology } from "~/lib/chon-ngay-result";
import {
  loadTraCuuKetQua,
  persistTraCuuKetQua,
} from "~/lib/tra-cuu-session";

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
    root.ranked_days,
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
  const navState = location.state as ChonNgayKetQuaState | null;
  const [state, setState] = useState<ChonNgayKetQuaState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (navState?.payload) {
      persistTraCuuKetQua(navState);
      setState(navState);
      setHydrated(true);
      return;
    }
    const stored = loadTraCuuKetQua();
    if (stored?.payload) {
      setState(stored);
    }
    setHydrated(true);
  }, [navState]);

  useEffect(() => {
    if (hydrated && !state?.payload) {
      navigate("/tra-cuu", { replace: true });
    }
  }, [hydrated, state, navigate]);

  const days = useMemo(
    () => (state?.payload ? mapChonNgayPayloadToResultDays(state.payload, 5) : []),
    [state?.payload],
  );

  const methodology = useMemo(
    () => (state?.payload ? parseChonNgayScoreMethodology(state.payload) : null),
    [state?.payload],
  );

  useEffect(() => {
    if (!state?.payload || days.length > 0) return;
    navigate("/tra-cuu/khong-co-ngay", {
      state: {
        intent: state.intent,
        intentLabel: state.intentLabel,
        daysInclusive: state.daysInclusive,
        rangeStart: state.rangeStart,
        rangeEnd: state.rangeEnd,
        emptyReasonVi: parseChonNgayEmptyReasonVi(state.payload) ?? undefined,
      },
      replace: true,
    });
  }, [state, days.length, navigate]);

  if (!hydrated || !state) return null;

  return (
    <DirectionCScreenBoundary screen="Kết quả tra cứu">
      <div
        className="flex min-h-full flex-col"
        style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
      >
        <BackBar
          title="Kết quả tra cứu"
          onBack={() => navigate("/tra-cuu")}
        />

      <div className="flex-1 overflow-auto px-6 pb-6 pt-3">
        <div
          className="font-serif text-[13px]"
          style={{ color: CT.muted, lineHeight: 1.5 }}
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
          className="mt-5 text-sm font-bold uppercase tracking-[-0.005em]"
          style={{
            fontFamily: "var(--display-2)",
            color: CT.ink,
          }}
        >
          {days.length} ngày cát lành nhất
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
                markLabel={state.intentLabel}
              />
            ))}
          </div>
        )}

        <TraCuuMethodologyCollapsible methodology={methodology} />
      </div>
      </div>
    </DirectionCScreenBoundary>
  );
}

function ResultRow({
  day,
  index,
  total,
  payload,
  markLabel,
}: {
  day: ResultDay;
  index: number;
  total: number;
  payload: unknown;
  markLabel: string;
}) {
  const navigate = useNavigate();
  const isTop = index === 0;
  const fallback = gradeToScore(day.grade, index);
  const score = extractScoreFromPayload(payload, day.isoDate, fallback);
  const why =
    day.reasons[0] ??
    (day.truc !== "—" ? `${day.truc} · giờ tốt ${day.bestHour}` : "Phù hợp với lá số của bạn");
  const metaChi = day.canChi !== "—" ? day.canChi : "—";

  return (
    <button
      type="button"
      onClick={() =>
        void navigate(`/ngay/${day.isoDate}`, {
          state: { markLabel },
        })
      }
      className="relative flex w-full cursor-pointer items-baseline gap-4 border-none px-3.5 py-4 text-left"
      style={{
        background: isTop ? "rgba(154,124,34,0.12)" : "transparent",
        borderBottom: index < total - 1 ? `1px solid ${CT.hairline2}` : "none",
        borderLeft: isTop ? `3px solid ${CT.goldDeep}` : "3px solid transparent",
      }}
    >
      {isTop ? (
        <span
          className="absolute right-3.5 top-2 text-[9.5px] font-extrabold uppercase tracking-[0.2em]"
          style={{
            fontFamily: "var(--mono)",
            color: CT.goldDeep,
            background: CT.gold,
            padding: "2px 6px",
          }}
        >
          ★ CÁT LÀNH
        </span>
      ) : null}
      <div className="min-w-[54px]">
        <div
          className="text-2xl font-extrabold leading-none tabular-nums tracking-[-0.02em]"
          style={{
            fontFamily: "var(--display-2)",
            color: isTop ? CT.red : CT.ink,
          }}
        >
          {formatIsoDotShort(day.isoDate).split(".")[0]}
        </div>
        <div className="mt-[3px] font-serif text-[11.5px]" style={{ color: CT.muted }}>
          Th {formatIsoDotShort(day.isoDate).split(".")[1]} · {weekdayShort(day.isoDate)}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="mb-[3px] font-serif text-[12px]"
          style={{ color: CT.muted }}
        >
          {metaChi} · {day.lunarLabel}
        </div>
        <div
          className="font-serif text-[13.5px] italic"
          style={{ color: CT.ink2, lineHeight: 1.45 }}
        >
          {why}
        </div>
      </div>
      <div className="min-w-[38px] text-right">
        <span
          className="text-[22.5px] font-extrabold tabular-nums tracking-[-0.02em]"
          style={{
            fontFamily: "var(--display-2)",
            color: scoreDotColor(score),
          }}
        >
          {score}
        </span>
      </div>
    </button>
  );
}
