import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";

import { BottomNav } from "~/components/BottomNav";
import { ExploreSheetModal } from "~/components/ExploreSheetModal";
import { getActiveTab, shouldShowNav, type BottomNavTab } from "~/lib/nav-config";

const PWA_SESSION_KEY = "nltt_session_count";
const PWA_DISMISSED_KEY = "pwa_install_dismissed";

function incrementSessionCount(): number {
  const prev = Number.parseInt(sessionStorage.getItem(PWA_SESSION_KEY) ?? "0", 10);
  const next = Number.isFinite(prev) ? prev + 1 : 1;
  sessionStorage.setItem(PWA_SESSION_KEY, String(next));
  return next;
}

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

  // PWA nudge — run once on mount only (parity with Make `AppShell`; avoids double-count on remount).
  useEffect(() => {
    const alreadyDismissed = localStorage.getItem(PWA_DISMISSED_KEY) === "true";
    const alreadyInstalled = window.matchMedia("(display-mode: standalone)").matches;
    if (alreadyDismissed || alreadyInstalled) return;

    const sessionCount = incrementSessionCount();
    if (sessionCount >= 2) {
      const t = window.setTimeout(() => void navigate("/app/cai-dat-app"), 800);
      return () => window.clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: one-shot per document mount
  }, []);

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

      <ExploreSheetModal
        isOpen={showExplore}
        onClose={() => setShowExplore(false)}
        hasLaso={hasLaso}
      />
    </div>
  );
}
