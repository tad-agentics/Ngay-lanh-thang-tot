import type { ReactNode } from "react";
import { useLocation } from "react-router";

import { SavedPicksProvider } from "~/lib/saved-picks-context";
import { useAuth } from "~/lib/auth";
import { routeUsesSavedPicks } from "~/lib/route-performance-gates";

export function SavedPicksRouteGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user || !routeUsesSavedPicks(pathname)) {
    return <>{children}</>;
  }

  return <SavedPicksProvider userId={user.id}>{children}</SavedPicksProvider>;
}
