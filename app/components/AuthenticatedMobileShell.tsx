import type { ReactNode } from "react";
import { useLocation } from "react-router";

import { AppShellViewport } from "~/components/AppShellViewport";
import { CBottomNav } from "~/components/brand/CBottomNav";
import { CSubscriptionExpiryBanner } from "~/components/direction-c/CSubscriptionExpiryBanner";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { getActiveTab, shouldShowNav } from "~/lib/nav-config";

type AuthenticatedMobileShellProps = {
  children: ReactNode;
};

export function AuthenticatedMobileShell({ children }: AuthenticatedMobileShellProps) {
  const location = useLocation();
  const online = useOnlineStatus();
  const showNav = shouldShowNav(location.pathname);
  const activeTab = getActiveTab(location.pathname);
  const lichTab =
    location.pathname === "/lich" || location.pathname.startsWith("/lich/");
  const darkNav = !online && lichTab;
  return (
    <AppShellViewport>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: showNav ? 88 : 0 }}
      >
        {lichTab ? <CSubscriptionExpiryBanner /> : null}
        {children}
      </div>
      {showNav && activeTab ? (
        <CBottomNav active={activeTab} dark={darkNav} />
      ) : null}
    </AppShellViewport>
  );
}
