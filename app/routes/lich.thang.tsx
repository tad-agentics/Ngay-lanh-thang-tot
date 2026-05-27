import { CalendarGate } from "~/components/CalendarGate";
import { CMonthScreen } from "~/components/direction-c/CMonthScreen";

export default function LichThangRoute() {
  return (
    <CalendarGate>
      <CMonthScreen />
    </CalendarGate>
  );
}
