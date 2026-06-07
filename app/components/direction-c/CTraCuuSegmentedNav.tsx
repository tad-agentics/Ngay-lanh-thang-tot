import { useLocation, useNavigate } from "react-router";

import { CSegmented } from "~/components/brand/CSegmented";
import { HOP_TUOI_ENABLED } from "~/lib/feature-flags";

const OPTIONS = [
  { label: "Ngày lành", to: "/tra-cuu" },
  ...(HOP_TUOI_ENABLED
    ? [{ label: "Hợp tuổi", to: "/tra-cuu/hop-tuoi" } as const]
    : []),
] as const;

export function CTraCuuSegmentedNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (OPTIONS.length <= 1) return null;

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
