import { Navigate, useParams } from "react-router";

import { CAiTypedScreen } from "~/components/direction-c/CAiTypedScreen";
import { CBaziReadingScreen } from "~/components/direction-c/CBaziReadingScreen";
import { CTieuVanLuanScreen } from "~/components/direction-c/CTieuVanLuanScreen";
import { parseLuanContext } from "~/lib/luan-context";

export default function LuanAiContextRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind === "bazi-year") {
    return <CBaziReadingScreen />;
  }

  if (parsed.kind === "tieu-van") {
    return <CTieuVanLuanScreen year={parsed.year} />;
  }

  if (parsed.kind === "invalid") {
    return <Navigate to="/lich" replace />;
  }

  return <CAiTypedScreen iso={parsed.iso} />;
}
