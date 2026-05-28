import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { CTopStrip } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichRecomputeSkeleton } from "~/components/direction-c/CLichRecomputeSkeleton";
import { CLichSegmentedNav } from "~/components/direction-c/CLichSegmentedNav";
import { useLaSoRecomputeGate } from "~/hooks/useLaSoRecomputeGate";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { buildCalendarDaysForMonth, formatLichThangMonthKey } from "~/lib/home-bat-tu";
import type { CalendarDay } from "~/lib/api-types";
import { CT } from "~/lib/c-tokens";
import { scoreDotColor, scoreFromDayType } from "~/lib/c-score";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { todayIsoInVn } from "~/lib/today-reading-cache";

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

function MonthGrid({
  year,
  month,
  days,
  todayIso,
}: {
  year: number;
  month: number;
  days: CalendarDay[];
  todayIso: string;
}) {
  const startDay = new Date(year, month - 1, 1).getDay();
  const mondayFirst = (startDay + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  type Cell = {
    d: number;
    otherMonth: boolean;
    score?: number;
    iso?: string;
    lunarDay?: number;
  };

  const cells: Cell[] = [];
  for (let i = prevMonthDays - mondayFirst + 1; i <= prevMonthDays; i++) {
    cells.push({ d: i, otherMonth: true });
  }
  for (const day of days) {
    const solar = Number(day.isoDate.slice(8, 10));
    cells.push({
      d: solar,
      otherMonth: false,
      score:
        day.score != null && Number.isFinite(day.score)
          ? day.score
          : scoreFromDayType(day.dayType),
      iso: day.isoDate,
      lunarDay: day.lunarDay > 0 ? day.lunarDay : undefined,
    });
  }
  let j = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ d: j++, otherMonth: true });
    if (cells.length >= 42) break;
  }

  return (
    <>
      <div
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {WEEKDAY_SHORT.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: i === 6 ? CT.red : CT.muted,
              letterSpacing: "0.08em",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}
      >
        {cells.map((c, i) => {
          const isToday =
            c.iso === todayIso ||
            (c.d === Number(todayIso.slice(8, 10)) &&
              !c.otherMonth &&
              month === Number(todayIso.slice(5, 7)));
          const lunarDay = c.otherMonth ? null : c.lunarDay ?? null;
          const inner = (
            <div
              style={{
                aspectRatio: "1 / 1",
                padding: "5px 0 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                cursor: c.otherMonth || !c.iso ? "default" : "pointer",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: isToday ? CT.forest : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: isToday ? 800 : 600,
                    fontSize: 14,
                    color: isToday
                      ? CT.cream
                      : c.otherMonth
                        ? "rgba(154,124,34,0.3)"
                        : CT.ink,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c.d}
                </span>
              </div>
              <div
                style={{
                  marginTop: 3,
                  height: 11,
                  lineHeight: 1,
                  fontFamily: "var(--serif)",
                  fontSize: 9,
                  color: c.otherMonth ? "transparent" : "rgba(24,21,14,0.42)",
                }}
              >
                {c.otherMonth ? "·" : lunarDay ?? "·"}
              </div>
              {!c.otherMonth && c.score != null ? (
                <span
                  style={{
                    position: "absolute",
                    bottom: 6,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: scoreDotColor(c.score),
                  }}
                />
              ) : null}
            </div>
          );
          if (c.iso && !c.otherMonth) {
            return (
              <Link key={i} to={`/ngay/${c.iso}`} style={{ textDecoration: "none" }}>
                {inner}
              </Link>
            );
          }
          return <div key={i}>{inner}</div>;
        })}
      </div>
    </>
  );
}

export function CMonthScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const { pending: recomputePending } = useLaSoRecomputeGate();
  const todayIso = todayIsoInVn();
  const [year, setYear] = useState(() => Number(todayIso.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(todayIso.slice(5, 7)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);

  const menh = useMemo(() => {
    const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
    return laso?.menh ?? "bạn";
  }, [profile]);

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.la_so_recompute_status === "pending") {
      setLoading(true);
      setDays([]);
      setError(null);
      return;
    }
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoading(false);
      setError("Cần ngày sinh trên hồ sơ.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const res = await invokeBatTu<unknown>({
        op: "lich-thang",
        body: { ...body, month: formatLichThangMonthKey(year, month) },
      });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.message ?? "Không tải lịch tháng.");
        setDays([]);
      } else {
        const built = buildCalendarDaysForMonth(month, year, res.data);
        setDays(built);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, year, month]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.paper, color: CT.ink }}
    >
      <CTopStrip />
      <CLichSegmentedNav />

      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-2">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 28,
              color: CT.ink,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            Tháng {month} · {year}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              aria-label="Tháng trước"
              onClick={() => shiftMonth(-1)}
              style={{
                color: CT.goldDeep,
                fontFamily: "var(--serif)",
                fontSize: 20,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Tháng sau"
              onClick={() => shiftMonth(1)}
              style={{
                color: CT.goldDeep,
                fontFamily: "var(--serif)",
                fontSize: 20,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ›
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--serif)",
            fontSize: 12.5,
            color: CT.muted,
            lineHeight: 1.5,
          }}
        >
          Chấm theo mệnh{" "}
          <strong style={{ color: CT.ink, fontWeight: 600 }}>{menh}</strong>
        </div>

        {error ? <ErrorBanner message={error} /> : null}
        {recomputePending || profile?.la_so_recompute_status === "pending" ? (
          <CLichRecomputeSkeleton variant="month" />
        ) : loading ? (
          <p className="py-12 text-center font-serif text-sm" style={{ color: CT.muted }}>
            Đang tải lịch tháng…
          </p>
        ) : (
          <MonthGrid year={year} month={month} days={days} todayIso={todayIso} />
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
            fontFamily: "var(--serif)",
            fontSize: 11,
            color: CT.muted,
          }}
        >
          {(
            [
              ["Tốt", CT.greenMute],
              ["Khá", CT.gold],
              ["Bình", CT.muted],
              ["Tránh", CT.red],
            ] as const
          ).map(([l, c]) => (
            <span
              key={l}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c,
                }}
              />
              {l}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
