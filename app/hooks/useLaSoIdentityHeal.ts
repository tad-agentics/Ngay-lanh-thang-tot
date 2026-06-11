import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import {
  baziReadingBirthRevision,
} from "~/lib/bazi-reading-session";
import { clearUserReadingSessionCaches } from "~/lib/la-so-recompute-invalidate";
import { profileLaSoNeedsRecompute } from "~/lib/la-so-display-merge";
import type { Profile } from "~/lib/profile-context";

const HEAL_SESSION_PREFIX = "la-so-identity-heal:";

function healSessionKey(profile: Profile): string {
  return `${HEAL_SESSION_PREFIX}${profile.id}:${baziReadingBirthRevision(profile)}`;
}

function shouldRunHeal(profile: Profile, pathname: string): boolean {
  if (!profileLaSoNeedsRecompute(profile)) return false;
  if (profile.la_so_recompute_status === "pending") return false;
  if (pathname === "/dang-dung-lich") return false;
  return true;
}

/**
 * Tự gọi `tu-tru` khi `profiles.la_so` lệch ngày/giờ sinh — sửa DB + invalidate cache FE.
 * Một lần / birth revision / phiên (sessionStorage).
 */
export function useLaSoIdentityHeal(
  profile: Profile | null,
  profileLoading: boolean,
): void {
  const { pathname } = useLocation();
  const inflightRef = useRef(false);

  useEffect(() => {
    if (profileLoading || !profile || !shouldRunHeal(profile, pathname)) {
      return;
    }

    const key = healSessionKey(profile);
    try {
      if (sessionStorage.getItem(key) === "1") return;
    } catch {
      /* private mode */
    }

    if (inflightRef.current) return;
    inflightRef.current = true;

    const body = profileToBatTuPersonQuery(profile);
    if (!body.birth_date || body.birth_time == null) {
      inflightRef.current = false;
      return;
    }

    let cancelled = false;
    void invokeBatTu<unknown>({ op: "tu-tru", body }).then((res) => {
      inflightRef.current = false;
      if (cancelled || !res.ok) return;
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
      clearUserReadingSessionCaches(profile.id);
      window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    });

    return () => {
      cancelled = true;
    };
  }, [profile, profileLoading, pathname]);
}
