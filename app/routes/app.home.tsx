import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coins } from "lucide-react";

import { BestHourCard } from "~/components/home/BestHourCard";
import { CalendarGrid } from "~/components/home/CalendarGrid";
import { TodaySummaryCard } from "~/components/home/TodaySummaryCard";
import { WeeklyTeaserCard } from "~/components/home/WeeklyTeaserCard";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  buildCalendarDaysForMonth,
  parseNgayHomNayForHome,
  parseWeeklyGoodDayCount,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";

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

  const now = new Date();
  const [calMonth, setCalMonth] = useState(() => now.getMonth() + 1);
  const [calYear, setCalYear] = useState(() => now.getFullYear());

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [calendarErr, setCalendarErr] = useState<string | null>(null);
  const [todayHome, setTodayHome] = useState<NgayHomNayHome | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [lichPayload, setLichPayload] = useState<unknown | null>(null);

  const q = profileToBatTuPersonQuery(profile);
  const canBatTu = Boolean(q.birth_date);
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const menh = profile ? laSoJsonToRevealProps(profile.la_so)?.menh ?? null : null;
  const displayName = firstNameFromDisplay(profile?.display_name ?? null);

  useEffect(() => {
    if (profileLoading || !profile) return;

    if (!canBatTu) {
      setSummaryLoading(false);
      setSummaryErr(null);
      setTodayHome(null);
      setWeeklyCount(null);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    setSummaryErr(null);

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
      } else {
        errs.push(nhn.message);
      }

      let wCount: number | null = null;
      if (ws.ok) {
        wCount = parseWeeklyGoodDayCount(ws.data);
      } else {
        errs.push(ws.message);
      }

      setTodayHome(parsedToday);
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

          <button
            type="button"
            onClick={() => void navigate("/app/mua-luong")}
            className="flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-foreground shrink-0"
            style={{ borderRadius: "var(--radius-pill)", minHeight: 36 }}
          >
            <Coins size={13} className="text-accent" strokeWidth={1.5} />
            <span
              style={{
                fontFamily: "var(--font-ibm-mono)",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {profile?.credits_balance ?? 0} lượng
            </span>
          </button>
        </div>

        {summaryErr ? <ErrorBanner message={summaryErr} /> : null}
        {calendarErr ? <ErrorBanner message={calendarErr} /> : null}

        {!canBatTu ? (
          <div
            className="mb-3 rounded-xl border border-border bg-card px-4 py-4 text-sm space-y-3"
          >
            <p className="text-muted-foreground leading-relaxed">
              Thêm ngày sinh (và nên có giờ sinh / giới tính) trong Cài đặt để xem Hôm nay,
              tuần này và lịch tháng theo Bát Tự.
            </p>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link to="/app/cai-dat">Mở Cài đặt</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            <TodaySummaryCard
              dayType={todayHome?.dayType ?? "neutral"}
              lunarDate={todayHome?.lunarLabel ?? "—"}
              solarDate={todayHome?.solarDateVi ?? "—"}
              isLoading={summaryLoading}
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
