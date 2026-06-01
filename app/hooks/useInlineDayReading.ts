import { useEffect, useRef, useState } from "react";

import { useAuth } from "~/lib/auth";
import { buildInlineDayReadingInvoke } from "~/lib/inline-day-reading-invoke";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { shortenInlineReading } from "~/lib/inline-reading-text";
import {
  ensureReadingUnlocked,
  isReadingUnlockGranted,
} from "~/lib/reading-unlock";
import {
  hasSeenInlineReading,
  markInlineReadingSeen,
  readTodayAiReadingCache,
  todayIsoInVn,
  writeTodayAiReadingSession,
} from "~/lib/today-reading-cache";

export function useInlineDayReading({
  iso,
  endpoint,
  batTuPayload,
  enabled,
  subActive,
  newUserTeaser,
}: {
  iso: string;
  endpoint: "ngay-hom-nay" | "day-detail";
  batTuPayload: unknown | null;
  enabled: boolean;
  subActive: boolean;
  /** User mới chưa từng đăng ký gói — teaser hôm nay; ngày khác dùng copy engine trên màn. */
  newUserTeaser: boolean;
}) {
  const { user } = useAuth();
  const payloadRef = useRef(batTuPayload);
  payloadRef.current = batTuPayload;

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instantTyping, setInstantTyping] = useState(false);
  const [paywallBlurred, setPaywallBlurred] = useState(false);

  useEffect(() => {
    if (!enabled || !iso || !user) {
      setText(null);
      setLoading(false);
      setInstantTyping(false);
      setPaywallBlurred(false);
      return;
    }

    const userId = user.id;
    const todayIso = todayIsoInVn();
    const freeNeverSubToday =
      newUserTeaser &&
      (endpoint === "ngay-hom-nay" || iso === todayIso);

    if (newUserTeaser && !freeNeverSubToday) {
      setText(null);
      setLoading(false);
      setInstantTyping(false);
      setPaywallBlurred(false);
      return;
    }

    if (!newUserTeaser && subActive) {
      const cached = readTodayAiReadingCache(userId, iso);
      if (cached) {
        setText(shortenInlineReading(cached));
        setLoading(false);
        setInstantTyping(true);
        setPaywallBlurred(false);
        return;
      }
    }

    if (!batTuPayload) {
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
      if (freeNeverSubToday) {
        const genInput = buildInlineDayReadingInvoke(
          endpoint,
          payloadRef.current,
          "teaser",
        );
        let r = await invokeGenerateReading(genInput);
        if (!r.reading && !r.transportError) {
          r = await invokeGenerateReading(genInput);
        }
        if (cancelled) return;
        if (r.reading) {
          setText(shortenInlineReading(r.reading));
          setInstantTyping(false);
        } else {
          setText(null);
        }
        setPaywallBlurred(false);
        setLoading(false);
        return;
      }

      if (!subActive) {
        setText(null);
        setLoading(false);
        setPaywallBlurred(false);
        return;
      }

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
      const r = await invokeGenerateReading(genInput);
      if (cancelled) return;
      if (r.reading) {
        const teaser = shortenInlineReading(r.reading);
        setText(teaser);
        writeTodayAiReadingSession(userId, iso, teaser);
        setInstantTyping(false);
      } else {
        setText(null);
      }
      setPaywallBlurred(false);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, batTuPayload, user, iso, endpoint, subActive, newUserTeaser]);

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
