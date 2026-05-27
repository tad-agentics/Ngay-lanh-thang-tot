import type { ReactNode } from "react";

import { CSubExpired } from "~/components/CSubExpired";
import { useEntitlements } from "~/hooks/useEntitlements";

type CalendarGateProps = {
  children: ReactNode;
};

/** Blocks calendar UI and data when subscription expired (Direction C artboard 38). */
export function CalendarGate({ children }: CalendarGateProps) {
  const { canUseCalendar } = useEntitlements();
  if (!canUseCalendar) {
    return (
      <div className="flex min-h-full flex-col bg-paper">
        <CSubExpired />
      </div>
    );
  }
  return <>{children}</>;
}
