import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { AuthenticatedMobileShell } from "~/components/AuthenticatedMobileShell";
import { AppShellViewport } from "~/components/AppShellViewport";
import { CSubExpired } from "~/components/CSubExpired";
import { ErrorBanner } from "~/components/ErrorBanner";
import { Button } from "~/components/ui/button";
import { useEntitlements } from "~/hooks/useEntitlements";
import {
  isNeverSubscribedUser,
  isSubscriptionLapsed,
} from "~/lib/entitlements";
import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import { consumeAuthRedirectReason } from "~/lib/auth-session-redirect";
import {
  isCalendarBrowsePath,
  isOnboardingExemptPath,
  isSubscriptionExemptPath,
  legacyAppRedirect,
  sanitizeReturnTo,
} from "~/lib/nav-config";
import {
  firstRunInProgressPath,
  onboardingInProgressPath,
  profileHasBirthChartInput,
  stashPendingReturnTo,
} from "~/lib/pending-return-to";
import { ProfileProvider } from "~/lib/profile-context";
import {
  isSubExpiredBlocked,
  setSubExpiredBlocked,
  subscribeSubExpired,
} from "~/lib/sub-expired";

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
    const params = new URLSearchParams();
    const reason = consumeAuthRedirectReason();
    if (reason === "expired") {
      params.set("reason", "expired");
    }
    const returnTo = sanitizeReturnTo(location.pathname);
    if (returnTo) {
      stashPendingReturnTo(returnTo);
      params.set("return_to", returnTo);
    }
    const qs = params.toString();
    return <Navigate to={qs ? `/dang-nhap?${qs}` : "/dang-nhap"} replace />;
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
  const { canUseCalendar } = useEntitlements();
  const location = useLocation();
  const [, subExpiredTick] = useState(0);

  useEffect(() => subscribeSubExpired(() => subExpiredTick((n) => n + 1)), []);

  useEffect(() => {
    if (!profile) return;
    if (canUseCalendar || isNeverSubscribedUser(profile)) {
      setSubExpiredBlocked(false);
    }
  }, [canUseCalendar, profile]);

  async function retryProfile() {
    await reload();
  }

  if (profileLoading && profile === null) {
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

  const birthProfile = {
    onboarding_completed_at: profile.onboarding_completed_at,
    ngay_sinh: profile.ngay_sinh,
    gio_sinh: profile.gio_sinh,
    gioi_tinh: profile.gioi_tinh,
  };
  if (
    !profileHasBirthChartInput(birthProfile) &&
    !isOnboardingExemptPath(location.pathname)
  ) {
    return (
      <Navigate to={onboardingInProgressPath(birthProfile)} replace />
    );
  }

  if (
    profile.onboarding_completed_at == null &&
    profileHasBirthChartInput(birthProfile) &&
    !isOnboardingExemptPath(location.pathname)
  ) {
    const firstRunPath = firstRunInProgressPath(birthProfile);
    if (location.pathname !== firstRunPath) {
      return <Navigate to={firstRunPath} replace />;
    }
  }

  if (
    profile.onboarding_completed_at != null &&
    profileHasBirthChartInput(birthProfile) &&
    (location.pathname === "/gio-sinh" ||
      location.pathname === "/dang-dung-lich" ||
      location.pathname === "/lich-da-mo")
  ) {
    return <Navigate to="/lich" replace />;
  }

  const onCalendarBrowse = isCalendarBrowsePath(location.pathname);
  const subscriptionBlocked =
    (isSubscriptionLapsed(profile) ||
      (isSubExpiredBlocked() && !onCalendarBrowse)) &&
    !isSubscriptionExemptPath(location.pathname) &&
    !onCalendarBrowse;

  if (subscriptionBlocked) {
    return (
      <AppShellViewport>
        <div className="flex min-h-full flex-col bg-paper">
          <CSubExpired />
        </div>
      </AppShellViewport>
    );
  }

  return (
    <AuthenticatedMobileShell>
      <Outlet />
    </AuthenticatedMobileShell>
  );
}
