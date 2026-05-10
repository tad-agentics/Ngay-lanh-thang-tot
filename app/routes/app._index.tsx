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
import { Kanji, LogoMark, Mono, Stamp, Ticket } from "~/components/brand";
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

function verdictKanji(dayType: DayType): string {
  if (dayType === "hoang-dao") return "吉";
  if (dayType === "hac-dao") return "凶";
  return "中";
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
    <div className="px-5 pt-3">
      <Link
        to="/app/nhip/lich-su"
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            background: "rgba(197,165,90,0.08)",
            border: "1px solid var(--gold, #c5a55a)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--gold, #c5a55a)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              flexShrink: 0,
            }}
          >
            {currentCount}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Mono style={{ color: "var(--gold, #c5a55a)" }}>
              {`Liền · ${currentCount} ngày`}
              {term?.name ? ` · ${term.name}` : ""}
            </Mono>
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

  return (
    <div
      style={{ background: "var(--paper, #f0ece2)", minHeight: "100%", color: "var(--ink, #1a1a1a)", fontFamily: "var(--serif)" }}
    >
      {/* Header: LogoMark + greeting + credits chip */}
      <div
        className="flex items-center justify-between px-5 pt-3 pb-3"
        style={{ borderBottom: "1px solid rgba(154,124,34,0.18)" }}
      >
        <div className="flex items-center gap-3">
          <LogoMark size={26} />
          <div style={{ lineHeight: 1.05 }}>
            <div
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              {displayName ? `${displayName} · Hôm nay` : "Hôm nay"}
            </div>
            {todayHome ? (
              <Mono style={{ color: "#7a7050", marginTop: 1, display: "block" }}>
                {todayHome.solarDateVi.toUpperCase()}
                {todayHome.lunarLabel ? ` · ${todayHome.lunarLabel.toUpperCase()}` : ""}
              </Mono>
            ) : (
              <Mono style={{ color: "#7a7050", marginTop: 1, display: "block" }}>
                ĐỌC NGÀY…
              </Mono>
            )}
          </div>
        </div>
        <CreditsHeaderChip />
      </div>

      <StreakRibbon currentCount={streakCount} loading={streakLoading} />

      <div className="pb-8">
        {summaryErr ? (
          <div className="px-5 pt-4"><ErrorBanner message={summaryErr} /></div>
        ) : null}

        {/* Onboarding CTA */}
        {!profileLoading && !canBatTu ? (
          <div className="px-5 pt-4">
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(154,124,34,0.22)",
                padding: "18px 18px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "-0.005em",
                  marginBottom: 8,
                }}
              >
                Lập lá số Bát Tự
              </div>
              <p
                style={{ fontFamily: "var(--serif)", fontSize: 16, color: "#3a3220", lineHeight: 1.55, marginBottom: 14 }}
              >
                Lá số Bát Tự chưa có. Lập ngay để xem lịch Hôm nay, tuần này và tháng này theo đúng mệnh và Dụng Thần của bạn.
              </p>
              <Link
                to="/app/la-so"
                style={{
                  display: "inline-block",
                  padding: "12px 20px",
                  background: "var(--forest, #2d5a3d)",
                  color: "#ede7d3",
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  minHeight: 44,
                  lineHeight: 1.2,
                }}
              >
                Lập lá số ngay →
              </Link>
            </div>
          </div>
        ) : null}

        {/* Today verdict card — forest dark */}
        {canBatTu ? (
          <div className="px-5 pt-4">
            <Mono style={{ color: "#9a7c22" }}>Phán định cho hôm nay</Mono>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                marginTop: 10,
                padding: "20px 22px",
                background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
                color: "#ede7d3",
                position: "relative",
                overflow: "hidden",
                minHeight: 110,
              }}
            >
              <Kanji
                ch={verdictKanji(todayType)}
                size={140}
                drift
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  color: "rgba(197,165,90,0.10)",
                }}
              />
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
                          fontFamily: "var(--display-2)",
                          fontWeight: 800,
                          fontSize: 42,
                          color: verdictColor(todayType),
                          lineHeight: 0.9,
                        }}
                      >
                        {verdictText(todayType)}
                      </span>
                    </div>
                    {todayHome?.lunarLabel ? (
                      <div
                        style={{
                          fontSize: 13,
                          color: "rgba(237,231,211,0.72)",
                          marginTop: 6,
                          lineHeight: 1.55,
                        }}
                      >
                        {todayHome.lunarLabel}
                      </div>
                    ) : null}

                    {/* AI Reading */}
                    {todayReadingUnlocked ? (
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
                              cursor: homePinBusy ? "default" : "pointer",
                              opacity: homePinBusy ? 0.65 : 1,
                              fontFamily: "var(--mono)",
                              fontSize: 10,
                              color: homePinned ? "#c07070" : "rgba(197,165,90,0.85)",
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                            }}
                          >
                            <span style={{ fontFamily: "var(--hanzi)", fontSize: 12, fontWeight: 700 }}>留</span>
                            <span>{homePinned ? "Bỏ ghim" : "Ghim"}</span>
                          </button>
                        </div>
                      ) : null
                    ) : todayHome && !todayAiReadingLoading ? (
                      <button
                        type="button"
                        onClick={() => void onUnlockTodayReading()}
                        disabled={unlockingTodayReading}
                        style={{
                          marginTop: 12,
                          padding: "12px 16px",
                          minHeight: 44,
                          background: "rgba(197,165,90,0.15)",
                          border: "1px solid rgba(197,165,90,0.4)",
                          color: "var(--gold, #c5a55a)",
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
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

        {/* Best hours */}
        {canBatTu && todayHome?.hourRange ? (
          <div className="px-5 pt-4">
            <Mono style={{ color: "#7a7050" }}>Giờ tốt hôm nay</Mono>
            <div
              style={{
                marginTop: 8,
                background: "#fff",
                border: "1px solid rgba(154,124,34,0.2)",
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  color: "var(--ink, #1a1a1a)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {todayHome.hourRange}
              </p>
            </div>
          </div>
        ) : null}

        {/* Personal layer — Mệnh + Lá số link */}
        {hasLaso && menh ? (
          <div className="px-5 pt-4">
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(154,124,34,0.2)",
                padding: "14px 16px",
              }}
            >
              <div className="flex items-center justify-between">
                <Mono style={{ color: "#9a7c22" }}>Lá số của bạn · Mệnh {menh}</Mono>
              </div>
              {laso?.daiVan ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                  <span
                    style={{
                      fontFamily: "var(--display-2)",
                      fontWeight: 800,
                      fontSize: 15,
                      color: "var(--ink, #1a1a1a)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {laso.daiVan}
                  </span>
                </div>
              ) : null}
              <Link
                to="/app/la-so/chi-tiet"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--gold-deep, #7d6219)",
                  letterSpacing: "0.1em",
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
          <div className="px-5 pt-4">
            <Mono style={{ color: "#7a7050" }}>
              {weeklyLoading ? "Đang tải ngày lành…" : weekly?.rows.length ? "3 ngày lành sắp tới" : "Ngày lành tuần này"}
            </Mono>
            <div style={{ marginTop: 10 }}>
              {weeklyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 60,
                        background: "#fff",
                        border: "1px solid rgba(154,124,34,0.15)",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                  ))}
                </div>
              ) : upcomingDays.length ? (
                upcomingDays.map((row, i) => (
                  <Link
                    key={row.isoDate}
                    to={`/app/ngay/${row.isoDate}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "#fff",
                      border: "1px solid rgba(154,124,34,0.18)",
                      marginBottom: 8,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--display-2)",
                        fontWeight: 800,
                        fontSize: 22,
                        color: "var(--gold-deep, #7d6219)",
                        minWidth: 54,
                      }}
                    >
                      {row.score ?? "—"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--display-2)",
                          fontWeight: 700,
                          fontSize: 13,
                          textTransform: "uppercase",
                          color: "var(--ink, #1a1a1a)",
                          letterSpacing: "-0.005em",
                          marginBottom: 2,
                        }}
                      >
                        {row.grade}
                      </div>
                      <Mono style={{ color: "#7a7050" }}>
                        {row.dateLabelVi}
                      </Mono>
                      {row.oneLiner ? (
                        <p
                          style={{
                            fontFamily: "var(--serif)",
                            fontSize: 15,
                            color: "#3a3220",
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
                    <span style={{ color: "#9a7c22", fontSize: 18 }}>→</span>
                  </Link>
                ))
              ) : (
                <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "#7a7050", lineHeight: 1.55 }}>
                  Chưa có gợi ý tuần này. Hãy thêm ngày sinh trong hồ sơ.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* Primary CTA */}
        <div className="px-5 pt-2">
          <button
            type="button"
            onClick={() => void navigate("/app/chon-ngay")}
            style={{
              width: "100%",
              padding: "14px",
              background: "#1d3129",
              color: "#ede7d3",
              border: "none",
              fontFamily: "var(--display-2)",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              minHeight: 48,
            }}
          >
            + Chọn ngày cho việc khác
          </button>
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
            background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
            display: "flex",
            flexDirection: "column",
            padding: "0 20px 32px",
            overflowY: "auto",
          }}
        >
          {/* Large floating "7" — Barlow Condensed per b-habit.jsx HBStreak7 */}
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0 24px" }}>
            <span
              aria-hidden
              style={{
                fontFamily: "var(--display-2)",
                fontSize: 96,
                fontWeight: 900,
                color: "var(--gold, #c5a55a)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              7
            </span>
          </div>

          {/* Ticket with celebration content */}
          <Ticket holeColor="#1d3129">
            <div style={{ padding: "28px 22px 22px", textAlign: "center", position: "relative" }}>
              <Stamp ch="圓滿" style={{ position: "absolute", top: 14, right: 14, fontSize: 18 }} />
              <Mono style={{ color: "#7a7050" }}>Nhịp liên · 7 ngày</Mono>
              <h2
                id="day7-streak-title"
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 900,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  margin: "8px 0 4px",
                  color: "#18150e",
                }}
              >
                Đủ 7 ngày
              </h2>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: "#5a4f30",
                  marginBottom: 16,
                  lineHeight: 1.55,
                }}
              >
                Bạn đã giữ thói quen suốt một tuần.
              </p>

              {/* 7 checkmark dots */}
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
                      background: "#9a7c22",
                      color: "#ede7d3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--display-2)",
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
                    background: "var(--gold, #c5a55a)",
                    color: "#18150e",
                    border: "none",
                    padding: "14px 20px",
                    fontFamily: "var(--display-2)",
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                  }}
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </Ticket>
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
            background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
            display: "flex",
            flexDirection: "column",
            padding: "0 20px 32px",
            overflowY: "auto",
          }}
        >
          {/* Broken ribbon */}
          <div style={{ paddingTop: 64 }}>
            <div
              style={{
                background: "rgba(139,26,26,0.12)",
                border: "1px solid rgba(196,77,77,0.45)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--display-2)",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#e58a5c",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  flexShrink: 0,
                }}
              >
                —
              </span>
              <Mono style={{ color: "#e58a5c" }}>Liền · gián đoạn</Mono>
            </div>
          </div>

          {/* Ticket with restart content */}
          <Ticket holeColor="#1d3129">
            <div style={{ padding: "24px 22px 20px", textAlign: "center", position: "relative" }}>
              <span
                aria-hidden
                style={{
                  fontFamily: "var(--display-2)",
                  fontSize: 64,
                  color: "#7a7050",
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
                  fontFamily: "var(--display-2)",
                  fontWeight: 800,
                  fontSize: 22,
                  margin: "10px 0 4px",
                  letterSpacing: "-0.005em",
                  color: "#18150e",
                }}
              >
                Nhịp đã ngắt
              </h2>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 16,
                  color: "#5a4f30",
                  lineHeight: 1.55,
                  marginBottom: 16,
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
                <Mono style={{ color: "#7a7050" }}>Nhịp hiện tại · 0 ngày</Mono>
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
                  background: "var(--gold, #c5a55a)",
                  color: "#18150e",
                  border: "none",
                  padding: "14px 20px",
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                Bắt đầu lại · ngày 1 / 7
              </button>
            </div>
          </Ticket>
        </div>
      ) : null}
    </div>
  );
}
