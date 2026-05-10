import { useEffect, useState } from "react";

import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";
import { todayIsoInVn } from "~/lib/today-reading-cache";

export interface StreakState {
  currentCount: number;
  longestCount: number;
  lastCheckIn: string | null;
  loading: boolean;
}

function visitStorageKey(dayIso: string): string {
  return `ngaytot_streak_visit:${dayIso}`;
}

export function addDaysToIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + delta);
  return t.toISOString().slice(0, 10);
}

function parseStreakRow(
  row: unknown,
): Pick<StreakState, "currentCount" | "longestCount" | "lastCheckIn"> {
  if (!row || typeof row !== "object") {
    return { currentCount: 0, longestCount: 0, lastCheckIn: null };
  }
  const r = row as Record<string, unknown>;
  return {
    currentCount:
      typeof r.current_count === "number"
        ? r.current_count
        : Number(r.current_count) || 0,
    longestCount:
      typeof r.longest_count === "number"
        ? r.longest_count
        : Number(r.longest_count) || 0,
    lastCheckIn:
      typeof r.last_check_in === "string" ? r.last_check_in : null,
  };
}

/** Records daily visit via RPC (throttled per day in localStorage) and exposes streak row. */
export function useStreak(): StreakState & { streakGapReturn: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [currentCount, setCurrentCount] = useState(0);
  const [longestCount, setLongestCount] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streakGapReturn, setStreakGapReturn] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setCurrentCount(0);
      setLongestCount(0);
      setLastCheckIn(null);
      setLoading(false);
      setStreakGapReturn(false);
      return;
    }

    let cancelled = false;
    const uid = user.id;
    const today = todayIsoInVn();
    const vKey = visitStorageKey(today);

    void (async () => {
      setLoading(true);
      setStreakGapReturn(false);

      try {
        let alreadyVisited = false;
        try {
          alreadyVisited = localStorage.getItem(vKey) === "1";
        } catch {
          alreadyVisited = false;
        }

        if (alreadyVisited) {
          const { data } = await supabase
            .from("streaks")
            .select("current_count,longest_count,last_check_in")
            .eq("user_id", uid)
            .maybeSingle();
          if (cancelled) return;
          const parsed = data
            ? parseStreakRow(data)
            : { currentCount: 0, longestCount: 0, lastCheckIn: null };
          setCurrentCount(parsed.currentCount);
          setLongestCount(parsed.longestCount);
          setLastCheckIn(parsed.lastCheckIn);
          return;
        }

        const { data: preRow } = await supabase
          .from("streaks")
          .select("last_check_in,current_count")
          .eq("user_id", uid)
          .maybeSingle();
        if (cancelled) return;

        const beforeYesterday = addDaysToIso(today, -1);
        if (
          preRow?.last_check_in &&
          preRow.last_check_in < beforeYesterday &&
          preRow.current_count > 0
        ) {
          setStreakGapReturn(true);
        }

        const { data: rpcRaw, error } = await supabase.rpc(
          "record_daily_visit",
          { p_user_id: uid, p_day_iso: today },
        );

        if (cancelled) return;

        if (error) {
          const { data: fallback } = await supabase
            .from("streaks")
            .select("current_count,longest_count,last_check_in")
            .eq("user_id", uid)
            .maybeSingle();
          if (!cancelled && fallback) {
            const p = parseStreakRow(fallback);
            setCurrentCount(p.currentCount);
            setLongestCount(p.longestCount);
            setLastCheckIn(p.lastCheckIn);
          }
          return;
        }

        try {
          localStorage.setItem(vKey, "1");
        } catch {
          /* ignore */
        }

        const parsed = parseStreakRow(rpcRaw);
        setCurrentCount(parsed.currentCount);
        setLongestCount(parsed.longestCount);
        setLastCheckIn(parsed.lastCheckIn);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  return {
    currentCount,
    longestCount,
    lastCheckIn,
    loading,
    streakGapReturn,
  };
}
