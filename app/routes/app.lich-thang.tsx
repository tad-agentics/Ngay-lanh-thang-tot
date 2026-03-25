import { useEffect, useState } from "react";
import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { useProfile } from "~/hooks/useProfile";

function currentMonthYyyyMm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AppLichThang() {
  const { profile, loading: profileLoading } = useProfile();
  const [month, setMonth] = useState(() => currentMonthYyyyMm());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    if (profileLoading) return;

    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      setLoading(false);
      setErr(null);
      setPayload(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      const res = await invokeBatTu({
        op: "lich-thang",
        body: { ...q, month },
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        setPayload(null);
        return;
      }
      setErr(null);
      setPayload(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile, month]);

  return (
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link to="/app" className="underline-offset-4 hover:underline">
            ← Trang chủ app
          </Link>
        </p>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
          Lịch tháng
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          GET /v1/lich-thang — tổng quan tháng (miễn phí).
        </p>
      </div>

      {!profileLoading && profile && !profile.ngay_sinh ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p className="text-muted-foreground">
            Cần ngày sinh trong hồ sơ.
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to="/app/cai-dat">Mở Cài đặt</Link>
          </Button>
        </div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
        <div className="space-y-2">
          <Label htmlFor="lich-month">Tháng (YYYY-MM)</Label>
          <Input
            id="lich-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            disabled={profileLoading || !profile?.ngay_sinh}
          />
        </div>
      </section>

      {loading || profileLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : err ? (
        <ErrorBanner message={err} />
      ) : payload != null ? (
        <pre className="text-xs bg-card border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
