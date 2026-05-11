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
import { LogoMark, Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import {
  buildCalendarDaysForMonth,
  parseWeeklySummaryForScreen,
  type WeeklySummaryScreen,
} from "~/lib/home-bat-tu";
import { HM } from "~/lib/maket-tokens";
import type { CalendarDay } from "~/lib/api-types";
import { useProfile } from "~/hooks/useProfile";

const WEEKDAY_SHORT_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

function dayCellSurface(day: CalendarDay): { bg: string; border: string } {
  if (day.dayType === "hoang-dao") {
    return {
      bg: "rgba(111, 168, 120, 0.14)",
      border: "rgba(111, 168, 120, 0.35)",
    };
  }
  if (day.dayType === "hac-dao") {
    return {
      bg: "rgba(197, 122, 90, 0.12)",
      border: "rgba(197, 122, 90, 0.38)",
    };
  }
  return { bg: "#fff", border: HM.borderCard };
}

function MonthCalendarGrid({ days, year, month }: { days: CalendarDay[]; year: number; month: number }) {
  const lead = new Date(year, month - 1, 1).getDay();
  const cells: (CalendarDay | null)[] = [...Array(lead).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {WEEKDAY_SHORT_VI.map((w) => (
          <div
            key={w}
            style={{
              fontFamily: HM.mono,
              fontSize: 12,
              fontWeight: 600,
              textAlign: "center",
              color: HM.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "4px 0",
            }}
          >
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {row.map((day, ci) => {
              if (!day) {
                return <div key={`e-${ri}-${ci}`} style={{ minHeight: 48 }} />;
              }
              const solar = Number(day.isoDate.slice(8, 10));
              const surf = dayCellSurface(day);
              const todayStyle = day.isToday ? { boxShadow: `0 0 0 2px ${HM.goldDeep}` } : {};

              return (
                <Link
                  key={day.isoDate}
                  to={`/app/ngay/${day.isoDate}`}
                  style={{
                    minHeight: 48,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    textDecoration: "none",
                    background: surf.bg,
                    border: `1px solid ${surf.border}`,
                    borderRadius: HM.radM,
                    padding: "4px 2px",
                    ...todayStyle,
                  }}
                >
                  <span
                    style={{
                      fontFamily: HM.display,
                      fontWeight: 800,
                      fontSize: 15,
                      lineHeight: 1,
                      color: HM.ink,
                    }}
                  >
                    {solar}
                  </span>
                  {day.lunarDay > 0 ? (
                    <span
                      style={{
                        fontFamily: HM.mono,
                        fontSize: 10,
                        color: HM.muted,
                        lineHeight: 1,
                      }}
                    >
                      Âm {day.lunarDay}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 border border-border bg-card animate-pulse rounded-[10px]" />
          ))}
        </div>
      ) : err ? (
        <div className="px-5"><ErrorBanner message={err} /></div>
      ) : payload != null ? (
        <div className="px-5 pb-2">
          <MonthCalendarGrid
            days={buildCalendarDaysForMonth(m, y, payload)}
            year={y}
            month={m}
          />
          <Mono style={{ color: HM.muted, display: "block", marginTop: 12, textAlign: "center" }} size={12}>
            Chạm ô để mở chi tiết ngày · màu theo Hoàng / Hắc đạo
          </Mono>
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
      style={{ background: HM.paper, minHeight: "100%" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-2"
        style={{ borderBottom: `1px solid ${HM.borderSection}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <LogoMark size={26} className="shrink-0 mt-0.5" />
            <div className="min-w-0">
            <h1
              style={{
                fontFamily: HM.display,
                fontWeight: 800,
                fontSize: 16,
                textTransform: "uppercase",
                letterSpacing: "-0.005em",
                color: HM.ink,
                lineHeight: 1.1,
              }}
            >
              Tháng
            </h1>
            <Mono style={{ color: HM.muted, marginTop: 2, display: "block" }} size={12}>
              Lịch · ngày nổi bật · cá nhân hoá
            </Mono>
            </div>
          </div>
        </div>

        {/* Segmented control */}
        <div
          className="flex mt-3"
          style={{
            background: "rgba(154,124,34,0.08)",
            border: `1px solid ${HM.borderSection}`,
            padding: 3,
            borderRadius: HM.radM,
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
                  fontFamily: HM.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: active ? HM.cream : "transparent",
                  color: active ? HM.ink : HM.muted,
                  border: active ? `1px solid ${HM.borderChip}` : "1px solid transparent",
                  borderRadius: 8,
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
