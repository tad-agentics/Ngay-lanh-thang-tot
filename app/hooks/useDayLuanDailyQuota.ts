import { useCallback, useEffect, useState } from "react";

import {
  DAY_LUAN_MAX_FOLLOW_UPS,
  invokeDayLuanDailyQuota,
} from "~/lib/day-luan-chat";

/** Poll global day-luan quota (10/user/VN-day shared pool). */
export function useDayLuanDailyQuota(enabled = true) {
  const [followUpRemaining, setFollowUpRemaining] = useState(
    DAY_LUAN_MAX_FOLLOW_UPS,
  );
  const [quotaLoaded, setQuotaLoaded] = useState(false);

  const refreshQuota = useCallback(async () => {
    const res = await invokeDayLuanDailyQuota();
    if (res.ok) {
      setFollowUpRemaining(res.follow_up_remaining);
    }
    setQuotaLoaded(true);
    return res;
  }, []);

  useEffect(() => {
    if (enabled) void refreshQuota();
  }, [enabled, refreshQuota]);

  return { followUpRemaining, quotaLoaded, refreshQuota, setFollowUpRemaining };
}
