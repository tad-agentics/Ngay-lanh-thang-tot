import { AppShellViewport } from "~/components/AppShellViewport";
import { CDayDetailScreen } from "~/components/direction-c/CDayDetailScreen";

export default function NgayDetailRoute() {
  return (
    <AppShellViewport>
      <CDayDetailScreen />
    </AppShellViewport>
  );
}
