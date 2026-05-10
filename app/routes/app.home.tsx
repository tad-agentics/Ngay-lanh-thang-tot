import { Navigate } from "react-router";

/** Legacy `/app/home` → canonical tab root `/app`. Home UI lives in `app._index.tsx`. */
export default function AppHomeRedirect() {
  return <Navigate to="/app" replace />;
}
