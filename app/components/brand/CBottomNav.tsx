/**
 * Direction C — 3-tab floating pill: Lịch · Tra cứu · Tôi
 */

import { NavLink } from "react-router";

import type { BottomNavTab } from "~/lib/nav-config";
import { TAB_ROUTES } from "~/lib/nav-config";

type CBottomNavProps = {
  active: BottomNavTab;
  dark?: boolean;
};

function IconCalendar({ active, dark }: { active: boolean; dark: boolean }) {
  const c = active
    ? dark
      ? "var(--gold)"
      : "var(--forest)"
    : dark
      ? "rgba(237,231,211,0.6)"
      : "var(--muted-warm)";
  return (
    <svg
      width={19}
      height={19}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="3.8" y="5" width="16.4" height="15" rx="1" />
      <path d="M3.8 9 H20.2 M8 3 V7 M16 3 V7" />
      {active ? (
        <circle cx="12" cy="14.5" r="1.6" fill={c} stroke="none" />
      ) : null}
    </svg>
  );
}

function IconSearch({ active, dark }: { active: boolean; dark: boolean }) {
  const c = active
    ? dark
      ? "var(--gold)"
      : "var(--forest)"
    : dark
      ? "rgba(237,231,211,0.6)"
      : "var(--muted-warm)";
  return (
    <svg
      width={19}
      height={19}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 L20 20" />
    </svg>
  );
}

function IconUser({ active, dark }: { active: boolean; dark: boolean }) {
  const c = active
    ? dark
      ? "var(--gold)"
      : "var(--forest)"
    : dark
      ? "rgba(237,231,211,0.6)"
      : "var(--muted-warm)";
  return (
    <svg
      width={19}
      height={19}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21 C4.5 16, 8 14, 12 14 C16 14, 19.5 16, 19.5 21" />
    </svg>
  );
}

const TABS: {
  id: BottomNavTab;
  label: string;
  Icon: typeof IconCalendar;
}[] = [
  { id: "lich", label: "Lịch", Icon: IconCalendar },
  { id: "tra-cuu", label: "Tra cứu", Icon: IconSearch },
  { id: "toi", label: "Tôi", Icon: IconUser },
];

export function CBottomNav({ active, dark = false }: CBottomNavProps) {
  const bg = dark ? "rgba(14,28,20,0.92)" : "rgba(241,236,225,0.96)";
  const border = dark
    ? "1px solid rgba(197,165,90,0.18)"
    : "1px solid rgba(154,124,34,0.18)";

  return (
    <nav
      aria-label="Điều hướng chính"
      className="pointer-events-none fixed bottom-6 left-0 right-0 z-40 flex justify-center px-[22px]"
    >
      <div
        className="pointer-events-auto flex w-full max-w-[min(100%,22rem)] gap-1 rounded-full px-[5px] py-[7px] backdrop-blur-[14px]"
        style={{
          background: bg,
          border,
          boxShadow: dark
            ? "0 8px 20px rgba(0,0,0,0.35)"
            : "0 6px 16px rgba(0,0,0,0.08)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.Icon;
          return (
            <NavLink
              key={tab.id}
              to={TAB_ROUTES[tab.id]}
              className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-full px-1 py-1.5 no-underline"
              style={{
                background: isActive
                  ? dark
                    ? "rgba(197,165,90,0.15)"
                    : "rgba(29,49,41,0.07)"
                  : "transparent",
              }}
            >
              <Icon active={isActive} dark={dark} />
              <span
                className="mt-[3px] font-[family-name:var(--display-2)] text-[10px] uppercase tracking-[0.04em]"
                style={{
                  fontWeight: isActive ? 700 : 600,
                  color: isActive
                    ? dark
                      ? "var(--gold)"
                      : "var(--forest)"
                    : dark
                      ? "rgba(237,231,211,0.6)"
                      : "var(--muted-warm)",
                }}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
