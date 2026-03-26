import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { Chip } from "~/components/Chip";
import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
import { Button } from "~/components/ui/button";
import { cn } from "~/components/ui/utils";
import { useProfile } from "~/hooks/useProfile";
import type { LaSoJson } from "~/lib/api-types";
import { laSoJsonToChiTiet, profileHasLaso } from "~/lib/la-so-ui";

/** Thanh ngũ hành — khớp Make: xám / forest / xanh / đỏ sẫm / ochre. */
const NGU_HANH_COLORS: Record<string, string> = {
  kim: "oklch(0.62 0.02 80)",
  moc: "var(--forest)",
  thuy: "#4a7a9b",
  hoa: "var(--danger)",
  tho: "#a67c29",
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
      <div className="min-h-[40vh] bg-background px-4 pb-8 py-10">
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  const detail = laSoJsonToChiTiet(profile.la_so as LaSoJson);
  const { nguHanh } = detail;

  return (
    <div className="min-h-[60vh] bg-background px-4 pb-24">
      <ScreenHeader
        title="Chi tiết lá số"
        showBack={false}
        appScreenTitle
      />

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-forest text-forest-foreground px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-forest-foreground/55 text-[10px] font-medium tracking-widest mb-3"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              TỨ TRỤ
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(["Giờ", "Ngày", "Tháng", "Năm"] as const).map((label, i) => (
                <div key={label}>
                  <p className="text-forest-foreground/50 text-[10px] mb-2 font-medium">
                    {label}
                  </p>
                  <div
                    className="bg-forest-foreground/12 py-2 mb-1"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-make-cta text-sm font-semibold">
                      {detail.thienCan[i] ?? "—"}
                    </p>
                  </div>
                  <div
                    className="bg-forest-foreground/8 py-2"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <p className="text-make-cta/95 text-sm font-medium">
                      {detail.diaChi[i] ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-base font-semibold mb-3">Ngũ hành</p>
          <div className="flex flex-col gap-2.5">
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
                  <span className="text-foreground text-xs font-medium w-9 shrink-0">
                    {labels[key] ?? key}
                  </span>
                  <div
                    className="flex-1 h-2 bg-make-cta/28 overflow-hidden min-w-0"
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
                  <span className="text-muted-foreground text-xs w-9 text-right tabular-nums shrink-0">
                    {val}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-base font-semibold mb-3">Cát thần</p>
          <div className="flex flex-wrap gap-2">
            {detail.thanSat.map((ts) => (
              <Chip
                key={ts}
                color="success"
                size="sm"
                radius="sm"
                className="!bg-forest/12 !text-forest font-medium"
              >
                {ts}
              </Chip>
            ))}
          </div>
        </div>

        <div
          className="bg-card border border-border px-4 py-4 shadow-sm"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-base font-semibold mb-3">Đại Vận</p>
          <div className="flex flex-col gap-2">
            {detail.daiVanList.map((dv) => (
              <div
                key={`${dv.label}-${dv.years}`}
                className={cn(
                  "flex items-center gap-2 py-2.5 px-3 rounded-[var(--radius-sm)]",
                  dv.isActive
                    ? "bg-forest text-make-cta shadow-sm"
                    : "border border-border bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold flex-1 min-w-0",
                    dv.isActive ? "text-make-cta" : "text-foreground",
                  )}
                >
                  {dv.label}
                </span>
                <span
                  className={cn(
                    "text-xs tabular-nums shrink-0",
                    dv.isActive ? "text-make-cta" : "text-muted-foreground",
                  )}
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  {dv.years}
                </span>
                {dv.isActive ? (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/22 text-make-cta border border-make-cta/30">
                    Hiện tại
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <Button variant="outline" asChild className="w-full font-medium">
          <Link to="/app/la-so">← Lá số tứ trụ</Link>
        </Button>
      </div>
    </div>
  );
}
