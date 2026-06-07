import { useLocation } from "react-router";

import { useBaziReadingPrewarm } from "~/hooks/useBaziReadingPrewarm";
import { useVanTrinhNamPrewarm } from "~/hooks/useVanTrinhNamPrewarm";
import { useProfile } from "~/hooks/useProfile";
import {
  routeUsesBaziPrewarm,
  routeUsesVanTrinhNamPrewarm,
} from "~/lib/route-performance-gates";

/** Prewarm chỉ trên route cần luận — tránh noise trên `/lich`, `/tra-cuu`. */
export function ReadingPrewarmGate() {
  const { pathname } = useLocation();
  const { profile } = useProfile();
  const baziOn = routeUsesBaziPrewarm(pathname);
  const vanOn = routeUsesVanTrinhNamPrewarm(pathname);

  useBaziReadingPrewarm(baziOn ? profile : null);
  useVanTrinhNamPrewarm(vanOn ? profile : null);
  return null;
}
