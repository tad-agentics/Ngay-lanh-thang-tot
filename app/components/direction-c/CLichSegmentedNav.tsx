import { useLocation, useNavigate } from "react-router";

import { CSegmented } from "~/components/brand/CSegmented";

const OPTIONS = [
  { label: "Hôm nay", to: "/lich" },
  { label: "Tháng", to: "/lich/thang" },
] as const;

export function CLichSegmentedNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname.startsWith("/lich/thang") ? 1 : 0;

  return (
    <CSegmented
      options={OPTIONS.map((o) => ({ label: o.label, to: o.to }))}
      activeIndex={active}
      onSelect={(i) => {
        void navigate(OPTIONS[i]?.to ?? "/lich");
      }}
    />
  );
}
