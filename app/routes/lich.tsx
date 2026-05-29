import { useState } from "react";

import { CInstallBanner } from "~/components/CInstallBanner";
import { CHomeScreen } from "~/components/direction-c/CHomeScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import {
  dismissInstallBanner,
  isInstallBannerDismissed,
} from "~/lib/install-banner-dismiss";

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
