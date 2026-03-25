import { lazy, Suspense, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

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
    <div className="flex flex-col bg-background w-full" style={{ height: "100dvh" }}>
      <div
        className="flex-1 overflow-y-auto min-h-0"
        style={{ paddingBottom: showNav ? 72 : 0 }}
      >
        {children}
      </div>

      {showNav ? (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <BottomNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onExploreOpen={() => setShowExplore(true)}
          />
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
    </div>
  );
}
