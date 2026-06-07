import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { BackBar, Mono } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { NSealTiny } from "~/components/direction-c/tra-cuu/NSeal";
import { useTraCuuResultsChat } from "~/hooks/useTraCuuResultsChat";
import { useProfile } from "~/hooks/useProfile";
import {
  canAccessPaidCalendar,
  effectiveChatQuotaRemaining,
  isOnboardingTrialChatMode,
  isOnboardingTrialExhausted,
} from "~/lib/entitlements";
import { useOnboardingTrialExhaustedModal } from "~/lib/onboarding-trial-exhausted-context";
import type { ResultDay, ResultGrade, TuTruIntent } from "~/lib/api-types";
import type { ChonNgayKetQuaState } from "~/lib/chon-ngay-flow";
import type { TraCuuResultsClientAction } from "~/lib/tra-cuu-results-chat";
import { mapChonNgayPayloadToResultDays } from "~/lib/chon-ngay-result";
import { scoreDotColor } from "~/lib/c-score";
import { CT } from "~/lib/c-tokens";
import {
  TRA_CUU_CHON_NGAY_TOP_N,
  TRA_CUU_DISPLAY_MAX_DAYS,
} from "~/lib/tra-cuu-pick";
import type { TraCuuRefineFilter } from "~/lib/tra-cuu-flow-types";
import { isTraCuuRefineChipActive } from "~/lib/tra-cuu-range-label";
import { filterWeekendDays } from "~/lib/tra-cuu-weekend";
import { CTraCuuAskBar } from "~/components/direction-c/tra-cuu/CTraCuuAskBar";
import {
  CTraCuuInkLoading,
  CTraCuuTypingText,
} from "~/components/direction-c/tra-cuu/CTraCuuTypingProse";
import { NSealSmall } from "~/components/direction-c/tra-cuu/NSeal";

