import { useCallback, useEffect, useRef, useState } from "react";

import { useProfile } from "~/hooks/useProfile";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { baziReadingBirthRevision } from "~/lib/bazi-reading-session";
import { canUseCalendar, isNewUserDayLuanTeaser } from "~/lib/entitlements";
import {
  DAY_LUAN_MAX_FOLLOW_UPS,
  invokeDayLuanChatAsk,
  invokeDayLuanChatOpen,
} from "~/lib/day-luan-chat";
import {
  invokeGenerateReading,
  type LuanThreadTurn,
} from "~/lib/generate-reading";
import { parseDayDetailForView, type DayDetailViewModel } from "~/lib/day-detail-view";
import { parseDayCompareResponse } from "~/lib/luan-context";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import {
  DAY_LUAN_FOLLOW_UP_TODAY_ONLY_MESSAGE,
  dayLuanFollowUpAllowed,
} from "~/lib/day-luan-follow-up";
import { addDaysToIso } from "~/lib/tu-tru-dates";
import { todayIsoInVn } from "~/lib/today-reading-cache";

type ThreadOpenSnapshot = {
  iso: string;
  birthRevision: string;
  anchorLen: number;
};

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

  const [threadId, setThreadId] = useState<string | null>(null);
  const [followUpRemaining, setFollowUpRemaining] = useState(DAY_LUAN_MAX_FOLLOW_UPS);
  const [serverThreadMessages, setServerThreadMessages] = useState<LuanThreadTurn[]>(
    [],
  );

  const threadIdRef = useRef<string | null>(null);
  const threadOpenRef = useRef<ThreadOpenSnapshot | null>(null);

  const subActive = canUseCalendar(profile);
  const paywallTeaser = isNewUserDayLuanTeaser(profile);

  const loadReading = useCallback(
    async (contextPayload: unknown, mode: "full" | "teaser") => {
      setReadingLoading(true);
      const r = await invokeGenerateReading({
        endpoint: "day-detail",
        data: contextPayload,
        ...(mode === "teaser" ? { variant: "teaser" } : {}),
      });
      setReading(r.reading);
      setReadingLoading(false);
    },
    [],
  );

  useEffect(() => {
    threadIdRef.current = null;
    threadOpenRef.current = null;
    setThreadId(null);
    setFollowUpRemaining(DAY_LUAN_MAX_FOLLOW_UPS);
    setServerThreadMessages([]);
  }, [iso]);

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
        await loadReading(contextPayload, "full");
        return;
      }

      setUnlocked(false);
      await loadReading(contextPayload, "teaser");
    })();
    return () => {
      cancelled = true;
    };
  }, [iso, profile, profileLoading, subActive, loadReading]);

  const ensureDayLuanThread = useCallback(
    async (anchorReading?: string): Promise<string | null> => {
      if (!profile || !luanContext || !unlocked || paywallTeaser) return null;

      const birthRevision = baziReadingBirthRevision(profile);
      const anchorLen = anchorReading?.trim().length ?? 0;
      const snap = threadOpenRef.current;
      const cachedId = threadIdRef.current;

      if (
        cachedId &&
        snap?.iso === iso &&
        snap.birthRevision === birthRevision &&
        anchorLen <= snap.anchorLen
      ) {
        return cachedId;
      }

      const open = await invokeDayLuanChatOpen({
        day_iso: iso,
        birth_revision: birthRevision,
        luan_context_raw: luanContext,
        ...(anchorReading ? { anchor_reading: anchorReading } : {}),
      });
      if (!open.ok) return null;

      threadIdRef.current = open.thread_id;
      threadOpenRef.current = { iso, birthRevision, anchorLen };
      setThreadId(open.thread_id);
      setFollowUpRemaining(open.follow_up_remaining);
      setServerThreadMessages(open.messages);
      return open.thread_id;
    },
    [profile, luanContext, unlocked, paywallTeaser, iso],
  );

  useEffect(() => {
    if (!reading || !unlocked || paywallTeaser || !luanContext || !profile) {
      return;
    }
    const anchorLen = reading.trim().length;
    const snap = threadOpenRef.current;
    if (
      threadIdRef.current &&
      snap?.iso === iso &&
      snap.birthRevision === baziReadingBirthRevision(profile) &&
      anchorLen <= snap.anchorLen
    ) {
      return;
    }
    void ensureDayLuanThread(reading);
  }, [reading, unlocked, paywallTeaser, luanContext, profile, iso, ensureDayLuanThread]);

  const unlockAndLoad = useCallback(async () => {
    if (!luanContext || unlockBusy || paywallTeaser) return;
    setUnlockBusy(true);
    setReadingLoading(true);
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
    await loadReading(luanContext, "full");
    setUnlockBusy(false);
    return { ok: true as const };
  }, [luanContext, unlockBusy, paywallTeaser, iso, loadReading]);

  const askFollowUp = useCallback(
    async (question: string, idempotencyKey: string) => {
      if (!luanContext || !unlocked || paywallTeaser) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Cần mở luận giải trước.",
        };
      }
      if (!dayLuanFollowUpAllowed(iso)) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: DAY_LUAN_FOLLOW_UP_TODAY_ONLY_MESSAGE,
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

      let tid = threadIdRef.current;
      if (!tid) {
        tid = await ensureDayLuanThread(reading ?? undefined);
      }
      if (!tid) {
        return {
          ok: false as const,
          reading: null,
          message: "Không mở được hội thoại. Thử lại ›",
        };
      }

      const res = await invokeDayLuanChatAsk({
        thread_id: tid,
        question: q,
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) {
        const message =
          res.code === "IN_PROGRESS"
            ? "Đang xử lý câu hỏi. Đợi vài giây rồi thử lại."
            : res.code === "FOLLOW_UP_TODAY_ONLY"
              ? DAY_LUAN_FOLLOW_UP_TODAY_ONLY_MESSAGE
              : res.message;
        return {
          ok: false as const,
          reading: null,
          message,
        };
      }

      setFollowUpRemaining(res.follow_up_remaining);
      setServerThreadMessages((prev) => [
        ...prev,
        { role: "user", content: q },
        { role: "assistant", content: res.answer },
      ]);

      return {
        ok: true as const,
        reading: res.answer,
        message: undefined as string | undefined,
      };
    },
    [luanContext, unlocked, paywallTeaser, ensureDayLuanThread, reading, iso],
  );

  const compareWithIso = useCallback(
    async (otherIso: string) => {
      if (!profile || !unlocked || paywallTeaser) {
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
    [profile, unlocked, paywallTeaser, iso],
  );

  const compareWithTomorrow = useCallback(async () => {
    if (!dayLuanFollowUpAllowed(iso)) {
      return {
        ok: false as const,
        reading: null as string | null,
        message:
          "So sánh với ngày mai chỉ dùng khi xem luận hôm nay.",
      };
    }
    const nextIso = addDaysToIso(todayIsoInVn(), 1);
    return compareWithIso(nextIso);
  }, [compareWithIso, iso]);

  const retryReading = useCallback(async () => {
    if (!luanContext) return;
    if (paywallTeaser) {
      await loadReading(luanContext, "teaser");
      return;
    }
    if (!unlocked) return;
    await loadReading(luanContext, "full");
  }, [luanContext, unlocked, paywallTeaser, loadReading]);

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
    paywallTeaser,
    unlockAndLoad,
    retryReading,
    askFollowUp,
    compareWithIso,
    compareWithTomorrow,
    threadId,
    followUpRemaining,
    serverThreadMessages,
    followUpChatEnabled: dayLuanFollowUpAllowed(iso),
  };
}
