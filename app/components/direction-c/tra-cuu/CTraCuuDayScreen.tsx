import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CSavedPickMarkSheet } from "~/components/direction-c/CSavedPickMarkSheet";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CTraCuuAskBar } from "~/components/direction-c/tra-cuu/CTraCuuAskBar";
import { NSealSmall, NSealTiny } from "~/components/direction-c/tra-cuu/NSeal";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import {
  effectiveChatQuotaRemaining,
  isOnboardingTrialExhausted,
} from "~/lib/entitlements";
import { useOnboardingTrialExhaustedModal } from "~/lib/onboarding-trial-exhausted-context";
import { useSavedPicks } from "~/hooks/useSavedPicks";
import type { TuTruIntent } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import {
  DAY_LUAN_SUGGESTED_CHIPS,
  formatDayIsoShort,
  resolveLuanSourceLabels,
} from "~/lib/day-luan-sectioned";
import { scoreDotColor } from "~/lib/c-score";
import { parseSuggestedFollowups } from "~/lib/luan-context";
import {
  dayNumberFromIso,
  weekdayFromIso,
} from "~/lib/lich-format";
import { offerGoogleCalendarAfterSave } from "~/lib/saved-pick-calendar";
import { resolveSavedPickSource } from "~/lib/saved-pick-mark";
import { findSavedPickForDay } from "~/lib/saved-picks-upcoming";
import {
  traCuuDayLuuY,
  traCuuDayWhyFromReading,
} from "~/lib/tra-cuu-day-copy";
import { traCuuDayVerdictFromScore } from "~/lib/tra-cuu-verdict";

type CTraCuuDayScreenProps = {
  iso: string;
  intent: TuTruIntent;
  intentLabel: string;
  quotaLoaded?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onQuotaChange?: (remaining: number) => void;
};

