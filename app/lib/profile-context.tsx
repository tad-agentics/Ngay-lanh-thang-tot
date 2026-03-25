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

  const load = useCallback(async (mode: "full" | "silent") => {
    const seq = ++loadSeqRef.current;
    if (mode === "full") setLoading(true);
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
  }, [load, userId]);

  const refresh = useCallback(() => load("silent"), [load]);
  const reload = useCallback(() => load("full"), [load]);

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
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
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
