import { sanitizeReturnTo } from "~/lib/nav-config";

const STORAGE_KEY = "ngaytot:return_to";

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

/** After login — keep pending return_to through first-run if onboarding incomplete. */
export function destinationAfterAuth(onboardingComplete: boolean): string {
  if (!onboardingComplete) return "/gio-sinh";
  return consumePendingReturnTo() ?? "/lich";
}

/** After first-run reveal CTA — honor stashed deep link from anon visit. */
export function destinationAfterOnboarding(): string {
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
