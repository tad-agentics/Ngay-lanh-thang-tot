import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

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
import { parseDayDetailForView } from "~/lib/day-detail-view";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import type { Database } from "~/lib/database.types";
import { formatIsoDateLichHeader } from "~/lib/tu-tru-dates";
import { useProfile } from "~/hooks/useProfile";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function gradeChipColor(grade: string): "success" | "warning" | "danger" | "default" {
  const g = grade.toUpperCase();
  if (g === "A") return "success";
  if (g === "B") return "warning";
  if (g === "C" || g === "D" || g === "E" || g === "F") return "danger";
  return "default";
}

function breakdownTone(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("bonus") || t.includes("cat")) return "text-success";
  if (t.includes("penalty") || t.includes("hung")) return "text-danger";
  return "text-muted-foreground";
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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

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

  const reasons = view?.reasonLines?.length ? view.reasonLines : fallbackLines;

  return (
    <div className="space-y-4">
      {view ? (
        <>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {view.score != null ? (
                <span
                  className="text-lg font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-lora)" }}
                >
                  Điểm {view.score}
                </span>
              ) : null}
              {view.grade && view.grade !== "—" ? (
                <Chip
                  color={gradeChipColor(view.grade)}
                  variant="flat"
                  size="sm"
                  radius="sm"
                >
                  Hạng {view.grade}
                </Chip>
              ) : null}
            </div>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Âm lịch
                </dt>
                <dd className="text-foreground mt-0.5">{view.lunarDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Can Chi
                </dt>
                <dd className="text-foreground mt-0.5">{view.canChi}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Trực · Sao
                </dt>
                <dd className="text-foreground mt-0.5">
                  {view.trucLine}
                  {view.starLine && view.starLine !== "—" ? ` · ${view.starLine}` : ""}
                </dd>
              </div>
            </dl>
          </div>

          {reasons.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p
                className="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Nhận xét
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-sm text-foreground">
                {reasons.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.goodFor.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p
                className="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Nên làm
              </p>
              <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
                {view.goodFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.avoidFor.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p
                className="text-xs text-muted-foreground uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Nên tránh
              </p>
              <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
                {view.avoidFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <p
                className="text-xs text-muted-foreground uppercase tracking-wider mb-1"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Giờ Hoàng đạo
              </p>
              <p className="text-sm text-foreground">{view.gioTot}</p>
            </div>
            <div>
              <p
                className="text-xs text-muted-foreground uppercase tracking-wider mb-1"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Giờ Hắc đạo
              </p>
              <p className="text-sm text-foreground">{view.gioXau}</p>
            </div>
          </div>

          {view.breakdown.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p
                className="text-xs text-muted-foreground uppercase tracking-wider mb-3"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Chi tiết điểm
              </p>
              <ul className="space-y-2 text-sm">
                {view.breakdown.map((row, i) => (
                  <li
                    key={`${row.source}-${i}`}
                    className="flex flex-col gap-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-foreground font-medium">{row.source}</span>
                    <span className={`font-mono text-xs ${breakdownTone(row.type)}`}>
                      {row.points > 0 ? "+" : ""}
                      {row.points}
                    </span>
                    <span className="text-muted-foreground text-xs leading-snug">
                      {row.reasonVi}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
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
