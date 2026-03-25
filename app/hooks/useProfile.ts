import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "~/lib/auth";
import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile(): {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Bumped on every load(); ignore await results from stale passes (logout, user switch, newer refresh). */
  const loadSeqRef = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: qe } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (seq !== loadSeqRef.current) return;
    if (qe) setError(qe.message);
    else setError(null);
    setProfile(data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, refresh: load };
}
