import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { BackBar, LogoMark, Mono } from "~/components/brand";
import { useDayLuanReading } from "~/hooks/useDayLuanReading";
import { CT } from "~/lib/c-tokens";
import { weekdayFromIso } from "~/lib/lich-format";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";
import { luanContextToParam } from "~/lib/luan-context";

const TYPED_MS = 14;

function TypedBody({ text, active }: { text: string; active: boolean }) {
  const [len, setLen] = useState(0);
  useEffect(() => {
    if (!active || !text) {
      setLen(text.length);
      return;
    }
    setLen(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= text.length) window.clearInterval(id);
    }, TYPED_MS);
    return () => window.clearInterval(id);
  }, [text, active]);
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
            animation: "ldc-cursor-blink 1s steps(2) infinite",
          }}
        />
      ) : null}
      <style>{`@keyframes ldc-cursor-blink { 50% { opacity: 0; } }`}</style>
    </p>
  );
}

export function CAiTypedScreen({ iso }: { iso: string }) {
  const navigate = useNavigate();
  const {
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
  } = useDayLuanReading(iso);

  const titleDate = formatIsoDateLichHeader(iso);
  const score = detail?.score ?? null;
  const question =
    score != null
      ? `Tại sao hôm nay được ${score} điểm với mệnh của tôi?`
      : "Tại sao hôm nay được chấm như vậy với mệnh của tôi?";

  const showTyped = Boolean(reading && unlocked && !readingLoading);
  const locked = !unlocked && !readingLoading && !detailLoading && !profileLoading;

  return (
    <main
      className="min-h-[100svh] flex flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <BackBar
        title={`Luận giải · ${titleDate}`}
        endAdornment={<Mono style={{ color: CT.muted, fontSize: 9 }}>AI</Mono>}
      />

      <div className="flex-1 overflow-auto px-6 pt-2 pb-4">
        {(detailLoading || profileLoading) && (
          <p className="font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        )}
        {detailError ? <ErrorBanner message={detailError} /> : null}

        {!detailLoading && !detailError ? (
          <>
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

            {(readingLoading || showTyped) && (
              <div className="mt-6 flex gap-3 items-start">
                <div
                  className="shrink-0 flex items-center justify-center overflow-hidden rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    background: CT.forest,
                    marginTop: 2,
                  }}
                >
                  <LogoMark size={22} dark />
                </div>
                <div className="flex-1 min-w-0">
                  <Mono style={{ color: CT.muted, fontSize: 9 }}>NLTT đang luận</Mono>
                  {readingLoading && !reading ? (
                    <p className="font-serif text-sm mt-2" style={{ color: CT.muted }}>
                      Đang đối chiếu lá số với ngày {weekdayFromIso(iso)}…
                    </p>
                  ) : (
                    <TypedBody text={reading ?? ""} active={showTyped} />
                  )}
                </div>
              </div>
            )}

            {detail?.canChi ? (
              <div
                className="mt-5 pt-3.5"
                style={{
                  borderTop: `1px solid ${CT.hairline}`,
                  fontFamily: "var(--serif)",
                  fontSize: 12,
                  color: CT.muted,
                  lineHeight: 1.5,
                }}
              >
                Đối chiếu:{" "}
                <span style={{ color: CT.ink2 }}>Hiệp Kỷ Biện Phương</span>,{" "}
                <span style={{ color: CT.ink2 }}>Ngọc Hạp Thông Thư</span>… ·{" "}
                {detail.canChi}
              </div>
            ) : null}

            {showTyped ? (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() =>
                    void navigate(`/luan-ai/${luanContextToParam(iso)}/day-du`)
                  }
                  className="w-full py-3 font-display text-xs font-extrabold uppercase tracking-wider"
                  style={{
                    background: "transparent",
                    color: CT.ink,
                    border: `1px solid ${CT.goldDeep}`,
                  }}
                >
                  Xem luận giải đầy đủ có nguồn →
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
