import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import { Chip } from "~/components/Chip";
import { CreditGate } from "~/components/CreditGate";
import { ErrorBanner } from "~/components/ErrorBanner";
import { GrainOverlay } from "~/components/GrainOverlay";
import { ScreenHeader } from "~/components/ScreenHeader";
import {
  type DayDetailHeaderMeta,
  extractDayDetailHeaderMeta,
} from "~/lib/day-detail-header";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Database } from "~/lib/database.types";
import { formatIsoDateLichHeader, isoDateToDdMmYyyy } from "~/lib/tu-tru-dates";
import { useProfile } from "~/hooks/useProfile";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function DayDetailFetched({
  iso,
  profile,
  onPayload,
}: {
  iso: string;
  profile: ProfileRow;
  onPayload?: (data: unknown | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    let cancelled = false;
    const q = profileToBatTuPersonQuery(profile);
    const dateDm = isoDateToDdMmYyyy(iso);
    if (!dateDm || !q.birth_date) {
      setLoading(false);
      setErr("Thiếu ngày dương lịch hoặc ngày sinh.");
      onPayloadRef.current?.(null);
      return;
    }
    setLoading(true);
    setErr(null);
    onPayloadRef.current?.(null);
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
        onPayloadRef.current?.(null);
        return;
      }
      setPayload(res.data);
      onPayloadRef.current?.(res.data);
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
  const [headerMeta, setHeaderMeta] = useState<DayDetailHeaderMeta | null>(
    null,
  );

  useEffect(() => {
    setHeaderMeta(null);
  }, [iso]);

  if (!iso) {
    return (
      <div className="px-4 pb-8 pt-6 space-y-4">
        <ErrorBanner message="Đường dẫn ngày không hợp lệ (cần YYYY-MM-DD)." />
        <Link to="/app" className="text-sm text-primary underline">
          Về trang chủ app
        </Link>
      </div>
    );
  }

  const dayTitle = formatIsoDateLichHeader(iso);

  return (
    <div className="pb-8">
      <div className="relative overflow-hidden bg-surface text-surface-foreground px-4 pt-5 pb-5">
        <GrainOverlay />
        <div className="relative">
          <ScreenHeader title={dayTitle} dark className="pb-2" />
          {headerMeta?.subline || headerMeta?.chip ? (
            <div className="flex items-center justify-between gap-2 mt-1">
              {headerMeta.subline ? (
                <p
                  className="text-surface-foreground/60 text-xs min-w-0 flex-1 pr-2"
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  {headerMeta.subline}
                </p>
              ) : (
                <span className="flex-1 min-w-0" />
              )}
              {headerMeta.chip ? (
                <Chip
                  color={headerMeta.chip.color}
                  variant="flat"
                  size="sm"
                  radius="sm"
                  className="shrink-0"
                >
                  {headerMeta.chip.label}
                </Chip>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
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
            <DayDetailFetched
              iso={iso}
              profile={profile}
              onPayload={(data) =>
                setHeaderMeta(
                  data == null ? null : extractDayDetailHeaderMeta(data),
                )
              }
            />
          </CreditGate>
        )}
      </div>
    </div>
  );
}
