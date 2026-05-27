import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import type { HopTuoiPanelView } from "~/lib/hop-tuoi-result";
import { invokeGenerateReading } from "~/lib/generate-reading";

export type HopTuoiKetQuaState = {
  panel: HopTuoiPanelView;
  payload: unknown;
  otherName: string;
  selfName: string;
};

export default function TraCuuHopTuoiKetQuaRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as HopTuoiKetQuaState | null;
  const [aiReading, setAiReading] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.panel) {
      navigate("/tra-cuu/hop-tuoi", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (!state?.payload) return;
    let cancelled = false;
    void invokeGenerateReading({
      endpoint: "hop-tuoi",
      data: state.payload,
    }).then((r) => {
      if (!cancelled) setAiReading(r.reading);
    });
    return () => {
      cancelled = true;
    };
  }, [state?.payload]);

  if (!state) return null;

  const { panel, selfName, otherName } = state;
  const score = panel.score ?? 72;
  const quote =
    aiReading?.trim() ||
    panel.reading?.trim() ||
    panel.advice?.trim() ||
    panel.naphAmRelation;

  const breakdown =
    panel.criteriaRows.length > 0
      ? panel.criteriaRows.map((row) => ({
          t: row.name,
          v: row.description ?? "—",
          s:
            row.sentiment === "positive"
              ? "+"
              : row.sentiment === "negative"
                ? "−"
                : "·",
        }))
      : panel.criteriaLines.map((line, i) => ({
          t: `Tiêu chí ${i + 1}`,
          v: line,
          s: "·",
        }));

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Hợp tuổi · kết quả" />

      <div className="flex-1 overflow-auto px-[22px] pb-24 pt-1.5">
        <div className="mt-1.5 flex items-center gap-3.5">
          <div
            className="flex-1 border bg-white px-3 py-2.5"
            style={{ borderColor: CT.hairline }}
          >
            <div
              className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.005em]"
              style={{ color: CT.ink }}
            >
              {selfName}
            </div>
            <div className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
              {panel.personCards.p1?.menh
                ? `${panel.naphAm1} · mệnh ${panel.personCards.p1.menh}`
                : panel.naphAm1}
            </div>
          </div>
          <span
            className="font-[family-name:var(--font-mono)] text-sm"
            style={{ color: CT.goldDeep }}
          >
            ×
          </span>
          <div
            className="flex-1 border bg-white px-3 py-2.5"
            style={{ borderColor: CT.hairline }}
          >
            <div
              className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[-0.005em]"
              style={{ color: CT.ink }}
            >
              {otherName}
            </div>
            <div className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
              {panel.personCards.p2?.menh
                ? `${panel.naphAm2} · mệnh ${panel.personCards.p2.menh}`
                : panel.naphAm2}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: "0.22em" }}>
            Độ hợp · {panel.relationshipLabel ?? "hợp tuổi"}
          </Mono>
          <div className="mt-2.5 flex items-baseline justify-center gap-1.5">
            <span
              className="font-[family-name:var(--font-display)] text-[96px] font-extrabold leading-[0.85] tabular-nums tracking-[-0.04em]"
              style={{ color: CT.goldDeep }}
            >
              {score}
            </span>
            <span className="font-serif text-base" style={{ color: CT.muted }}>
              /100
            </span>
          </div>
          <div
            className="mt-2 font-[family-name:var(--font-display)] text-[22px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ color: CT.ink }}
          >
            {panel.gradLabel}
          </div>
          {quote ? (
            <p
              className="mx-auto mt-2 max-w-[320px] font-serif text-[13.5px] italic leading-snug"
              style={{ color: CT.ink2 }}
            >
              &ldquo;{quote}&rdquo;
            </p>
          ) : null}
        </div>

        {breakdown.length > 0 ? (
          <div className="mt-7">
            {breakdown.map((row, i) => (
              <div
                key={`${row.t}-${i}`}
                className="flex items-baseline justify-between py-3"
                style={{
                  borderBottom:
                    i < breakdown.length - 1 ? `1px solid ${CT.hairline2}` : "none",
                }}
              >
                <div className="flex-1">
                  <div
                    className="font-[family-name:var(--font-display)] text-[13.5px] font-bold uppercase tracking-[-0.005em]"
                    style={{ color: CT.ink }}
                  >
                    {row.t}
                  </div>
                  <div
                    className="mt-0.5 font-serif text-xs leading-snug"
                    style={{ color: CT.ink2 }}
                  >
                    {row.v}
                  </div>
                </div>
                <span
                  className="font-[family-name:var(--font-display)] text-base font-bold tabular-nums tracking-[-0.01em]"
                  style={{ color: CT.goldDeep }}
                >
                  {row.s}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className="mt-5 border-l-2 px-3.5 py-3.5"
          style={{
            background: "rgba(154,124,34,0.06)",
            borderColor: CT.goldDeep,
          }}
        >
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>
            Gợi ý tiếp theo
          </Mono>
          <div
            className="mt-1.5 font-serif text-[13.5px] leading-snug"
            style={{ color: CT.ink }}
          >
            Tra cứu{" "}
            <strong className="font-semibold">ngày tốt</strong> theo cả hai mệnh
            — chấm điểm chéo Can Chi.
          </div>
          <Link
            to="/tra-cuu"
            className="mt-3 inline-block px-3.5 py-2 no-underline font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ background: CT.forest, color: CT.cream }}
          >
            Tra cứu ngày lành →
          </Link>
        </div>

        <button
          type="button"
          onClick={() => navigate("/tra-cuu/hop-tuoi")}
          className="mt-6 w-full cursor-pointer border bg-transparent py-3 font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ borderColor: CT.hairline, color: CT.ink }}
        >
          Kiểm tra lại
        </button>
      </div>
    </div>
  );
}
