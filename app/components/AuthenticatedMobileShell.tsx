import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";

import { AppShellViewport } from "~/components/AppShellViewport";
import { CBottomNav } from "~/components/brand/CBottomNav";
import { CPaymentRecoveryBanner } from "~/components/direction-c/CPaymentRecoveryBanner";
import { CSubscriptionExpiryBanner } from "~/components/direction-c/CSubscriptionExpiryBanner";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { usePaymentRecovery } from "~/hooks/usePaymentRecovery";
import { useTraCuuThinkingOverlay } from "~/hooks/useTraCuuThinkingOverlay";
import { getActiveTab, shouldShowNav } from "~/lib/nav-config";

type AuthenticatedMobileShellProps = {
  children: ReactNode;
};

export function AuthenticatedMobileShell({ children }: AuthenticatedMobileShellProps) {
  const location = useLocation();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const online = useOnlineStatus();
  const { offer, checking, dismiss, checkPaymentStatus } = usePaymentRecovery();
  const traCuuThinking = useTraCuuThinkingOverlay();
  const traCuuSuppressNav =
    traCuuThinking && location.pathname.startsWith("/tra-cuu");
  const showNav = shouldShowNav(location.pathname) && !traCuuSuppressNav;
  const activeTab = getActiveTab(location.pathname);
  const lichTab =
    location.pathname === "/lich" || location.pathname.startsWith("/lich/");
  const darkNav = !online && lichTab;

  useLayoutEffect(() => {
    mainScrollRef.current?.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <AppShellViewport>
      <div
        ref={mainScrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: showNav ? 88 : 0 }}
      >
        {lichTab ? <CSubscriptionExpiryBanner /> : null}
        {offer ? (
          <CPaymentRecoveryBanner
            offer={offer}
            checking={checking}
            onCheck={() => void checkPaymentStatus()}
            onDismiss={dismiss}
          />
        ) : null}
        {children}
      </div>
      {showNav && activeTab ? (
        <CBottomNav active={activeTab} dark={darkNav} />
      ) : null}
    </AppShellViewport>
  );
}
