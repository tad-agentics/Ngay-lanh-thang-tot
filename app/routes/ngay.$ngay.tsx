import { CDayDetailScreen } from "~/components/direction-c/CDayDetailScreen";
import { CSubExpired } from "~/components/CSubExpired";
import { useEntitlements } from "~/hooks/useEntitlements";

export default function NgayDetailRoute() {
  const { canUseCalendar } = useEntitlements();

  return (
    <>
      <CDayDetailScreen />
      {!canUseCalendar ? <CSubExpired /> : null}
    </>
  );
}
