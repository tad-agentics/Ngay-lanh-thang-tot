import { Navigate, Outlet, useLocation } from "react-router";

import { AppMobileShell } from "~/components/AppMobileShell";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
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
  const { profile, loading: profileLoading, error: profileError, reload } =
    useProfile();
  const location = useLocation();

  async function retryProfile() {
    await reload();
  }

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

  /** Profile fetch finished but no row / error — do not expose app routes as if onboarding passed. */
  if (profile === null) {
    const message =
      profileError ??
      "Không tìm thấy hồ sơ tài khoản. Thử tải lại hoặc đăng xuất và đăng nhập lại.";
    return (
      <main className="px-4 pb-8 py-10 space-y-6">
        <ErrorBanner message={message} />
        <div className="flex flex-col sm:flex-row gap-3">
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
    );
  }

  const needsOnboarding = profile.onboarding_completed_at == null;

  if (needsOnboarding && !isOnboardingExemptPath(location.pathname)) {
    return <Navigate to="/app/bat-dau" replace />;
  }

  const hasLaso = profileHasLaso(profile.la_so);

  return (
    <AppMobileShell hasLaso={hasLaso}>
      <Outlet />
    </AppMobileShell>
  );
}
