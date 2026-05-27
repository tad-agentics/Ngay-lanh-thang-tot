import { Navigate, useParams } from "react-router";

import { CAiTypedScreen } from "~/components/direction-c/CAiTypedScreen";
import { parseLuanContext } from "~/lib/luan-context";

export default function LuanAiContextRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind === "invalid") {
    return <Navigate to="/lich" replace />;
  }

  return <CAiTypedScreen iso={parsed.iso} />;
}
