import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import type { DayLuanSectionRow } from "~/lib/day-luan-sectioned";
import {
  DAY_LUAN_SOURCES,
  formatDaySectionSubline,
  formatLuanBaseScoreNote,
} from "~/lib/day-luan-sectioned";

type DayLuanSectionedPanelProps = {
  rows: DayLuanSectionRow[];
  totalScore: number | null;
  baseScore?: number | null;
  iso?: string;
  canChi?: string;
  id?: string;
  sourceLabels?: readonly [string, string][];
};

function scrollToSource(ref: string) {
  const num = ref.replace(/[[\]]/g, "");
  document.getElementById(`nguon-${num}`)?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

export function DayLuanSectionedPanel({
  rows,
  totalScore,
  baseScore = null,
  iso,
  canChi = "—",
  id = "chi-tiet",
  sourceLabels = DAY_LUAN_SOURCES,
}: DayLuanSectionedPanelProps) {
  if (rows.length === 0 && totalScore == null) return null;

  return (
    <div
      id={id}
      className="mt-[26px] pt-[18px]"
      style={{
        borderTop: `1px solid ${CT.hairline}`,
        animation: "b-fade-in 320ms ease-out both",
      }}
    >
      <style>{`
        @keyframes b-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      {iso ? (
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <Mono style={{ color: CT.goldDeep, fontSize: 10 }}>
            Phân tích chi tiết · 4 yếu tố
          </Mono>
          <span
            className="font-serif text-[11.5px] shrink-0"
            style={{ color: CT.muted }}
          >
            {formatDaySectionSubline(iso, canChi)}
          </span>
        </div>
      ) : null}

      {rows.map((s, i) => (
        <div
          key={`${s.title}-${i}`}
          style={{
            marginTop: i === 0 ? 16 : 16,
            paddingTop: i === 0 ? 14 : 14,
            borderTop: i === 0 ? "none" : `1px solid ${CT.hairline2}`,
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <Mono style={{ color: CT.muted, fontSize: 9 }}>{s.title}</Mono>
            {s.score ? (
              <span
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 13,
                  color: CT.goldDeep,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.score}
              </span>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 16,
              color: CT.ink,
              letterSpacing: "-0.005em",
            }}
          >
            {s.verdict}
          </div>
          <p
            className="font-serif text-[13px]"
            style={{
              marginTop: 6,
              color: CT.ink2,
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            {s.body}{" "}
            <button
              type="button"
              onClick={() => scrollToSource(s.sourceRef)}
              className="inline p-0 align-baseline cursor-pointer"
              style={{
                color: CT.goldDeep,
                fontFamily: "var(--mono)",
                fontSize: 10,
                background: "none",
                border: "none",
              }}
              aria-label={`Nguồn ${s.sourceRef}`}
            >
              {s.sourceRef}
            </button>
          </p>
        </div>
      ))}

      {baseScore != null ? (
        <div
          className="mt-4 pt-3"
          style={{ borderTop: `1px solid ${CT.hairline2}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Mono style={{ color: CT.muted, fontSize: 9 }}>Điểm nền</Mono>
              <p
                className="mt-1 font-serif text-[12px] leading-snug"
                style={{ color: CT.muted }}
              >
                {formatLuanBaseScoreNote(baseScore)}
              </p>
            </div>
            <span
              className="shrink-0"
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 700,
                fontSize: 13,
                color: CT.goldDeep,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              +{baseScore}
            </span>
          </div>
        </div>
      ) : null}

      {totalScore != null ? (
        <div
          className="flex justify-between items-baseline"
          style={{
            marginTop: 20,
            padding: "14px 0",
            borderTop: `2px solid ${CT.ink}`,
          }}
        >
          <div
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 16,
              color: CT.ink,
              textTransform: "uppercase",
              letterSpacing: "-0.005em",
            }}
          >
            Tổng điểm
          </div>
          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 32,
                color: CT.goldDeep,
                lineHeight: 1,
                letterSpacing: "-0.015em",
              }}
            >
              {totalScore}
            </span>
            <span
              className="font-serif text-[13px]"
              style={{ color: CT.muted }}
            >
              /100
            </span>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <Mono style={{ color: CT.muted, fontSize: 9 }}>Nguồn đối chiếu</Mono>
        <div className="mt-2 flex flex-col" style={{ gap: 6 }}>
          {sourceLabels.map(([n, t]) => (
            <div
              key={n}
              id={`nguon-${n.replace(/[[\]]/g, "")}`}
              className="flex gap-2 scroll-mt-24"
              style={{
                fontFamily: "var(--serif)",
                fontSize: 12,
                color: CT.ink2,
                lineHeight: 1.45,
              }}
            >
              <span
                style={{
                  color: CT.goldDeep,
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  minWidth: 24,
                }}
              >
                {n}
              </span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