function formatDayParts(iso: string): { day: string; month: string; wd: string } {
  const dt = new Date(`${iso}T12:00:00`);
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
  return {
    day: String(dt.getDate()).padStart(2, "0"),
    month: String(dt.getMonth() + 1).padStart(2, "0"),
    wd: labels[dt.getDay()] ?? "",
  };
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

const REFINE_OPTIONS: { id: TraCuuRefineFilter; label: string }[] = [
  { id: "weekend", label: "Chỉ cuối tuần" },
  { id: "extended90", label: "Mở rộng 3 tháng" },
  { id: "all", label: "Cả tháng" },
];

type CTraCuuResultsScreenProps = {
  state: ChonNgayKetQuaState;
  rangeLabel: string;
  intro: string | null;
  introLoading: boolean;
  filter: TraCuuRefineFilter;
  quotaRemaining: number;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  quotaLoaded?: boolean;
  onChangeTask: (prefillText?: string) => void;
  onStartSearch: (intent: TuTruIntent, intentLabel: string) => void;
  onOpenDay: (iso: string) => void;
  onRefine: (filter: TraCuuRefineFilter) => void;
  onQuotaChange?: (remaining: number) => void;
};

export function CTraCuuResultsScreen({
  state,
  rangeLabel,
  intro,
  introLoading,
  filter,
  quotaRemaining,
  quotaLoaded = true,
  scrollRef,
  onBack,
  onChangeTask,
  onStartSearch,
  onOpenDay,
  onRefine,
  onQuotaChange,
}: CTraCuuResultsScreenProps) {
  const handleClientAction = useCallback(
    (action: TraCuuResultsClientAction) => {
      if (action.type === "change_task") {
        onStartSearch(action.intent, action.intentLabel);
        return;
      }
      if (action.type === "open_day") {
        onOpenDay(action.dayIso);
      }
    },
    [onOpenDay, onStartSearch],
  );

  const sessionKey = `${state.intent}:${state.rangeStart}:${state.rangeEnd}`;
  const [introTypingDone, setIntroTypingDone] = useState(false);
  const turnEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useProfile();
  const { showOnboardingTrialExhaustedModal } = useOnboardingTrialExhaustedModal();
  const trialChatMode = isOnboardingTrialChatMode(profile);
  const trialExhausted = isOnboardingTrialExhausted(profile);
  const displayQuota = effectiveChatQuotaRemaining(profile, quotaRemaining);
  const chatPaywalled = Boolean(profile && !canAccessPaidCalendar(profile));

  const { turns, submitBusy, ask, markTurnTypingDone } = useTraCuuResultsChat({
    state,
    intro,
    onQuotaChange,
    onClientAction: handleClientAction,
  });

  useEffect(() => {
    setIntroTypingDone(false);
  }, [sessionKey]);

  useEffect(() => {
    if (introLoading) {
      setIntroTypingDone(false);
      return;
    }
    if (!intro) {
      setIntroTypingDone(true);
    }
  }, [intro, introLoading]);

  const interactionLocked = useMemo(() => {
    if (introLoading || (intro && !introTypingDone)) return true;
    return turns.some(
      (turn) =>
        turn.loading || Boolean(turn.answer && !turn.typingDone),
    );
  }, [intro, introLoading, introTypingDone, turns]);

  const scrollToLatest = useCallback(() => {
    window.requestAnimationFrame(() => {
      turnEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  useEffect(() => {
    if (turns.length === 0) return;
    const last = turns[turns.length - 1];
    if (last.loading || (last.answer && !last.typingDone)) {
      scrollToLatest();
    }
  }, [turns, scrollToLatest]);

  const allDays = useMemo(
    () => mapChonNgayPayloadToResultDays(state.payload, TRA_CUU_CHON_NGAY_TOP_N),
    [state.payload],
  );

  const days = useMemo(() => {
    const base =
      filter === "weekend" ? filterWeekendDays(allDays) : allDays;
    return base.slice(0, TRA_CUU_DISPLAY_MAX_DAYS);
  }, [allDays, filter]);

  const scannedCount = allDays.length;

  return (
    <div className="flex min-h-full flex-col">
      <BackBar
        title="Tra cứu"
        subtitle="chọn ngày theo việc"
        onBack={onBack}
      />

      <div ref={scrollRef} className="flex-1 overflow-auto px-[22px] pb-4 pt-1">
        <div
          className="flex flex-wrap items-center gap-2 font-serif text-xs leading-snug"
          style={{ color: CT.muted }}
        >
          <span
            className="whitespace-nowrap px-2.5 py-1 font-bold uppercase tracking-[0.02em]"
            style={{
              fontFamily: "var(--display-2)",
              background: CT.forest,
              color: CT.cream,
              fontSize: 11.5,
            }}
          >
            {state.intentLabel}
          </span>
          <span>· {rangeLabel}</span>
          <button
            type="button"
            onClick={() => onChangeTask()}
            className="cursor-pointer border-none bg-transparent p-0 font-serif text-xs"
            style={{ color: CT.goldDeep }}
          >
            · đổi việc
          </button>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <NSealSmall />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className="text-[13px] font-extrabold uppercase tracking-[0.02em]"
                style={{ fontFamily: "var(--display-2)", color: CT.ink }}
              >
                NLTT
              </span>
              <Mono style={{ color: CT.muted, fontSize: 8.5 }}>
                đã soi {scannedCount} ngày
              </Mono>
            </div>
            {introLoading && !intro ? (
              <CTraCuuInkLoading
                className="mt-1.5"
                fontSize={13.5}
                message="NLTT đang tổng hợp"
              />
            ) : intro ? (
              <CTraCuuTypingText
                className="mt-1.5"
                fontSize={13.5}
                text={intro}
                active={!introTypingDone}
                onComplete={() => setIntroTypingDone(true)}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 ml-[45px]">
          {filter === "weekend" && days.length === 0 ? (
            <div
              className="border px-3.5 py-4 font-serif text-[13px] italic"
              style={{
                background: "#fff",
                borderColor: CT.hairline,
                color: CT.muted,
              }}
            >
              Không có cuối tuần nào đủ tốt trong tháng.{" "}
              <button
                type="button"
                onClick={() => onRefine("all")}
                className="cursor-pointer border-none bg-transparent p-0 font-serif text-[13px] not-italic"
                style={{ color: CT.goldDeep }}
              >
                Xem cả tuần →
              </button>
            </div>
          ) : days.length === 0 ? (
            <ErrorBanner message="Chưa đọc được danh sách ngày từ API." />
          ) : (
            <div>
              {days.map((day, i) => (
                <ResultRow
                  key={day.isoDate}
                  day={day}
                  index={i}
                  payload={state.payload}
                  onOpen={() => onOpenDay(day.isoDate)}
                />
              ))}
            </div>
          )}

          <div className="mt-[18px]">
            <Mono style={{ color: CT.muted, fontSize: 9 }}>Lọc lại</Mono>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REFINE_OPTIONS.map((opt) => {
                const active = isTraCuuRefineChipActive(
                  opt.id,
                  filter,
                  rangeLabel,
                );
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onRefine(opt.id)}
                    className="cursor-pointer border px-3 py-2 font-serif text-[12.5px]"
                    style={{
                      background: active ? CT.forest : "#fff",
                      color: active ? CT.cream : CT.ink2,
                      borderColor: CT.hairline,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {turns.map((turn, i) => (
            <div key={`${turn.question}-${i}`} className="ml-[45px] mt-[18px]">
              <div
                className="px-[13px] py-2.5"
                style={{
                  background: "rgba(154,124,34,0.06)",
                  borderLeft: `3px solid ${CT.goldDeep}`,
                }}
              >
                <Mono
                  className="mb-[3px] block"
                  style={{ color: CT.goldDeep, fontSize: 8.5 }}
                >
                  Bạn hỏi
                </Mono>
                <p
                  className="m-0 font-serif text-[13px] italic leading-snug"
                  style={{ color: CT.ink2 }}
                >
                  {turn.question}
                </p>
              </div>
              <div className="mt-2.5 flex items-start gap-2.5">
                <NSealTiny />
                <div className="min-w-0 flex-1">
                  {turn.loading ? (
                    <CTraCuuInkLoading fontSize={13} message="Đang luận giải" />
                  ) : turn.error ? (
                    <p className="font-serif text-[13px]" style={{ color: CT.red }}>
                      {turn.error}
                    </p>
                  ) : turn.answer ? (
                    <CTraCuuTypingText
                      fontSize={13}
                      text={turn.answer}
                      active={!turn.typingDone}
                      onComplete={() => markTurnTypingDone(i)}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <div ref={turnEndRef} aria-hidden className="h-px" />
        </div>
      </div>

      <CTraCuuAskBar
        mode="results"
        placeholder={
          chatPaywalled
            ? "Đặt lịch để hỏi tiếp…"
            : "Hỏi tiếp hoặc đổi việc…"
        }
        quotaRemaining={displayQuota}
        quotaLoaded={quotaLoaded}
        trialChatMode={trialChatMode}
        paywallLocked={chatPaywalled && trialExhausted}
        onTrialExhaustedTap={
          trialExhausted ? showOnboardingTrialExhaustedModal : undefined
        }
        disabled={interactionLocked || chatPaywalled}
        submitBusy={submitBusy || interactionLocked}
        onSubmit={(q) => {
          if (!q.trim()) {
            onChangeTask();
            return;
          }
          scrollToLatest();
          void ask(q);
        }}
      />
    </div>
  );
}

function ResultRow({
  day,
  index,
  payload,
  onOpen,
}: {
  day: ResultDay;
  index: number;
  payload: unknown;
  onOpen: () => void;
}) {
  const isTop = index === 0;
  const parts = formatDayParts(day.isoDate);
  const fallback = gradeToScore(day.grade, index);
  const score = extractScoreFromPayload(payload, day.isoDate, fallback);
  const why =
    day.reasons[0] ??
    (day.truc !== "—" ? `${day.truc} · giờ tốt ${day.bestHour}` : "Phù hợp với lá số của bạn");
  const metaChi = day.canChi !== "—" ? day.canChi : "—";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative mb-2 flex w-full cursor-pointer items-baseline gap-3 border px-3.5 py-3.5 text-left"
      style={{
        background: isTop ? "rgba(154,124,34,0.1)" : "#fff",
        borderColor: CT.hairline,
        borderLeftWidth: isTop ? 3 : 1,
        borderLeftColor: isTop ? CT.goldDeep : CT.hairline,
      }}
    >
      {isTop ? (
        <span
          className="absolute -top-2 right-3 text-[8.5px] font-extrabold uppercase tracking-[0.2em]"
          style={{
            fontFamily: "var(--mono)",
            color: CT.goldDeep,
            background: CT.gold,
            padding: "2px 7px",
            whiteSpace: "nowrap",
          }}
        >
          ★ ĐỀ XUẤT
        </span>
      ) : null}
      <div className="min-w-[50px]">
        <div
          className="text-[23px] font-extrabold leading-none tabular-nums tracking-[-0.02em]"
          style={{
            fontFamily: "var(--display-2)",
            color: isTop ? CT.red : CT.ink,
          }}
        >
          {parts.day}
        </div>
        <div className="mt-[3px] font-serif text-[10.5px]" style={{ color: CT.muted }}>
          Th{parts.month} · {parts.wd}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] font-serif text-[11px]" style={{ color: CT.muted }}>
          {metaChi} · {day.lunarLabel}
        </div>
        <div
          className="font-serif text-[12.5px] italic"
          style={{ color: CT.ink2, lineHeight: 1.45 }}
        >
          {why}
        </div>
      </div>
      <div
        className="min-w-[30px] text-right text-xl font-extrabold tabular-nums tracking-[-0.02em]"
        style={{
          fontFamily: "var(--display-2)",
          color: scoreDotColor(score),
        }}
      >
        {score}
      </div>
    </button>
  );
}
