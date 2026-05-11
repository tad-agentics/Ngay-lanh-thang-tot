import { Navigate } from "react-router";

/** /app/van-thang → /app/tieu-van (route renamed per wave4-tieu-van) */
export default function AppVanThangRedirect() {
  return <Navigate to="/app/tieu-van" replace />;
}
