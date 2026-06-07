import { lazy, Suspense } from "react";

import { withDirectionCScreenBoundary } from "~/components/direction-c/withDirectionCScreenBoundary";

const CBaziReadingScreen = lazy(() =>
  import("~/components/direction-c/CBaziReadingScreen").then((m) => ({
    default: m.CBaziReadingScreen,
  })),
);

function LuanBatTuScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
          Đang tải luận…
        </div>
      }
    >
      <CBaziReadingScreen />
    </Suspense>
  );
}

export default withDirectionCScreenBoundary(LuanBatTuScreen, "Luận Bát tự");
