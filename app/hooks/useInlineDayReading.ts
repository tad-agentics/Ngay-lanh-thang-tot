import { useEffect, useState } from "react";

import { useAuth } from "~/lib/auth";
import { invokeGenerateReading } from "~/lib/generate-reading";
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
        setText(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      const r = await invokeGenerateReading({ endpoint, data: batTuPayload });
      if (cancelled) return;
      if (r.reading) {
        setText(r.reading);
        writeTodayAiReadingSession(user.id, iso, r.reading);
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
