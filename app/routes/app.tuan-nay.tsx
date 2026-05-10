import { Navigate } from "react-router";

/** 308-style client redirect — /app/tuan-nay → /app/thang */
export default function AppTuanNayRedirect() {
  return <Navigate to="/app/thang" replace />;
}
