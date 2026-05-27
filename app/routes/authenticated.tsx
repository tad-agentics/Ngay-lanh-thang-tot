import { Navigate, Outlet, useLocation } from "react-router";

import { AuthenticatedMobileShell } from "~/components/AuthenticatedMobileShell";
import { AppShellViewport } from "~/components/AppShellViewport";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import {
  isOnboardingExemptPath,
  legacyAppRedirect,
} from "~/lib/nav-config";
import { ProfileProvider } from "~/lib/profile-context";

export default function AuthenticatedLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const location = useLocation();

  const legacyTarget = legacyAppRedirect(location.pathname);
  if (legacyTarget) {
    return <Navigate to={legacyTarget} replace />;
  }

  if (authLoading) {
    return (
      <AppShellViewport>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      </AppShellViewport>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/dang-nhap?returnTo=${returnTo}`} replace />;
  }

  return (
    <ProfileProvider user={user}>
      <AuthenticatedShellWithProfile signOut={signOut} />
    </ProfileProvider>
  );
}

function AuthenticatedShellWithProfile({
  signOut,
}: {
  signOut: () => Promise<void>;
}) {
  const { profile, loading: profileLoading, error: profileError, reload } =
    useProfile();
  const location = useLocation();

  async function retryProfile() {
    await reload();
  }

  if (profileLoading) {
    return (
      <AppShellViewport>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Đang tải hồ sơ…
        </div>
      </AppShellViewport>
    );
  }

  if (profile === null) {
    const message =
      profileError ??
      "Không tìm thấy hồ sơ tài khoản. Thử tải lại hoặc đăng xuất và đăng nhập lại.";
    return (
      <AppShellViewport>
        <main className="flex-1 space-y-6 overflow-y-auto px-4 py-10 pb-8">
          <ErrorBanner message={message} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="w-full sm:w-auto" onClick={() => void retryProfile()}>
              Thử tải lại
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void signOut()}
            >
              Đăng xuất
            </Button>
          </div>
        </main>
      </AppShellViewport>
    );
  }

  const needsOnboarding = profile.onboarding_completed_at == null;
  if (needsOnboarding && !isOnboardingExemptPath(location.pathname)) {
    return <Navigate to="/gio-sinh" replace />;
  }

  if (
    profile.onboarding_completed_at != null &&
    (location.pathname === "/gio-sinh" ||
      location.pathname === "/dang-dung-lich" ||
      location.pathname === "/lich-da-mo")
  ) {
    return <Navigate to="/lich" replace />;
  }

  return (
    <AuthenticatedMobileShell>
      <Outlet />
    </AuthenticatedMobileShell>
  );
}
