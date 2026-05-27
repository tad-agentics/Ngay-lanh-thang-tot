import type { ReactNode } from "react";
import { useLocation } from "react-router";

import { AppShellViewport } from "~/components/AppShellViewport";
import { CBottomNav } from "~/components/brand/CBottomNav";
import { getActiveTab, shouldShowNav } from "~/lib/nav-config";

type AuthenticatedMobileShellProps = {
  children: ReactNode;
  /** Forest-dark pages use dark nav variant */
  darkNav?: boolean;
};

export function AuthenticatedMobileShell({
  children,
  darkNav = false,
}: AuthenticatedMobileShellProps) {
  const location = useLocation();
  const showNav = shouldShowNav(location.pathname);
  const activeTab = getActiveTab(location.pathname);
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const useDarkNav = darkNav || path === "/lich";

  return (
    <AppShellViewport>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: showNav ? 88 : 0 }}
      >
        {children}
      </div>
      {showNav && activeTab ? (
        <CBottomNav active={activeTab} dark={useDarkNav} />
      ) : null}
    </AppShellViewport>
  );
}
