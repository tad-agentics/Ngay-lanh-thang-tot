import { Navigate } from "react-router";

/** /app/hom-nay → /app (folded into home tab) */
export default function AppHomNayRedirect() {
  return <Navigate to="/app" replace />;
}
