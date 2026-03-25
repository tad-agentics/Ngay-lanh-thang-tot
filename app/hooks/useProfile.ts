import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "~/lib/auth";
import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile(): {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch without toggling `loading` — keeps shell mounted (parity with Make / avoids layout flash). */
  refresh: () => Promise<void>;
  /** Full spinner pass (e.g. retry after error). */
  reload: () => Promise<void>;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Bumped on every load(); ignore await results from stale passes (logout, user switch, newer refresh). */
  const loadSeqRef = useRef(0);
  /** Always latest `user` so `refresh` can stay referentially stable and still read the current session. */
  const userRef = useRef(user);
  userRef.current = user;

  const load = useCallback(async (mode: "full" | "silent") => {
    const u = userRef.current;
    const seq = ++loadSeqRef.current;
    if (!u) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (mode === "full") setLoading(true);
    const { data, error: qe } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .maybeSingle();
    if (seq !== loadSeqRef.current) return;
    if (qe) setError(qe.message);
    else setError(null);
    setProfile(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load("full");
  }, [load, user]);

  return {
    profile,
    loading,
    error,
    refresh: () => load("silent"),
    reload: () => load("full"),
  };
}
