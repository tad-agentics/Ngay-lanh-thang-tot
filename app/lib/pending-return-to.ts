import { sanitizeReturnTo } from "~/lib/nav-config";

const STORAGE_KEY = "ngaytot:return_to";
/** Set when `/dang-dung-lich` animation finishes; cleared on reveal CTA. */
const FIRST_RUN_BUILD_KEY = "ngaytot:first_run_build_done";

export function returnToFromSearchParams(
  params: URLSearchParams,
): string | null {
  return sanitizeReturnTo(params.get("return_to") ?? params.get("returnTo"));
}

export function stashPendingReturnTo(path: string | null): void {
  try {
    if (!path) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* private mode / SSR */
  }
}

export function readPendingReturnTo(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function consumePendingReturnTo(): string | null {
  const raw = readPendingReturnTo();
  stashPendingReturnTo(null);
  return sanitizeReturnTo(raw);
}

export type PostLoginProfile = {
  onboarding_completed_at: string | null;
  ngay_sinh: string | null;
  gio_sinh?: string | null;
  gioi_tinh?: string | null;
};

export function profileHasGioiTinh(
  prof: Pick<PostLoginProfile, "gioi_tinh"> | null | undefined,
): boolean {
  return prof?.gioi_tinh === "nam" || prof?.gioi_tinh === "nu";
}

/** Ngày sinh + canh giờ + giới tính đủ để dựng lá số (một màn `/dang-ky`). */
export function profileHasBirthChartInput(
  prof: PostLoginProfile | null | undefined,
): boolean {
  const hasBirthDate =
    prof?.ngay_sinh != null && String(prof.ngay_sinh).trim() !== "";
  const hasGioSinh =
    prof?.gio_sinh != null && String(prof.gio_sinh).trim() !== "";
  return hasBirthDate && hasGioSinh && profileHasGioiTinh(prof);
}

export function markFirstRunBuildDone(): void {
  try {
    sessionStorage.setItem(FIRST_RUN_BUILD_KEY, "1");
  } catch {
    /* private mode / SSR */
  }
}

export function clearFirstRunBuildDone(): void {
  try {
    sessionStorage.removeItem(FIRST_RUN_BUILD_KEY);
  } catch {
    /* private mode / SSR */
  }
}

export function hasFirstRunBuildDone(): boolean {
  try {
    return sessionStorage.getItem(FIRST_RUN_BUILD_KEY) === "1";
  } catch {
    return false;
  }
}

/** Route for users still in first-run (before `onboarding_completed_at`). */
export function onboardingInProgressPath(
  prof: PostLoginProfile | null | undefined,
): "/dang-ky" | "/dang-dung-lich" {
  return profileHasBirthChartInput(prof) ? "/dang-dung-lich" : "/dang-ky";
}

/** Building screen → reveal → app; honors session flag if build already finished. */
export function firstRunInProgressPath(
  prof: PostLoginProfile | null | undefined,
): "/dang-ky" | "/dang-dung-lich" | "/lich-da-mo" {
  if (!profileHasBirthChartInput(prof)) return "/dang-ky";
  if (hasFirstRunBuildDone()) return "/lich-da-mo";
  return "/dang-dung-lich";
}

/** After login — keep pending return_to through first-run if onboarding incomplete. */
export function destinationAfterAuth(
  onboardingComplete: boolean,
  hasBirthChartInput = true,
): string {
  if (!hasBirthChartInput) return "/dang-ky";
  if (!onboardingComplete) {
    return hasFirstRunBuildDone() ? "/lich-da-mo" : "/dang-dung-lich";
  }
  return consumePendingReturnTo() ?? "/lich";
}

export function destinationAfterAuthFromProfile(
  prof: PostLoginProfile | null | undefined,
): string {
  const onboardingComplete = prof?.onboarding_completed_at != null;
  if (!profileHasBirthChartInput(prof)) return "/dang-ky";
  if (!onboardingComplete) return firstRunInProgressPath(prof);
  return consumePendingReturnTo() ?? "/lich";
}

/** After first-run reveal CTA — honor stashed deep link from anon visit. */
export function destinationAfterOnboarding(): string {
  clearFirstRunBuildDone();
  return consumePendingReturnTo() ?? "/lich";
}

export function appendReturnToQuery(
  path: string,
  returnTo: string | null,
): string {
  if (!returnTo) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}return_to=${encodeURIComponent(returnTo)}`;
}
