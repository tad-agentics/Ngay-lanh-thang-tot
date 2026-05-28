import { useEffect, useState } from "react";

import { useAuth } from "~/lib/auth";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { shortenInlineReading } from "~/lib/inline-reading-text";
import { invokeReadingUnlock } from "~/lib/reading-unlock";
import {
  readTodayAiReadingSession,
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
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !batTuPayload || !user) {
      setText(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
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

      const cached = readTodayAiReadingSession(user.id, iso);
      if (cached) {
        setText(shortenInlineReading(cached));
        setLoading(false);
        return;
      }

      setLoading(true);
      const r = await invokeGenerateReading({
        endpoint,
        data: batTuPayload,
        variant: "inline",
      });
      if (cancelled) return;
      if (r.reading) {
        const teaser = shortenInlineReading(r.reading);
        setText(teaser);
        writeTodayAiReadingSession(user.id, iso, teaser);
      } else {
        setText(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, batTuPayload, user, iso, endpoint]);

  return {
    text,
    loading,
    canAskFollowUp: Boolean(user),
  };
}
