import { Coins } from "lucide-react";
import { useNavigate } from "react-router";

import { useProfile } from "~/hooks/useProfile";
import {
  creditsBalanceChipLabel,
  creditsBalanceFootnote,
  subscriptionActive,
} from "~/lib/subscription";
import { cn } from "~/components/ui/utils";

/**
 * Chip số dư / «Không giới hạn» giống trang chủ — bấm vào chuyển Mua lượng.
 * `forDarkSurface`: header nền tối (vd. chi tiết ngày).
 */
export function CreditsHeaderChip({
  forDarkSurface = false,
  className,
}: {
  forDarkSurface?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const foot = creditsBalanceFootnote(profile);
  const subOn = subscriptionActive(profile?.subscription_expires_at);

  return (
    <button
      type="button"
      onClick={() => void navigate("/app/mua-luong")}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 shrink-0 border",
        forDarkSurface
          ? "border-surface-foreground/25 text-surface-foreground bg-surface-foreground/5"
          : "border-border text-foreground",
        className,
      )}
      style={{ borderRadius: "var(--radius-pill)", minHeight: 36 }}
      title={foot ?? undefined}
    >
      <Coins
        size={13}
        className={forDarkSurface ? "text-primary" : "text-accent"}
        strokeWidth={1.5}
      />
      <span
        style={{
          fontFamily: "var(--font-ibm-mono)",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {creditsBalanceChipLabel(profile)}
        {foot ? "" : " lượng"}
      </span>
      {subOn ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
            forDarkSurface
              ? "bg-primary/30 text-surface-foreground"
              : "bg-primary/15 text-primary",
          )}
        >
          Gói
        </span>
      ) : null}
    </button>
  );
}
