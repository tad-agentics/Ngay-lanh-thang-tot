import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import type { Database } from "~/lib/database.types";
import { displayNameFromAuthUser } from "~/lib/profile-display-name";
import { tryConsumePendingReferralClaim } from "~/lib/referral-claim";
import { supabase } from "~/lib/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function useProfileState(user: User): ProfileContextValue {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadSeqRef = useRef(0);
  const userId = user.id;
  const syncedNameRef = useRef(false);

  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  const load = useCallback(async (mode: "full" | "silent") => {
    const seq = ++loadSeqRef.current;
    if (mode === "full" && profileRef.current === null) setLoading(true);
    const { data, error: qe } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (seq !== loadSeqRef.current) return;
    if (qe) setError(qe.message);
    else setError(null);
    setProfile((data ?? null) as Profile | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load("full");
    syncedNameRef.current = false;
  }, [load, userId]);

  useEffect(() => {
    if (!profile || profile.display_name?.trim() || syncedNameRef.current) return;
    const fromAuth = displayNameFromAuthUser(user);
    if (!fromAuth) return;
    syncedNameRef.current = true;
    let cancelled = false;
    void (async () => {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ display_name: fromAuth })
        .eq("id", userId)
        .is("display_name", null);
      if (cancelled || upErr) {
        syncedNameRef.current = false;
        return;
      }
      void load("silent");
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, user, userId, load]);

  /** Fallback when authed shell mounts without `resolvePostLoginPath` (e.g. cold open on `/lich`). */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session?.access_token) return;
      await tryConsumePendingReferralClaim(session);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const onRefresh = () => {
      void load("silent");
    };
    window.addEventListener("ngaytot:profile-refresh", onRefresh);
    return () => window.removeEventListener("ngaytot:profile-refresh", onRefresh);
  }, [load]);

  const refresh = useCallback(() => load("silent"), [load]);
  const reload = useCallback(
    () => load(profileRef.current ? "silent" : "full"),
    [load],
  );

  return useMemo(
    () => ({ profile, loading, error, refresh, reload }),
    [profile, loading, error, refresh, reload],
  );
}

export function ProfileProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const value = useProfileState(user);
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

/** Reads profile loaded once in `ProfileProvider` (app shell). Avoids duplicate Supabase fetches per route. */
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
