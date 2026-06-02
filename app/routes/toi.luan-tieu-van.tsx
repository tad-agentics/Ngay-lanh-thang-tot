import { useSearchParams } from "react-router";

import { CVanTrinhNamReadingScreen } from "~/components/direction-c/CVanTrinhNamReadingScreen";
import { DirectionCScreenBoundary } from "~/components/direction-c/DirectionCScreenBoundary";
import { LUAN_LUU_NIEN_NGUYET_TITLE_SHORT } from "~/lib/luan-luu-nien-nguyet-labels";
import { currentYearVn, parseYearFromSearch } from "~/lib/van-trinh-nam-session";

export default function ToiLuanTieuVanRoute() {
  const [searchParams] = useSearchParams();
  const year = parseYearFromSearch(searchParams) ?? currentYearVn();

  return (
    <DirectionCScreenBoundary screen={LUAN_LUU_NIEN_NGUYET_TITLE_SHORT}>
      <CVanTrinhNamReadingScreen year={year} />
    </DirectionCScreenBoundary>
  );
}
