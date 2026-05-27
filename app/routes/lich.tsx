import { useState } from "react";

import { CInstallBanner } from "~/components/CInstallBanner";
import { CHomeScreen } from "~/components/direction-c/CHomeScreen";

export default function LichRoute() {
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
    </>
  );
}
