import { Navigate, useParams } from "react-router";

import { CAiSectionedScreen } from "~/components/direction-c/CAiSectionedScreen";
import { parseLuanContext } from "~/lib/luan-context";

export default function LuanAiDayDuRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind === "invalid") {
    return <Navigate to="/lich" replace />;
  }

  return <CAiSectionedScreen iso={parsed.iso} />;
}
