import { Navigate, useParams } from "react-router";

import { parseLuanContext, luanContextToParam } from "~/lib/luan-context";

/** Legacy route — sectioned breakdown lives on `/luan-ai/:context#chi-tiet`. */
export default function LuanAiDayDuRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind !== "day") {
    return <Navigate to="/lich" replace />;
  }

  return (
    <Navigate
      to={`/luan-ai/${luanContextToParam(parsed.iso)}#chi-tiet`}
      replace
    />
  );
}
