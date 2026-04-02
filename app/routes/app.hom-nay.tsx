import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { BestHourCard } from "~/components/home/BestHourCard";
import { TodaySummaryCard } from "~/components/home/TodaySummaryCard";
import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  parseNgayHomNayForHome,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import {
  readTodayAiReadingSession,
  todayAiReadingSessionKey,
  todayIsoInVn,
  writeTodayAiReadingSession,
} from "~/lib/today-reading-cache";
import { useProfile } from "~/hooks/useProfile";

export default function AppHomNay() {
  const { profile, loading: profileLoading } = useProfile();
  const { costs } = useFeatureCosts();
  const unlockReadingCost = costs.ai_reading_unlock?.credit_cost ?? 1;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [today, setToday] = useState<NgayHomNayHome | null>(null);
  const [todayAiReading, setTodayAiReading] = useState<string | null>(null);
  const [todayAiReadingLoading, setTodayAiReadingLoading] = useState(false);
  const [todayReadingSource, setTodayReadingSource] = useState<unknown>(null);
  const [todayReadingUnlocked, setTodayReadingUnlocked] = useState(false);
  const [unlockingTodayReading, setUnlockingTodayReading] = useState(false);

  useEffect(() => {
    if (profileLoading || !profile) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      setLoading(false);
      setErr(null);
      setToday(null);
      setTodayAiReading(null);
      setTodayAiReadingLoading(false);
      setTodayReadingSource(null);
      setTodayReadingUnlocked(false);
      setUnlockingTodayReading(false);
      return;
    }

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

    let cancelled = false;
    setLoading(true);
    setErr(null);
    setTodayAiReading(null);
    setTodayAiReadingLoading(false);
    setTodayReadingSource(null);
    setTodayReadingUnlocked(false);
    setUnlockingTodayReading(false);

    void (async () => {
      const res = await invokeBatTu({ op: "ngay-hom-nay", body: { ...q } });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        setToday(null);
        return;
      }
      setErr(null);
      const parsed = parseNgayHomNayForHome(res.data);
      setToday(parsed);
      if (!parsed) return;

      setTodayReadingSource(res.data);
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
          data: res.data,
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
    })();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile, profile?.ngay_sinh, profile?.gio_sinh, profile?.gioi_tinh]);

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

  const showSummary = !profileLoading && profile && profile.ngay_sinh;

  return (
    <div className="px-4 pb-8 space-y-6">
      <ScreenHeader title="Hôm nay" />

      <p className="text-sm text-muted-foreground">
        Tóm tắt ngày theo lá số của bạn (Bát Tự).{" "}
        <a
          href="https://tu-tru-api.fly.dev/docs"
          className="underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          Tài liệu API
        </a>
      </p>

      {!profileLoading && profile && !profile.ngay_sinh ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p className="text-muted-foreground">
            Cho biết ngày sinh trong Cài đặt — nên có thêm giờ và giới tính để Nhật
            Chủ khớp hơn.
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to="/app/cai-dat">Mở Cài đặt</Link>
          </Button>
        </div>
      ) : null}

      {loading || profileLoading ? (
        <div className="flex flex-col gap-2">
          <TodaySummaryCard
            dayType="neutral"
            lunarDate="—"
            solarDate="—"
            isLoading
            aiReading={null}
            aiReadingLoading={false}
          />
          <BestHourCard hourRange="—" isLoading />
        </div>
      ) : err ? (
        <ErrorBanner message={err} />
      ) : showSummary && today ? (
        <div className="flex flex-col gap-2">
          <TodaySummaryCard
            dayType={today.dayType}
            lunarDate={today.lunarLabel}
            solarDate={today.solarDateVi}
            aiReading={todayAiReading}
            aiReadingLoading={
              !loading && today != null ? todayAiReadingLoading : false
            }
            readingLocked={!loading && today != null && !todayReadingUnlocked}
            unlocking={unlockingTodayReading}
            unlockCost={unlockReadingCost}
            onUnlockReading={() => void onUnlockTodayReading()}
          />
          <BestHourCard hourRange={today.hourRange} />
        </div>
      ) : showSummary && !today ? (
        <p className="text-sm text-muted-foreground">
          Chưa đọc được dữ liệu Hôm nay. Thử lại sau vài giây.
        </p>
      ) : null}
    </div>
  );
}
