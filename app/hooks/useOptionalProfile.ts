import { useEffect, useState } from "react";

import { useAuth } from "~/lib/auth";
import type { Profile } from "~/lib/profile-context";
import { supabase } from "~/lib/supabase";

/** Profile fetch for public routes (e.g. `/ngay/:ngay`) outside `ProfileProvider`. */
export function useOptionalProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile((data ?? null) as Profile | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    user,
    profile,
    loading: authLoading || loading,
  };
}
