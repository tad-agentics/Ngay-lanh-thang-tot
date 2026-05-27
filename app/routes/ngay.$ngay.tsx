import { CalendarGate } from "~/components/CalendarGate";
import { CDayDetailScreen } from "~/components/direction-c/CDayDetailScreen";

export default function NgayDetailRoute() {
  return (
    <CalendarGate>
      <CDayDetailScreen />
    </CalendarGate>
  );
}
