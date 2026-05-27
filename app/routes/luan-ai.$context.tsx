import { Navigate, useParams } from "react-router";

import { CAiTypedScreen } from "~/components/direction-c/CAiTypedScreen";
import { parseLuanContext } from "~/lib/luan-context";

export default function LuanAiContextRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind === "bazi-year") {
    return <Navigate to="/toi/luan-bat-tu" replace />;
  }

  if (parsed.kind === "tieu-van") {
    return (
      <Navigate to={`/toi/luan-tieu-van?year=${parsed.year}`} replace />
    );
  }

  if (parsed.kind === "invalid") {
    return <Navigate to="/lich" replace />;
  }

  return <CAiTypedScreen iso={parsed.iso} />;
}
