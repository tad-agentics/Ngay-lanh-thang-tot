import { useEffect, useRef, useState } from "react";

import { useAuth } from "~/lib/auth";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { shortenInlineReading } from "~/lib/inline-reading-text";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import {
  hasSeenInlineReading,
  markInlineReadingSeen,
  readTodayAiReadingCache,
  writeTodayAiReadingSession,
} from "~/lib/today-reading-cache";

export function useInlineDayReading({
  iso,
  endpoint,
  batTuPayload,
  enabled,
}: {
  iso: string;
  endpoint: "ngay-hom-nay" | "day-detail";
  batTuPayload: unknown | null;
  enabled: boolean;
}) {
  const { user } = useAuth();
  const payloadRef = useRef(batTuPayload);
  payloadRef.current = batTuPayload;

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instantTyping, setInstantTyping] = useState(false);

  useEffect(() => {
    if (!enabled || !iso || !user) {
      setText(null);
      setLoading(false);
      setInstantTyping(false);
      return;
    }

    const userId = user.id;
    const cached = readTodayAiReadingCache(userId, iso);
    if (cached) {
      setText(shortenInlineReading(cached));
      setLoading(false);
      setInstantTyping(true);
      return;
    }

    if (!batTuPayload) {
      setText(null);
      setLoading(false);
      setInstantTyping(hasSeenInlineReading(userId, iso));
      return;
    }

    let cancelled = false;
    setInstantTyping(hasSeenInlineReading(userId, iso));

    void (async () => {
      const scope = endpoint === "ngay-hom-nay" ? "home" : "day_detail";
      const unlock = await invokeReadingUnlock({
        dry_run: true,
        scope,
        day_iso: iso,
      });
      if (cancelled) return;

      const allowed =
        unlock.ok &&
        (unlock.unlocked === true ||
          unlock.already_unlocked === true ||
          unlock.subscription_free === true);

      if (!allowed) {
        setText(null);
        setLoading(false);
        return;
      }

      const cachedAgain = readTodayAiReadingCache(userId, iso);
      if (cachedAgain) {
        setText(shortenInlineReading(cachedAgain));
        setLoading(false);
        setInstantTyping(true);
        return;
      }

      setLoading(true);
      const r = await invokeGenerateReading({
        endpoint,
        data: payloadRef.current,
        variant: "inline",
      });
      if (cancelled) return;
      if (r.reading) {
        const teaser = shortenInlineReading(r.reading);
        setText(teaser);
        writeTodayAiReadingSession(userId, iso, teaser);
        setInstantTyping(false);
      } else {
        setText(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, batTuPayload, user, iso, endpoint]);

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
    canAskFollowUp: Boolean(user),
  };
}
