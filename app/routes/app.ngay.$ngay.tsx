import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Moon, Sun } from "lucide-react";

import { Chip } from "~/components/Chip";
import { CreditGate } from "~/components/CreditGate";
import { ErrorBanner } from "~/components/ErrorBanner";
import { GrainOverlay } from "~/components/GrainOverlay";
import { ScreenHeader } from "~/components/ScreenHeader";
import { extractDetailReasonLines } from "~/lib/chon-ngay-detail";
import {
  type DayDetailHeaderMeta,
  extractDayDetailHeaderMeta,
} from "~/lib/day-detail-header";
import {
  parseDayDetailForView,
  sortPurposeRowsForDisplay,
  type DayDetailPurposeVerdict,
} from "~/lib/day-detail-view";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Database } from "~/lib/database.types";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";

import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/utils";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function gradeChipColor(grade: string): "success" | "warning" | "danger" | "default" {
  const g = grade.toUpperCase();
  if (g === "A") return "success";
  if (g === "B") return "warning";
  if (g === "C" || g === "D" || g === "E" || g === "F") return "danger";
  return "default";
}

type BreakdownImpact = "thuan" | "can_luu_y" | "trung_tinh";

function breakdownImpact(type: string, points: number): BreakdownImpact {
  const t = type.toLowerCase();
  if (t.includes("bonus") || t.includes("cat")) return "thuan";
  if (t.includes("penalty") || t.includes("hung")) return "can_luu_y";
  if (points > 0) return "thuan";
  if (points < 0) return "can_luu_y";
  return "trung_tinh";
}

function breakdownImpactLabel(impact: BreakdownImpact): string {
  switch (impact) {
    case "thuan":
      return "Thuận";
    case "can_luu_y":
      return "Cần lưu ý";
    case "trung_tinh":
      return "Trung tính";
    default: {
      const _e: never = impact;
      return _e;
    }
  }
}

function breakdownImpactPillClass(impact: BreakdownImpact): string {
  switch (impact) {
    case "thuan":
      return "bg-success/15 text-success";
    case "can_luu_y":
      return "bg-destructive/12 text-destructive";
    case "trung_tinh":
      return "bg-muted text-muted-foreground";
    default: {
      const _e: never = impact;
      return _e;
    }
  }
}

function purposeVerdictLabel(v: DayDetailPurposeVerdict): string {
  switch (v) {
    case "nen_lam":
      return "Nên làm";
    case "khong_nen":
      return "Không nên";
    case "trung_lap":
      return "Cân nhắc";
    default: {
      const _x: never = v;
      return _x;
    }
  }
}

function purposeVerdictClass(v: DayDetailPurposeVerdict): string {
  switch (v) {
    case "nen_lam":
      return "bg-success/15 text-success";
    case "khong_nen":
      return "bg-destructive/12 text-destructive";
    case "trung_lap":
      return "bg-muted text-muted-foreground";
    default: {
      const _x: never = v;
      return _x;
    }
  }
}

