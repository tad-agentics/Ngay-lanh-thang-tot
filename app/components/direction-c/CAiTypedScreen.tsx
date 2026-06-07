import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar, LogoMark, Mono } from "~/components/brand";
import { CBaziNlttLuanInkCursor } from "~/components/direction-c/CBaziNlttLuanRow";
import { DayLuanSectionedPanel } from "~/components/direction-c/DayLuanSectionedPanel";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import type { LuanThreadTurn } from "~/lib/generate-reading";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { DAY_LUAN_MAX_FOLLOW_UPS } from "~/lib/day-luan-chat";
import { canPeekTodayLuanReading } from "~/lib/entitlements";
import { todayIsoInVn } from "~/lib/today-reading-cache";
import {
  anchorQuestionForScore,
  buildDayLuanSectionBundle,
  resolveLuanSourceLabels,
  DAY_LUAN_SUGGESTED_CHIPS,
  formatDayIsoShort,
} from "~/lib/day-luan-sectioned";
import { NLTT_TYPING_MS_PER_CHAR } from "~/lib/nltt-typing";
import { paragraphSpansInText } from "~/lib/prose-paragraphs";

type FollowUpTurn = {
  id: string;
  question: string;
  answer: string | null;
  loading: boolean;
  error: string | null;
  typingDone: boolean;
};

function threadMessagesToFollowUps(messages: LuanThreadTurn[]): FollowUpTurn[] {
  const out: FollowUpTurn[] = [];
  for (let i = 0; i < messages.length; i += 2) {
    const user = messages[i];
    const assistant = messages[i + 1];
    if (user?.role === "user" && assistant?.role === "assistant") {
      out.push({
        id: `srv-${i}`,
        question: user.content,
        answer: assistant.content,
        loading: false,
        error: null,
        typingDone: true,
      });
    }
  }
  return out;
}

function TypedBody({
  text,
  active,
  onComplete,
  fontSize = 14,
  marginTop = 6,
  sentencesPerParagraph = 2,
}: {
  text: string;
  active: boolean;
  onComplete?: () => void;
  fontSize?: number;
  marginTop?: number;
  sentencesPerParagraph?: number;
}) {
  const [len, setLen] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const paragraphs = useMemo(
    () => paragraphSpansInText(text, sentencesPerParagraph),
    [text, sentencesPerParagraph],
  );

  useEffect(() => {
    completedRef.current = false;
    if (!active || !text) {
      setLen(text.length);
      if (text && onCompleteRef.current && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }
    setLen(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= text.length) {
        window.clearInterval(id);
        if (onCompleteRef.current && !completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
      }
    }, NLTT_TYPING_MS_PER_CHAR);
    return () => window.clearInterval(id);
  }, [text, active]);

  const typing = active && len < text.length;
  const lineHeight = fontSize >= 14 ? 1.65 : 1.6;
  const paragraphGap = fontSize >= 14 ? 12 : 10;

  return (
    <>
      {paragraphs.map((span, index) => {
        const sliceEnd = Math.min(span.end, len);
        if (sliceEnd <= span.start) return null;
        const visible = text.slice(span.start, sliceEnd);
        const isLastVisible =
          index === paragraphs.length - 1 ||
          paragraphs.slice(index + 1).every((next) => len <= next.start);

        return (
          <p
            key={`${span.start}-${span.end}`}
            aria-live={active && index === 0 ? "polite" : undefined}
            style={{
              marginTop: index === 0 ? marginTop : paragraphGap,
              marginBottom: 0,
              fontFamily: "var(--serif)",
              fontSize,
              color: CT.ink,
              lineHeight,
            }}
          >
            {visible}
            {typing && isLastVisible ? (
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 14,
                  background: CT.ink,
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: "b-cursor-blink 1s steps(2) infinite",
                }}
              />
            ) : null}
          </p>
        );
      })}
      <style>{`@keyframes b-cursor-blink { 50% { opacity: 0; } }`}</style>
    </>
  );
}

