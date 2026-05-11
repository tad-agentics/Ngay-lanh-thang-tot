import { Navigate, Outlet, useLocation } from "react-router";

import { AppMobileShell } from "~/components/AppMobileShell";
import { AppShellViewport } from "~/components/AppShellViewport";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { FeatureCostsProvider } from "~/hooks/useFeatureCosts";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { ProfileProvider } from "~/lib/profile-context";
import { profileHasLaso } from "~/lib/la-so-ui";

/** Allowed while `onboarding_completed_at` is null (purchase path from welcome). */
function isOnboardingExemptPath(pathname: string): boolean {
  return (
    pathname === "/app/bat-dau" ||
    pathname === "/app/mua-luong" ||
    pathname === "/app/mua-luong/thanh-cong"
  );
}

export default function AppShellLayout() {
  const { user, loading: authLoading, signOut } = useAuth();

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
    return <Navigate to="/dang-nhap" replace />;
  }

  return (
    <ProfileProvider user={user}>
      <AppShellWithProfile signOut={signOut} />
    </ProfileProvider>
  );
}

function AppShellWithProfile({
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

  /** Profile fetch finished but no row / error — do not expose app routes as if onboarding passed. */
  if (profile === null) {
    const message =
      profileError ??
      "Không tìm thấy hồ sơ tài khoản. Thử tải lại hoặc đăng xuất và đăng nhập lại.";
    return (
      <AppShellViewport>
        <main className="flex-1 space-y-6 overflow-y-auto px-4 py-10 pb-8">
          <ErrorBanner message={message} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => void retryProfile()}
            >
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
    return <Navigate to="/app/bat-dau" replace />;
  }

  const hasLaso = profileHasLaso(profile.la_so);

  return (
    <FeatureCostsProvider>
      <AppMobileShell hasLaso={hasLaso}>
        <Outlet />
      </AppMobileShell>
    </FeatureCostsProvider>
  );
}