function DayDetailFetched({
  iso,
  profile,
  onPayload,
}: {
  iso: string;
  profile: ProfileRow;
  onPayload?: (data: unknown | null) => void;
}) {
  const { costs } = useFeatureCosts();
  const [purposeExpanded, setPurposeExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    setPurposeExpanded(false);
  }, [iso]);

  useEffect(() => {
    let cancelled = false;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      setLoading(false);
      setErr("Thiếu ngày sinh trong hồ sơ.");
      onPayloadRef.current?.(null);
      return;
    }
    setLoading(true);
    setErr(null);
    onPayloadRef.current?.(null);
    void (async () => {
      const res = await invokeBatTu({
        op: "day-detail",
        body: { ...q, date: iso },
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

  const view = parseDayDetailForView(payload);
  const fallbackLines = extractDetailReasonLines(payload ?? {});

  if (!view && fallbackLines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Không có nội dung chi tiết cho ngày này.
      </p>
    );
  }

  const dayDetailCost = costs.day_detail;
  const showLuongCta =
    dayDetailCost &&
    !dayDetailCost.is_free &&
    dayDetailCost.credit_cost > 0;

  const purposeSorted =
    view != null ? sortPurposeRowsForDisplay(view.purposeRows) : [];
  const purposeVisible = purposeExpanded
    ? purposeSorted
    : purposeSorted.slice(0, 3);

  return (
    <div className="space-y-4">
      {view ? (
        <>
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <p className="text-xs text-muted-foreground">Trực</p>
            <h2 className="text-base font-semibold text-foreground leading-snug">
              {view.trucTitle}
            </h2>
            {view.trucDescription ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {view.trucDescription}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
            <div className="flex gap-3 items-start">
              <Sun
                className="shrink-0 text-success mt-0.5"
                size={20}
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Giờ tốt</p>
                <p className="text-sm font-medium text-success">{view.gioTot}</p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex gap-3 items-start">
              <Moon
                className="shrink-0 text-destructive mt-0.5"
                size={20}
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Giờ xấu</p>
                <p className="text-sm font-medium text-destructive">{view.gioXau}</p>
              </div>
            </div>
          </section>

          {view.catThanLabels.length > 0 || view.hungSatLabels.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <h2 className="text-base font-semibold text-foreground">Thần sát</h2>
              {view.catThanLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {view.catThanLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-success/15 text-success"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              {view.hungSatLabels.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Hung sát</p>
                  <div className="flex flex-wrap gap-2">
                    {view.hungSatLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-destructive/12 text-destructive"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {view.purposeRows.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground flex-1 min-w-[12rem]">
                  Mục đích trong ngày
                </h2>
                {view.grade && view.grade !== "—" ? (
                  <Chip color={gradeChipColor(view.grade)} variant="flat" size="sm">
                    Hạng {view.grade}
                  </Chip>
                ) : null}
              </div>
              <ul className="space-y-2.5">
                {purposeVisible.map((row, idx) => (
                  <li
                    key={`${row.label}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-foreground font-medium min-w-0 flex-1">
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                        purposeVerdictClass(row.verdict),
                      )}
                    >
                      {purposeVerdictLabel(row.verdict)}
                    </span>
                  </li>
                ))}
              </ul>
              {view.purposeRows.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setPurposeExpanded((e) => !e)}
                  className="block w-full text-left text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {purposeExpanded
                    ? "Thu gọn"
                    : `Xem đầy đủ ${view.purposeRows.length} mục đích`}
                </button>
              ) : null}
              {showLuongCta ? (
                <Button
                  asChild
                  className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/app/mua-luong">
                    +{dayDetailCost.credit_cost} lượng
                  </Link>
                </Button>
              ) : null}
            </section>
          ) : null}

          {view.avoidFor.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-2">Nên tránh</p>
              <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
                {view.avoidFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {view.breakdown.length > 0 ? (
            <details className="rounded-xl border border-border bg-card p-4 shadow-sm group">
              <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center justify-between gap-2">
                Luận theo từng yếu tố
                <span className="text-muted-foreground text-xs font-normal group-open:hidden">
                  Xem thêm
                </span>
                <span className="text-muted-foreground text-xs font-normal hidden group-open:inline">
                  Thu gọn
                </span>
              </summary>
              <ul className="mt-3 space-y-3 text-sm border-t border-border pt-3">
                {view.breakdown.map((row, i) => {
                  const impact = breakdownImpact(row.type, row.points);
                  return (
                    <li
                      key={`${row.source}-${i}`}
                      className="border-b border-border/60 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-foreground font-medium min-w-0 flex-1">
                          {row.source}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                            breakdownImpactPillClass(impact),
                          )}
                        >
                          {breakdownImpactLabel(impact)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm leading-snug mt-1.5">
                        {row.reasonVi}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <p
            className="text-xs text-muted-foreground uppercase tracking-wider mb-2"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            Nhận xét
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-sm text-foreground">
            {fallbackLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
      <div className="relative overflow-hidden bg-surface text-surface-foreground px-4 pt-3 pb-5">
        <GrainOverlay />
        <div className="relative">
          <ScreenHeader
            title={dayTitle}
            dark
            className="pt-2 pb-2"
            titleClassName="!text-primary"
          />
          {headerMeta?.subline || headerMeta?.chip ? (
            <div className="flex items-center justify-between gap-2 mt-1 pb-1">
              {headerMeta.subline ? (
                <p className="text-surface-foreground/70 text-xs min-w-0 flex-1 pr-2 leading-snug">
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
                  radius="pill"
                  className={cn(
                    "shrink-0 border-0",
                    headerMeta.chip.color === "success" &&
                      "bg-black/25 text-emerald-300",
                    headerMeta.chip.color === "danger" &&
                      "bg-black/25 text-red-300",
                    headerMeta.chip.color === "default" &&
                      "bg-black/20 text-surface-foreground/80",
                  )}
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
