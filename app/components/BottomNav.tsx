import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CalendarSearch, Compass, Settings2 } from "lucide-react";

import { cn } from "~/components/ui/utils";
import { prefetchCoreAppQueries } from "~/lib/prefetch-app-queries";
import type { BottomNavTab } from "~/lib/nav-config";

interface BottomNavProps {
  activeTab: BottomNavTab | null;
  onTabChange: (tab: BottomNavTab) => void;
  onExploreOpen: () => void;
}

const TABS: { id: BottomNavTab; label: string; Icon: LucideIcon }[] = [
  { id: "lich", label: "Lịch", Icon: CalendarDays },
  { id: "chon-ngay", label: "Chọn ngày", Icon: CalendarSearch },
  { id: "kham-pha", label: "Khám phá", Icon: Compass },
  { id: "cai-dat", label: "Cài đặt", Icon: Settings2 },
];

export function BottomNav({ activeTab, onTabChange, onExploreOpen }: BottomNavProps) {
  const queryClient = useQueryClient();
  const warmCache = () => prefetchCoreAppQueries(queryClient);

  const handleTabClick = (tab: BottomNavTab) => {
    if (tab === "kham-pha") {
      onExploreOpen();
    } else {
      onTabChange(tab);
    }
  };

  return (
    <div className="px-4 py-2">
      <div
        className="flex justify-between items-center gap-1 mx-1 px-1.5 py-1.5 border border-border/80 bg-card/80 backdrop-blur-xl shadow-sm"
        style={{ borderRadius: "var(--radius-pill)" }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const isCore = id === "chon-ngay";
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabClick(id)}
              onPointerEnter={warmCache}
              onTouchStart={warmCache}
              aria-label={label}
              style={{ borderRadius: "var(--radius-pill)", minHeight: 44, minWidth: 44 }}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors flex-1",
                isActive
                  ? "bg-surface/10 text-surface"
                  : isCore
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} aria-hidden />
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : isCore ? "font-semibold" : "font-normal",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
