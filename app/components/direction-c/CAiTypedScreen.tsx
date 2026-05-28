import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar, LogoMark, Mono } from "~/components/brand";
import { DayLuanSectionedPanel } from "~/components/direction-c/DayLuanSectionedPanel";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import { CT } from "~/lib/c-tokens";
import {
  DAY_LUAN_MAX_FOLLOW_UPS,
  incrementDayLuanFollowUpCount,
  readDayLuanFollowUpCount,
} from "~/lib/day-luan-chat-quota";
import {
  anchorQuestionForScore,
  buildDayLuanSectionRows,
  DAY_LUAN_SUGGESTED_CHIPS,
  formatDayIsoShort,
} from "~/lib/day-luan-sectioned";

const TYPED_MS = 18;

type FollowUpTurn = {
  id: string;
  question: string;
  answer: string | null;
  loading: boolean;
  error: string | null;
  typingDone: boolean;
};

function TypedBody({
  text,
  active,
  onComplete,
}: {
  text: string;
  active: boolean;
  onComplete?: () => void;
}) {
  const [len, setLen] = useState(0);
  const completedRef = useRef(false);

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

  const shown = text.slice(0, len);
  const typing = active && len < text.length;

  return (
    <p
      style={{
        marginTop: 6,
        fontFamily: "var(--serif)",
        fontSize: 14,
        color: CT.ink,
        lineHeight: 1.65,
        margin: 0,
      }}
    >
      {shown}
      {typing ? (
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
      <style>{`@keyframes b-cursor-blink { 50% { opacity: 0; } }`}</style>
    </p>
  );
}

function QuestionBlock({ question }: { question: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "rgba(154,124,34,0.06)",
        borderLeft: `2px solid ${CT.goldDeep}`,
      }}
    >
      <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>Bạn hỏi</Mono>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 13.5,
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
        <Mono style={{ color: CT.muted, fontSize: 9 }}>{kicker}</Mono>
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
    unlockAndLoad,
    askFollowUp,
  } = useDayLuanReading(iso);

  const dayShort = formatDayIsoShort(iso);
  const score = detail?.score ?? null;
  const anchorQuestion = anchorQuestionForScore(score, iso);
  const sectionRows = buildDayLuanSectionRows(detail);

  const [anchorTypingDone, setAnchorTypingDone] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpTurn[]>([]);
  const [input, setInput] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(0);

  const userId = profile?.id ?? "";
  useEffect(() => {
    if (!userId) return;
    setQuotaUsed(readDayLuanFollowUpCount(userId, iso));
  }, [userId, iso]);

  const quotaRemaining = Math.max(0, DAY_LUAN_MAX_FOLLOW_UPS - quotaUsed);
  const quotaExhausted = quotaRemaining <= 0;

  const showAnchorTyped = Boolean(reading && unlocked && !readingLoading);
  const anchorDone = showAnchorTyped && anchorTypingDone;
  const locked = !unlocked && !readingLoading && !detailLoading && !profileLoading;

  useEffect(() => {
    setAnchorTypingDone(false);
    setFollowUps([]);
  }, [iso]);

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
      if (!question || submitBusy || quotaExhausted || !unlocked) return;

      const turnId = `${Date.now()}`;
      setFollowUps((prev) => [
        ...prev,
        { id: turnId, question, answer: null, loading: true, error: null, typingDone: false },
      ]);
      setInput("");
      scrollToLatest();

      setSubmitBusy(true);
      const res = await askFollowUp(question);
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

      if (userId) {
        incrementDayLuanFollowUpCount(userId, iso);
        setQuotaUsed(readDayLuanFollowUpCount(userId, iso));
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
      iso,
      quotaExhausted,
      scrollToLatest,
      submitBusy,
      unlocked,
      userId,
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
      const res = await askFollowUp(question);
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
      if (userId) {
        incrementDayLuanFollowUpCount(userId, iso);
        setQuotaUsed(readDayLuanFollowUpCount(userId, iso));
      }
      setFollowUps((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? { ...t, loading: false, answer: res.reading, error: null }
            : t,
        ),
      );
    },
    [askFollowUp, iso, userId],
  );

  const askedQuestions = [
    anchorQuestion,
    ...followUps.map((f) => f.question),
  ];
  const remainingChips = DAY_LUAN_SUGGESTED_CHIPS.filter(
    (chip) => !chipWasAsked(chip, askedQuestions),
  );

  const anchorKicker =
    anchorDone || !showAnchorTyped ? "NLTT luận" : "NLTT đang luận…";

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar
        title={`Luận giải · ngày ${dayShort}`}
        endAdornment={
          <Mono style={{ color: CT.muted, fontSize: 9 }}>AI · có nguồn</Mono>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-auto px-6 pt-2 pb-4">
        {(detailLoading || profileLoading) && (
          <p className="font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        )}
        {detailError ? <ErrorBanner message={detailError} /> : null}

        {!detailLoading && !detailError ? (
          <>
            <QuestionBlock question={anchorQuestion} />

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
                  className="w-full max-w-xs py-3 font-display text-xs font-extrabold uppercase tracking-wider"
                  style={{ background: CT.forest, color: CT.cream, border: "none" }}
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

            {(readingLoading || showAnchorTyped) && (
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
                    text={reading ?? ""}
                    active={showAnchorTyped && !anchorTypingDone}
                    onComplete={() => setAnchorTypingDone(true)}
                  />
                )}
              </AiAnswerRow>
            )}

            {anchorDone ? (
              <DayLuanSectionedPanel
                rows={sectionRows}
                totalScore={detail?.score ?? null}
                iso={iso}
                canChi={detail?.canChi ?? "—"}
              />
            ) : null}

            {followUps.map((turn) => (
              <div
                key={turn.id}
                className="mt-5 pt-4"
                style={{ borderTop: `1px solid ${CT.hairline}` }}
              >
                <QuestionBlock question={turn.question} />
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
            ))}

            {anchorDone && remainingChips.length > 0 && !quotaExhausted ? (
              <div
                className="mt-5 pt-4"
                style={{ borderTop: `1px solid ${CT.hairline}` }}
              >
                <Mono style={{ color: CT.muted, fontSize: 9 }}>Hỏi tiếp gợi ý</Mono>
                <div className="mt-2 flex flex-col gap-1.5">
                  {remainingChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={submitBusy}
                      onClick={() => void submitFollowUp(chip)}
                      className="text-left py-2.5 px-3.5 font-serif text-[13px]"
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

      {unlocked && !detailLoading && !detailError ? (
        <div
          className="px-5 pt-2 pb-5"
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
              className="flex-1 min-w-0 border-0 outline-none bg-transparent font-serif text-[13px]"
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
                  color: CT.cream,
                  border: "none",
                  opacity: submitBusy || !input.trim() ? 0.5 : 1,
                }}
                aria-label="Gửi"
              >
                ↑
              </button>
            ) : null}
          </div>
          <div className="mt-1.5 px-1 flex items-baseline justify-between gap-2">
            {quotaExhausted ? (
              <span
                className="w-full text-center font-serif italic text-[10.5px]"
                style={{ color: CT.muted }}
              >
                Hết câu hôm nay · quay lại sáng mai
              </span>
            ) : (
              <>
                <span
                  className="font-serif italic text-[10.5px]"
                  style={{ color: CT.muted }}
                >
                  Chỉ trả lời về ngày này và lá số của bạn
                </span>
                <Mono
                  style={{
                    color: CT.muted,
                    fontSize: 9,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  còn{" "}
                  <span style={{ color: CT.goldDeep, fontWeight: 700 }}>
                    {quotaRemaining}/{DAY_LUAN_MAX_FOLLOW_UPS}
                  </span>{" "}
                  câu hôm nay
                </Mono>
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
