import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { btnPrimaryGold, C, CForestShell } from "~/components/auth/c-auth-ui";
import { Mono } from "~/components/brand";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { buildingCalendarQuote } from "~/lib/first-run-ui";
import {
  extractMenhTagline,
  extractTuTruPillarLabels,
  profileHasStoredLaso,
} from "~/lib/la-so-ui";
import {
  onboardingInProgressPath,
  profileHasBirthChartInput,
} from "~/lib/pending-return-to";

const PILLARS = ["Niên", "Nguyệt", "Nhật", "Thời"] as const;

const REVEAL_STEPS = [
  { at: 400, done: 1, prog: 25 },
  { at: 1200, done: 2, prog: 50 },
  { at: 2000, done: 3, prog: 76 },
  { at: 3200, done: 4, prog: 100 },
] as const;

export default function DangDungLichRoute() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [doneCount, setDoneCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pillarValues, setPillarValues] = useState<string[]>([
    "···",
    "···",
    "···",
    "···",
  ]);
  const [quote, setQuote] = useState(buildingCalendarQuote(null));
  const [buildError, setBuildError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  /** One build per `retryTick`; must not reset when `profile` refetches (profile-refresh). */
  const buildStartedForRetry = useRef(-1);

  const resetReveal = useCallback(() => {
    setDoneCount(0);
    setProgress(0);
    setPillarValues(["···", "···", "···", "···"]);
    setQuote(buildingCalendarQuote(null));
    setBuildError(null);
  }, []);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const birthProfile = {
      onboarding_completed_at: profile.onboarding_completed_at,
      ngay_sinh: profile.ngay_sinh,
      gio_sinh: profile.gio_sinh,
      gioi_tinh: profile.gioi_tinh,
    };
    if (!profileHasBirthChartInput(birthProfile)) {
      navigate(onboardingInProgressPath(birthProfile), { replace: true });
      return;
    }

    if (buildStartedForRetry.current === retryTick) return;
    buildStartedForRetry.current = retryTick;

    const body = profileToBatTuPersonQuery(profile);
    const storedLaso = profile.la_so;

    let cancelled = false;
    const timers: number[] = [];

    // Overall watchdog: if tu-tru hasn't resolved within 25s, show retry.
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) {
          setBuildError("Mất quá nhiều thời gian. Vui lòng thử lại.");
          toast.error("Không lập được lịch.");
        }
      }, 25_000),
    );

    void (async () => {
      try {
        // Profile sync — fire-and-forget; tu-tru receives all data in body.
        void invokeBatTu<unknown>({ op: "profile", body }).catch(() => {});

        let tuTruPayload: unknown;
        if (profileHasStoredLaso(storedLaso)) {
          tuTruPayload = storedLaso;
        } else {
          const res = await invokeBatTu<unknown>({ op: "tu-tru", body });
          if (cancelled) return;
          if (!res.ok) {
            setBuildError(
              res.message ?? "Không lập được lá số. Thử lại sau vài giây.",
            );
            toast.error("Không lập được lá số.");
            return;
          }
          tuTruPayload = res.data;
        }

        if (cancelled) return;

        const labels = extractTuTruPillarLabels(tuTruPayload);
        const tagline = extractMenhTagline(tuTruPayload);
        setQuote(buildingCalendarQuote(tagline));
        // Profile refresh deferred to `/lich-da-mo` — refresh here re-ran this effect (loop).

        for (const { at, done, prog } of REVEAL_STEPS) {
          timers.push(
            window.setTimeout(() => {
              if (cancelled) return;
              setDoneCount(done);
              setProgress(prog);
              setPillarValues((prev) =>
                prev.map((v, i) => (i < done ? labels[i] ?? v : v)),
              );
            }, at),
          );
        }
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) navigate("/lich-da-mo", { replace: true });
          }, 3400),
        );
      } catch {
        if (!cancelled) {
          setBuildError("Đã xảy ra lỗi. Vui lòng thử lại.");
          toast.error("Không lập được lịch.");
        }
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [
    profileLoading,
    navigate,
    retryTick,
    profile?.id,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    profile?.gioi_tinh,
    profile?.onboarding_completed_at,
  ]);

  function handleRetry() {
    buildStartedForRetry.current = -1;
    resetReveal();
    setRetryTick((n) => n + 1);
  }

  return (
    <CForestShell gradientOpacity={0.16} gradientHeight={320} centered>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          position: "relative",
          padding: "0 28px",
          textAlign: "center",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10.5, letterSpacing: "0.24em" }}>
          Đang dựng lịch của bạn
        </Mono>

        {buildError ? (
          <>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 14.5,
                color: "rgba(237,231,211,0.75)",
                lineHeight: 1.55,
                maxWidth: 300,
                margin: 0,
              }}
            >
              {buildError}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              style={{ ...btnPrimaryGold, maxWidth: 280 }}
            >
              Thử lại
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              {PILLARS.map((p, i) => {
                const done = i < doneCount;
                return (
                  <div
                    key={p}
                    style={{
                      width: 56,
                      padding: "12px 0",
                      textAlign: "center",
                      background: done ? "rgba(197,165,90,0.1)" : "transparent",
                      border: `1px solid ${done ? C.gold : "rgba(237,231,211,0.18)"}`,
                    }}
                  >
                    <Mono
                      style={{
                        color: done ? C.gold : "rgba(237,231,211,0.4)",
                        fontSize: 9.5,
                      }}
                    >
                      {p}
                    </Mono>
                    <div
                      style={{
                        marginTop: 6,
                        fontFamily: "var(--display-2)",
                        fontWeight: 700,
                        fontSize: 12.5,
                        color: done ? C.cream : "rgba(237,231,211,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "-0.005em",
                        lineHeight: 1,
                      }}
                    >
                      {done ? pillarValues[i] : "···"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                width: 200,
                height: 1.5,
                background: "rgba(197,165,90,0.25)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progress}%`,
                  background: C.gold,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 14.5,
                color: "rgba(237,231,211,0.6)",
                lineHeight: 1.55,
                maxWidth: 280,
                margin: 0,
              }}
            >
              {quote}
            </p>
          </>
        )}
      </div>
    </CForestShell>
  );
}
