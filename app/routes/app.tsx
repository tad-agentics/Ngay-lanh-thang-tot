import { Navigate, useLocation } from "react-router";

import { legacyAppRedirect } from "~/lib/nav-config";

/** Legacy `/app/*` tree — redirect to Direction C routes. */
export default function AppShellLayout() {
  const location = useLocation();
  const target = legacyAppRedirect(location.pathname) ?? "/lich";
  const qs = location.search ?? "";
  return <Navigate to={`${target}${qs}`} replace />;
}
