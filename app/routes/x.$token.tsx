import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { Kanji, Mono, Ticket } from "~/components/brand";
import { fetchShareResolve } from "~/lib/share-token";

/** Public share resolve — forest ceremonial + Ticket phiếu. */
export default function PublicShareCardPage() {
  const { token } = useParams();
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!token?.trim()) {
      setErr("Thiếu mã liên kết.");
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetchShareResolve(token);
      if (cancelled) return;
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      setPayload(res.data.payload);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const headline = payload?.headline ?? "Ngày Lành Tháng Tốt";
  const eventLabel = payload?.event_label ?? headline;
  const dateLabel = payload?.date_label ?? "—";
  const lunarLabel = payload?.lunar_label ?? "";
  const reasonShort =
    payload?.reason_short ?? payload?.summary ?? "Xem thêm trong ứng dụng.";
  const menh = payload?.menh ?? "—";
  const grade = payload?.grade as "A" | "B" | "C" | undefined;

  return (
    <main
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
        color: "var(--cream, #ede7d3)",
        fontFamily: "var(--serif)",
        padding: "32px 20px 48px",
        boxSizing: "border-box",
      }}
    >
      {err ? (
        <p
          style={{
            fontSize: 16,
            color: "rgba(237,231,211,0.75)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {err}
        </p>
      ) : !payload ? (
        <p
          style={{
            fontSize: 16,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Đang tải thẻ…
        </p>
      ) : (
        <Ticket holeColor="#1d3129">
          <div
            style={{
              padding: "22px 18px 24px",
              position: "relative",
              color: "var(--ink, #18150e)",
            }}
          >
            <Kanji
              ch="吉"
              size={100}
              drift
              style={{
                position: "absolute",
                right: -12,
                top: -6,
                color: "rgba(197,165,90,0.12)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <Mono style={{ color: "var(--gold-deep, #7d6219)", marginBottom: 8 }}>
                Ngày lành tháng tốt
              </Mono>
              <h1
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  margin: "0 0 10px",
                  textTransform: "uppercase",
                }}
              >
                {eventLabel}
              </h1>
              {grade ? (
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--muted, #6a5f3f)",
                    margin: "0 0 8px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Hạng {grade}
                </p>
              ) : null}
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 600,
                  fontSize: 22,
                  color: "var(--gold-deep, #7d6219)",
                  margin: "0 0 6px",
                  lineHeight: 1.25,
                }}
              >
                {dateLabel}
              </p>
              {lunarLabel ? (
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color: "var(--muted, #6a5f3f)",
                    margin: "0 0 14px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {lunarLabel}
                </p>
              ) : null}
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-2, #3a3a3a)",
                  margin: "0 0 14px",
                }}
              >
                {reasonShort}
              </p>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--muted, #6a5f3f)",
                  margin: 0,
                }}
              >
                Mệnh {menh}
              </p>
            </div>
          </div>
        </Ticket>
      )}

      <p style={{ marginTop: 32, textAlign: "center" }}>
        <Link
          to="/"
          style={{
            fontFamily: "var(--serif)",
            fontSize: 16,
            color: "var(--gold, #c5a55a)",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          Mở Ngày Lành Tháng Tốt
        </Link>
      </p>
    </main>
  );
}
