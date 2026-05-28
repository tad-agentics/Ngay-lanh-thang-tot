import { useState } from "react";

import { CInstallBanner } from "~/components/CInstallBanner";
import { CHomeScreen } from "~/components/direction-c/CHomeScreen";
import { CSubscriptionExpiryBanner } from "~/components/direction-c/CSubscriptionExpiryBanner";
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
    <>
      {!installHidden ? <CInstallBanner onDismiss={dismissInstall} /> : null}
      <CSubscriptionExpiryBanner />
      <CHomeScreen />
    </>
  );
}
