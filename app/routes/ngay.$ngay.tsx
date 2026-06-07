import { Navigate, useParams } from "react-router";

import { CDayDetailScreen } from "~/components/direction-c/CDayDetailScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { normalizeLichDayIso } from "~/hooks/useLichDayData";
import { useAuth } from "~/lib/auth";
import { lichDayPath } from "~/lib/lich-day-url";
import { todayIsoInVn } from "~/lib/today-reading-cache";

/**
 * Public generic day view for anon/share links; signed-in users inline on `/lich`.
 */
export default function NgayRoute() {
  const { user, loading } = useAuth();
  const { ngay } = useParams();
  const todayIso = todayIsoInVn();
  const iso = normalizeLichDayIso(ngay ?? null, todayIso);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center font-serif text-sm text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  if (user) {
    return <Navigate to={lichDayPath(iso, todayIso)} replace />;
  }

  return (
    <DirectionCScreenBoundary screen="Chi tiết ngày">
      <CDayDetailScreen />
    </DirectionCScreenBoundary>
  );
}
