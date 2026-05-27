/**
 * Direction B BottomNav — 5-cell with center FAB above the row.
 * Forest-dark background per design. Perf dots decoration on top edge.
 * Tabs: home / month / (FAB = chọn ngày) / book / me
 */

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { prefetchCoreAppQueries } from "~/lib/prefetch-app-queries";
import { HM } from "~/lib/maket-tokens";
import type { LegacyBottomNavTab } from "~/lib/nav-config-legacy";

interface BottomNavProps {
  activeTab: LegacyBottomNavTab | null;
  onTabChange: (tab: LegacyBottomNavTab) => void;
  /** FAB click = navigate to /app/chon-ngay. Kept as prop for backward compat. */
  onExploreOpen?: () => void;
}

const CREAM_MUTED = "rgba(212,200,154,0.5)";

function NavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const s: React.SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </svg>
      );
    case "month":
      return (
        <svg {...s}>
          <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
          <circle cx="12" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "book":
      return (
        <svg {...s}>
          <path d="M5 5h11a3 3 0 0 1 3 3v11H8a3 3 0 0 1-3-3V5z" />
          <path d="M9 9h6M9 12.5h6M9 16h4" />
        </svg>
      );
    case "me":
      return (
        <svg {...s}>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...s} strokeWidth={2}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    default:
      return null;
  }
}

function PerfDots() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0 8px",
        height: 6,
        alignItems: "center",
        background: HM.forest,
      }}
    >
      {Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "rgba(197,165,90,0.28)",
          }}
        />
      ))}
    </div>
  );
}

type TabDef = {
  id: LegacyBottomNavTab;
  ic: string;
  vi: string;
};

const TABS: TabDef[] = [
  { id: "home", ic: "home", vi: "Hôm nay" },
  { id: "month", ic: "month", vi: "Tháng" },
  { id: "lookup", ic: "book", vi: "Tra cứu" },
  { id: "me", ic: "me", vi: "Tôi" },
];

export function BottomNav({ activeTab, onTabChange, onExploreOpen }: BottomNavProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const warmCache = () => prefetchCoreAppQueries(queryClient);

  const handleTabClick = (tab: LegacyBottomNavTab) => {
    onTabChange(tab);
  };

  const handleFab = () => {
    if (onExploreOpen) {
      onExploreOpen();
    } else {
      void navigate("/app/chon-ngay");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: HM.forest,
        borderTop: `1px solid ${HM.borderChip}`,
        flexShrink: 0,
      }}
    >
      <PerfDots />
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          padding: "4px 0 6px",
          position: "relative",
        }}
      >
        {/* First two real tabs */}
        {TABS.slice(0, 2).map((t) => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabClick(t.id)}
              onPointerEnter={warmCache}
              aria-label={t.vi}
              aria-current={on ? "page" : undefined}
              style={{
                flex: 1,
                padding: "6px 0 4px",
                textAlign: "center",
                background: "transparent",
                border: "none",
                borderTop: on ? `2px solid ${HM.gold}` : "2px solid transparent",
                marginTop: -6,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: on ? HM.gold : CREAM_MUTED,
                transition: "color 0.15s ease",
                minHeight: 44,
                minWidth: 44,
              }}
            >
              <NavIcon name={t.ic} size={20} />
              <span
                style={{
                  fontFamily: HM.mono,
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "1.32px",
                  color: on ? HM.cream : HM.muted,
                  textTransform: "uppercase",
                }}
              >
                {t.vi}
              </span>
            </button>
          );
        })}

        {/* Centre FAB slot */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -34,
              fontFamily: HM.display,
              fontSize: 11,
              fontWeight: 700,
              color: HM.gold,
              textTransform: "uppercase",
              letterSpacing: "1.32px",
              whiteSpace: "nowrap",
            }}
          >
            Chọn ngày
          </div>
          <button
            type="button"
            onClick={handleFab}
            aria-label="Chọn ngày lành"
            style={{
              marginTop: -22,
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: HM.gold,
              border: "none",
              boxShadow: `0 6px 14px rgba(0,0,0,0.35), 0 0 0 4px ${HM.forest}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: HM.forestDeep,
              cursor: "pointer",
              transition: "transform 0.12s ease, box-shadow 0.12s ease",
              flexShrink: 0,
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.94)";
            }}
            onPointerUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
            onPointerLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            <NavIcon name="plus" size={24} />
          </button>
        </div>

        {/* Last two real tabs */}
        {TABS.slice(2).map((t) => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabClick(t.id)}
              onPointerEnter={warmCache}
              aria-label={t.vi}
              aria-current={on ? "page" : undefined}
              style={{
                flex: 1,
                padding: "6px 0 4px",
                textAlign: "center",
                background: "transparent",
                border: "none",
                borderTop: on ? `2px solid ${HM.gold}` : "2px solid transparent",
                marginTop: -6,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: on ? HM.gold : CREAM_MUTED,
                transition: "color 0.15s ease",
                minHeight: 44,
                minWidth: 44,
              }}
            >
              <NavIcon name={t.ic} size={20} />
              <span
                style={{
                  fontFamily: HM.mono,
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "1.32px",
                  color: on ? HM.cream : HM.muted,
                  textTransform: "uppercase",
                }}
              >
                {t.vi}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
