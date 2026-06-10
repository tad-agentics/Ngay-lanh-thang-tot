import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBatTuQuery } from "~/hooks/useBatTuQuery";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { baziReadingBirthRevision } from "~/lib/bazi-reading-session";
import {
  canAccessPaidCalendar,
  canUseCalendar,
  canPeekTodayLuanReading,
  hasOnboardingTrialAccess,
  isOnboardingTrialExhausted,
} from "~/lib/entitlements";
import { useOnboardingTrialExhaustedModal } from "~/lib/onboarding-trial-exhausted-context";
import { ONBOARDING_TRIAL_EXHAUSTED_TITLE } from "~/lib/onboarding-trial-exhausted-copy";
import {
  clearInlineReadingFailCooldown,
  isInlineReadingFailCooldown,
  markInlineReadingFailCooldown,
  runInlineReadingDeduped,
} from "~/lib/inline-day-reading-coord";
import { stableStringify } from "~/lib/stable-stringify";
import {
  DAY_LUAN_MAX_FOLLOW_UPS,
  invokeDayLuanChatAsk,
  invokeDayLuanChatOpen,
  invokeDayLuanDailyQuota,
} from "~/lib/day-luan-chat";
import {
  invokeGenerateReadingWithRetry,
  type LuanThreadTurn,
} from "~/lib/generate-reading";
import { parseDayDetailForView } from "~/lib/day-detail-view";
import { parseDayCompareResponse } from "~/lib/luan-context";
import {
  ensureReadingUnlocked,
  invokeReadingUnlock,
  isReadingUnlockGranted,
} from "~/lib/reading-unlock";
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
  const { user } = useAuth();
  const userId = user?.id;
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const { showOnboardingTrialExhaustedModal } = useOnboardingTrialExhaustedModal();
  const [reading, setReading] = useState<string | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingFailed, setReadingFailed] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [followUpRemaining, setFollowUpRemaining] = useState(DAY_LUAN_MAX_FOLLOW_UPS);
  const [serverThreadMessages, setServerThreadMessages] = useState<LuanThreadTurn[]>(
    [],
  );

  const threadIdRef = useRef<string | null>(null);
  const threadOpenRef = useRef<ThreadOpenSnapshot | null>(null);
  const loadGenRef = useRef(0);

  const subActive = canUseCalendar(profile);
  const trialAccess = hasOnboardingTrialAccess(profile);
  const paidCalendarAccess = canAccessPaidCalendar(profile);
  /** Chưa có gói lịch và hết lượt thử — paywall `/luan-ai`. */
  const calendarTeaserUser = Boolean(profile && !paidCalendarAccess);
  const todayIso = todayIsoInVn();
  /** Never-sub / lapsed: luận full hôm nay (wow moment) — ngày khác cần gói hoặc lượt thử. */
  const todayFreePeek = canPeekTodayLuanReading(profile, iso, todayIso);
  /** Có thể tải luận anchor: hôm nay (teaser) hoặc bất kỳ ngày nào (lượt thử). */
  const dayLuanPeek = todayFreePeek || trialAccess;

  const batTuQuery = profile ? profileToBatTuPersonQuery(profile) : null;
  const batTuBody =
    batTuQuery?.birth_date && iso
      ? { ...batTuQuery, date: iso }
      : { date: iso, tz: "Asia/Ho_Chi_Minh" };
  const fetchEnabled =
    !profileLoading && Boolean(profile?.id && batTuQuery?.birth_date && iso);

  const detailQuery = useBatTuQuery<unknown>(
    profile?.id,
    "day-detail",
    batTuBody,
    { enabled: fetchEnabled },
  );
  const luanQuery = useBatTuQuery<unknown>(
    profile?.id,
    "day-luan-context",
    batTuBody,
    { enabled: fetchEnabled },
  );

  const detailLoading =
    fetchEnabled && (detailQuery.isPending || luanQuery.isPending);
  const detailError = detailQuery.isError
    ? (detailQuery.error?.message ?? "Không tải chi tiết ngày.")
    : !profileLoading && profile && !batTuQuery?.birth_date
      ? "Cần lá số trên hồ sơ."
      : null;
  const payload = detailQuery.data ?? null;
  const detail = payload != null ? parseDayDetailForView(payload) : null;
  const luanContext =
    luanQuery.data ?? detailQuery.data ?? null;
  const luanContextHash = useMemo(
    () => (luanContext != null ? stableStringify(luanContext) : ""),
    [luanContext],
  );

  const loadReading = useCallback(
    async (
      contextPayload: unknown,
      gen: number,
      dayIso: string,
    ): Promise<void> => {
      if (!userId) {
        setReadingLoading(false);
        setReadingFailed(true);
        return;
      }
      if (isInlineReadingFailCooldown(userId, dayIso)) {
        setReadingLoading(false);
        setReadingFailed(true);
        return;
      }
      setReadingLoading(true);
      setReadingFailed(false);
      setDailyLimitReached(false);
      const runKey = `${userId}:day-luan:${dayIso}:full:${stableStringify(contextPayload)}`;
      const result = await runInlineReadingDeduped(runKey, async () => {
        const r = await invokeGenerateReadingWithRetry({
          endpoint: "day-detail",
          data: contextPayload,
          day_iso: dayIso,
        });
        if (r.reading) {
          clearInlineReadingFailCooldown(userId, dayIso);
          return {
            text: r.reading,
            failed: false,
            dailyLimit: false,
            trialExhausted: false,
          };
        }
        if (r.errorCode === "DAILY_LIMIT") {
          return { text: null, failed: true, dailyLimit: true };
        }
        if (r.errorCode === "TRIAL_EXHAUSTED") {
          return { text: null, failed: true, dailyLimit: false, trialExhausted: true };
        }
        if (r.transportError) {
          markInlineReadingFailCooldown(userId, dayIso);
        }
        return {
          text: null,
          failed: true,
          dailyLimit: false,
          trialExhausted: false,
        };
      });
      if (gen !== loadGenRef.current) return;
      setReading(result.text);
      setReadingLoading(false);
      setReadingFailed(result.failed);
      if (result.dailyLimit) {
        setDailyLimitReached(true);
        setFollowUpRemaining(0);
      }
      if (result.trialExhausted) {
        showOnboardingTrialExhaustedModal();
        void refreshProfile();
      } else if (result.text) {
        const quota = await invokeDayLuanDailyQuota();
        if (quota.ok) setFollowUpRemaining(quota.follow_up_remaining);
        if (trialAccess) void refreshProfile();
      }
    },
    [userId, trialAccess, refreshProfile, showOnboardingTrialExhaustedModal],
  );

  useEffect(() => {
    threadIdRef.current = null;
    threadOpenRef.current = null;
    setThreadId(null);
    setFollowUpRemaining(DAY_LUAN_MAX_FOLLOW_UPS);
    setServerThreadMessages([]);
  }, [iso]);

  useEffect(() => {
    if (
      !fetchEnabled ||
      !userId ||
      !luanContextHash ||
      detailLoading ||
      detailError ||
      luanContext == null
    ) {
      return;
    }
    if (calendarTeaserUser && !dayLuanPeek) {
      setReading(null);
      setReadingLoading(false);
      setReadingFailed(false);
      setUnlocked(false);
      return;
    }
    const gen = ++loadGenRef.current;
    setReading(null);
    setReadingFailed(false);
    setDailyLimitReached(false);
    if (subActive || trialAccess) {
      setUnlocked(true);
    } else {
      setUnlocked(false);
    }
    setReadingLoading(true);
    void (async () => {
      try {
        if (subActive) {
          const unlock = await ensureReadingUnlocked({
            scope: "day_detail",
            day_iso: iso,
          });
          if (gen !== loadGenRef.current) return;
          if (!unlock.ok || !isReadingUnlockGranted(unlock)) {
            setUnlocked(false);
            setReadingLoading(false);
            setReadingFailed(true);
            return;
          }
          await loadReading(luanContext, gen, iso);
        } else {
          await loadReading(luanContext, gen, iso);
        }
      } catch {
        if (gen !== loadGenRef.current) return;
        setReadingLoading(false);
        setReadingFailed(true);
      }
    })();
  }, [
    fetchEnabled,
    detailLoading,
    detailError,
    luanContext,
    subActive,
    calendarTeaserUser,
    dayLuanPeek,
    trialAccess,
    loadReading,
    iso,
    userId,
    luanContextHash,
  ]);

  const canUseDayLuanChat =
    !calendarTeaserUser && (trialAccess || (subActive && unlocked));

  const ensureDayLuanThread = useCallback(
    async (anchorReading?: string): Promise<string | null> => {
      if (!profile || !luanContext || calendarTeaserUser) return null;
      if (subActive && !unlocked) return null;
      if (!subActive && !trialAccess) return null;

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
    [profile, luanContext, unlocked, calendarTeaserUser, trialAccess, subActive, iso],
  );

  useEffect(() => {
    if (!reading || calendarTeaserUser || !luanContext || !profile) return;
    if (subActive && !unlocked) return;
    if (!subActive && !trialAccess) return;
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
  }, [
    reading,
    unlocked,
    calendarTeaserUser,
    trialAccess,
    subActive,
    luanContext,
    profile,
    iso,
    ensureDayLuanThread,
  ]);

  const unlockAndLoad = useCallback(async () => {
    if (!luanContext || unlockBusy || calendarTeaserUser) return;
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
    const gen = ++loadGenRef.current;
    await loadReading(luanContext, gen, iso);
    setUnlockBusy(false);
    return { ok: true as const };
  }, [luanContext, unlockBusy, calendarTeaserUser, iso, loadReading]);

  const askFollowUp = useCallback(
    async (question: string, idempotencyKey: string) => {
      if (!luanContext || calendarTeaserUser) {
        if (isOnboardingTrialExhausted(profile)) {
          showOnboardingTrialExhaustedModal();
        }
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Cần gói lịch hoặc lượt chat miễn phí.",
        };
      }
      if (subActive && !unlocked) {
        return {
          ok: false as const,
          reading: null as string | null,
          message: "Cần mở luận giải trước.",
        };
      }
      if (!subActive && !trialAccess) {
        if (isOnboardingTrialExhausted(profile)) {
          showOnboardingTrialExhaustedModal();
        }
        return {
          ok: false as const,
          reading: null as string | null,
          message: ONBOARDING_TRIAL_EXHAUSTED_TITLE,
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
        if (res.code === "TRIAL_EXHAUSTED") {
          showOnboardingTrialExhaustedModal();
        }
        const message =
          res.code === "IN_PROGRESS"
            ? "Đang xử lý câu hỏi. Đợi vài giây rồi thử lại."
            : res.code === "DAILY_LIMIT"
              ? "Hết lượt hỏi hôm nay."
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
      if (trialAccess) {
        void refreshProfile();
      }

      return {
        ok: true as const,
        reading: res.answer,
        message: undefined as string | undefined,
      };
    },
    [
      luanContext,
      unlocked,
      calendarTeaserUser,
      trialAccess,
      subActive,
      profile,
      ensureDayLuanThread,
      reading,
      refreshProfile,
      showOnboardingTrialExhaustedModal,
    ],
  );

  const compareWithIso = useCallback(
    async (otherIso: string) => {
      if (!profile || !unlocked || calendarTeaserUser) {
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
    [profile, unlocked, calendarTeaserUser, iso],
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
    if (calendarTeaserUser && !dayLuanPeek) return;
    if (userId) clearInlineReadingFailCooldown(userId, iso);
    const gen = ++loadGenRef.current;
    setReading(null);
    setReadingFailed(false);
    setDailyLimitReached(false);
    if (!subActive) {
      await loadReading(luanContext, gen, iso);
      return;
    }
    setReadingLoading(true);
    const unlock = await ensureReadingUnlocked({
      scope: "day_detail",
      day_iso: iso,
    });
    if (gen !== loadGenRef.current) return;
    if (!unlock.ok || !isReadingUnlockGranted(unlock)) {
      setUnlocked(false);
      setReadingLoading(false);
      setReadingFailed(true);
      return;
    }
    setUnlocked(true);
    await loadReading(luanContext, gen, iso);
  }, [luanContext, subActive, calendarTeaserUser, dayLuanPeek, iso, loadReading]);

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
    readingFailed,
    dailyLimitReached,
    unlocked,
    unlockBusy,
    subActive,
    calendarTeaserUser,
    todayFreePeek,
    trialAccess,
    unlockAndLoad,
    retryReading,
    askFollowUp,
    compareWithIso,
    compareWithTomorrow,
    threadId,
    followUpRemaining,
    serverThreadMessages,
    followUpChatEnabled: Boolean(luanContext && canUseDayLuanChat),
    canUseDayLuanChat,
  };
}
