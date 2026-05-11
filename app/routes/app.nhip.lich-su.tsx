/**
 * /app/nhip/lich-su — 30-day habit check-in grid (forest).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { BackBar, Kanji, Mono } from "~/components/brand";
import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";
import { addDaysToIso } from "~/hooks/useStreak";
import { todayIsoInVn } from "~/lib/today-reading-cache";

const CELL = 36;
const GAP = 4;

export default function NhipLichSuRoute() {
  const { user, loading: authLoading } = useAuth();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [currentCount, setCurrentCount] = useState(0);
  const [longestCount, setLongestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = todayIsoInVn();
  const startIso = addDaysToIso(today, -29);

  const days = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 30; i++) {
      out.push(addDaysToIso(startIso, i));
    }
    return out;
  }, [startIso]);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const uid = user.id;

    void (async () => {
      setLoading(true);
      const [ins, streak] = await Promise.all([
        supabase
          .from("daily_check_ins")
          .select("day_iso")
          .eq("user_id", uid)
          .gte("day_iso", startIso)
          .lte("day_iso", today),
        supabase
          .from("streaks")
          .select("current_count,longest_count")
          .eq("user_id", uid)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const next = new Set<string>();
      for (const row of ins.data ?? []) {
        if (row.day_iso) next.add(row.day_iso);
      }
      setChecked(next);

      if (streak.data) {
        setCurrentCount(streak.data.current_count ?? 0);
        setLongestCount(streak.data.longest_count ?? 0);
      } else {
        setCurrentCount(0);
        setLongestCount(0);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, startIso, today]);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
        color: "var(--cream, #ede7d3)",
        fontFamily: "var(--serif)",
        paddingBottom: 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Kanji
        ch="習"
        size={150}
        drift
        style={{
          position: "absolute",
          right: "-20px",
          top: "40%",
          color: "rgba(197,165,90,0.08)",
          pointerEvents: "none",
        }}
      />
      <BackBar dark title="Nhịp · Lịch sử" />

      <div className="px-5 pt-1" style={{ position: "relative" }}>
        {loading ? (
          <Mono style={{ color: "rgba(237,231,211,0.5)" }}>Đang tải…</Mono>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <Mono style={{ color: "rgba(237,231,211,0.58)" }}>
                  Nhịp hiện tại
                </Mono>
                <div
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: 28,
                    color: "var(--gold, #c5a55a)",
                    lineHeight: 1.1,
                    marginTop: 4,
                  }}
                >
                  {currentCount}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Mono style={{ color: "rgba(237,231,211,0.58)" }}>
                  Dài nhất
                </Mono>
                <div
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: 28,
                    color: "rgba(237,231,211,0.9)",
                    lineHeight: 1.1,
                    marginTop: 4,
                  }}
                >
                  {longestCount}
                </div>
              </div>
            </div>

            <Mono style={{ color: "rgba(237,231,211,0.52)", marginBottom: 10 }}>
              30 ngày gần nhất · {startIso} — {today}
            </Mono>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(7, ${CELL}px)`,
                gap: GAP,
              }}
            >
              {days.map((iso) => {
                const on = checked.has(iso);
                const dom = parseInt(iso.slice(8, 10), 10);
                return (
                  <div
                    key={iso}
                    title={iso}
                    style={{
                      width: CELL,
                      height: CELL,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: on
                        ? "rgba(197,165,90,0.9)"
                        : "rgba(237,231,211,0.08)",
                      color: on ? "var(--ink, #18150e)" : "rgba(237,231,211,0.3)",
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {dom}
                  </div>
                );
              })}
            </div>

            <Link
              to="/app/nhip/cai-dat"
              style={{
                display: "inline-block",
                marginTop: 24,
                padding: "10px 0",
                minHeight: 44,
                fontFamily: "var(--mono)",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--gold, #c5a55a)",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              Cài đặt nhịp →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
