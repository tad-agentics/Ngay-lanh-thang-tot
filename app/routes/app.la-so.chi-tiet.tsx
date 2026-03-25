import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { Chip } from "~/components/Chip";
import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import type { LaSoJson } from "~/lib/api-types";
import { laSoJsonToChiTiet, profileHasLaso } from "~/lib/la-so-ui";

const NGU_HANH_COLORS: Record<string, string> = {
  kim: "var(--nltt-default)",
  moc: "var(--success)",
  thuy: "#4a7a9b",
  hoa: "var(--danger)",
  tho: "#9a7c22",
};

export default function AppLaSoChiTiet() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  useEffect(() => {
    if (loading) return;
    if (!hasLaso) {
      navigate("/app/la-so", { replace: true });
    }
  }, [hasLaso, loading, navigate]);

  if (loading || !profile?.la_so || !hasLaso) {
    return (
      <div className="px-4 pb-8 py-10">
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  const detail = laSoJsonToChiTiet(profile.la_so as LaSoJson);
  const { nguHanh } = detail;

  return (
    <div className="px-4 pb-8">
      <ScreenHeader title="Chi tiết lá số" />

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-surface-foreground/60 text-xs mb-3"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              TỨ TRỤ
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["Giờ", "Ngày", "Tháng", "Năm"] as const).map((label, i) => (
                <div key={label}>
                  <p className="text-surface-foreground/50 text-[10px] mb-2">{label}</p>
                  <div
                    className="bg-surface-foreground/10 py-2 mb-1"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-surface-foreground text-sm font-medium">
                      {detail.thienCan[i] ?? "—"}
                    </p>
                  </div>
                  <div
                    className="bg-surface-foreground/5 py-2"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-surface-foreground/80 text-sm">
                      {detail.diaChi[i] ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-sm font-medium mb-3">Ngũ hành</p>
          <div className="flex flex-col gap-2">
            {(Object.entries(nguHanh) as [string, number][]).map(([key, val]) => {
              const labels: Record<string, string> = {
                kim: "Kim",
                moc: "Mộc",
                thuy: "Thủy",
                hoa: "Hỏa",
                tho: "Thổ",
              };
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs w-8">
                    {labels[key] ?? key}
                  </span>
                  <div
                    className="flex-1 h-1.5 bg-muted overflow-hidden"
                    style={{ borderRadius: "var(--radius-pill)" }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, val)}%`,
                        background: NGU_HANH_COLORS[key] ?? "var(--muted-foreground)",
                        borderRadius: "var(--radius-pill)",
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs w-6 text-right">
                    {val}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-sm font-medium mb-3">Cát thần</p>
          <div className="flex flex-wrap gap-2">
            {detail.thanSat.map((ts) => (
              <Chip key={ts} color="success" size="sm" radius="sm">
                {ts}
              </Chip>
            ))}
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-sm font-medium mb-3">Đại Vận</p>
          <div className="flex flex-col gap-2">
            {detail.daiVanList.map((dv) => (
              <div
                key={`${dv.label}-${dv.years}`}
                className="flex items-center justify-between py-2 px-3"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: dv.isActive ? "var(--surface)" : "transparent",
                  border: dv.isActive ? "none" : "1px solid var(--border)",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{
                    color: dv.isActive ? "var(--accent)" : "var(--foreground)",
                  }}
                >
                  {dv.label}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: dv.isActive
                      ? "var(--surface-foreground)"
                      : "var(--muted-foreground)",
                    fontFamily: "var(--font-ibm-mono)",
                  }}
                >
                  {dv.years}
                </span>
                {dv.isActive ? (
                  <Chip color="accent" size="sm" radius="sm">
                    Hiện tại
                  </Chip>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <Button variant="outline" asChild className="w-full">
          <Link to="/app/la-so">← Lá số tứ trụ</Link>
        </Button>
      </div>
    </div>
  );
}
