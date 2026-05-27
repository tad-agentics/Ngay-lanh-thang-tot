import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

import { AppShellViewport } from "~/components/AppShellViewport";
import { BottomNav } from "~/components/BottomNav";
import {
  getLegacyActiveTab,
  LEGACY_TAB_ROUTES,
  shouldShowLegacyNav,
  type LegacyBottomNavTab,
} from "~/lib/nav-config-legacy";

export function AppMobileShell({
  children,
  hasLaso,
}: {
  children: ReactNode;
  hasLaso: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const showNav = shouldShowLegacyNav(location.pathname);
  const activeTab = getLegacyActiveTab(location.pathname);

  const handleTabChange = (tab: LegacyBottomNavTab) => {
    void navigate(LEGACY_TAB_ROUTES[tab]);
  };

  const handleFab = () => {
    void navigate("/app/chon-ngay");
  };

  // Redirect ?explore=open to /app/tra-cuu (legacy Explore sheet links)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("explore") === "open") {
      void navigate("/app/tra-cuu", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <AppShellViewport>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: showNav ? 72 : 0 }}
      >
        {children}
      </div>

      {showNav ? (
        <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[var(--app-shell-max-width)] -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto">
            <BottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onExploreOpen={handleFab}
            />
          </div>
        </div>
      ) : null}
    </AppShellViewport>
  );
}
