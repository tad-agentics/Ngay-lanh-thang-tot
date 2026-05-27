import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { clearPendingReferralCode } from "~/lib/pending-referral";
import {
  markManualSignOut,
  markSessionExpired,
  resetManualSignOutFlag,
} from "~/lib/auth-session-redirect";
import { supabase } from "~/lib/supabase";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          if (/jwt|expired|invalid.*token/i.test(error.message)) {
            markSessionExpired();
          }
          setSession(null);
        } else {
          setSession(data.session ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setLoading(false);
      });

    const { data: subListener } = supabase.auth.onAuthStateChange(
      (event, next) => {
        if (event === "SIGNED_OUT" && !next) {
          markSessionExpired();
          resetManualSignOutFlag();
        }
        setSession(next);
      },
    );

    return () => subListener.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    markManualSignOut();
    clearPendingReferralCode();
    await supabase.auth.signOut();
    resetManualSignOutFlag();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut,
    }),
    [session, loading, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
