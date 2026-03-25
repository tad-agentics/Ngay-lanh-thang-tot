import { useEffect, useState } from "react";
import { Link } from "react-router";

import { BestHourCard } from "~/components/home/BestHourCard";
import { TodaySummaryCard } from "~/components/home/TodaySummaryCard";
import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  parseNgayHomNayForHome,
  type NgayHomNayHome,
} from "~/lib/home-bat-tu";
import { useProfile } from "~/hooks/useProfile";

export default function AppHomNay() {
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [today, setToday] = useState<NgayHomNayHome | null>(null);

  useEffect(() => {
    if (profileLoading) return;

    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      setLoading(false);
      setErr(null);
      setToday(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
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
      setToday(parseNgayHomNayForHome(res.data));
    })();
    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile]);

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
