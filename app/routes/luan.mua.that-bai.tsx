import { useSearchParams } from "react-router";

import { CPayFailureScreen } from "~/components/direction-c/CPayFailureScreen";

export default function LuanMuaThatBaiRoute() {
  const [searchParams] = useSearchParams();
  const sku = searchParams.get("sku") ?? "luan_bat_tu";

  return (
    <CPayFailureScreen
      retryTo={`/luan/mua/xac-nhan?sku=${sku}`}
      backTo="/toi"
    />
  );
}
