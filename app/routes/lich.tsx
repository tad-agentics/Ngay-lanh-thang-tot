import { useState } from "react";

import { CInstallBanner } from "~/components/CInstallBanner";
import { CSubExpired } from "~/components/CSubExpired";
import { CHomeScreen } from "~/components/direction-c/CHomeScreen";
import { useEntitlements } from "~/hooks/useEntitlements";

export default function LichRoute() {
  const { canUseCalendar } = useEntitlements();
  const [installDismissed, setInstallDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("ngaytot:install-banner-dismissed") === "1";
  });

  function dismissInstall() {
    window.localStorage.setItem("ngaytot:install-banner-dismissed", "1");
    setInstallDismissed(true);
  }

  return (
    <>
      {!installDismissed ? (
        <div className="absolute left-0 right-0 top-0 z-30">
          <CInstallBanner onDismiss={dismissInstall} />
        </div>
      ) : null}
      <CHomeScreen />
      {!canUseCalendar ? <CSubExpired /> : null}
    </>
  );
}
