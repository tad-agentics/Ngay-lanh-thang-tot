import { Navigate, useSearchParams } from "react-router";

import { CTieuVanLuanScreen } from "~/components/direction-c/CTieuVanLuanScreen";

export default function ToiLuanTieuVanRoute() {
  const [params] = useSearchParams();
  const year = Number.parseInt(params.get("year") ?? "", 10);
  if (!Number.isFinite(year)) {
    return <Navigate to="/toi" replace />;
  }
  return <CTieuVanLuanScreen year={year} />;
}
