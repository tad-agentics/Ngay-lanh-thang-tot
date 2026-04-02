import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { BestHourCard } from "~/components/home/BestHourCard";
import { CalendarGrid } from "~/components/home/CalendarGrid";
import { TodaySummaryCard } from "~/components/home/TodaySummaryCard";
import { WeeklyTeaserCard } from "~/components/home/WeeklyTeaserCard";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import {
  buildCalendarDaysForMonth,
  parseNgayHomNayForHome,
  parseWeeklyGoodDayCount,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  readTodayAiReadingSession,
  readTodayHomeSession,
  todayAiReadingSessionKey,
  todayIsoInVn,
  writeTodayAiReadingSession,
  writeTodayHomeSession,
} from "~/lib/today-reading-cache";

function monthYyyyMm(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function firstNameFromDisplay(displayName: string | null): string | null {
  if (!displayName?.trim()) return null;
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const last = parts.at(-1);
  return last ?? null;
}

export default function AppHome() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const { costs } = useFeatureCosts();
  const unlockReadingCost = costs.ai_reading_unlock?.credit_cost ?? 1;

  const now = new Date();
  const [calMonth, setCalMonth] = useState(() => now.getMonth() + 1);
  const [calYear, setCalYear] = useState(() => now.getFullYear());

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [calendarErr, setCalendarErr] = useState<string | null>(null);
  const [todayHome, setTodayHome] = useState<NgayHomNayHome | null>(null);
  const [todayAiReading, setTodayAiReading] = useState<string | null>(null);
  const [todayAiReadingLoading, setTodayAiReadingLoading] = useState(false);
  const [todayReadingSource, setTodayReadingSource] = useState<unknown>(null);
  const [todayReadingUnlocked, setTodayReadingUnlocked] = useState(false);
  const [unlockingTodayReading, setUnlockingTodayReading] = useState(false);
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [lichPayload, setLichPayload] = useState<unknown | null>(null);

  const q = profileToBatTuPersonQuery(profile);
  const canBatTu = Boolean(q.birth_date);
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;
  const displayName = firstNameFromDisplay(profile?.display_name ?? null);

  useEffect(() => {
    if (profileLoading || !profile) return;
    const todayIso = todayIsoInVn();
    try {
      localStorage.removeItem(
        `ngaytot_today_reading_unlock:${profile.id}:${todayIso}`,
      );
    } catch {
      /* legacy client-only unlock flag */
    }
    const sessionCachedReading = readTodayAiReadingSession(
      profile.id,
      todayIso,
    );
    const sessionCachedHome = readTodayHomeSession(profile.id, todayIso);

    if (!canBatTu) {
      setSummaryLoading(false);
      setSummaryErr(null);
      setTodayHome(null);
      setTodayAiReading(null);
      setTodayAiReadingLoading(false);
      setTodayReadingSource(null);
      setTodayReadingUnlocked(false);
      setUnlockingTodayReading(false);
      setWeeklyCount(null);
      return;
    }

    let cancelled = false;
    if (sessionCachedHome) {
      setTodayHome(sessionCachedHome);
      setSummaryLoading(false);
    } else {
      setTodayHome(null);
      setSummaryLoading(true);
    }
    setSummaryErr(null);
    if (sessionCachedReading) {
      setTodayAiReading(sessionCachedReading);
      setTodayAiReadingLoading(false);
    } else {
      setTodayAiReading(null);
      setTodayAiReadingLoading(false);
    }
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

      const errs: string[] = [];
      let parsedToday: NgayHomNayHome | null = null;
      if (nhn.ok) {
        parsedToday = parseNgayHomNayForHome(nhn.data);
        if (!parsedToday)
          errs.push("Không tải được kết quả Hôm nay lúc này. Thử lại sau vài giây.");
        else {
          setTodayReadingSource(nhn.data);
          const unlock = await invokeReadingUnlock({
            dry_run: true,
            scope: "home",
            day_iso: todayIso,
          });
          if (cancelled) return;
          const serverAllows = Boolean(
            unlock.ok &&
              (unlock.unlocked === true ||
                unlock.already_unlocked === true ||
                unlock.subscription_free === true),
          );
          setTodayReadingUnlocked(serverAllows);
          if (serverAllows) {
            const hadSessionCache = Boolean(sessionCachedReading);
            if (sessionCachedReading) {
              setTodayAiReading(sessionCachedReading);
            } else {
              setTodayAiReading(null);
            }
            if (!hadSessionCache) {
              setTodayAiReadingLoading(true);
            } else {
              setTodayAiReadingLoading(false);
            }
            void invokeGenerateReading({
              endpoint: "ngay-hom-nay",
              data: nhn.data,
            }).then((r) => {
              if (!cancelled) {
                const next = r.reading;
                if (next) {
                  setTodayAiReading(next);
                  writeTodayAiReadingSession(profile.id, todayIso, next);
                } else if (!hadSessionCache) {
                  setTodayAiReading(null);
                }
                setTodayAiReadingLoading(false);
              }
            });
          } else {
            try {
              sessionStorage.removeItem(
                todayAiReadingSessionKey(profile.id, todayIso),
              );
            } catch {
              /* ignore */
            }
            setTodayAiReading(null);
            setTodayAiReadingLoading(false);
          }
        }
      } else {
        errs.push(nhn.message);
      }

      let wCount: number | null = null;
      if (ws.ok) {
        wCount = parseWeeklyGoodDayCount(ws.data);
      } else {
        errs.push(ws.message);
      }

      setTodayHome(parsedToday ?? sessionCachedHome ?? null);
      if (parsedToday) {
        writeTodayHomeSession(profile.id, todayIso, parsedToday);
      }
      setWeeklyCount(wCount);
      setSummaryErr(errs.length ? errs.join(" ") : null);
      setSummaryLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    profileLoading,
    profile,
    canBatTu,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    profile?.gioi_tinh,
  ]);

  async function onUnlockTodayReading() {
    if (!todayReadingSource || unlockingTodayReading || !profile?.id) return;
    setUnlockingTodayReading(true);

    setTodayAiReadingLoading(true);
    const iso = todayIsoInVn();
    const unlock = await invokeReadingUnlock({
      scope: "home",
      day_iso: iso,
    });
    if (!unlock.ok) {
      toast.error(unlock.message);
      setTodayAiReadingLoading(false);
      setUnlockingTodayReading(false);
      return;
    }
    if (unlock.charged || unlock.subscription_free) {
      window.dispatchEvent(new CustomEvent("ngaytot:profile-refresh"));
    }
    const r = await invokeGenerateReading({
      endpoint: "ngay-hom-nay",
      data: todayReadingSource,
    });
    const next = r.reading;
    setTodayAiReading(next);
    setTodayAiReadingLoading(false);
    setTodayReadingUnlocked(true);
    setUnlockingTodayReading(false);
    if (next) {
      writeTodayAiReadingSession(profile.id, iso, next);
    }
    toast.success(
      unlock.charged
        ? "Đã mở khóa luận giải (đã trừ lượng)."
        : unlock.subscription_free
          ? "Đã mở khóa luận giải (gói đang hoạt động)."
          : "Đã mở khóa luận giải.",
    );
  }

  useEffect(() => {
    if (profileLoading || !profile) return;

    if (!canBatTu) {
      setCalendarLoading(false);
      setCalendarErr(null);
      setLichPayload(null);
      return;
    }

    let cancelled = false;
    setCalendarLoading(true);
    setCalendarErr(null);
    const month = monthYyyyMm(calYear, calMonth);

    void (async () => {
      const body = profileToBatTuPersonQuery(profile);
      const lt = await invokeBatTu<unknown>({
        op: "lich-thang",
        body: { ...body, month },
      });
      if (cancelled) return;
      if (lt.ok) {
        setLichPayload(lt.data);
        setCalendarErr(null);
      } else {
        setLichPayload(null);
        setCalendarErr(lt.message);
      }
      setCalendarLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    profileLoading,
    profile,
    canBatTu,
    calMonth,
    calYear,
    profile?.ngay_sinh,
    profile?.gio_sinh,
    profile?.gioi_tinh,
  ]);

  const handleMonthChange = (dir: "prev" | "next") => {
    if (dir === "prev") {
      if (calMonth === 1) {
        setCalMonth(12);
        setCalYear((y) => y - 1);
      } else {
        setCalMonth((m) => m - 1);
      }
    } else {
      if (calMonth === 12) {
        setCalMonth(1);
        setCalYear((y) => y + 1);
      } else {
        setCalMonth((m) => m + 1);
      }
    }
  };

  const calendarDays = buildCalendarDaysForMonth(calMonth, calYear, lichPayload);

  return (
    <div className="px-4 pb-4">
        <div className="flex items-center justify-between pt-5 pb-4 gap-3">
          <div className="min-w-0">
            <h1
              className="text-foreground leading-tight truncate"
              style={{
                fontFamily: "var(--font-lora)",
                fontWeight: 700,
                fontSize: "var(--text-xl)",
              }}
            >
              {displayName ?? "Ngày Lành Tháng Tốt"}
            </h1>
            {hasLaso && menh ? (
              <p className="text-muted-foreground text-xs mt-0.5">
                Mệnh <span className="text-foreground">{menh}</span>
              </p>
            ) : null}
          </div>

          <CreditsHeaderChip />
        </div>

        {summaryErr ? <ErrorBanner message={summaryErr} /> : null}
        {calendarErr ? <ErrorBanner message={calendarErr} /> : null}

        {!canBatTu ? (
          <div
            className="mb-3 rounded-xl border border-border bg-card px-4 py-4 text-sm space-y-3"
          >
            <p className="text-muted-foreground leading-relaxed">
              Lá số Bát Tự chưa có. Lập ngay để xem lịch Hôm nay, tuần này và tháng này theo đúng
              mệnh và Dụng Thần của bạn — không phải kết quả chung.
            </p>
            <Button asChild variant="forest" className="w-full sm:w-auto">
              <Link to="/app/la-so">Lập lá số ngay</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            <TodaySummaryCard
              dayType={todayHome?.dayType ?? "neutral"}
              lunarDate={todayHome?.lunarLabel ?? "—"}
              solarDate={todayHome?.solarDateVi ?? "—"}
              isLoading={summaryLoading}
              aiReading={todayAiReading}
              aiReadingLoading={
                !summaryLoading && todayHome != null ? todayAiReadingLoading : false
              }
              readingLocked={!summaryLoading && todayHome != null && !todayReadingUnlocked}
              unlocking={unlockingTodayReading}
              unlockCost={unlockReadingCost}
              onUnlockReading={() => void onUnlockTodayReading()}
            />
            <BestHourCard
              hourRange={todayHome?.hourRange ?? "—"}
              isLoading={summaryLoading}
            />
          </div>
        )}

        <div className="mb-3">
          <WeeklyTeaserCard
            goodDayCount={weeklyCount}
            hasLaso={hasLaso}
            menh={menh}
            isLoading={profileLoading || (canBatTu && summaryLoading)}
          />
        </div>

        {calendarLoading ? (
          <p className="text-xs text-muted-foreground mb-2">Đang tải lịch tháng…</p>
        ) : null}
        <CalendarGrid
          month={calMonth}
          year={calYear}
          days={calendarDays}
          onDayTap={(iso) => void navigate(`/app/ngay/${iso}`)}
          onMonthChange={handleMonthChange}
        />
    </div>
  );
}
