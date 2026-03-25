import { useEffect, useState } from "react";
import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { useProfile } from "~/hooks/useProfile";

export default function AppTuanNay() {
  const { profile, loading: profileLoading } = useProfile();
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
        op: "weekly-summary",
        body: { ...q, intent: "MAC_DINH" },
      });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      setErr(null);
      setPayload(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileLoading, profile]);

  return (
    <div className="px-4 pb-8 space-y-6">
      <ScreenHeader title="Tuần này" />

      <div>
        <p className="text-sm text-muted-foreground">
          Gợi ý các ngày đáng chú ý trong tuần từ hồ sơ của bạn — bản xem thô; giao
          diện đầy đủ sẽ bổ sung sau.{" "}
          <a
            href="https://tu-tru-api.fly.dev/docs"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Tài liệu API
          </a>
        </p>
      </div>

      {!profileLoading && profile && !profile.ngay_sinh ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p className="text-muted-foreground">
            Thêm ngày sinh trong Cài đặt để xem gợi ý tuần này.
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to="/app/cai-dat">Mở Cài đặt</Link>
          </Button>
        </div>
      ) : null}

      {loading || profileLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : err ? (
        <ErrorBanner message={err} />
      ) : payload != null ? (
        <pre className="text-xs bg-card border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
