import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar, LogoMark, Mono } from "~/components/brand";
import { DayLuanPaywallBlur } from "~/components/direction-c/DayLuanPaywallBlur";
import { DayLuanSectionedPanel } from "~/components/direction-c/DayLuanSectionedPanel";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import type { LuanThreadTurn } from "~/lib/generate-reading";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { DAY_LUAN_MAX_FOLLOW_UPS } from "~/lib/day-luan-chat";
import {
  anchorQuestionForScore,
  buildDayLuanSectionBundle,
  resolveLuanSourceLabels,
  DAY_LUAN_SUGGESTED_CHIPS,
  formatDayIsoShort,
} from "~/lib/day-luan-sectioned";
import { paragraphSpansInText } from "~/lib/prose-paragraphs";
import { splitReadingAtHalf } from "~/lib/reading-teaser";

const TYPED_MS = 18;

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
  const paragraphs = useMemo(
    () => paragraphSpansInText(text, sentencesPerParagraph),
    [text, sentencesPerParagraph],
  );

  useEffect(() => {
    completedRef.current = false;
    if (!active || !text) {
      setLen(text.length);
      if (text && onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete();
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
        if (onComplete && !completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }
    }, TYPED_MS);
    return () => window.clearInterval(id);
  }, [text, active, onComplete]);

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

function AnchorLoadingSkeleton() {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {[0.9, 0.75, 0.6].map((w) => (
        <div
          key={w}
          style={{
            height: 10,
            width: `${w * 100}%`,
            background: "rgba(154,124,34,0.06)",
          }}
        />
      ))}
    </div>
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

export function CAiTypedScreen({ iso }: { iso: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const turnEndRef = useRef<HTMLDivElement>(null);

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
    paywallTeaser,
    unlockAndLoad,
    retryReading,
    askFollowUp,
    compareWithTomorrow,
    followUpRemaining,
    serverThreadMessages,
  } = useDayLuanReading(iso);

  const dayShort = formatDayIsoShort(iso);
  const score = detail?.score ?? null;
  const anchorQuestion = anchorQuestionForScore(score, iso);
  const sectionBundle = buildDayLuanSectionBundle(detail);

  const [anchorTypingDone, setAnchorTypingDone] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpTurn[]>([]);
  const [input, setInput] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const threadHydratedIsoRef = useRef<string | null>(null);

  const quotaRemaining = followUpRemaining;
  const quotaExhausted = quotaRemaining <= 0;

  const readingSplit = useMemo(
    () => (reading ? splitReadingAtHalf(reading) : { visible: "", locked: "" }),
    [reading],
  );
  const showAnchorHead = Boolean(
    reading && !readingLoading && (unlocked || paywallTeaser),
  );
  const anchorDone = showAnchorHead && anchorTypingDone;
  const locked =
    !paywallTeaser &&
    !unlocked &&
    !readingLoading &&
    !detailLoading &&
    !profileLoading;
  const readingMissing =
    !reading &&
    !readingLoading &&
    !detailLoading &&
    !profileLoading &&
    !detailError;

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
      const question = rawQuestion.trim();
      if (!question || submitBusy || quotaExhausted || !unlocked || paywallTeaser) {
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
      iso,
      quotaExhausted,
      reading,
      scrollToLatest,
      submitBusy,
      unlocked,
    ],
  );

  const retryFollowUp = useCallback(
    async (turnId: string, question: string) => {
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
    [askFollowUp],
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

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar title={`Luận giải · ngày ${dayShort}`} />

      <div ref={scrollRef} className="flex-1 overflow-auto px-6 pt-2 pb-6">
        {(detailLoading || profileLoading) && (
          <p className="font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        )}
        {detailError ? <ErrorBanner message={detailError} /> : null}

        {!detailLoading && !detailError ? (
          <>
            <QuestionBlock question={anchorQuestion} />

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
                  <AnchorLoadingSkeleton />
                ) : (
                  <TypedBody
                    text={
                      paywallTeaser ? readingSplit.visible : (reading ?? "")
                    }
                    active={showAnchorHead && !anchorTypingDone}
                    onComplete={() => setAnchorTypingDone(true)}
                  />
                )}
              </AiAnswerRow>
            )}

            {paywallTeaser && anchorDone ? (
              <DayLuanPaywallBlur className="mt-4" minHeight={280}>
                {readingSplit.locked ? (
                  <AiAnswerRow kicker="NLTT luận" compact>
                    <TypedBody
                      text={readingSplit.locked}
                      active={false}
                      fontSize={14}
                      marginTop={6}
                    />
                  </AiAnswerRow>
                ) : null}
                <DayLuanSectionedPanel
                  rows={sectionBundle.rows}
                  baseScore={sectionBundle.baseScore}
                  totalScore={detail?.score ?? null}
                  iso={iso}
                  canChi={detail?.canChi ?? "—"}
                  sourceLabels={resolveLuanSourceLabels(detail)}
                />
                <div
                  className="mt-[22px] pt-4"
                  style={{ borderTop: `1px solid ${CT.hairline}` }}
                >
                  <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Hỏi tiếp gợi ý</Mono>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {DAY_LUAN_SUGGESTED_CHIPS.slice(0, 3).map((chip) => (
                      <div
                        key={chip}
                        className="py-2.5 px-3.5 font-serif text-[13.5px] leading-snug"
                        style={{
                          background: "#fff",
                          border: `1px solid ${CT.hairline}`,
                          color: CT.ink2,
                        }}
                      >
                        {chip}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="mt-4 flex items-center gap-2.5 py-2.5 px-3.5"
                  style={{
                    background: "#fff",
                    border: `1px solid ${CT.hairline}`,
                    borderRadius: 999,
                  }}
                >
                  <span
                    className="flex-1 font-serif text-[13.5px] italic"
                    style={{ color: CT.muted }}
                  >
                    Hỏi tiếp về ngày {dayShort}…
                  </span>
                </div>
              </DayLuanPaywallBlur>
            ) : null}

            {!paywallTeaser && anchorDone ? (
              <DayLuanSectionedPanel
                rows={sectionBundle.rows}
                baseScore={sectionBundle.baseScore}
                totalScore={detail?.score ?? null}
                iso={iso}
                canChi={detail?.canChi ?? "—"}
                sourceLabels={resolveLuanSourceLabels(detail)}
              />
            ) : null}

            {!paywallTeaser
              ? followUps.map((turn) => (
              <div
                key={turn.id}
                className="mt-[22px] pt-[18px]"
                style={{ borderTop: `1px solid ${CT.hairline}` }}
              >
                <QuestionBlock question={turn.question} compact />
                {turn.loading ? (
                  <AiAnswerRow kicker="NLTT đang luận…" compact>
                    <p
                      className="font-serif text-sm mt-1"
                      style={{ color: CT.muted, minHeight: 20 }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 7,
                          height: 14,
                          background: CT.ink,
                          animation: "b-cursor-blink 1s steps(2) infinite",
                        }}
                      />
                    </p>
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

            {!paywallTeaser &&
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
                      style={{
                        background: "#fff",
                        border: `1px solid ${CT.hairline}`,
                        color: CT.ink2,
                        cursor: "pointer",
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={turnEndRef} aria-hidden className="h-1" />
          </>
        ) : null}
      </div>

      {!paywallTeaser && unlocked && !detailLoading && !detailError ? (
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
