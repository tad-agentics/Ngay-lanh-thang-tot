import { CTieuVanLuanScreen } from "~/components/direction-c/CTieuVanLuanScreen";
import { withDirectionCScreenBoundary } from "~/components/direction-c/withDirectionCScreenBoundary";
import { LUAN_LUU_NIEN_NGUYET_TITLE_SHORT } from "~/lib/luan-luu-nien-nguyet-labels";

export default withDirectionCScreenBoundary(
  CTieuVanLuanScreen,
  LUAN_LUU_NIEN_NGUYET_TITLE_SHORT,
);
