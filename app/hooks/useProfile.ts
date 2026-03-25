import { useEffect, useState } from "react";

import { useAuth } from "~/lib/auth";
import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfile(): {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error: qe }) => {
        if (cancelled) return;
        if (qe) setError(qe.message);
        else setError(null);
        setProfile(data ?? null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { profile, loading, error };
}
