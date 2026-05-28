import { useAuth } from "~/lib/auth";
import { SavedPicksProvider } from "~/lib/saved-picks-context";

/** Mounts shared saved-picks state for any logged-in route (Tab Tôi + /ngay mark flow). */
export function SavedPicksGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return children;
  return <SavedPicksProvider userId={user.id}>{children}</SavedPicksProvider>;
}
