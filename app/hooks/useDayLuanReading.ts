import { useCallback, useEffect, useState } from "react";

import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { canUseCalendar } from "~/lib/entitlements";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { parseDayDetailForView, type DayDetailViewModel } from "~/lib/day-detail-view";
import { parseDayCompareResponse } from "~/lib/luan-context";
import {
  ensureReadingUnlocked,
  invokeReadingUnlock,
  isReadingUnlockGranted,
} from "~/lib/reading-unlock";
import { addDaysToIso } from "~/lib/tu-tru-dates";

export function useDayLuanReading(iso: string) {
  const { profile, loading: profileLoading } = useProfile();
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DayDetailViewModel | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [luanContext, setLuanContext] = useState<unknown>(null);

  const [reading, setReading] = useState<string | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const subActive = canUseCalendar(profile);

  const loadReading = useCallback(async (contextPayload: unknown) => {
    setReadingLoading(true);
    const r = await invokeGenerateReading({
      endpoint: "day-detail",
      data: contextPayload,
    });
    setReading(r.reading);
    setReadingLoading(false);
  }, []);

  useEffect(() => {
    if (profileLoading || !profile || !iso) return;
    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date) {
      setDetailLoading(false);
      setDetailError("Cần lá số trên hồ sơ.");
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    setReading(null);
    setLuanContext(null);
    void (async () => {
      const query = { ...body, date: iso };
      const [detailRes, luanRes] = await Promise.all([
        invokeBatTu<unknown>({ op: "day-detail", body: query }),
        invokeBatTu<unknown>({ op: "day-luan-context", body: query }),
      ]);
      if (cancelled) return;
      if (!detailRes.ok) {
        setDetailLoading(false);
        setDetailError(detailRes.message ?? "Không tải chi tiết ngày.");
        setDetail(null);
        setPayload(null);
        return;
      }
      setPayload(detailRes.data);
      setDetail(parseDayDetailForView(detailRes.data));
      const contextPayload = luanRes.ok ? luanRes.data : detailRes.data;
      setLuanContext(contextPayload);
      setDetailLoading(false);

      if (subActive) {
        setUnlocked(true);
        await loadReading(contextPayload);
        return;
      }

      const unlock = await ensureReadingUnlocked({
        scope: "day_detail",
        day_iso: iso,
      });
      if (cancelled) return;
      const allowed = unlock.ok && isReadingUnlockGranted(unlock);
      setUnlocked(allowed);
      if (allowed) {
        await loadReading(contextPayload);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [iso, profile, profileLoading, subActive, loadReading]);

  const unlockAndLoad = useCallback(async () => {
    if (!luanContext || unlockBusy) return;
    setUnlockBusy(true);
    setReadingLoading(true);
    if (!subActive) {
      const unlock = await invokeReadingUnlock({
        scope: "day_detail",
        day_iso: iso,
      });
      if (!unlock.ok) {
        setReadingLoading(false);
        setUnlockBusy(false);
        return { ok: false as const, message: unlock.message };
      }
      setUnlocked(true);
    }
    await loadReading(luanContext);
    setUnlockBusy(false);
    return { ok: true as const };
  }, [luanContext, unlockBusy, subActive, iso, loadReading]);

  const askFollowUp = useCallback(
    async (question: string) => {
      if (!luanContext || !unlocked) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Cần mở luận giải trước.",
        };
      }
      const q = question.trim();
      if (!q) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Nhập câu hỏi.",
        };
      }
      const r = await invokeGenerateReading({
        endpoint: "day-detail",
        data: luanContext,
        question: q,
      });
      return {
        ok: true as const,
        reading: r.reading?.trim() ?? null,
        message: undefined as string | undefined,
      };
    },
    [luanContext, unlocked],
  );

  const compareWithIso = useCallback(
    async (otherIso: string) => {
      if (!profile || !unlocked) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Cần mở luận giải trước.",
        };
      }
      const body = profileToBatTuPersonQuery(profile);
      if (!body.birth_date) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Cần lá số trên hồ sơ.",
        };
      }
      const res = await invokeBatTu<unknown>({
        op: "day-compare",
        body: {
          ...body,
          date_a: iso,
          date_b: otherIso,
          tz: "Asia/Ho_Chi_Minh",
        },
      });
      if (!res.ok) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: res.message ?? "Không so sánh được hai ngày.",
        };
      }
      const facts = parseDayCompareResponse(res.data);
      return {
        ok: true as const,
        reading: facts?.comparisonVi ?? null,
        message: undefined as string | undefined,
      };
    },
    [profile, unlocked, iso],
  );

  const compareWithTomorrow = useCallback(async () => {
    const nextIso = addDaysToIso(iso, 1);
    return compareWithIso(nextIso);
  }, [compareWithIso, iso]);

  const retryReading = useCallback(async () => {
    if (!luanContext || !unlocked) return;
    await loadReading(luanContext);
  }, [luanContext, unlocked, loadReading]);

  return {
    profile,
    profileLoading,
    detailLoading,
    detailError,
    detail,
    payload,
    luanContext,
    reading,
    readingLoading,
    unlocked,
    unlockBusy,
    subActive,
    unlockAndLoad,
    retryReading,
    askFollowUp,
    compareWithIso,
    compareWithTomorrow,
  };
}
