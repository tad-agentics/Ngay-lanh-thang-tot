import { Navigate } from "react-router";

/** /app/cai-dat → /app/toi (folded into Tôi tab) */
export default function AppCaiDatRedirect() {
  return <Navigate to="/app/toi" replace />;
}
