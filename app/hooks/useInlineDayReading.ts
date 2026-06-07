import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "~/lib/auth";
import { buildInlineDayReadingInvoke } from "~/lib/inline-day-reading-invoke";
import {
  clearInlineReadingFailCooldown,
  inlineReadingRunKey,
  isInlineReadingFailCooldown,
  markInlineReadingFailCooldown,
  runInlineReadingDeduped,
} from "~/lib/inline-day-reading-coord";
import { invokeGenerateReadingWithRetry } from "~/lib/generate-reading";
import { shortenInlineReading } from "~/lib/inline-reading-text";
import {
  ensureReadingUnlocked,
  isReadingUnlockGranted,
} from "~/lib/reading-unlock";
import { stableStringify } from "~/lib/stable-stringify";
import {
  hasSeenInlineReading,
  markInlineReadingSeen,
  readTodayAiReadingCache,
  writeTodayAiReadingSession,
} from "~/lib/today-reading-cache";

/** Inline NLTT on lịch tờ — subscribers only; calendar-teaser users use engine copy on screen. */
export function useInlineDayReading({
  iso,
  endpoint,
  batTuPayload,
  enabled,
  payloadPending = false,
  subActive,
}: {
  iso: string;
  endpoint: "ngay-hom-nay" | "day-detail";
  batTuPayload: unknown | null;
  enabled: boolean;
  /** Bat-tu payload still loading — keep prior text, show loading. */
  payloadPending?: boolean;
  subActive: boolean;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const payloadRef = useRef(batTuPayload);
  payloadRef.current = batTuPayload;

  const payloadHash = useMemo(
    () => (batTuPayload != null ? stableStringify(batTuPayload) : ""),
    [batTuPayload],
  );

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [instantTyping, setInstantTyping] = useState(false);
  const [paywallBlurred, setPaywallBlurred] = useState(false);

  useEffect(() => {
    if (!enabled || !iso || !userId || !subActive) {
      setText(null);
      setLoading(false);
      setFailed(false);
      setInstantTyping(false);
      setPaywallBlurred(false);
      return;
    }

    const cached = readTodayAiReadingCache(userId, iso);
    if (cached) {
      clearInlineReadingFailCooldown(userId, iso);
      setText(shortenInlineReading(cached));
      setLoading(false);
      setFailed(false);
      setInstantTyping(true);
      setPaywallBlurred(false);
      return;
    }

    if (!payloadHash) {
      if (payloadPending) {
        setLoading(true);
        setFailed(false);
        setPaywallBlurred(false);
        return;
      }
      setText(null);
      setLoading(false);
      setFailed(false);
      setInstantTyping(hasSeenInlineReading(userId, iso));
      setPaywallBlurred(false);
      return;
    }

    if (isInlineReadingFailCooldown(userId, iso)) {
      setLoading(false);
      setFailed(true);
      setInstantTyping(hasSeenInlineReading(userId, iso));
      setPaywallBlurred(false);
      return;
    }

    let cancelled = false;
    setInstantTyping(hasSeenInlineReading(userId, iso));
    setLoading(true);
    setFailed(false);
    setPaywallBlurred(false);

    const runKey = inlineReadingRunKey(userId, iso, endpoint, payloadHash);

    void runInlineReadingDeduped(runKey, async () => {
      const genInput = buildInlineDayReadingInvoke(
        endpoint,
        payloadRef.current,
        "inline",
      );
      const unlockScope =
        genInput.endpoint === "day-detail" ? "day_detail" : "home";
      const unlock = await ensureReadingUnlocked({
        scope: unlockScope,
        day_iso: iso,
      });

      if (!unlock.ok || !isReadingUnlockGranted(unlock)) {
        return { text: null, failed: true };
      }

      const cachedAgain = readTodayAiReadingCache(userId, iso);
      if (cachedAgain) {
        clearInlineReadingFailCooldown(userId, iso);
        return { text: shortenInlineReading(cachedAgain), failed: false };
      }

      const r = await invokeGenerateReadingWithRetry(genInput);
      if (r.reading) {
        const teaser = shortenInlineReading(r.reading);
        clearInlineReadingFailCooldown(userId, iso);
        writeTodayAiReadingSession(userId, iso, teaser);
        return { text: teaser, failed: false };
      }

      if (r.transportError) {
        markInlineReadingFailCooldown(userId, iso);
      }
      return { text: null, failed: true };
    })
      .then((result) => {
        if (cancelled) return;
        if (result.text) {
          setText(result.text);
          setInstantTyping(false);
          setFailed(false);
        } else if (result.failed) {
          setText((prev) => prev);
          setFailed(true);
        }
        setPaywallBlurred(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPaywallBlurred(false);
        setLoading(false);
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    payloadHash,
    payloadPending,
    userId,
    iso,
    endpoint,
    subActive,
  ]);

  const markTypingSeen = () => {
    if (!userId || !iso) return;
    markInlineReadingSeen(userId, iso);
    setInstantTyping(true);
  };

  return {
    text,
    loading,
    failed,
    instantTyping,
    markTypingSeen,
    canAskFollowUp: Boolean(userId) && subActive,
    paywallBlurred: paywallBlurred && Boolean(text || loading),
  };
}
