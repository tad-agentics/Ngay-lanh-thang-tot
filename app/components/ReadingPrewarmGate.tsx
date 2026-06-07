import { useLocation } from "react-router";

import {
  useBaziPaywallTeaserPrewarm,
  useBaziReadingPrewarm,
} from "~/hooks/useBaziReadingPrewarm";
import { useVanTrinhNamPrewarm } from "~/hooks/useVanTrinhNamPrewarm";
import { useProfile } from "~/hooks/useProfile";
import {
  routeUsesBaziPrewarm,
  routeUsesBaziTeaserPrewarm,
  routeUsesVanTrinhNamPrewarm,
} from "~/lib/route-performance-gates";

/** Prewarm luận/teaser chỉ trên route cần — tránh noise trên `/tra-cuu`, v.v. */
export function ReadingPrewarmGate() {
  const { pathname } = useLocation();
  const { profile } = useProfile();
  const baziOn = routeUsesBaziPrewarm(pathname);
  const baziTeaserOn = routeUsesBaziTeaserPrewarm(pathname);
  const vanOn = routeUsesVanTrinhNamPrewarm(pathname);

  useBaziReadingPrewarm(baziOn ? profile : null);
  useBaziPaywallTeaserPrewarm(baziTeaserOn ? profile : null);
  useVanTrinhNamPrewarm(vanOn ? profile : null);
  return null;
}