function QuestionBlock({
  question,
  compact,
}: {
  question: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        padding: compact ? "10px 14px" : "12px 14px",
        background: "rgba(154,124,34,0.06)",
        borderLeft: `2px solid ${CT.goldDeep}`,
      }}
    >
      <Mono style={{ color: CT.goldDeep, fontSize: 9.5 }}>Bạn hỏi</Mono>
      <div
        style={{
          marginTop: compact ? 3 : 4,
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: compact ? 13 : 13.5,
          color: CT.ink2,
          lineHeight: 1.5,
        }}
      >
        &ldquo;{question}&rdquo;
      </div>
    </div>
  );
}

/** Design system §13B — ink cursor while bat-tu / LLM chưa trả prose. */
function NlttInkLoadingBody({
  message = "Đang luận giải",
  compact,
}: {
  message?: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`font-serif mt-1 italic leading-[1.6] ${compact ? "text-sm" : "text-[14px]"}`}
      style={{ color: compact ? CT.muted : CT.ink2, minHeight: 20 }}
      aria-live="polite"
    >
      {message}
      <CBaziNlttLuanInkCursor />
    </p>
  );
}

function AiAnswerRow({
  kicker,
  children,
  compact,
}: {
  kicker: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const size = compact ? 26 : 32;
  const logo = compact ? 18 : 22;
  return (
    <div
      className="flex gap-3 items-start"
      style={{ marginTop: compact ? 14 : 22, gap: compact ? 10 : 12 }}
    >
      <div
        className="shrink-0 flex items-center justify-center overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          background: CT.forest,
          marginTop: 2,
        }}
      >
        <LogoMark size={logo} dark />
      </div>
      <div className="flex-1 min-w-0">
        <Mono style={{ color: CT.muted, fontSize: 9.5 }}>{kicker}</Mono>
        {children}
      </div>
    </div>
  );
}

function chipWasAsked(chip: string, asked: string[]): boolean {
  const c = chip.toLowerCase();
  return asked.some((q) => {
    const t = q.toLowerCase();
    return t.includes(c) || c.includes(t);
  });
}

const chipButtonStyle = {
  background: "#fff",
  border: `1px solid ${CT.hairline}`,
  color: CT.ink2,
  cursor: "pointer",
} as const;

