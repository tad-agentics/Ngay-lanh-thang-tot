import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { GrainOverlay } from "~/components/GrainOverlay";
import { fetchShareResolve } from "~/lib/share-token";

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
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto">
      {err ? (
        <p className="text-sm text-muted-foreground">{err}</p>
      ) : !payload ? (
        <p className="text-sm text-muted-foreground">Đang tải thẻ…</p>
      ) : (
        <div
          className="relative overflow-hidden bg-surface text-surface-foreground p-5 shadow-xl"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-accent text-xs mb-1 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              Ngày Lành Tháng Tốt
            </p>
            <h1
              className="text-surface-foreground text-lg font-bold mb-2"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {eventLabel}
            </h1>
            {grade ? (
              <p className="text-accent text-xs mb-3">Hạng {grade}</p>
            ) : null}
            <p
              className="text-accent text-xl font-semibold"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {dateLabel}
            </p>
            {lunarLabel ? (
              <p
                className="text-surface-foreground/60 text-xs mt-0.5 mb-3"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                {lunarLabel}
              </p>
            ) : null}
            <p className="text-surface-foreground/80 text-sm leading-relaxed mb-4">
              {reasonShort}
            </p>
            <p
              className="text-surface-foreground/40 text-xs"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              Mệnh {menh}
            </p>
          </div>
        </div>
      )}

      <p className="mt-8 text-center">
        <Link
          to="/"
          className="text-sm text-primary underline underline-offset-4"
        >
          Mở Ngày Lành Tháng Tốt
        </Link>
      </p>
    </main>
  );
}
