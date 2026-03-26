import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { CreditGate } from "~/components/CreditGate";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
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
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";

import { cn } from "~/components/ui/utils";

const RANGE_PRESETS = [30, 60, 90] as const;
type RangePreset = (typeof RANGE_PRESETS)[number];

/** Không hiển thị «Mặc định» — người dùng phải chọn sự kiện cụ thể. */
const CHON_NGAY_INTENT_OPTIONS = TU_TRU_INTENT_OPTIONS.filter(
  (o) => o.value !== "MAC_DINH",
);

/** Giá trị Select luôn là chuỗi — tránh `undefined` làm Radix chuyển uncontrolled. */
const INTENT_UNSET = "__unset__";

export default function AppChonNgay() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, refresh: refreshProfile } =
    useProfile();
  const { costs } = useFeatureCosts();
  const [rangePreset, setRangePreset] = useState<RangePreset>(30);
  const [intent, setIntent] = useState<TuTruIntent | "">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rangeStart = useMemo(() => localTodayIsoDate(), []);
  const rangeEnd = useMemo(() => {
    const end = addDaysIso(rangeStart, rangePreset - 1);
    return end ?? rangeStart;
  }, [rangeStart, rangePreset]);

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

  const costRow = costs[featureKey];
  const creditHint = costRow
    ? costRow.is_free || costRow.credit_cost <= 0
      ? "Không trừ lượng"
      : `${costRow.credit_cost} lượng`
    : null;

  async function runLookup() {
    if (!profile?.ngay_sinh) {
      toast.error("Cần ngày sinh trong hồ sơ.");
      return;
    }
    if (!intent || intent === "MAC_DINH") {
      toast.error("Chọn loại sự kiện.");
      return;
    }
    const rs = isoDateToDdMmYyyy(rangeStart);
    const re = isoDateToDdMmYyyy(rangeEnd);
    if (!rs || !re || days == null) {
      toast.error("Khoảng ngày không hợp lệ.");
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
    await refreshProfile();
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

  const disabledForm = profileLoading || !profile;
  const intentSelectValue =
    intent && intent !== "MAC_DINH" ? intent : INTENT_UNSET;

  return (
    <div className="min-h-[60vh] bg-background pb-8">
      <div className="px-4 pt-6 pb-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-[family-name:var(--font-lora)] min-w-0 flex-1">
          Chọn Ngày Tốt
        </h1>
        <CreditsHeaderChip className="mt-1" />
      </div>

      <div className="px-4 flex flex-col gap-6">
        {!profileLoading && profile && !profile.ngay_sinh ? (
          <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 text-sm space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              Thêm ngày sinh trong Cài đặt để tra chọn ngày theo Bát Tự.
            </p>
            <Button asChild variant="secondary" className="w-full font-medium">
              <Link to="/app/cai-dat">Mở Cài đặt</Link>
            </Button>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label
            htmlFor="chon-su-kien"
            className="text-sm font-medium text-foreground"
          >
            Sự kiện
          </Label>
          <Select
            value={intentSelectValue}
            onValueChange={(v) =>
              setIntent(v === INTENT_UNSET ? "" : (v as TuTruIntent))
            }
            disabled={disabledForm}
          >
            <SelectTrigger
              id="chon-su-kien"
              className="w-full min-h-12 rounded-[var(--radius-md)] border-border bg-card text-foreground shadow-none h-auto py-3"
            >
              <SelectValue placeholder="Chọn loại sự kiện…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INTENT_UNSET}>
                Chọn loại sự kiện…
              </SelectItem>
              {CHON_NGAY_INTENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Khoảng thời gian
          </Label>
          <div
            className="flex rounded-[var(--radius-md)] border border-border bg-card p-1 gap-0"
            role="group"
            aria-label="Độ dài khoảng quét ngày"
          >
            {RANGE_PRESETS.map((preset, idx) => {
              const selected = rangePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabledForm}
                  aria-pressed={selected}
                  onClick={() => setRangePreset(preset)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium transition-colors rounded-[calc(var(--radius-md)-2px)] border-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    idx < RANGE_PRESETS.length - 1 &&
                      "border-r border-border/80",
                    selected
                      ? "bg-forest text-forest-foreground shadow-sm"
                      : "bg-transparent text-foreground hover:bg-muted/60",
                  )}
                >
                  {preset} ngày
                </button>
              );
            })}
          </div>
          {days != null && creditHint ? (
            <p className="text-xs text-muted-foreground pt-1">
              Từ hôm nay · {days} ngày · {creditHint}
            </p>
          ) : null}
        </div>

        <CreditGate featureKey={featureKey}>
          <Button
            type="button"
            variant="default"
            className="w-full min-h-12 rounded-[var(--radius-md)] font-semibold shadow-sm"
            disabled={
              busy || profileLoading || !profile?.ngay_sinh || days == null
            }
            onClick={() => void runLookup()}
          >
            {busy ? "Đang tra…" : "Tìm ngày phù hợp"}
          </Button>
        </CreditGate>

        {err ? <ErrorBanner message={err} /> : null}
      </div>
    </div>
  );
}
