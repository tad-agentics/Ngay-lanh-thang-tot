import { useEffect, useRef, useState } from "react";

import type { CalendarDay } from "~/lib/api-types";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  profileToBatTuPersonQuery,
} from "~/lib/bat-tu-birth";
import {
  buildCalendarDaysForMonth,
  formatLichThangMonthKey,
  parseLichThangLunarMonthLabel,
  parseLichThangScoreMethodology,
} from "~/lib/home-bat-tu";
import type { ScoreMethodologyView } from "~/lib/score-methodology";
import {
  lichThangBirthFingerprint,
  readLichThangCache,
  writeLichThangCache,
} from "~/lib/lich-thang-cache";
import type { Profile } from "~/lib/profile-context";

async function fetchLichThangMonth(
  body: ReturnType<typeof profileToBatTuPersonQuery>,
  year: number,
  month: number,
): Promise<
  | {
      ok: true;
      days: CalendarDay[];
      lunarMonthLabel: string | null;
      scoreMethodology: ScoreMethodologyView | null;
    }
  | { ok: false; message: string }
> {
  const res = await invokeBatTu<unknown>({
    op: "lich-thang",
    body: { ...body, month: formatLichThangMonthKey(year, month) },
  });
  if (!res.ok) {
    return { ok: false, message: res.message ?? "Không tải lịch tháng." };
  }
  return {
    ok: true,
    days: buildCalendarDaysForMonth(month, year, res.data),
    lunarMonthLabel: parseLichThangLunarMonthLabel(res.data),
    scoreMethodology: parseLichThangScoreMethodology(res.data),
  };
}

function shiftMonthParts(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  return { year: y, month: m };
}

export function useLichThangData({
  profile,
  profileLoading,
  year,
  month,
  online,
}: {
  profile: Profile | null;
  profileLoading: boolean;
  year: number;
  month: number;
  online: boolean;
}) {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [lunarMonthLabel, setLunarMonthLabel] = useState<string | null>(null);
  const [scoreMethodology, setScoreMethodology] =
    useState<ScoreMethodologyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefetchingRef = useRef(false);

  useEffect(() => {
    if (profileLoading || !profile) return;

    if (profile.la_so_recompute_status === "pending") {
      setLoading(true);
      setRefreshing(false);
      setDays([]);
      setLunarMonthLabel(null);
      setScoreMethodology(null);
      setError(null);
      return;
    }

    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setLoading(false);
      setRefreshing(false);
      setDays([]);
      setLunarMonthLabel(null);
      setScoreMethodology(null);
      setError("Cần ngày sinh trên hồ sơ.");
      return;
    }

    const userId = profile.id;
    const monthKey = formatLichThangMonthKey(year, month);
    const birthFingerprint = lichThangBirthFingerprint(body);
    const cached = readLichThangCache(userId, monthKey, birthFingerprint);

    if (cached) {
      setDays(cached.days);
      setLunarMonthLabel(cached.lunarMonthLabel);
      setScoreMethodology(cached.scoreMethodology ?? null);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    if (!online) {
      if (cached) {
        setRefreshing(false);
        return;
      }
      setLoading(false);
      setDays([]);
      setLunarMonthLabel(null);
      setScoreMethodology(null);
      setError("Không có lịch tháng ngoại tuyến — cần mạng để tải lần đầu.");
      return;
    }

    let cancelled = false;
    setRefreshing(Boolean(cached));

    void (async () => {
      const result = await fetchLichThangMonth(body, year, month);
      if (cancelled) return;

      if (!result.ok) {
        if (!cached) {
          setError(result.message);
          setDays([]);
          setLunarMonthLabel(null);
          setScoreMethodology(null);
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setDays(result.days);
      setLunarMonthLabel(result.lunarMonthLabel);
      setScoreMethodology(result.scoreMethodology);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      writeLichThangCache(userId, monthKey, birthFingerprint, {
        days: result.days,
        lunarMonthLabel: result.lunarMonthLabel,
        scoreMethodology: result.scoreMethodology,
      });

      if (prefetchingRef.current) return;
      prefetchingRef.current = true;
      try {
        for (const delta of [-1, 1] as const) {
          const { year: y2, month: m2 } = shiftMonthParts(year, month, delta);
          const key2 = formatLichThangMonthKey(y2, m2);
          if (readLichThangCache(userId, key2, birthFingerprint)) continue;
          const warm = await fetchLichThangMonth(body, y2, m2);
          if (cancelled || !warm.ok) continue;
          writeLichThangCache(userId, key2, birthFingerprint, {
            days: warm.days,
            lunarMonthLabel: warm.lunarMonthLabel,
            scoreMethodology: warm.scoreMethodology,
          });
        }
      } finally {
        prefetchingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, year, month, online]);

  return {
    days,
    lunarMonthLabel,
    scoreMethodology,
    loading,
    refreshing,
    error,
    recomputePending: profile?.la_so_recompute_status === "pending",
  };
}
