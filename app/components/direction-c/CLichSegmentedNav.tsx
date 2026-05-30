import { useLocation, useNavigate } from "react-router";

import { CSegmented } from "~/components/brand/CSegmented";

const OPTIONS = [
  { label: "Hôm nay", to: "/lich" },
  { label: "Lịch tháng", to: "/lich/thang" },
] as const;

type CLichSegmentedNavProps = {
  dark?: boolean;
};

export function CLichSegmentedNav({ dark = false }: CLichSegmentedNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname.startsWith("/lich/thang") ? 1 : 0;

  return (
    <div className="pt-4">
      <CSegmented
        dark={dark}
        options={OPTIONS.map((o) => ({ label: o.label, to: o.to }))}
        activeIndex={active}
        onSelect={(i) => {
          void navigate(OPTIONS[i]?.to ?? "/lich");
        }}
      />
    </div>
  );
}
