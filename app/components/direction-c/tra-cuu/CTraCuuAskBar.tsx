import { useState } from "react";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { DAY_LUAN_MAX_FOLLOW_UPS } from "~/lib/day-luan-chat";
import { DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX } from "~/lib/entitlements";

type CTraCuuAskBarProps = {
  mode: "day" | "results";
  placeholder: string;
  quotaRemaining: number;
  /** When false, quota line shows loading instead of a misleading 10/10. */
  quotaLoaded?: boolean;
  /** Lifetime trial pool (never-sub); default = daily 10 cap. */
  trialChatMode?: boolean;
  disabled?: boolean;
  submitBusy?: boolean;
  onSubmit: (question: string) => void;
  footerScope?: string;
  /** Khi hết lượt trial — chạm vào thanh hỏi mở modal (thay vì khóa im lặng). */
  onTrialExhaustedTap?: () => void;
  /** Paywall tra cứu — vẫn cho chạm mở modal khi `disabled`. */
  paywallLocked?: boolean;
};

export function CTraCuuAskBar({
  mode,
  placeholder,
  quotaRemaining,
  quotaLoaded = true,
  trialChatMode = false,
  disabled = false,
  submitBusy = false,
  onSubmit,
  footerScope = "NLTT chỉ luận theo lá số của bạn",
  onTrialExhaustedTap,
  paywallLocked = false,
}: CTraCuuAskBarProps) {
  const [input, setInput] = useState("");
  const quotaCap = trialChatMode
    ? DEFAULT_ONBOARDING_TRIAL_QUESTIONS_MAX
    : DAY_LUAN_MAX_FOLLOW_UPS;
  const quotaExhausted = quotaLoaded && quotaRemaining <= 0;
  const trialExhaustedTap = quotaExhausted && Boolean(onTrialExhaustedTap);
  const paywallTapActive = paywallLocked && Boolean(onTrialExhaustedTap);
  const paywallInteractive = trialExhaustedTap || paywallTapActive;
  const locked =
    (disabled && !paywallTapActive) ||
    (quotaExhausted && !paywallInteractive) ||
    submitBusy;
  const isResultsShell = mode === "results";

  function handleSubmit() {
    if (paywallInteractive) {
      onTrialExhaustedTap?.();
      return;
    }
    if (locked) return;

    const q = input.trim();
    if (isResultsShell) {
      onSubmit(q);
      setInput("");
      return;
    }
    if (!q) return;
    onSubmit(q);
    setInput("");
  }

  const showSend =
    !quotaExhausted &&
    !paywallLocked &&
    (!isResultsShell ? input.trim().length > 0 : true);

  return (
    <div
      className="px-5 pt-2 pb-[18px]"
      style={{ background: CT.paper, borderTop: `1px solid ${CT.hairline}` }}
    >
      <div
        className="flex items-center gap-2.5 py-3 px-4"
        role={paywallInteractive ? "button" : undefined}
        tabIndex={paywallInteractive ? 0 : undefined}
        onClick={paywallInteractive ? onTrialExhaustedTap : undefined}
        onKeyDown={
          paywallInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onTrialExhaustedTap?.();
                }
              }
            : undefined
        }
        style={{
          background:
            quotaExhausted || paywallLocked ? "rgba(0,0,0,0.02)" : "#fff",
          border: `1px solid ${CT.hairline}`,
          borderRadius: 999,
          pointerEvents:
            (quotaExhausted || paywallLocked) && !paywallInteractive
              ? "none"
              : "auto",
          cursor: paywallInteractive ? "pointer" : undefined,
        }}
      >
        <input
          type="text"
          value={input}
          disabled={locked}
          readOnly={paywallInteractive}
          tabIndex={paywallInteractive ? -1 : undefined}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className="min-w-0 flex-1 border-0 bg-transparent font-serif text-base outline-none"
          style={{
            color: quotaExhausted || paywallLocked ? CT.muted : CT.ink,
            pointerEvents: paywallInteractive ? "none" : undefined,
          }}
        />
        {showSend ? (
          <button
            type="button"
            disabled={locked || (!isResultsShell && !input.trim())}
            onClick={handleSubmit}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-none font-serif text-base"
            style={{
              background: CT.forest,
              color: CT.gold,
              opacity: locked || (!isResultsShell && !input.trim()) ? 0.5 : 1,
              cursor: locked ? "not-allowed" : "pointer",
            }}
            aria-label="Gửi"
          >
            ↑
          </button>
        ) : null}
      </div>
      <div className="mt-[7px] flex items-baseline justify-between gap-2 px-1">
        {quotaExhausted || paywallLocked ? (
          <span
            className="w-full text-center font-serif text-[11px] italic"
            style={{ color: CT.muted }}
          >
            {trialChatMode || paywallLocked
              ? "Hết lượt chat miễn phí · chạm để mở gói lịch"
              : "Hết lượt hỏi hôm nay"}
          </span>
        ) : (
          <>
            <span className="font-serif text-[10.5px] italic" style={{ color: CT.muted }}>
              {footerScope}
            </span>
            {!quotaLoaded ? (
              <Mono
                style={{
                  color: CT.muted,
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                đang tải…
              </Mono>
            ) : (
              <Mono
                style={{
                  color: CT.muted,
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                còn{" "}
                <span style={{ color: CT.goldDeep, fontWeight: 700 }}>
                  {quotaRemaining}/{quotaCap}
                </span>{" "}
                {trialChatMode ? "lượt chat" : "câu hôm nay"}
              </Mono>
            )}
          </>
        )}
      </div>
    </div>
  );
}
