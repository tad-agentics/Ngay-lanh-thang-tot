import { useCallback } from "react";

import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import type { NgayHomNayHome } from "~/lib/home-bat-tu";
import {
  readTodayHomeSession,
  writeTodayHomeSession,
} from "~/lib/today-reading-cache";

/** Cache last `ngay-hom-nay` parse for Tab Lịch offline (sessionStorage; W4 hook surface). */
export function useOfflineCalendar(userId: string | undefined, dayIso: string) {
  const online = useOnlineStatus();

  const readCached = useCallback((): NgayHomNayHome | null => {
    if (!userId) return null;
    return readTodayHomeSession(userId, dayIso);
  }, [userId, dayIso]);

  const writeCached = useCallback(
    (home: NgayHomNayHome) => {
      if (!userId) return;
      writeTodayHomeSession(userId, dayIso, home);
    },
    [userId, dayIso],
  );

  return { online, readCached, writeCached };
}
