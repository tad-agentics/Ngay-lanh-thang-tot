import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { CreditGate } from "~/components/CreditGate";
import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { TuTruIntent } from "~/lib/api-types";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  addDaysIso,
  chonNgayInclusiveDaysToFeatureKey,
  inclusiveDaysBetweenIsoDates,
  isoDateToDdMmYyyy,
  localTodayIsoDate,
} from "~/lib/tu-tru-dates";
import { TU_TRU_INTENT_OPTIONS } from "~/lib/tu-tru-intents";
import { useProfile } from "~/hooks/useProfile";

export default function AppChonNgay() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [rangeStart, setRangeStart] = useState(() => localTodayIsoDate());
  const [rangeEnd, setRangeEnd] = useState(() => {
    const t = localTodayIsoDate();
    return addDaysIso(t, 29) ?? t;
  });
  const [intent, setIntent] = useState<TuTruIntent>("MAC_DINH");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const days = useMemo(
    () => inclusiveDaysBetweenIsoDates(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );
  const featureKey = useMemo(
    () =>
      days == null
        ? "chon_ngay_30"
        : chonNgayInclusiveDaysToFeatureKey(days),
    [days],
  );

  async function runLookup() {
    if (!profile?.ngay_sinh) {
      toast.error("Cần ngày sinh trong hồ sơ.");
      return;
    }
    const rs = isoDateToDdMmYyyy(rangeStart);
    const re = isoDateToDdMmYyyy(rangeEnd);
    if (!rs || !re || days == null) {
      toast.error("Khoảng ngày không hợp lệ (cần từ ngày ≤ đến ngày).");
      return;
    }
    setBusy(true);
    setErr(null);
    const base = profileToBatTuPersonQuery(profile);
    const res = await invokeBatTu({
      op: "chon-ngay",
      body: {
        ...base,
        intent,
        range_start: rs,
        range_end: re,
        top_n: 3,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setErr(null);
    const intentLabel =
      TU_TRU_INTENT_OPTIONS.find((o) => o.value === intent)?.label ?? intent;
    navigate("/app/chon-ngay/ket-qua", {
      state: {
        intent,
        intentLabel,
        rangeStart,
        rangeEnd,
        daysInclusive: days,
        payload: res.data,
      },
    });
  }

  return (
    <div className="px-4 pb-8">
      <ScreenHeader title="Chọn Ngày Tốt" showBack={false} className="pb-5" />

      <div className="flex flex-col gap-5">
      {!profileLoading && profile && !profile.ngay_sinh ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
          <p className="text-muted-foreground">
            Cần ngày sinh trong hồ sơ để chọn ngày Bát Tự.
          </p>
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to="/app/cai-dat">Mở Cài đặt</Link>
          </Button>
        </div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 space-y-4 text-sm">
        <div className="space-y-2">
          <Label htmlFor="chon-intent">Mục đích</Label>
          <Select
            value={intent}
            onValueChange={(v) => setIntent(v as TuTruIntent)}
            disabled={profileLoading || !profile}
          >
            <SelectTrigger id="chon-intent" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TU_TRU_INTENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="range-start">Từ ngày</Label>
            <Input
              id="range-start"
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              disabled={profileLoading || !profile}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="range-end">Đến ngày</Label>
            <Input
              id="range-end"
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              disabled={profileLoading || !profile}
            />
          </div>
        </div>
        {days != null ? (
          <p className="text-xs text-muted-foreground">
            Khoảng: <strong className="text-foreground">{days}</strong> ngày
            (tính cả hai đầu) — mức lượng:{" "}
            <strong className="text-foreground">{featureKey}</strong>
          </p>
        ) : (
          <p className="text-xs text-destructive">
            Chọn từ ngày ≤ đến ngày.
          </p>
        )}

        <CreditGate featureKey={featureKey}>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={
              busy || profileLoading || !profile?.ngay_sinh || days == null
            }
            onClick={() => void runLookup()}
          >
            {busy ? "Đang tra…" : "Tra cứu"}
          </Button>
        </CreditGate>
      </section>

      {err ? <ErrorBanner message={err} /> : null}
      </div>
    </div>
  );
}
