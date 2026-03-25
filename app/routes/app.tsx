import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";

/** Allowed while `onboarding_completed_at` is null (purchase path from welcome). */
function isOnboardingExemptPath(pathname: string): boolean {
  return (
    pathname === "/app/bat-dau" ||
    pathname === "/app/mua-luong" ||
    pathname === "/app/mua-luong/thanh-cong"
  );
}

export default function AppShellLayout() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background text-muted-foreground text-sm">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/dang-nhap" replace />;
  }

  if (profileLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background text-muted-foreground text-sm">
        Đang tải hồ sơ…
      </div>
    );
  }

  const needsOnboarding =
    profile != null && profile.onboarding_completed_at == null;

  if (needsOnboarding && !isOnboardingExemptPath(location.pathname)) {
    return <Navigate to="/app/bat-dau" replace />;
  }

  return <Outlet />;
}