export function CAiTypedScreen({ iso }: { iso: string }) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const turnEndRef = useRef<HTMLDivElement>(null);

  const openPurchase = useCallback(() => {
    navigate("/dat-lich");
  }, [navigate]);

  const {
    profile,
    profileLoading,
    detailLoading,
    detailError,
    detail,
    reading,
    readingLoading,
    unlocked,
    unlockBusy,
    subActive,
    calendarTeaserUser,
    unlockAndLoad,
    retryReading,
    askFollowUp,
    compareWithTomorrow,
    followUpRemaining,
    serverThreadMessages,
    followUpChatEnabled,
  } = useDayLuanReading(iso);

  const dayShort = formatDayIsoShort(iso);
  const todayIso = todayIsoInVn();
  const todayShort = formatDayIsoShort(todayIso);
  const todayFreePeek = canPeekTodayLuanReading(profile, iso, todayIso);
  const purchaseGated = calendarTeaserUser;
  const offTodayPurchaseGate =
    purchaseGated &&
    !todayFreePeek &&
    !detailLoading &&
    !profileLoading &&
    !detailError;
  const score = detail?.score ?? null;
  const anchorQuestion = anchorQuestionForScore(score, iso);
  const sectionBundle = buildDayLuanSectionBundle(detail);

  const [anchorTypingDone, setAnchorTypingDone] = useState(false);
  const handleAnchorTypingComplete = useCallback(() => {
    setAnchorTypingDone(true);
  }, []);
  const [followUps, setFollowUps] = useState<FollowUpTurn[]>([]);
  const [input, setInput] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const threadHydratedIsoRef = useRef<string | null>(null);

  const quotaRemaining = followUpRemaining;
  const quotaExhausted = quotaRemaining <= 0;

  const showAnchorHead = Boolean(
    reading && !readingLoading && (unlocked || todayFreePeek),
  );
  const anchorDone = showAnchorHead && anchorTypingDone;
  const locked =
    !purchaseGated &&
    !unlocked &&
    !readingLoading &&
    !detailLoading &&
    !profileLoading;
  const readingMissing =
    !reading &&
    !readingLoading &&
    !detailLoading &&
    !profileLoading &&
    !detailError &&
    !offTodayPurchaseGate;
  const showEarlyLoading =
    (detailLoading || profileLoading) && !detailError;

  useEffect(() => {
    threadHydratedIsoRef.current = null;
    setAnchorTypingDone(false);
    setFollowUps([]);
  }, [iso]);

  useEffect(() => {
    if (serverThreadMessages.length === 0) return;
    if (threadHydratedIsoRef.current === iso) return;
    threadHydratedIsoRef.current = iso;
    setFollowUps(threadMessagesToFollowUps(serverThreadMessages));
  }, [iso, serverThreadMessages]);

  useEffect(() => {
    if (!anchorDone) return;
    if (window.location.hash !== "#chi-tiet") return;
    window.requestAnimationFrame(() => {
      document.getElementById("chi-tiet")?.scrollIntoView({ behavior: "smooth" });
    });
  }, [anchorDone]);

  const scrollToLatest = useCallback(() => {
    window.requestAnimationFrame(() => {
      turnEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const submitFollowUp = useCallback(
    async (rawQuestion: string) => {
      if (purchaseGated) {
        openPurchase();
        return;
      }

      const question = rawQuestion.trim();
      if (
        !question ||
        submitBusy ||
        quotaExhausted ||
        !unlocked ||
        !followUpChatEnabled
      ) {
        return;
      }

      const turnId = `${Date.now()}`;
      setFollowUps((prev) => [
        ...prev,
        { id: turnId, question, answer: null, loading: true, error: null, typingDone: false },
      ]);
      setInput("");
      scrollToLatest();

      setSubmitBusy(true);
      const isCompareTomorrow =
        question === "So sánh với ngày mai" ||
        question.toLowerCase().includes("so sánh với ngày mai");
      const res = isCompareTomorrow
        ? await compareWithTomorrow()
        : await askFollowUp(question, turnId);
      setSubmitBusy(false);

      if (!res.ok || !res.reading) {
        setFollowUps((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  loading: false,
                  error: res.message ?? "Không kết nối được. Thử lại ›",
                }
              : t,
          ),
        );
        return;
      }

      setFollowUps((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? { ...t, loading: false, answer: res.reading, error: null }
            : t,
        ),
      );
    },
    [
      askFollowUp,
      compareWithTomorrow,
      followUpChatEnabled,
      openPurchase,
      purchaseGated,
      quotaExhausted,
      scrollToLatest,
      submitBusy,
      unlocked,
    ],
  );

  const retryFollowUp = useCallback(
    async (turnId: string, question: string) => {
      if (purchaseGated) {
        openPurchase();
        return;
      }
      setFollowUps((prev) =>
        prev.map((t) =>
          t.id === turnId ? { ...t, loading: true, error: null, answer: null } : t,
        ),
      );
      setSubmitBusy(true);
      const res = await askFollowUp(question, turnId);
      setSubmitBusy(false);
      if (!res.ok || !res.reading) {
        setFollowUps((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  loading: false,
                  error: res.message ?? "Không kết nối được. Thử lại ›",
                }
              : t,
          ),
        );
        return;
      }
      setFollowUps((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? { ...t, loading: false, answer: res.reading, error: null }
            : t,
        ),
      );
    },
    [askFollowUp, openPurchase, purchaseGated],
  );

  const askedQuestions = [
    anchorQuestion,
    ...followUps.map((f) => f.question),
  ];
  const remainingChips = DAY_LUAN_SUGGESTED_CHIPS.filter(
    (chip) => !chipWasAsked(chip, askedQuestions),
  );

  const anchorKicker =
    anchorDone || !showAnchorHead ? "NLTT luận" : "NLTT đang luận…";

  const purchaseGatedChips =
    purchaseGated &&
    anchorDone &&
    followUpChatEnabled &&
    remainingChips.length > 0;

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar title={`Luận giải · ngày ${dayShort}`} />

      <div ref={scrollRef} className="flex-1 overflow-auto px-6 pt-2 pb-6">
        {detailError ? <ErrorBanner message={detailError} /> : null}

        {!detailError ? (
          <>
            <QuestionBlock question={anchorQuestion} />

            {showEarlyLoading ? (
              <AiAnswerRow kicker="Đang tải…">
                <NlttInkLoadingBody message="" />
              </AiAnswerRow>
            ) : null}

        {!detailLoading && !profileLoading ? (
          <>

            {offTodayPurchaseGate ? (
              <div className="mt-6 text-center">
                <p className="font-serif text-sm mb-4" style={{ color: CT.ink2 }}>
                  Luận giải cho ngày {dayShort} cần gói lịch cá nhân. Bạn vẫn có
                  thể xem teaser miễn phí cho hôm nay.
                </p>
                <button
                  type="button"
                  onClick={openPurchase}
                  className="w-full max-w-xs py-3 text-xs font-extrabold uppercase tracking-wider"
                  style={{ ...DISPLAY2, background: CT.forest, color: CT.cream, border: "none" }}
                >
                  Đặt lịch cát tường
                </button>
                {iso !== todayIso ? (
                  <Link
                    to={`/luan-ai/day-${todayIso}`}
                    className="mt-3 inline-block font-serif text-sm"
                    style={{ color: CT.goldDeep }}
                  >
                    Xem luận hôm nay →
                  </Link>
                ) : null}
              </div>
            ) : null}

            {readingMissing ? (
              <div className="mt-6 text-center">
                <p className="font-serif text-sm mb-4" style={{ color: CT.ink2 }}>
                  Chưa tải được luận giải cho ngày này. Thử tải lại sau vài giây.
                </p>
                <button
                  type="button"
                  disabled={readingLoading}
                  onClick={() => void retryReading()}
                  className="w-full max-w-xs py-3 text-xs font-extrabold uppercase tracking-wider"
                  style={{ ...DISPLAY2, background: CT.forest, color: CT.cream, border: "none" }}
                >
                  Tải lại luận giải
                </button>
              </div>
            ) : null}

            {locked ? (
              <div className="mt-6 text-center">
                <p className="font-serif text-sm mb-4" style={{ color: CT.ink2 }}>
                  {subActive
                    ? "Chưa có luận giải cho ngày này."
                    : "Gia hạn lịch hoặc mở khóa để đọc luận giải ngày."}
                </p>
                <button
                  type="button"
                  disabled={unlockBusy}
                  onClick={() => void unlockAndLoad()}
                  className="w-full max-w-xs py-3 text-xs font-extrabold uppercase tracking-wider"
                  style={{ ...DISPLAY2, background: CT.forest, color: CT.cream, border: "none" }}
                >
                  {unlockBusy ? "Đang mở…" : subActive ? "Tải luận giải" : "Mở luận giải"}
                </button>
                {!subActive ? (
                  <Link
                    to="/dat-lich"
                    className="mt-3 inline-block font-serif text-sm"
                    style={{ color: CT.goldDeep }}
                  >
                    Xem gói lịch →
                  </Link>
                ) : null}
              </div>
            ) : null}

            {(readingLoading || showAnchorHead) && (
              <AiAnswerRow
                kicker={
                  readingLoading && !reading
                    ? "NLTT đang luận…"
                    : anchorKicker
                }
              >
                {readingLoading && !reading ? (
                  <NlttInkLoadingBody />
                ) : (
                  <TypedBody
                    text={reading ?? ""}
                    active={showAnchorHead && !anchorTypingDone}
                    onComplete={handleAnchorTypingComplete}
                  />
                )}
              </AiAnswerRow>
            )}

            {anchorDone ? (
              <DayLuanSectionedPanel
                rows={sectionBundle.rows}
                baseScore={sectionBundle.baseScore}
                totalScore={detail?.score ?? null}
                iso={iso}
                canChi={detail?.canChi ?? "—"}
                sourceLabels={resolveLuanSourceLabels(detail)}
              />
            ) : null}

            {!purchaseGated && !followUpChatEnabled && followUps.length > 0 ? (
              <Mono
                className="mt-[22px] block"
                style={{ color: CT.muted, fontSize: 9.5, letterSpacing: "0.08em" }}
              >
                Lịch sử hỏi đáp · chỉ xem
              </Mono>
            ) : null}

            {!purchaseGated
              ? followUps.map((turn) => (
                  <div
                    key={turn.id}
                    className="mt-[22px] pt-[18px]"
                    style={{ borderTop: `1px solid ${CT.hairline}` }}
                  >
                    <QuestionBlock question={turn.question} compact />
                    {turn.loading ? (
                      <AiAnswerRow kicker="NLTT đang luận…" compact>
                        <NlttInkLoadingBody message="" compact />
                      </AiAnswerRow>
                    ) : turn.error ? (
                      <button
                        type="button"
                        className="mt-3 font-serif text-sm text-left"
                        style={{ color: CT.red, background: "none", border: "none", padding: 0 }}
                        onClick={() => void retryFollowUp(turn.id, turn.question)}
                      >
                        {turn.error}
                      </button>
                    ) : turn.answer ? (
                      <AiAnswerRow kicker="NLTT luận" compact>
                        <TypedBody
                          text={turn.answer}
                          active={!turn.typingDone}
                          fontSize={13.5}
                          marginTop={4}
                          onComplete={() =>
                            setFollowUps((prev) =>
                              prev.map((t) =>
                                t.id === turn.id ? { ...t, typingDone: true } : t,
                              ),
                            )
                          }
                        />
                      </AiAnswerRow>
                    ) : null}
                  </div>
                ))
              : null}

            {purchaseGatedChips ? (
              <div
                className="mt-[22px] pt-4"
                style={{ borderTop: `1px solid ${CT.hairline}` }}
              >
                <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Hỏi tiếp gợi ý</Mono>
                <div className="mt-2 flex flex-col gap-1.5">
                  {remainingChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={openPurchase}
                      className="text-left py-2.5 px-3.5 font-serif text-[13.5px] leading-snug"
                      style={chipButtonStyle}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!purchaseGated &&
            followUpChatEnabled &&
            anchorDone &&
            remainingChips.length > 0 &&
            !quotaExhausted ? (
              <div
                className="mt-[22px] pt-4"
                style={{ borderTop: `1px solid ${CT.hairline}` }}
              >
                <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Hỏi tiếp gợi ý</Mono>
                <div className="mt-2 flex flex-col gap-1.5">
                  {remainingChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={submitBusy}
                      onClick={() => void submitFollowUp(chip)}
                      className="text-left py-2.5 px-3.5 font-serif text-[13.5px] leading-snug"
                      style={chipButtonStyle}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!purchaseGated && anchorDone && unlocked && !followUpChatEnabled ? (
              <div
                className="mt-[22px] pt-4"
                style={{ borderTop: `1px solid ${CT.hairline}` }}
              >
                <p
                  className="font-serif text-[13.5px] leading-snug m-0"
                  style={{ color: CT.ink2 }}
                >
                  Phần hỏi thêm chỉ dùng cho{" "}
                  <strong style={{ fontWeight: 600 }}>hôm nay</strong> ({todayShort},
                  giờ Việt Nam). Với ngày {dayShort} bạn xem luận giải phía trên.
                </p>
                {iso !== todayIso ? (
                  <Link
                    to={`/luan-ai/day-${todayIso}`}
                    className="inline-block mt-3 font-[family-name:var(--display-2)] text-[11px] font-extrabold uppercase tracking-wider no-underline"
                    style={{ color: CT.goldDeep }}
                  >
                    Xem luận hôm nay →
                  </Link>
                ) : null}
              </div>
            ) : null}

            <div ref={turnEndRef} aria-hidden className="h-1" />
          </>
        ) : null}
          </>
        ) : null}
      </div>

      {purchaseGated && followUpChatEnabled && anchorDone && !detailLoading && !detailError ? (
        <div
          className="px-5 pt-2 pb-[18px]"
          style={{ background: CT.paper, borderTop: `1px solid ${CT.hairline}` }}
        >
          <button
            type="button"
            onClick={openPurchase}
            className="flex w-full items-center gap-2.5 py-2.5 px-3.5 text-left"
            style={{
              background: "#fff",
              border: `1px solid ${CT.hairline}`,
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            <span
              className="flex-1 font-serif text-[13.5px] italic"
              style={{ color: CT.muted }}
            >
              Hỏi tiếp về ngày {dayShort}…
            </span>
            <span
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full font-serif text-sm"
              style={{ background: CT.forest, color: CT.gold }}
              aria-hidden
            >
              ↑
            </span>
          </button>
          <p
            className="mt-[7px] px-1 text-center font-serif text-[11px] italic"
            style={{ color: CT.muted }}
          >
            Đặt lịch cát tường để hỏi tiếp và chat với NLTT
          </p>
        </div>
      ) : null}

      {!purchaseGated &&
      followUpChatEnabled &&
      unlocked &&
      !detailLoading &&
      !detailError ? (
        <div
          className="px-5 pt-2 pb-[18px]"
          style={{ background: CT.paper, borderTop: `1px solid ${CT.hairline}` }}
        >
          <div
            className="flex items-center gap-2.5 py-2.5 px-3.5"
            style={{
              background: quotaExhausted ? "rgba(0,0,0,0.02)" : "#fff",
              border: `1px solid ${CT.hairline}`,
              borderRadius: 999,
              pointerEvents: quotaExhausted ? "none" : "auto",
            }}
          >
            <input
              type="text"
              value={input}
              disabled={quotaExhausted || submitBusy}
              placeholder={`Hỏi tiếp về ngày ${dayShort}…`}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitFollowUp(input);
              }}
              className="flex-1 min-w-0 border-0 outline-none bg-transparent font-serif text-[13.5px]"
              style={{ color: quotaExhausted ? CT.muted : CT.ink }}
            />
            {!quotaExhausted ? (
              <button
                type="button"
                disabled={submitBusy || !input.trim()}
                onClick={() => void submitFollowUp(input)}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-serif text-sm"
                style={{
                  background: CT.forest,
                  color: CT.gold,
                  border: "none",
                  opacity: submitBusy || !input.trim() ? 0.5 : 1,
                }}
                aria-label="Gửi"
              >
                ↑
              </button>
            ) : null}
          </div>
          <div className="mt-[7px] px-1 flex items-baseline justify-between gap-2">
            {quotaExhausted ? (
              <span
                className="w-full text-center font-serif italic text-[11px]"
                style={{ color: CT.muted }}
              >
                Hết câu hôm nay · quay lại sáng mai
              </span>
            ) : (
              <>
                <span
                  className="font-serif italic text-[11px]"
                  style={{ color: CT.muted }}
                >
                  Chỉ trả lời về ngày này · so sánh ngày mai không tính lượt
                </span>
                <Mono
                  style={{
                    color: CT.muted,
                    fontSize: 9.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  còn{" "}
                  <span style={{ color: CT.goldDeep, fontWeight: 700 }}>
                    {quotaRemaining}/{DAY_LUAN_MAX_FOLLOW_UPS}
                  </span>{" "}
                  câu hỏi AI
                </Mono>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
