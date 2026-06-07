import { lazy, Suspense } from "react";
import { Navigate, useSearchParams } from "react-router";

import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { LUAN_LUU_NIEN_NGUYET_TITLE_SHORT } from "~/lib/luan-luu-nien-nguyet-labels";
import { currentYearVn, parseYearFromSearch } from "~/lib/van-trinh-nam-session";

const CVanTrinhNamReadingScreen = lazy(() =>
  import("~/components/direction-c/CVanTrinhNamReadingScreen").then((m) => ({
    default: m.CVanTrinhNamReadingScreen,
  })),
);

function ToiLuanTieuVanScreen() {
  const [searchParams] = useSearchParams();
  const year = parseYearFromSearch(searchParams) ?? currentYearVn();

  return (
    <DirectionCScreenBoundary screen={LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            Đang tải luận…
          </div>
        }
      >
        <CVanTrinhNamReadingScreen year={year} />
      </Suspense>
    </DirectionCScreenBoundary>
  );
}

export default function ToiLuanTieuVanRoute() {
  if (!TIEU_VAN_LUAN_ENABLED) {
    return <Navigate to="/toi" replace />;
  }
  return <ToiLuanTieuVanScreen />;
}
