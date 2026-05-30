import { useLocation, useNavigate } from "react-router";

import { CSegmented } from "~/components/brand/CSegmented";

const OPTIONS = [
  { label: "Ngày lành", to: "/tra-cuu" },
  { label: "Hợp tuổi", to: "/tra-cuu/hop-tuoi" },
] as const;

export function CTraCuuSegmentedNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname.startsWith("/tra-cuu/hop-tuoi") ? 1 : 0;

  return (
    <CSegmented
      options={OPTIONS.map((o) => ({ label: o.label, to: o.to }))}
      activeIndex={active}
      onSelect={(i) => {
        void navigate(OPTIONS[i]?.to ?? "/tra-cuu");
      }}
    />
  );
}
