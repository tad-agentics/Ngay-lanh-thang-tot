import { Navigate } from "react-router";

/** 308-style client redirect — /app/lich-thang → /app/thang */
export default function AppLichThangRedirect() {
  return <Navigate to="/app/thang" replace />;
}
