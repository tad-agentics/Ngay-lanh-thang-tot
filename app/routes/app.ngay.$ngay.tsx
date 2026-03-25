import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { CreditGate } from "~/components/CreditGate";
import { ErrorBanner } from "~/components/ErrorBanner";
import { GrainOverlay } from "~/components/GrainOverlay";
import { ScreenHeader } from "~/components/ScreenHeader";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Database } from "~/lib/database.types";
import { isoDateToDdMmYyyy } from "~/lib/tu-tru-dates";
import { useProfile } from "~/hooks/useProfile";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function DayDetailFetched({
  iso,
  profile,
}: {
  iso: string;
  profile: ProfileRow;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const q = profileToBatTuPersonQuery(profile);
    const dateDm = isoDateToDdMmYyyy(iso);
    if (!dateDm || !q.birth_date) {
      setLoading(false);
      setErr("Thiếu ngày dương lịch hoặc ngày sinh.");
      return;
    }
    setLoading(true);
    setErr(null);
    void (async () => {
      const res = await invokeBatTu({
        op: "day-detail",
        body: { ...q, date: dateDm },
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        setPayload(null);
        return;
      }
      setPayload(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [iso, profile]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Đang tải chi tiết…</p>;
  }
  if (err) {
    return <ErrorBanner message={err} />;
  }
  return (
    <pre className="text-xs bg-card border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

export default function AppNgayChiTiet() {
  const { ngay } = useParams();
  const { profile, loading } = useProfile();
  const iso = ngay && /^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngay : null;

  if (!iso) {
    return (
      <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-4">
        <ErrorBanner message="Đường dẫn ngày không hợp lệ (cần YYYY-MM-DD)." />
        <Link to="/app" className="text-sm text-primary underline">
          Về trang chủ app
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-background pb-10 max-w-lg mx-auto">
      <div className="relative overflow-hidden bg-surface text-surface-foreground px-4">
        <GrainOverlay />
        <div className="relative">
          <ScreenHeader title={`Chi tiết ngày ${iso}`} dark />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          <Link to="/app" className="underline-offset-4 hover:underline">
            ← Trang chủ app
          </Link>
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải hồ sơ…</p>
        ) : !profile?.ngay_sinh ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
            <p className="text-muted-foreground">Cần ngày sinh trong hồ sơ.</p>
            <Link
              to="/app/cai-dat"
              className="text-primary text-sm font-medium underline"
            >
              Mở Cài đặt
            </Link>
          </div>
        ) : (
          <CreditGate featureKey="day_detail">
            <DayDetailFetched iso={iso} profile={profile} />
          </CreditGate>
        )}
      </div>
    </main>
  );
}
