import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import { formatHopTuoiCriterionPoints } from "~/lib/hop-tuoi-result";
import {
  loadHopTuoiKetQua,
  persistHopTuoiKetQua,
  type HopTuoiKetQuaState,
} from "~/lib/hop-tuoi-session";
import {
  buildHopTuoiNextStepCopy,
  stashTraCuuIntentPreset,
} from "~/lib/hop-tuoi-ui";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";

function gradHeadline(label: string): string {
  return label.toUpperCase();
}

function HopTuoiSaveButton({
  state,
}: {
  state: HopTuoiKetQuaState;
}) {
  const { savePick } = useSavedPicks();
  const [saving, setSaving] = useState(false);
  const { panel, selfName, otherName, purposeLabel, payload } = state;
  const labelParts = [
    "Hợp tuổi",
    `${selfName} × ${otherName}`,
    purposeLabel,
    panel.gradLabel,
  ].filter(Boolean);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const r = await savePick({
      source_endpoint: "hop-tuoi",
      payload: {
        api: payload,
        panel,
        selfName,
        otherName,
        purposeLabel: purposeLabel ?? null,
      },
      label: labelParts.join(" · "),
      score: panel.score ?? undefined,
    });
    setSaving(false);
    if (r.ok) toast.success("Đã lưu kết quả luận giải tương hợp.");
    else toast.error(r.error ?? "Không lưu được.");
  }

  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => void handleSave()}
      className="cursor-pointer border-none bg-transparent p-0 font-serif text-xs"
      style={{ color: CT.goldDeep }}
    >
      {saving ? "…" : "Lưu"}
    </button>
  );
}

export default function TraCuuHopTuoiKetQuaRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as HopTuoiKetQuaState | null;
  const [state, setState] = useState<HopTuoiKetQuaState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (navState?.panel) {
      persistHopTuoiKetQua(navState);
      setState(navState);
      setHydrated(true);
      return;
    }
    const stored = loadHopTuoiKetQua();
    if (stored?.panel) {
      setState(stored);
    }
    setHydrated(true);
  }, [navState]);

  useEffect(() => {
    if (hydrated && !state?.panel) {
      navigate("/tra-cuu/hop-tuoi", { replace: true });
    }
  }, [hydrated, state, navigate]);

  const nextStep = useMemo(
    () =>
      state
        ? buildHopTuoiNextStepCopy({
            purposeLabel: state.purposeLabel,
            naphAm1: state.panel.naphAm1,
            naphAm2: state.panel.naphAm2,
          })
        : null,
    [state],
  );

  if (!hydrated || !state) return null;

  const { panel, selfName, otherName, purposeLabel } = state;
  const contextLabel =
    purposeLabel ??
    panel.relationshipLabel?.toLowerCase() ??
    "hợp tuổi";
  const showScore = panel.showNumericScore && panel.score != null;
  const quote =
    panel.reading?.trim() ||
    panel.advice?.trim() ||
    panel.verdict?.trim() ||
    panel.naphAmRelation;

  const breakdown =
    panel.criteriaRows.length > 0
      ? panel.criteriaRows.map((row) => ({
          t: row.name,
          v: row.description ?? "—",
          s: formatHopTuoiCriterionPoints(row),
        }))
      : panel.criteriaLines.map((line, i) => ({
          t: `Tiêu chí ${i + 1}`,
          v: line,
          s: "·",
        }));

  function handleTraCuuClick() {
    if (nextStep?.preset) {
      stashTraCuuIntentPreset(nextStep.preset);
    }
  }

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar
        title="Luận giải tương hợp"
        endAdornment={<HopTuoiSaveButton state={state} />}
      />

      <div className="flex-1 overflow-auto px-[22px] pb-24 pt-1.5">
        <div className="mt-1.5 flex items-center gap-3.5">
          <div
            className="flex-1 border bg-white px-3 py-2.5"
            style={{ borderColor: CT.hairline }}
          >
            <div
              className="text-sm font-bold tracking-[-0.005em]"
              style={{ ...DISPLAY2, color: CT.ink }}
            >
              {selfName}
            </div>
            <div className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
              {panel.personCards.p1?.menh
                ? `${panel.naphAm1} · bản mệnh ${panel.personCards.p1.menh}`
                : panel.naphAm1}
            </div>
          </div>
          <span
            className="text-sm"
            style={{ fontFamily: "var(--mono)", color: CT.goldDeep }}
          >
            ×
          </span>
          <div
            className="flex-1 border bg-white px-3 py-2.5"
            style={{ borderColor: CT.hairline }}
          >
            <div
              className="text-sm font-bold tracking-[-0.005em]"
              style={{ ...DISPLAY2, color: CT.ink }}
            >
              {otherName}
            </div>
            <div className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
              {panel.personCards.p2?.menh
                ? `${panel.naphAm2} · bản mệnh ${panel.personCards.p2.menh}`
                : panel.naphAm2}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Mono style={{ color: CT.goldDeep, fontSize: 10, letterSpacing: "0.22em" }}>
            Độ hòa hợp · {contextLabel}
          </Mono>
          {showScore ? (
            <div className="mt-2.5 flex items-baseline justify-center gap-1.5">
              <span
                className="text-[96px] font-extrabold leading-[0.85] tabular-nums tracking-[-0.04em]"
                style={{ ...DISPLAY2, color: CT.goldDeep }}
              >
                {panel.score}
              </span>
              <span className="font-serif text-base" style={{ color: CT.muted }}>
                /100
              </span>
            </div>
          ) : null}
          <div
            className="mt-2 text-[22px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ ...DISPLAY, color: CT.ink }}
          >
            {gradHeadline(panel.gradLabel)}
          </div>
          {quote ? (
            <p
              className="mx-auto mt-2 max-w-[320px] font-serif text-[13.5px] italic"
              style={{ color: CT.ink2, lineHeight: 1.55 }}
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
                    className="text-[13.5px] font-bold uppercase tracking-[-0.005em]"
                    style={{ ...DISPLAY2, color: CT.ink }}
                  >
                    {row.t}
                  </div>
                  <div
                    className="mt-0.5 font-serif text-xs"
                    style={{ color: CT.ink2, lineHeight: 1.45 }}
                  >
                    {row.v}
                  </div>
                </div>
                <span
                  className="text-base font-bold tabular-nums tracking-[-0.01em]"
                  style={{ ...DISPLAY2, color: CT.goldDeep }}
                >
                  {row.s}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {nextStep ? (
          <div
            className="mt-5 border-l-2 px-3.5 py-3.5"
            style={{
              background: "rgba(154,124,34,0.06)",
              borderColor: CT.goldDeep,
            }}
          >
            <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>
              {nextStep.kicker}
            </Mono>
            <div
              className="mt-1.5 font-serif text-[13.5px]"
              style={{ color: CT.ink, lineHeight: 1.55 }}
            >
              {nextStep.body}
            </div>
            <Link
              to="/tra-cuu"
              onClick={handleTraCuuClick}
              className="mt-3 inline-block px-3.5 py-2 no-underline text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ ...DISPLAY2, background: CT.forest, color: CT.cream }}
            >
              {nextStep.cta}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
