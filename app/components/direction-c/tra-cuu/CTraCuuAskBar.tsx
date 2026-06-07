import { useState } from "react";

import { Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { DAY_LUAN_MAX_FOLLOW_UPS } from "~/lib/day-luan-chat";

type CTraCuuAskBarProps = {
  mode: "day" | "results";
  placeholder: string;
  quotaRemaining: number;
  /** When false, quota line shows loading instead of a misleading 10/10. */
  quotaLoaded?: boolean;
  disabled?: boolean;
  submitBusy?: boolean;
  onSubmit: (question: string) => void;
  footerScope?: string;
};

export function CTraCuuAskBar({
  mode,
  placeholder,
  quotaRemaining,
  quotaLoaded = true,
  disabled = false,
  submitBusy = false,
  onSubmit,
  footerScope = "NLTT chỉ luận theo lá số của bạn",
}: CTraCuuAskBarProps) {
  const [input, setInput] = useState("");
  const quotaExhausted = quotaLoaded && quotaRemaining <= 0;
  const locked = disabled || quotaExhausted || submitBusy;
  const isResultsShell = mode === "results";

  function handleSubmit() {
    const q = input.trim();
    if (isResultsShell) {
      onSubmit(q);
      setInput("");
      return;
    }
    if (!q || locked) return;
    onSubmit(q);
    setInput("");
  }

  const showSend =
    !quotaExhausted && (!isResultsShell ? input.trim().length > 0 : true);

  return (
    <div
      className="px-5 pt-2 pb-[18px]"
      style={{ background: CT.paper, borderTop: `1px solid ${CT.hairline}` }}
    >
      <div
        className="flex items-center gap-2.5 py-3 px-4"
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
          disabled={locked}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className="min-w-0 flex-1 border-0 bg-transparent font-serif text-[13.5px] outline-none"
          style={{ color: quotaExhausted ? CT.muted : CT.ink }}
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
        {quotaExhausted ? (
          <span
            className="w-full text-center font-serif text-[11px] italic"
            style={{ color: CT.muted }}
          >
            Hết lượt hỏi hôm nay
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
                  {quotaRemaining}/{DAY_LUAN_MAX_FOLLOW_UPS}
                </span>{" "}
                câu hôm nay
              </Mono>
            )}
          </>
        )}
      </div>
    </div>
  );
}
