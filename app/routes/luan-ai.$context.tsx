import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, useParams } from "react-router";

import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { TIEU_VAN_LUAN_ENABLED } from "~/lib/feature-flags";
import { parseLuanContext } from "~/lib/luan-context";
import { LUAN_LUU_NIEN_NGUYET_TITLE_SHORT } from "~/lib/luan-luu-nien-nguyet-labels";

const CAiTypedScreen = lazy(() =>
  import("~/components/direction-c/CAiTypedScreen").then((m) => ({
    default: m.CAiTypedScreen,
  })),
);
const CBaziReadingScreen = lazy(() =>
  import("~/components/direction-c/CBaziReadingScreen").then((m) => ({
    default: m.CBaziReadingScreen,
  })),
);
const CTieuVanLuanScreen = lazy(() =>
  import("~/components/direction-c/CTieuVanLuanScreen").then((m) => ({
    default: m.CTieuVanLuanScreen,
  })),
);

function LuanSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
          Đang tải luận…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function LuanAiContextRoute() {
  const { context } = useParams();
  const parsed = parseLuanContext(context);

  if (parsed.kind === "invalid") {
    return <Navigate to="/lich" replace />;
  }

  if (!TIEU_VAN_LUAN_ENABLED && parsed.kind === "tieu-van") {
    return <Navigate to="/lich" replace />;
  }

  let screen = "Luận AI";
  let body: ReactNode;
  if (parsed.kind === "bazi-year") {
    screen = "Luận Bát tự";
    body = (
      <LuanSuspense>
        <CBaziReadingScreen />
      </LuanSuspense>
    );
  } else if (parsed.kind === "tieu-van") {
    screen = LUAN_LUU_NIEN_NGUYET_TITLE_SHORT;
    body = (
      <LuanSuspense>
        <CTieuVanLuanScreen year={parsed.year} />
      </LuanSuspense>
    );
  } else {
    screen = "Luận ngày";
    body = (
      <LuanSuspense>
        <CAiTypedScreen iso={parsed.iso} />
      </LuanSuspense>
    );
  }

  return <DirectionCScreenBoundary screen={screen}>{body}</DirectionCScreenBoundary>;
}
