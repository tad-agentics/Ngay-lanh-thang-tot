/**
 * /app/thang — Tab 2 · Tháng calendar.
 * Segmented control: Tháng (month grid) | Tuần (week list).
 * Absorbs both /app/lich-thang and /app/tuan-nay.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Chip } from "~/components/Chip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  parseWeeklySummaryForScreen,
  type WeeklySummaryScreen,
} from "~/lib/home-bat-tu";
import { useProfile } from "~/hooks/useProfile";

type View = "thang" | "tuan";

function gradeColor(grade: string): "success" | "warning" | "danger" | "default" {
  const g = grade.toUpperCase();
  if (g === "A") return "success";
  if (g === "B") return "warning";
  if (g === "C" || g === "D" || g === "E" || g === "F") return "danger";
  return "default";
}

function currentMonthYyyyMm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function MonthView({ profile, profileLoading }: { profile: ReturnType<typeof useProfile>["profile"]; profileLoading: boolean }) {
  const [month, setMonth] = useState(() => currentMonthYyyyMm());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    if (profileLoading) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const res = await invokeBatTu({ op: "lich-thang", body: { ...q, month } });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) { setErr(res.message); return; }
      setErr(null);
      setPayload(res.data);
    })();
    return () => { cancelled = true; };
  }, [profileLoading, profile, month]);

  const prevMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const [y, m] = month.split("-").map(Number);
  const monthLabel = `Tháng ${m} · ${y}`;

  if (!profileLoading && profile && !profile.ngay_sinh) {
    return (
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Thêm ngày sinh để xem lịch cá nhân hoá.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link to="/app/toi">Mở hồ sơ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Month nav */}
      <div
        className="flex items-center justify-between gap-2 px-5"
        style={{ minHeight: 44 }}
      >
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Tháng trước"
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, color: "var(--gold-deep, #7d6219)" }}
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
        <span
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 700,
            fontSize: 15,
            textTransform: "uppercase",
            letterSpacing: "-0.005em",
            color: "var(--ink, #1a1a1a)",
          }}
        >
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Tháng sau"
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, color: "var(--gold-deep, #7d6219)" }}
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>

      {loading || profileLoading ? (
        <div className="px-5 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : err ? (
        <div className="px-5"><ErrorBanner message={err} /></div>
      ) : payload != null ? (
        <div className="px-5">
          <pre className="text-xs bg-card border border-border p-4 overflow-x-auto whitespace-pre-wrap break-words" style={{ fontSize: 11 }}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="px-5 text-sm text-muted-foreground">Chưa có dữ liệu tháng này.</p>
      )}
    </div>
  );
}

function WeekView({ profile, profileLoading }: { profile: ReturnType<typeof useProfile>["profile"]; profileLoading: boolean }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummaryScreen | null>(null);

  useEffect(() => {
    if (profileLoading) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const res = await invokeBatTu({ op: "weekly-summary", body: { ...q, intent: "MAC_DINH" } });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) { setErr(res.message); return; }
      setErr(null);
      setWeekly(parseWeeklySummaryForScreen(res.data));
    })();
    return () => { cancelled = true; };
  }, [profileLoading, profile]);

  if (!profileLoading && profile && !profile.ngay_sinh) {
    return (
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Thêm ngày sinh để xem gợi ý tuần này.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link to="/app/toi">Mở hồ sơ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5">
      {weekly?.weekRangeLabel ? (
        <Mono style={{ color: "var(--gold-deep, #7d6219)", display: "block" }} size={12}>
          {weekly.weekRangeLabel}
        </Mono>
      ) : null}

      {loading || profileLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : err ? (
        <ErrorBanner message={err} />
      ) : weekly?.rows.length ? (
        <div className="space-y-2">
          {weekly.rows.map((row) => (
            <Link
              key={row.isoDate}
              to={`/app/ngay/${row.isoDate}`}
              className="block border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: "var(--mono)" }}>
                    {row.dateLabelVi}
                  </p>
                  <p className="text-sm text-foreground line-clamp-3 leading-snug">
                    {row.oneLiner}
                  </p>
                  {row.bestHours !== "—" ? (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                      Giờ tốt: {row.bestHours}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Chip color={gradeColor(row.grade)} variant="flat" size="sm" radius="sm">
                    {row.grade}
                  </Chip>
                  <ChevronRight size={16} className="text-muted-foreground" strokeWidth={1.5} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có gợi ý cho tuần này.
        </p>
      )}
    </div>
  );
}

export default function AppThang() {
  const { profile, loading: profileLoading } = useProfile();
  const [view, setView] = useState<View>("thang");

  return (
    <div
      className="pb-8"
      style={{ background: "var(--paper, #f0ece2)", minHeight: "100%" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-2"
        style={{ borderBottom: "1px solid rgba(154,124,34,0.18)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 16,
                textTransform: "uppercase",
                letterSpacing: "-0.005em",
                color: "var(--ink, #1a1a1a)",
                lineHeight: 1.1,
              }}
            >
              Tháng
            </h1>
            <Mono style={{ color: "#7a7050", marginTop: 2, display: "block" }} size={12}>
              Lịch · ngày nổi bật · cá nhân hoá
            </Mono>
          </div>
        </div>

        {/* Segmented control */}
        <div
          className="flex mt-3"
          style={{
            background: "rgba(154,124,34,0.08)",
            border: "1px solid rgba(154,124,34,0.2)",
            padding: 3,
          }}
        >
          {(["thang", "tuan"] as const).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: active ? "var(--paper-warm, #ebe4d2)" : "transparent",
                  color: active ? "var(--ink, #1a1a1a)" : "#7a7050",
                  border: active ? "1px solid rgba(154,124,34,0.3)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.15s ease, color 0.15s ease",
                  minHeight: 44,
                }}
              >
                {v === "thang" ? "Tháng" : "Tuần"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="pt-4">
        {view === "thang" ? (
          <MonthView profile={profile} profileLoading={profileLoading} />
        ) : (
          <WeekView profile={profile} profileLoading={profileLoading} />
        )}
      </div>
    </div>
  );
}
