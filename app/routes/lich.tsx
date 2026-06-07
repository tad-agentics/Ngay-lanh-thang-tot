import { useState } from "react";

import { CInstallBanner } from "~/components/CInstallBanner";
import { CHomeScreen } from "~/components/direction-c/CHomeScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import {
  dismissInstallBanner,
  isInstallBannerDismissed,
} from "~/lib/install-banner-dismiss";
import { getAppQueryClient } from "~/lib/query-client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import {
  readTodayHomeSession,
  todayIsoInVn,
} from "~/lib/today-reading-cache";

/** Hydrate TanStack Query từ session cache — không gọi BatTu khi chưa có profile. */
export async function clientLoader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const dayIso = todayIsoInVn();
  const cached = readTodayHomeSession(userId, dayIso);
  if (!cached) return null;

  const client = getAppQueryClient();
  client.setQueryData(queryKeys.todayLich(userId, dayIso), cached);
  return null;
}

export default function LichRoute() {
  const [installHidden, setInstallHidden] = useState(() => isInstallBannerDismissed());

  function dismissInstall() {
    dismissInstallBanner();
    setInstallHidden(true);
  }

  return (
    <DirectionCScreenBoundary screen="Lịch">
      {!installHidden ? <CInstallBanner onDismiss={dismissInstall} /> : null}
      <CHomeScreen />
    </DirectionCScreenBoundary>
  );
}
