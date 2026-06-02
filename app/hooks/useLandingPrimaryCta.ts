import { useEffect, useMemo, useState } from "react";

import { resolvePostLoginPath } from "~/lib/auth-post-login";
import { useAuth } from "~/lib/auth";
import {
  buildLandingOpenCalendarHref,
  buildLandingSignUpHref,
} from "~/lib/landing-entry";

export type LandingPrimaryCta = {
  primaryHref: string;
  primaryLabel: string;
  openCalendarHref: string;
  /** Show “Đã có tài khoản? Mở lịch” under hero / bottom CTAs. */
  showReturningLink: boolean;
  /** Block navigation until auth / post-login path is known. */
  disabled: boolean;
  heroSubline: string;
  /** Append “ →” on forest/gold CTA buttons (signup flow only). */
  showPrimaryArrow: boolean;
};

function heroSubline(args: {
  resolving: boolean;
  hasUser: boolean;
  showReturningLink: boolean;
}): string {
  if (args.resolving) {
    return args.hasUser
      ? "Đang tải lịch của bạn…"
      : "Khởi tạo trong 30 giây · Trải nghiệm ngay miễn phí";
  }
  if (args.showReturningLink) {
    return "Tài khoản mới — khởi tạo trong 30 giây · miễn phí";
  }
  return "Tiếp tục xem lịch hôm nay theo bản mệnh của bạn";
}

/**
 * Landing hero / footer CTAs:
 * - Signed in → post-login destination (usually `/lich`).
 * - Signed out → signup, plus link to login for returning users.
 */
export function useLandingPrimaryCta(referralFromUrl: string): LandingPrimaryCta {
  const { user, loading: authLoading } = useAuth();
  const [signedInDest, setSignedInDest] = useState<string | null>(null);

  const signUpHref = useMemo(
    () => buildLandingSignUpHref(referralFromUrl),
    [referralFromUrl],
  );
  const openCalendarHref = useMemo(
    () => buildLandingOpenCalendarHref(referralFromUrl),
    [referralFromUrl],
  );

  useEffect(() => {
    if (authLoading || !user) {
      setSignedInDest(null);
      return;
    }
    let cancelled = false;
    void resolvePostLoginPath().then((dest) => {
      if (!cancelled) setSignedInDest(dest);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const resolving = authLoading || (Boolean(user) && signedInDest == null);
  const showReturningLink = !user && !authLoading;

  if (resolving) {
    return {
      primaryHref: signUpHref,
      primaryLabel: user ? "Đang tải…" : "Khởi tạo lịch bản mệnh",
      openCalendarHref,
      showReturningLink: false,
      disabled: true,
      heroSubline: heroSubline({
        resolving: true,
        hasUser: Boolean(user),
        showReturningLink: false,
      }),
      showPrimaryArrow: false,
    };
  }

  if (user && signedInDest) {
    const label =
      signedInDest === "/lich"
        ? "Mở lịch của tôi"
        : signedInDest === "/dang-dung-lich"
          ? "Tiếp tục thiết lập"
          : "Tiếp tục";
    return {
      primaryHref: signedInDest,
      primaryLabel: label,
      openCalendarHref,
      showReturningLink: false,
      disabled: false,
      heroSubline: heroSubline({
        resolving: false,
        hasUser: true,
        showReturningLink: false,
      }),
      showPrimaryArrow: false,
    };
  }

  return {
    primaryHref: signUpHref,
    primaryLabel: "Khởi tạo lịch bản mệnh",
    openCalendarHref,
    showReturningLink: true,
    disabled: false,
    heroSubline: heroSubline({
      resolving: false,
      hasUser: false,
      showReturningLink: true,
    }),
    showPrimaryArrow: true,
  };
}
