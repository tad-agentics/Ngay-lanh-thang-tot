/**
 * /app (index) — Tab 1 · Hôm nay.
 * HomTodayLight reskin per b-refresh.jsx §1.
 * Calendar moved to /app/thang (Tab 2).
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
// Flame import removed — streak ribbon redesigned to match b-habit.jsx (no icon)
import { toast } from "sonner";

import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { LogoMark, Stamp, Ticket } from "~/components/brand";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import { addDaysToIso, useStreak } from "~/hooks/useStreak";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { fetchIsPinned, invokePin } from "~/lib/pin-reading";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import {
  parseNgayHomNayForHome,
  parseWeeklySummaryForScreen,
  type NgayHomNayHome,
  type WeeklySummaryScreen,
} from "~/lib/home-bat-tu";
import { HM } from "~/lib/maket-tokens";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { getActiveSolarTerm } from "~/lib/tiet-khi";
import {
  readTodayAiReadingSession,
  todayAiReadingSessionKey,
  todayIsoInVn,
  writeTodayAiReadingSession,
} from "~/lib/today-reading-cache";
import type { DayType } from "~/lib/api-types";

function verdictText(dayType: DayType): string {
  if (dayType === "hoang-dao") return "HOÀNG ĐẠO";
  if (dayType === "hac-dao") return "HẮC ĐẠO";
  return "BÌNH THƯỜNG";
}

function verdictColor(dayType: DayType): string {
  if (dayType === "hoang-dao") return "#c5a55a";
  if (dayType === "hac-dao") return "#c57a5a";
  return "rgba(237,231,211,0.7)";
}

function firstNameFromDisplay(name: string | null): string | null {
  if (!name?.trim()) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) ?? null;
}

function formatDaiVanArrow(s: string): string {
  if (!s || s === "—") return s;
  return s.replace(/(\d+)\s*[–-]\s*(\d+)/g, "$1 → $2");
}

// ─── Streak ribbon — matches b-habit.jsx HBStreakRibbon ───────────────────────
// Flat rectangle (no borderRadius), gold border, large count + Mono label,
// 7 horizontal progress bars fill left-to-right.
const RIBBON_TOTAL = 7;

function StreakRibbon({
  currentCount,
  loading,
}: {
  currentCount: number;
  loading: boolean;
}) {
  if (loading || currentCount === 0) return null;
  const filled = Math.min(currentCount, RIBBON_TOTAL);
  const today = todayIsoInVn();
  const term = getActiveSolarTerm(today);
  return (
    <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 12 }}>
      <Link
        to="/app/nhip/lich-su"
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            background: "rgba(197,165,90,0.08)",
            border: `1px solid ${HM.gold}`,
            borderRadius: 2,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: HM.display,
              fontWeight: 800,
              fontSize: 22,
              color: HM.gold,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              flexShrink: 0,
            }}
          >
            {currentCount}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontFamily: HM.mono,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: HM.muted,
              }}
            >
              {`Liền · ${currentCount} ngày`}
              {term?.name ? ` · ${term.name}` : ""}
            </span>
            <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
              {[...Array(RIBBON_TOTAL)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    background:
                      i < filled
                        ? "var(--gold, #c5a55a)"
                        : "rgba(197,165,90,0.15)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function AppIndex() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { costs } = useFeatureCosts();
  const unlockReadingCost = costs.ai_reading_unlock?.credit_cost ?? 1;

  const {
    currentCount: streakCount,
    loading: streakLoading,
    lastCheckIn: streakLastCheckIn,
    streakGapReturn,
  } = useStreak();
  const [day7ModalOpen, setDay7ModalOpen] = useState(false);
  const [restartModalOpen, setRestartModalOpen] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [todayHome, setTodayHome] = useState<NgayHomNayHome | null>(null);
  const [todayAiReading, setTodayAiReading] = useState<string | null>(null);
  const [todayAiReadingLoading, setTodayAiReadingLoading] = useState(false);
  const [todayReadingSource, setTodayReadingSource] = useState<unknown>(null);
  const [todayReadingUnlocked, setTodayReadingUnlocked] = useState(false);
  const [unlockingTodayReading, setUnlockingTodayReading] = useState(false);
  const [homePinned, setHomePinned] = useState(false);
  const [homePinBusy, setHomePinBusy] = useState(false);
  const [weekly, setWeekly] = useState<WeeklySummaryScreen | null>(null);

  const q = profileToBatTuPersonQuery(profile);
  const canBatTu = Boolean(q.birth_date);
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? null;
  const displayName = firstNameFromDisplay(profile?.display_name ?? null);

  useEffect(() => {
    if (profileLoading || !profile) return;
    const todayIso = todayIsoInVn();
    try {
      localStorage.removeItem(`ngaytot_today_reading_unlock:${profile.id}:${todayIso}`);
    } catch { /* ignore */ }
    const sessionCachedReading = readTodayAiReadingSession(profile.id, todayIso);

    if (!canBatTu) {
      setSummaryLoading(false);
      setWeeklyLoading(false);
      setSummaryErr(null);
      setTodayHome(null);
      setTodayAiReading(null);
      setTodayAiReadingLoading(false);
      setTodayReadingSource(null);
      setTodayReadingUnlocked(false);
      setUnlockingTodayReading(false);
      setWeekly(null);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    setWeeklyLoading(true);
    setSummaryErr(null);
    setTodayAiReading(sessionCachedReading ?? null);
    setTodayAiReadingLoading(false);
    setTodayReadingSource(null);
    setTodayReadingUnlocked(false);
    setUnlockingTodayReading(false);

    void (async () => {
      const body = profileToBatTuPersonQuery(profile);
      const [nhn, ws] = await Promise.all([
        invokeBatTu<unknown>({ op: "ngay-hom-nay", body: { ...body } }),
        invokeBatTu<unknown>({ op: "weekly-summary", body: { ...body } }),
      ]);
      if (cancelled) return;

      // Today summary
      if (nhn.ok) {
        const parsed = parseNgayHomNayForHome(nhn.data);
        setTodayHome(parsed);
        setSummaryLoading(false);
        if (parsed) {
          setTodayReadingSource(nhn.data);
          const unlock = await invokeReadingUnlock({ dry_run: true, scope: "home", day_iso: todayIso });
          if (cancelled) return;
          const serverAllows = Boolean(
            unlock.ok && (unlock.unlocked === true || unlock.already_unlocked === true || unlock.subscription_free === true),
          );
          setTodayReadingUnlocked(serverAllows);
          if (serverAllows) {
            const hadCache = Boolean(sessionCachedReading);
            if (!hadCache) setTodayAiReadingLoading(true);
            void invokeGenerateReading({ endpoint: "ngay-hom-nay", data: nhn.data }).then((r) => {
              if (!cancelled) {
                const next = r.reading;
                if (next) {
                  setTodayAiReading(next);
                  writeTodayAiReadingSession(profile.id, todayIso, next);
                } else if (!hadCache) setTodayAiReading(null);
                setTodayAiReadingLoading(false);
              }
            });
          } else {
            try { sessionStorage.removeItem(todayAiReadingSessionKey(profile.id, todayIso)); } catch { /* ignore */ }
            setTodayAiReading(null);
            setTodayAiReadingLoading(false);
          }
        } else {
          setSummaryErr("Không đọc được kết quả Hôm nay. Thử lại sau vài giây.");
          setSummaryLoading(false);
        }
      } else {
        setSummaryErr(nhn.message);
        setSummaryLoading(false);
      }

      // Weekly
      if (ws.ok) {
        setWeekly(parseWeeklySummaryForScreen(ws.data));
      }
      setWeeklyLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profileLoading, profile, canBatTu, profile?.ngay_sinh, profile?.gio_sinh, profile?.gioi_tinh]);

  useEffect(() => {
    if (streakLoading || streakCount !== 7) return;
    const ym = todayIsoInVn().slice(0, 7);
    const k = `ngaytot_day7_shown:${ym}`;
    try {
      if (localStorage.getItem(k) === "1") return;
    } catch {
      return;
    }
    setDay7ModalOpen(true);
  }, [streakLoading, streakCount]);

  useEffect(() => {
    if (streakLoading || streakCount === 7) return;
    const today = todayIsoInVn();
    const beforeYesterday = addDaysToIso(today, -1);
    const specBroken =
      streakCount === 0 &&
      streakLastCheckIn != null &&
      streakLastCheckIn < beforeYesterday;
    if (!specBroken && !streakGapReturn) return;
    const k = `ngaytot_restart_shown:${today}`;
    try {
      if (localStorage.getItem(k) === "1") return;
    } catch {
      return;
    }
    setRestartModalOpen(true);
  }, [
    streakLoading,
    streakCount,
    streakLastCheckIn,
    streakGapReturn,
  ]);

  useEffect(() => {
    if (!todayReadingUnlocked) return;
    const iso = todayIsoInVn();
    void fetchIsPinned({ scope: "home", day_iso: iso }).then(setHomePinned);
  }, [todayReadingUnlocked]);

  async function handleHomePin() {
    if (homePinBusy) return;
    setHomePinBusy(true);
    const iso = todayIsoInVn();
    const action = homePinned ? "unpin" : "pin";
    const result = await invokePin({
      action,
      scope: "home",
      day_iso: iso,
      reading_snapshot: todayAiReading ?? undefined,
    });
    if (result.ok) {
      setHomePinned(result.pinned);
      toast.success(result.pinned ? "Đã ghim luận giải." : "Đã bỏ ghim.");
    } else {
      toast.error(result.message);
    }
    setHomePinBusy(false);
  }

  async function onUnlockTodayReading() {
    if (!todayReadingSource || unlockingTodayReading || !profile?.id) return;
    setUnlockingTodayReading(true);
    setTodayAiReadingLoading(true);
    const iso = todayIsoInVn();
    const unlock = await invokeReadingUnlock({ scope: "home", day_iso: iso });
    if (!unlock.ok) {
      toast.error(unlock.message);
      setTodayAiReadingLoading(false);
      setUnlockingTodayReading(false);
      return;
    }
    if (unlock.charged || unlock.subscription_free) {
      window.dispatchEvent(new CustomEvent("ngaytot:profile-refresh"));
    }
    const r = await invokeGenerateReading({ endpoint: "ngay-hom-nay", data: todayReadingSource });
    const next = r.reading;
    setTodayAiReading(next);
    setTodayAiReadingLoading(false);
    setTodayReadingUnlocked(true);
    setUnlockingTodayReading(false);
    if (next) writeTodayAiReadingSession(profile.id, iso, next);
    toast.success(
      unlock.charged ? "Đã mở khóa luận giải (đã trừ lượng)."
        : unlock.subscription_free ? "Đã mở khóa luận giải (gói đang hoạt động)."
        : "Đã mở khóa luận giải.",
    );
  }

  const todayType = todayHome?.dayType ?? "neutral";
  const upcomingDays = weekly?.rows.slice(0, 3) ?? [];
  const readingInForestCard = !hasLaso || !menh;

  return (
    <div
      style={{
        background: HM.paper,
        minHeight: "100%",
        color: HM.ink,
        fontFamily: HM.serif,
      }}
    >
      <div style={{ maxWidth: HM.frame, margin: "0 auto" }}>
      {/* Header: LogoMark + greeting + credits chip */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: `10px ${HM.pxPage}px`,
          borderBottom: `1px solid ${HM.borderSection}`,
        }}
      >
        <div className="flex items-center gap-3">
          <LogoMark size={26} />
          <div style={{ lineHeight: 1.05 }}>
            <div
              style={{
                fontFamily: HM.display,
                fontWeight: 800,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.28px",
                lineHeight: "14.7px",
                color: HM.ink,
              }}
            >
              {displayName ? `${displayName} · Hôm nay` : "Hôm nay"}
            </div>
            {todayHome ? (
              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontFamily: HM.mono,
                  fontSize: 12,
                  fontWeight: 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  lineHeight: 1.25,
                  color: HM.muted,
                }}
              >
                {todayHome.headerSubline}
              </span>
            ) : (
              <span
                style={{
                  display: "block",
                  marginTop: 2,
                  fontFamily: HM.mono,
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  lineHeight: 1.25,
                  color: HM.muted,
                }}
              >
                ĐỌC NGÀY…
              </span>
            )}
          </div>
        </div>
        <CreditsHeaderChip homeMaket />
      </div>

      <StreakRibbon currentCount={streakCount} loading={streakLoading} />

      <div className="pb-8">
        {summaryErr ? (
          <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 16 }}>
            <ErrorBanner message={summaryErr} />
          </div>
        ) : null}

        {/* Onboarding CTA */}
        {!profileLoading && !canBatTu ? (
          <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 16 }}>
            <div
              style={{
                background: "#fff",
                border: `1px solid ${HM.borderSection}`,
                borderRadius: HM.radM,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontFamily: HM.display,
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.28px",
                  lineHeight: "14.7px",
                  color: HM.ink,
                  marginBottom: 8,
                }}
              >
                Lập lá số Bát Tự
              </div>
              <p
                style={{
                  fontFamily: HM.serif,
                  fontSize: 16,
                  color: HM.body,
                  lineHeight: 1.55,
                  marginBottom: 14,
                  marginTop: 0,
                }}
              >
                Lá số Bát Tự chưa có. Lập ngay để xem lịch Hôm nay, tuần này và tháng này theo đúng mệnh và Dụng Thần của bạn.
              </p>
              <Link
                to="/app/la-so"
                style={{
                  display: "inline-block",
                  padding: "14px 20px",
                  background: HM.forest,
                  color: HM.cream,
                  fontFamily: HM.display,
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: "0.84px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  minHeight: 45,
                  lineHeight: 1.2,
                  borderRadius: HM.radM,
                }}
              >
                Lập lá số ngay →
              </Link>
            </div>
          </div>
        ) : null}

        {/* Today verdict card — forest dark */}
        {canBatTu ? (
          <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 16 }}>
            <span
              style={{
                display: "block",
                fontFamily: HM.mono,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "1.32px",
                textTransform: "uppercase",
                color: HM.goldDeep,
              }}
            >
              Phán định cho hôm nay
            </span>
            <div
              style={{
                marginTop: 12,
                padding: "20px 22px",
                maxWidth: HM.inner,
                marginLeft: "auto",
                marginRight: "auto",
                background: HM.forest,
                color: HM.cream,
                position: "relative",
                overflow: "hidden",
                borderRadius: 0,
              }}
            >
              <div style={{ flex: 1, position: "relative" }}>
                {summaryLoading ? (
                  <div
                    style={{
                      height: 48,
                      background: "rgba(255,255,255,0.06)",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span
                        style={{
                          fontFamily: HM.display,
                          fontWeight: 800,
                          fontSize: 48,
                          color: verdictColor(todayType),
                          lineHeight: "43.2px",
                        }}
                      >
                        {verdictText(todayType)}
                      </span>
                    </div>
                    {todayHome?.lunarLabel ? (
                      <div
                        style={{
                          fontFamily: HM.serif,
                          fontSize: 13,
                          fontWeight: 400,
                          color: "rgba(237,231,211,0.72)",
                          marginTop: 6,
                          lineHeight: "19.5px",
                        }}
                      >
                        {todayHome.lunarLabel}
                      </div>
                    ) : null}

                    {todayHome && todayHome.trucDisplay && todayHome.trucDisplay !== "—" ? (
                      <div style={{ marginTop: 4 }}>
                        <span
                          style={{
                            display: "block",
                            fontFamily: HM.serif,
                            fontSize: 13,
                            fontWeight: 400,
                            color: "rgba(237,231,211,0.75)",
                            lineHeight: "19.5px",
                          }}
                        >
                          Trực
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontFamily: HM.serif,
                            fontSize: 13,
                            fontWeight: 700,
                            color: HM.gold,
                            lineHeight: "19.5px",
                          }}
                        >
                          {todayHome.trucDisplay}
                        </span>
                      </div>
                    ) : null}

                    {todayHome ? (
                      <div
                        style={{
                          fontFamily: HM.serif,
                          fontSize: 13,
                          fontWeight: 700,
                          color: HM.gold,
                          marginTop: 8,
                          lineHeight: "19.5px",
                        }}
                      >
                        {`· Sao tốt: ${todayHome.saoTotCsv} · Sao xấu: ${todayHome.saoXauCsv}`}
                      </div>
                    ) : null}

                    {todayHome && todayHome.goodForChips.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 10,
                        }}
                      >
                        {todayHome.goodForChips.slice(0, 6).map((label) => (
                          <span
                            key={label}
                            style={{
                              background: HM.chipBg,
                              border: `1px solid ${HM.borderChip}`,
                              borderRadius: 9999,
                              padding: "5px 10px",
                              fontFamily: HM.serif,
                              fontSize: 11,
                              fontWeight: 400,
                              letterSpacing: "0.44px",
                              color: HM.gold,
                              height: 26,
                              boxSizing: "border-box",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Luận giải — trong thẻ rừng khi chưa có lá số đủ (maket đưa lên thẻ Đại Vận). */}
                    {readingInForestCard && todayReadingUnlocked ? (
                      todayAiReadingLoading ? (
                        <div
                          style={{
                            marginTop: 12,
                            height: 3,
                            background: "rgba(197,165,90,0.35)",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              height: "100%",
                              width: "40%",
                              background: "rgba(197,165,90,0.75)",
                              animation: "shimmer 1.2s infinite",
                            }}
                          />
                        </div>
                      ) : todayAiReading ? (
                        <div
                          style={{
                            marginTop: 12,
                            borderTop: "1px solid rgba(197,165,90,0.2)",
                            paddingTop: 10,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: HM.serif,
                              fontSize: 16,
                              color: "rgba(237,231,211,0.88)",
                              lineHeight: 1.6,
                              margin: 0,
                            }}
                          >
                            {todayAiReading}
                          </p>
                          <button
                            type="button"
                            disabled={homePinBusy}
                            onClick={() => void handleHomePin()}
                            style={{
                              marginTop: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              background: homePinned
                                ? "rgba(139,26,26,0.18)"
                                : "rgba(197,165,90,0.08)",
                              border: `1px solid ${homePinned ? "rgba(139,26,26,0.5)" : "rgba(197,165,90,0.3)"}`,
                              padding: "6px 12px",
                              borderRadius: HM.radM,
                              cursor: homePinBusy ? "default" : "pointer",
                              opacity: homePinBusy ? 0.65 : 1,
                              fontFamily: HM.mono,
                              fontSize: 10,
                              color: homePinned ? "#c07070" : "rgba(197,165,90,0.85)",
                              letterSpacing: "1.4px",
                              textTransform: "uppercase",
                            }}
                          >
                            <span style={{ fontFamily: "var(--hanzi)", fontSize: 12, fontWeight: 700 }}>留</span>
                            <span>{homePinned ? "Bỏ ghim" : "Ghim"}</span>
                          </button>
                        </div>
                      ) : null
                    ) : readingInForestCard && todayHome && !todayAiReadingLoading ? (
                      <button
                        type="button"
                        onClick={() => void onUnlockTodayReading()}
                        disabled={unlockingTodayReading}
                        style={{
                          marginTop: 12,
                          padding: "14px 16px",
                          minHeight: 45,
                          background: "rgba(197,165,90,0.15)",
                          border: `1px solid ${HM.borderChip}`,
                          color: HM.gold,
                          fontFamily: HM.mono,
                          fontSize: 11,
                          letterSpacing: "1.32px",
                          textTransform: "uppercase",
                          borderRadius: HM.radM,
                          cursor: "pointer",
                        }}
                      >
                        {unlockingTodayReading ? "Đang mở…" : `Đọc luận giải · ${unlockReadingCost} lượng`}
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Giờ tốt / Giờ xấu — pill Địa Chi theo maket */}
        {canBatTu && todayHome &&
        (todayHome.gioTotChis.length > 0 ||
          todayHome.gioXauChis.length > 0 ||
          (todayHome.hourRange && todayHome.hourRange !== "—")) ? (
          <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 16 }}>
            {todayHome.gioTotChis.length > 0 || (todayHome.hourRange && todayHome.hourRange !== "—") ? (
              <div style={{ marginBottom: todayHome.gioXauChis.length > 0 ? 14 : 0 }}>
                <span
                  style={{
                    display: "block",
                    fontFamily: HM.mono,
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: "1.32px",
                    textTransform: "uppercase",
                    color: HM.muted,
                  }}
                >
                  Giờ tốt
                  {todayHome.gioTotChis.length > 0
                    ? ` — ${todayHome.gioTotChis.length} hoàng đạo`
                    : ""}
                </span>
                <div
                  style={{
                    marginTop: 8,
                    background: "#fff",
                    border: `1px solid ${HM.borderHourGood}`,
                    borderRadius: HM.radM,
                    padding: "10px 4px",
                    boxSizing: "border-box",
                  }}
                >
                  {todayHome.gioTotChis.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                        gap: 5,
                      }}
                    >
                      {todayHome.gioTotChis.map((chi) => (
                        <div
                          key={chi}
                          style={{
                            background: "#fff",
                            border: `1px solid ${HM.borderHourGood}`,
                            borderRadius: HM.radM,
                            padding: "10px 4px",
                            boxSizing: "border-box",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: HM.display,
                              fontSize: 13,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              textAlign: "center",
                              color: HM.ink,
                              lineHeight: 1.2,
                            }}
                          >
                            {chi}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontFamily: HM.serif,
                        fontSize: 16,
                        color: HM.ink,
                        lineHeight: 1.55,
                        margin: 0,
                        padding: "2px 10px",
                      }}
                    >
                      {todayHome.hourRange}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
            {todayHome.gioXauChis.length > 0 ? (
              <div>
                <span
                  style={{
                    display: "block",
                    fontFamily: HM.mono,
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: "1.32px",
                    textTransform: "uppercase",
                    color: HM.red,
                  }}
                >
                  Giờ xấu
                </span>
                <div
                  style={{
                    marginTop: 8,
                    background: "#fff",
                    border: `1px solid ${HM.borderHourGood}`,
                    borderRadius: HM.radM,
                    padding: "10px 4px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                      gap: 5,
                    }}
                  >
                    {todayHome.gioXauChis.map((chi) => (
                      <div
                        key={chi}
                        style={{
                          background: "#fff",
                          border: `1px solid ${HM.borderHourBad}`,
                          borderRadius: HM.radM,
                          padding: "10px 4px",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: HM.display,
                            fontSize: 13,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            textAlign: "center",
                            color: HM.red,
                            lineHeight: 1.2,
                          }}
                        >
                          {chi}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Đại Vận + luận giải (maket) / lá số */}
        {hasLaso && menh ? (
          <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 16 }}>
            <div
              style={{
                background: "#fff",
                border: `1px solid ${HM.borderSection}`,
                borderRadius: HM.radM,
                padding: "14px 16px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: HM.mono,
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "1.32px",
                  textTransform: "uppercase",
                  color: HM.goldDeep,
                }}
              >
                {laso?.daiVan && laso.daiVan !== "—"
                  ? `Đại Vận của bạn · ${formatDaiVanArrow(laso.daiVan)}`
                  : `Lá số của bạn · Mệnh ${menh}`}
              </span>
              {laso?.daiVan && laso.daiVan !== "—" ? (
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      fontFamily: HM.display,
                      fontWeight: 800,
                      fontSize: 15,
                      color: HM.ink,
                      letterSpacing: "0.3px",
                      lineHeight: 1.2,
                    }}
                  >
                    {laso?.nhatChu && laso.nhatChu !== "—"
                      ? `${laso.nhatChu}${laso?.hanh && laso.hanh !== "—" ? ` · ${laso.hanh}` : ""}`
                      : `Mệnh ${menh}`}
                  </span>
                </div>
              ) : null}
              {todayHome?.homeSummaryLine && todayHome.homeSummaryLine !== "—" && !todayReadingUnlocked ? (
                <p
                  style={{
                    fontFamily: HM.serif,
                    fontSize: 16,
                    color: HM.body,
                    lineHeight: 1.55,
                    marginTop: 10,
                    marginBottom: 0,
                  }}
                >
                  {todayHome.homeSummaryLine}
                </p>
              ) : null}

              {!readingInForestCard && todayReadingUnlocked ? (
                todayAiReadingLoading ? (
                  <div
                    style={{
                      marginTop: 12,
                      height: 3,
                      background: "rgba(197,165,90,0.35)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "40%",
                        background: "rgba(197,165,90,0.75)",
                        animation: "shimmer 1.2s infinite",
                      }}
                    />
                  </div>
                ) : todayAiReading ? (
                  <div style={{ marginTop: 12 }}>
                    <p
                      style={{
                        fontFamily: HM.serif,
                        fontSize: 16,
                        color: HM.body,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {todayAiReading}
                    </p>
                    <button
                      type="button"
                      disabled={homePinBusy}
                      onClick={() => void handleHomePin()}
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: homePinned
                          ? "rgba(139,26,26,0.12)"
                          : "rgba(197,165,90,0.1)",
                        border: `1px solid ${homePinned ? "rgba(139,26,26,0.45)" : "rgba(197,165,90,0.35)"}`,
                        padding: "6px 12px",
                        borderRadius: HM.radM,
                        cursor: homePinBusy ? "default" : "pointer",
                        opacity: homePinBusy ? 0.65 : 1,
                        fontFamily: HM.mono,
                        fontSize: 10,
                        color: homePinned ? "#a05050" : HM.goldDeep,
                        letterSpacing: "1.4px",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ fontFamily: "var(--hanzi)", fontSize: 12, fontWeight: 700 }}>留</span>
                      <span>{homePinned ? "Bỏ ghim" : "Ghim"}</span>
                    </button>
                  </div>
                ) : null
              ) : null}
              {!readingInForestCard && todayHome && !todayReadingUnlocked && !todayAiReadingLoading ? (
                <button
                  type="button"
                  onClick={() => void onUnlockTodayReading()}
                  disabled={unlockingTodayReading}
                  style={{
                    marginTop: 12,
                    padding: "14px 16px",
                    minHeight: 45,
                    background: "rgba(197,165,90,0.12)",
                    border: `1px solid ${HM.borderChip}`,
                    color: HM.goldDeep,
                    fontFamily: HM.mono,
                    fontSize: 11,
                    letterSpacing: "1.32px",
                    textTransform: "uppercase",
                    borderRadius: HM.radM,
                    cursor: "pointer",
                  }}
                >
                  {unlockingTodayReading ? "Đang mở…" : `Đọc luận giải · ${unlockReadingCost} lượng`}
                </button>
              ) : null}

              <Link
                to="/app/la-so/chi-tiet"
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  fontFamily: HM.mono,
                  fontSize: 11,
                  color: HM.goldDeep,
                  letterSpacing: "1.32px",
                  textTransform: "uppercase",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Xem chi tiết lá số →
              </Link>
            </div>
          </div>
        ) : null}

        {/* 3 upcoming auspicious days */}
        {canBatTu ? (
          <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 16 }}>
            <span
              style={{
                display: "block",
                fontFamily: HM.mono,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: "1.32px",
                textTransform: "uppercase",
                color: HM.muted,
              }}
            >
              {weeklyLoading ? "Đang tải ngày lành…" : weekly?.rows.length ? "3 ngày lành sắp tới" : "Ngày lành tuần này"}
            </span>
            <div style={{ marginTop: 10 }}>
              {weeklyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 60,
                        background: "#fff",
                        border: `1px solid ${HM.borderCard}`,
                        borderRadius: HM.radM,
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                  ))}
                </div>
              ) : upcomingDays.length ? (
                upcomingDays.map((row) => (
                  <Link
                    key={row.isoDate}
                    to={`/app/ngay/${row.isoDate}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "#fff",
                      border: `1px solid ${HM.borderCard}`,
                      borderRadius: HM.radM,
                      marginBottom: 8,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: HM.display,
                        fontWeight: 800,
                        fontSize: 22,
                        color: HM.goldDeep,
                        minWidth: 64,
                        lineHeight: 1,
                      }}
                    >
                      {row.score ?? "—"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: HM.display,
                          fontWeight: 700,
                          fontSize: 13,
                          textTransform: "uppercase",
                          color: HM.ink,
                          letterSpacing: "0.26px",
                          marginBottom: 2,
                          lineHeight: 1.2,
                        }}
                      >
                        {row.grade}
                      </div>
                      <span
                        style={{
                          display: "block",
                          fontFamily: HM.mono,
                          fontSize: 11,
                          fontWeight: 400,
                          letterSpacing: "1.32px",
                          textTransform: "uppercase",
                          color: HM.muted,
                        }}
                      >
                        {row.dateShortVi}
                      </span>
                      {row.oneLiner ? (
                        <p
                          style={{
                            fontFamily: HM.serif,
                            fontSize: 15,
                            color: HM.body,
                            lineHeight: 1.45,
                            marginTop: 3,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {row.oneLiner}
                        </p>
                      ) : null}
                    </div>
                    <span style={{ color: HM.goldDeep, fontSize: 18, lineHeight: 1 }}>→</span>
                  </Link>
                ))
              ) : (
                <p style={{ fontFamily: HM.serif, fontSize: 16, color: HM.muted, lineHeight: 1.55, margin: 0 }}>
                  Chưa có gợi ý tuần này. Hãy thêm ngày sinh trong hồ sơ.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Primary CTA */}
        <div style={{ paddingLeft: HM.pxPage, paddingRight: HM.pxPage, paddingTop: 8, paddingBottom: 8 }}>
          <button
            type="button"
            onClick={() => void navigate("/app/chon-ngay")}
            style={{
              width: "100%",
              padding: "14px",
              background: HM.forest,
              color: HM.cream,
              border: "none",
              fontFamily: HM.display,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.84px",
              textTransform: "uppercase",
              cursor: "pointer",
              minHeight: 45,
              borderRadius: HM.radM,
              boxSizing: "border-box",
            }}
          >
            + Chọn ngày cho việc khác
          </button>
        </div>
      </div>
      </div>

      {day7ModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day7-streak-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: `radial-gradient(ellipse at 50% 0%, #2a4738 0%, ${HM.forest} 50%, #131f1a 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto",
            paddingBottom: 32,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: HM.frame,
              boxSizing: "border-box",
              paddingLeft: HM.pxPage,
              paddingRight: HM.pxPage,
            }}
          >
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0 24px" }}>
            <span
              aria-hidden
              style={{
                fontFamily: HM.display,
                fontSize: 96,
                fontWeight: 900,
                color: HM.gold,
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              7
            </span>
          </div>

          <Ticket holeColor={HM.forest}>
            <div style={{ padding: "28px 22px 22px", textAlign: "center", position: "relative" }}>
              <Stamp ch="圓滿" style={{ position: "absolute", top: 14, right: 14, fontSize: 18 }} />
              <span
                style={{
                  fontFamily: HM.mono,
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "1.32px",
                  textTransform: "uppercase",
                  color: HM.muted,
                }}
              >
                Nhịp liên · 7 ngày
              </span>
              <h2
                id="day7-streak-title"
                style={{
                  fontFamily: HM.display,
                  fontWeight: 900,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  margin: "8px 0 4px",
                  color: HM.ink,
                  lineHeight: 1.1,
                }}
              >
                Đủ 7 ngày
              </h2>
              <p
                style={{
                  fontFamily: HM.serif,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: HM.bodyMuted,
                  marginBottom: 16,
                  lineHeight: 1.55,
                  marginTop: 0,
                }}
              >
                Bạn đã giữ thói quen suốt một tuần.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  padding: "14px 0",
                  borderTop: "1px dashed rgba(122,112,80,0.4)",
                  borderBottom: "1px dashed rgba(122,112,80,0.4)",
                }}
              >
                {[...Array(7)].map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: HM.goldDeep,
                      color: HM.cream,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: HM.display,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const ym = todayIsoInVn().slice(0, 7);
                    try { localStorage.setItem(`ngaytot_day7_shown:${ym}`, "1"); } catch { /* ignore */ }
                    setDay7ModalOpen(false);
                  }}
                  style={{
                    width: "100%",
                    background: HM.gold,
                    color: HM.ink,
                    border: "none",
                    padding: "14px 20px",
                    fontFamily: HM.display,
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.84px",
                    cursor: "pointer",
                    minHeight: 45,
                    borderRadius: HM.radM,
                    boxSizing: "border-box",
                  }}
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </Ticket>
          </div>
        </div>
      ) : null}

      {restartModalOpen && !day7ModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restart-streak-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: `radial-gradient(ellipse at 50% 0%, #2a4738 0%, ${HM.forest} 50%, #131f1a 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto",
            paddingBottom: 32,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: HM.frame,
              boxSizing: "border-box",
              paddingLeft: HM.pxPage,
              paddingRight: HM.pxPage,
            }}
          >
          <div style={{ paddingTop: 64 }}>
            <div
              style={{
                background: "rgba(139,26,26,0.12)",
                border: "1px solid rgba(196,77,77,0.45)",
                borderRadius: 2,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: HM.display,
                  fontSize: 22,
                  fontWeight: 800,
                  color: HM.accentWarm,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  flexShrink: 0,
                }}
              >
                —
              </span>
              <span
                style={{
                  fontFamily: HM.mono,
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "1.32px",
                  textTransform: "uppercase",
                  color: HM.accentWarm,
                }}
              >
                Liền · gián đoạn
              </span>
            </div>
          </div>

          <Ticket holeColor={HM.forest}>
            <div style={{ padding: "24px 22px 20px", textAlign: "center", position: "relative" }}>
              <span
                aria-hidden
                style={{
                  fontFamily: HM.display,
                  fontSize: 64,
                  color: HM.muted,
                  fontWeight: 800,
                  lineHeight: 1,
                  opacity: 0.4,
                  letterSpacing: "-0.04em",
                }}
              >
                —
              </span>
              <h2
                id="restart-streak-title"
                style={{
                  fontFamily: HM.display,
                  fontWeight: 800,
                  fontSize: 22,
                  margin: "10px 0 4px",
                  letterSpacing: "0.26px",
                  color: HM.ink,
                  lineHeight: 1.15,
                }}
              >
                Nhịp đã ngắt
              </h2>
              <p
                style={{
                  fontFamily: HM.serif,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: HM.bodyMuted,
                  lineHeight: 1.55,
                  marginBottom: 16,
                  marginTop: 0,
                }}
              >
                Cuộc đời nhiều việc — chuyện thường.<br />
                Bắt đầu lại từ hôm nay nhé.
              </p>

              <div
                style={{
                  padding: "12px 0",
                  borderTop: "1px dashed rgba(122,112,80,0.4)",
                  borderBottom: "1px dashed rgba(122,112,80,0.4)",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: HM.mono,
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: "1.32px",
                    textTransform: "uppercase",
                    color: HM.muted,
                  }}
                >
                  Nhịp hiện tại · 0 ngày
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(`ngaytot_restart_shown:${todayIsoInVn()}`, "1");
                  } catch { /* ignore */ }
                  setRestartModalOpen(false);
                }}
                style={{
                  width: "100%",
                  background: HM.gold,
                  color: HM.ink,
                  border: "none",
                  padding: "14px 20px",
                  fontFamily: HM.display,
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.84px",
                  cursor: "pointer",
                  minHeight: 45,
                  borderRadius: HM.radM,
                  boxSizing: "border-box",
                }}
              >
                Bắt đầu lại · ngày 1 / 7
              </button>
            </div>
          </Ticket>
          </div>
        </div>
      ) : null}
    </div>
  );
}
