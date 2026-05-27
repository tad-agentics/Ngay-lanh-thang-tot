import { CSubExpired } from "~/components/CSubExpired";
import { CMonthScreen } from "~/components/direction-c/CMonthScreen";
import { useEntitlements } from "~/hooks/useEntitlements";

export default function LichThangRoute() {
  const { canUseCalendar } = useEntitlements();

  return (
    <>
      <CMonthScreen />
      {!canUseCalendar ? <CSubExpired /> : null}
    </>
  );
}
