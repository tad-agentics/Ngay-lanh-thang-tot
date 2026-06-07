import { useEffect, useRef, useState } from "react";

import { useAuth } from "~/lib/auth";
import { buildInlineDayReadingInvoke } from "~/lib/inline-day-reading-invoke";
import { invokeGenerateReadingWithRetry } from "~/lib/generate-reading";
import { shortenInlineReading } from "~/lib/inline-reading-text";
import {
  ensureReadingUnlocked,
  isReadingUnlockGranted,
} from "~/lib/reading-unlock";
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
  const payloadRef = useRef(batTuPayload);
  payloadRef.current = batTuPayload;

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instantTyping, setInstantTyping] = useState(false);
  const [paywallBlurred, setPaywallBlurred] = useState(false);

  useEffect(() => {
    if (!enabled || !iso || !user || !subActive) {
      setText(null);
      setLoading(false);
      setInstantTyping(false);
      setPaywallBlurred(false);
      return;
    }

    const userId = user.id;

    const cached = readTodayAiReadingCache(userId, iso);
    if (cached) {
      setText(shortenInlineReading(cached));
      setLoading(false);
      setInstantTyping(true);
      setPaywallBlurred(false);
      return;
    }

    if (!batTuPayload) {
      if (payloadPending) {
        setLoading(true);
        setPaywallBlurred(false);
        return;
      }
      setText(null);
      setLoading(false);
      setInstantTyping(hasSeenInlineReading(userId, iso));
      setPaywallBlurred(false);
      return;
    }

    let cancelled = false;
    setInstantTyping(hasSeenInlineReading(userId, iso));
    setLoading(true);
    setPaywallBlurred(false);

    void (async () => {
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
      if (cancelled) return;

      if (!unlock.ok || !isReadingUnlockGranted(unlock)) {
        setText(null);
        setLoading(false);
        setPaywallBlurred(false);
        return;
      }

      const cachedAgain = readTodayAiReadingCache(userId, iso);
      if (cachedAgain) {
        setText(shortenInlineReading(cachedAgain));
        setLoading(false);
        setInstantTyping(true);
        setPaywallBlurred(false);
        return;
      }
      const r = await invokeGenerateReadingWithRetry(genInput);
      if (cancelled) return;
      if (r.reading) {
        const teaser = shortenInlineReading(r.reading);
        setText(teaser);
        writeTodayAiReadingSession(userId, iso, teaser);
        setInstantTyping(false);
      } else {
        setText((prev) => prev);
      }
      setPaywallBlurred(false);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, batTuPayload, payloadPending, user, iso, endpoint, subActive]);

  const markTypingSeen = () => {
    if (!user?.id || !iso) return;
    markInlineReadingSeen(user.id, iso);
    setInstantTyping(true);
  };

  return {
    text,
    loading,
    instantTyping,
    markTypingSeen,
    canAskFollowUp: Boolean(user) && subActive,
    paywallBlurred: paywallBlurred && Boolean(text || loading),
  };
}
