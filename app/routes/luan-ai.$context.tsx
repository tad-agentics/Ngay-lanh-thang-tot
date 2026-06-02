import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router";

import { CAiTypedScreen } from "~/components/direction-c/CAiTypedScreen";
import { CBaziReadingScreen } from "~/components/direction-c/CBaziReadingScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { CTieuVanLuanScreen } from "~/components/direction-c/CTieuVanLuanScreen";
import { parseLuanContext } from "~/lib/luan-context";
import { LUAN_LUU_NIEN_NGUYET_TITLE_SHORT } from "~/lib/luan-luu-nien-nguyet-labels";

export default function LuanAiContextRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind === "invalid") {
    return <Navigate to="/lich" replace />;
  }

  let screen = "Luận AI";
  let body: ReactNode;
  if (parsed.kind === "bazi-year") {
    screen = "Luận Bát tự";
    body = <CBaziReadingScreen />;
  } else if (parsed.kind === "tieu-van") {
    screen = LUAN_LUU_NIEN_NGUYET_TITLE_SHORT;
    body = <CTieuVanLuanScreen year={parsed.year} />;
  } else {
    screen = "Luận ngày";
    body = <CAiTypedScreen iso={parsed.iso} />;
  }

  return <DirectionCScreenBoundary screen={screen}>{body}</DirectionCScreenBoundary>;
}
