import { lazy, Suspense, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

import { AppShellViewport } from "~/components/AppShellViewport";
import { BottomNav } from "~/components/BottomNav";
import { getActiveTab, shouldShowNav, type BottomNavTab } from "~/lib/nav-config";

const ExploreSheetModal = lazy(() =>
  import("~/components/ExploreSheetModal").then((m) => ({
    default: m.ExploreSheetModal,
  })),
);

export function AppMobileShell({
  children,
  hasLaso,
}: {
  children: ReactNode;
  hasLaso: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExplore, setShowExplore] = useState(false);

  const showNav = shouldShowNav(location.pathname);
  const activeTab = getActiveTab(location.pathname);

  const handleTabChange = (tab: BottomNavTab) => {
    if (tab === "lich") void navigate("/app");
    else if (tab === "chon-ngay") void navigate("/app/chon-ngay");
    else if (tab === "cai-dat") void navigate("/app/cai-dat");
  };

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
              onExploreOpen={() => setShowExplore(true)}
            />
          </div>
        </div>
      ) : null}

      {showExplore ? (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 bg-foreground/20"
              aria-busy="true"
              aria-label="Đang mở"
            />
          }
        >
          <ExploreSheetModal
            isOpen
            onClose={() => setShowExplore(false)}
            hasLaso={hasLaso}
          />
        </Suspense>
      ) : null}
    </AppShellViewport>
  );
}
