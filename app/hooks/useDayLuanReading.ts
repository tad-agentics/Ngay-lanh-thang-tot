import { useCallback, useEffect, useState } from "react";

import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { canUseCalendar } from "~/lib/entitlements";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { parseDayDetailForView, type DayDetailViewModel } from "~/lib/day-detail-view";
import {
  ensureReadingUnlocked,
  invokeReadingUnlock,
  isReadingUnlockGranted,
} from "~/lib/reading-unlock";

export function useDayLuanReading(iso: string) {
  const { profile, loading: profileLoading } = useProfile();
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DayDetailViewModel | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  const [reading, setReading] = useState<string | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const subActive = canUseCalendar(profile);

  const loadReading = useCallback(
    async (data: unknown) => {
      setReadingLoading(true);
      const r = await invokeGenerateReading({
        endpoint: "day-detail",
        data,
      });
      setReading(r.reading);
      setReadingLoading(false);
    },
    [],
  );

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
    void (async () => {
      const res = await invokeBatTu<unknown>({
        op: "day-detail",
        body: { ...body, date: iso },
      });
      if (cancelled) return;
      if (!res.ok) {
        setDetailLoading(false);
        setDetailError(res.message ?? "Không tải chi tiết ngày.");
        setDetail(null);
        setPayload(null);
        return;
      }
      setPayload(res.data);
      setDetail(parseDayDetailForView(res.data));
      setDetailLoading(false);

      if (subActive) {
        setUnlocked(true);
        await loadReading(res.data);
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
        await loadReading(res.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [iso, profile, profileLoading, subActive, loadReading]);

  const unlockAndLoad = useCallback(async () => {
    if (!payload || unlockBusy) return;
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
    await loadReading(payload);
    setUnlockBusy(false);
    return { ok: true as const };
  }, [payload, unlockBusy, subActive, iso, loadReading]);

  const askFollowUp = useCallback(
    async (question: string) => {
      if (!payload || !unlocked) {
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
        data: payload,
        question: q,
      });
      return {
        ok: true as const,
        reading: r.reading?.trim() ?? null,
        message: undefined as string | undefined,
      };
    },
    [payload, unlocked],
  );

  return {
    profile,
    profileLoading,
    detailLoading,
    detailError,
    detail,
    payload,
    reading,
    readingLoading,
    unlocked,
    unlockBusy,
    subActive,
    unlockAndLoad,
    askFollowUp,
  };
}