export function CTraCuuDayScreen({
  iso,
  intent,
  intentLabel,
  quotaLoaded = true,
  scrollRef,
  onBack,
  onQuotaChange,
}: CTraCuuDayScreenProps) {
  const dayKey = iso;
  const {
    detail,
    detailLoading,
    detailError,
    reading,
    readingLoading,
    readingFailed,
    dailyLimitReached,
    unlocked,
    unlockAndLoad,
    askFollowUp,
    followUpRemaining,
    serverThreadMessages,
    followUpChatEnabled,
    subActive,
    profile,
    calendarTeaserUser,
    trialAccess,
    payload,
    luanContext,
  } = useDayLuanReading(iso);
  const { showOnboardingTrialExhaustedModal } = useOnboardingTrialExhaustedModal();
  const trialExhausted = isOnboardingTrialExhausted(profile);
  const displayQuota = effectiveChatQuotaRemaining(profile, followUpRemaining);

  const { savePick, deletePick, picks } = useSavedPicks();
  const savedPick = findSavedPickForDay(picks, iso);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [localMessages, setLocalMessages] = useState<
    { question: string; answer: string | null; loading: boolean; error: string | null }[]
  >([]);
  const idempotencyRef = useRef(0);

  useEffect(() => {
    onQuotaChange?.(followUpRemaining);
  }, [followUpRemaining, onQuotaChange]);

  useEffect(() => {
    setLocalMessages([]);
    idempotencyRef.current = 0;
  }, [dayKey]);

  useEffect(() => {
    if (serverThreadMessages.length === 0) return;
    const synced: typeof localMessages = [];
    for (let i = 0; i < serverThreadMessages.length; i += 2) {
      const user = serverThreadMessages[i];
      const assistant = serverThreadMessages[i + 1];
      if (user?.role === "user" && assistant?.role === "assistant") {
        synced.push({
          question: user.content,
          answer: assistant.content,
          loading: false,
          error: null,
        });
      }
    }
    setLocalMessages(synced);
  }, [serverThreadMessages, dayKey]);

  const score = detail?.score ?? 0;
  const verdict = traCuuDayVerdictFromScore(score);
  const gioTot = detail?.gioTot ?? "—";
  const gioXau = detail?.gioXau ?? "—";
  const breakdownFallback =
    detail?.breakdown?.[0]?.reasonVi ??
    "Phù hợp với lá số của bạn cho việc này.";
  const whyText = traCuuDayWhyFromReading(reading, breakdownFallback);
  const luuY = traCuuDayLuuY(
    reading,
    detail?.breakdown?.[1]?.reasonVi ?? detail?.breakdown?.[0]?.reasonVi,
  );

  const sourcePair = useMemo(() => {
    const labels = resolveLuanSourceLabels(detail);
    return labels.slice(0, 2).map(([, title]) => title);
  }, [detail]);

  const suggestedChips = useMemo(() => {
    const fromContext = parseSuggestedFollowups(luanContext);
    if (fromContext.length > 0) return fromContext;
    return [
      DAY_LUAN_SUGGESTED_CHIPS[0],
      `${intentLabel.toLowerCase()} — giờ nào tốt nhất?`,
      DAY_LUAN_SUGGESTED_CHIPS[2],
    ];
  }, [intentLabel, luanContext]);

  const askedQuestions = useMemo(
    () => new Set(localMessages.map((m) => m.question)),
    [localMessages],
  );

  const remainingChips = suggestedChips.filter((c) => !askedQuestions.has(c));

  const handleAsk = useCallback(
    async (question: string) => {
      if (calendarTeaserUser) {
        if (trialExhausted) {
          showOnboardingTrialExhaustedModal();
        } else {
          toast.error("Cần gói lịch hoặc lượt thử để hỏi tiếp.");
        }
        return;
      }
      if (!unlocked) {
        const unlock = await unlockAndLoad();
        if (!unlock?.ok) {
          toast.error(unlock?.message ?? "Cần mở luận giải trước.");
          return;
        }
      }

      setSubmitBusy(true);
      setLocalMessages((prev) => [
        ...prev,
        { question, answer: null, loading: true, error: null },
      ]);

      const idempotencyKey = `tracuu-${iso}-${++idempotencyRef.current}-${Date.now()}`;
      const res = await askFollowUp(question, idempotencyKey);

      setSubmitBusy(false);
      setLocalMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.question === question && m.loading);
        if (idx < 0) return prev;
        if (!res.ok) {
          next[idx] = {
            question,
            answer: null,
            loading: false,
            error: res.message ?? "Không trả lời được.",
          };
          return next;
        }
        next[idx] = {
          question,
          answer: res.reading,
          loading: false,
          error: null,
        };
        return next;
      });

      if (!res.ok && res.message) {
        toast.error(res.message);
      }
    },
    [
      askFollowUp,
      calendarTeaserUser,
      trialExhausted,
      showOnboardingTrialExhaustedModal,
      iso,
      unlockAndLoad,
      unlocked,
    ],
  );

  async function toggleSave() {
    if (savedPick) {
      setSaving(true);
      const r = await deletePick(savedPick.id);
      setSaving(false);
      if (r.ok) toast.success("Đã bỏ lưu ngày này.");
      else toast.error(r.error ?? "Không bỏ lưu được.");
      return;
    }
    setMarkSheetOpen(true);
  }

  async function handleMarkConfirm(values: {
    label: string;
    intent: TuTruIntent | null;
    note: string | null;
    addToGoogleCalendar: boolean;
  }) {
    if (!detail || !iso || saving) return;
    setSaving(true);
    const r = await savePick({
      source_endpoint: "day-detail",
      payload: payload ?? detail,
      label: values.label,
      day_iso: iso,
      score: score ?? undefined,
      intent: values.intent,
      note: values.note,
      source: resolveSavedPickSource({ intentLabel }),
    });
    setSaving(false);
    if (r.ok) {
      setMarkSheetOpen(false);
      if (values.addToGoogleCalendar) {
        offerGoogleCalendarAfterSave({
          dayIso: iso,
          label: values.label,
          note: values.note,
          score: score ?? undefined,
        });
      } else {
        toast.success("Đã lưu ngày này vào sổ tay của bạn.");
      }
    } else {
      toast.error(r.error ?? "Không lưu được.");
    }
  }

  const dayShort = formatDayIsoShort(iso);
  const dayNum = dayNumberFromIso(iso);
  const weekday = weekdayFromIso(iso);
  const monthNum = new Date(`${iso}T12:00:00`).getMonth() + 1;
  return (
    <div className="flex min-h-full flex-col">
      <BackBar
        title={`${intentLabel} · ${dayShort}`}
        subtitle="NLTT luận theo lá số của bạn"
        onBack={onBack}
        endAdornment={
          <Mono style={{ color: CT.muted, fontSize: 9 }}>có nguồn</Mono>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-auto px-[22px] pb-4 pt-1">
        {detailLoading ? (
          <p className="py-8 font-serif text-[13px] italic" style={{ color: CT.muted }}>
            Đang tải chi tiết ngày…
          </p>
        ) : detailError ? (
          <ErrorBanner message={detailError} />
        ) : detail ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className="text-[58px] font-extrabold leading-[0.84] tabular-nums tracking-[-0.04em]"
                style={{ fontFamily: "var(--display-2)", color: CT.red }}
              >
                {dayNum}
              </div>
              <div>
                <div
                  className="text-[19px] font-black uppercase leading-none tracking-[-0.01em]"
                  style={{ fontFamily: "var(--display)", color: CT.red }}
                >
                  Tháng {monthNum}
                </div>
                <div
                  className="mt-1 font-serif text-[11.5px] leading-snug"
                  style={{ color: CT.muted }}
                >
                  {weekday} · {detail.canChi}
                  <br />
                  {detail.lunarDate}
                </div>
              </div>
              <div className="ml-auto flex items-baseline gap-0.5">
                <span
                  className="text-[30px] font-extrabold tabular-nums leading-none"
                  style={{
                    fontFamily: "var(--display-2)",
                    color: scoreDotColor(score),
                  }}
                >
                  {score}
                </span>
                <span className="font-serif text-[11px]" style={{ color: CT.muted }}>
                  /100
                </span>
              </div>
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
                  <Mono style={{ color: CT.muted, fontSize: 8.5 }}>đã luận</Mono>
                </div>

                <div
                  className="mt-2 px-[15px] py-[13px]"
                  style={{
                    background: verdict.tint,
                    borderLeft: `3px solid ${verdict.edge}`,
                  }}
                >
                  <span
                    className="inline-block px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      fontFamily: "var(--mono)",
                      color: "#fff",
                      background: verdict.color,
                    }}
                  >
                    {verdict.label} · cho {intentLabel.toLowerCase()}
                  </span>
                  {readingLoading && !reading ? (
                    <p
                      className="mt-2.5 font-serif text-[13.5px] italic"
                      style={{ color: CT.muted }}
                    >
                      NLTT đang luận chi tiết…
                    </p>
                  ) : dailyLimitReached ? (
                    <p className="mt-2.5 font-serif text-[13px]" style={{ color: CT.ink2 }}>
                      Hết lượt hỏi hôm nay. Quay lại sáng mai.
                    </p>
                  ) : readingFailed ? (
                    <p className="mt-2.5 font-serif text-[13px]" style={{ color: CT.red }}>
                      Chưa tải được luận giải.
                    </p>
                  ) : (
                    <p
                      className="mb-0 mt-2.5 font-serif text-[13.5px] leading-relaxed"
                      style={{ color: CT.ink }}
                    >
                      {whyText}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2.5">
                  <ColoredMonoRow label="Giờ tốt" value={gioTot} color={CT.forest} />
                  <ColoredMonoRow label="Tránh" value={gioXau} color={CT.red} />
                  {luuY ? (
                    <ColoredMonoRow label="Lưu ý" value={luuY} color={CT.goldDeep} />
                  ) : null}
                </div>

                {sourcePair.length > 0 ? (
                  <p
                    className="mt-3 font-serif text-[11px] leading-snug"
                    style={{ color: CT.muted }}
                  >
                    Đối chiếu:{" "}
                    {sourcePair.map((s, i) => (
                      <span key={s}>
                        {i > 0 ? " · " : null}
                        <span style={{ color: CT.ink2 }}>{s}</span>
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => void toggleSave()}
              className="ml-[45px] mt-4 w-[calc(100%-45px)] cursor-pointer border py-[13px] text-[12.5px] font-extrabold uppercase tracking-[0.08em]"
              style={{
                fontFamily: "var(--display-2)",
                background: savedPick ? "transparent" : CT.forest,
                color: savedPick ? CT.forest : CT.cream,
                borderColor: savedPick ? CT.forest : "transparent",
              }}
            >
              {savedPick ? "✓ Đã lưu — nhắc trước 1 ngày" : "Lưu vào lịch của tôi"}
            </button>

            {localMessages.map((turn, i) => (
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
                      <p className="font-serif text-[13px] italic" style={{ color: CT.muted }}>
                        NLTT đang trả lời…
                      </p>
                    ) : turn.error ? (
                      <p className="font-serif text-[13px]" style={{ color: CT.red }}>
                        {turn.error}
                      </p>
                    ) : turn.answer ? (
                      <p
                        className="m-0 font-serif text-[13px] leading-relaxed"
                        style={{ color: CT.ink }}
                      >
                        {turn.answer}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {followUpChatEnabled && unlocked && followUpRemaining > 0 && remainingChips.length > 0 ? (
              <div
                className="ml-[45px] mt-5 border-t pt-3.5"
                style={{ borderColor: CT.hairline }}
              >
                <Mono style={{ color: CT.muted, fontSize: 9 }}>Hỏi tiếp về ngày này</Mono>
                <div className="mt-2.5 flex flex-col gap-[7px]">
                  {remainingChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void handleAsk(chip)}
                      className="cursor-pointer border px-3.5 py-[11px] text-left font-serif text-[13px]"
                      style={{
                        borderColor: CT.hairline,
                        background: "#fff",
                        color: CT.ink2,
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <CTraCuuAskBar
        mode="day"
        placeholder={
          calendarTeaserUser
            ? "Đặt lịch để hỏi tiếp…"
            : `Hỏi tiếp về ngày ${dayShort}…`
        }
        quotaRemaining={displayQuota}
        quotaLoaded={quotaLoaded}
        trialChatMode={trialAccess}
        paywallLocked={calendarTeaserUser && trialExhausted}
        onTrialExhaustedTap={
          trialExhausted ? showOnboardingTrialExhaustedModal : undefined
        }
        submitBusy={submitBusy}
        disabled={calendarTeaserUser}
        onSubmit={(q) => void handleAsk(q)}
      />

      <CSavedPickMarkSheet
        open={markSheetOpen}
        mode="create"
        dayIso={iso}
        score={score ?? undefined}
        suggestedLabels={[intentLabel, ...(detail?.goodFor ?? [])]}
        initialLabel={intentLabel}
        initialIntent={intent}
        busy={saving}
        onClose={() => setMarkSheetOpen(false)}
        onConfirm={(values) => void handleMarkConfirm(values)}
      />
    </div>
  );
}

function ColoredMonoRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <Mono
        className="w-[50px] shrink-0"
        style={{
          fontSize: 9,
          letterSpacing: "0.12em",
          color,
        }}
      >
        {label}
      </Mono>
      <span className="font-serif text-[13px] leading-snug" style={{ color: CT.ink }}>
        {value}
      </span>
    </div>
  );
}
