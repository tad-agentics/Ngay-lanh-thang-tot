import { Link } from "react-router";

import { Mono } from "~/components/brand";
import { CBaziAddonPriceBadge } from "~/components/direction-c/CBaziAddonPriceBadge";
import { CBaziLockedChaptersHomeTeaser } from "~/components/direction-c/bazi-paywall-chapter-ui";
import { CBaziNguHanhBars } from "~/components/direction-c/CBaziNguHanhBars";
import { useBaziPaywallMenhTeaser } from "~/hooks/useBaziPaywallMenhTeaser";
import type { LaSoJson } from "~/lib/api-types";
import { fallbackFlowYearCanChiLabel } from "~/lib/bazi-reading-outline";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import {
  LUAN_LA_SO_BAT_TU_TAGLINE,
  LUAN_LA_SO_BAT_TU_TITLE,
} from "~/lib/luan-la-so-bat-tu-labels";
import {
  extractMenhTagline,
  laSoJsonToChiTiet,
  laSoJsonToRevealProps,
  profileHasLaso,
} from "~/lib/la-so-ui";
import { truncateMenhProsePreview } from "~/lib/menh-prose-preview";
import { catalogPriceLabel, UI_PACKAGES } from "~/lib/packages";
import type { Profile } from "~/lib/profile-context";

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Mono className="text-[9px] tracking-wide" style={{ color: CT.muted }}>
        {label}
      </Mono>
      <span
        className="font-[family-name:var(--display-2)] text-[13px] font-bold tracking-tight"
        style={{ color: CT.ink }}
      >
        {value}
      </span>
    </div>
  );
}

type CHomeBaziPreviewCardProps = {
  profile: Profile;
};

/** /toi — lá số thật + menh teaser + blur chương; không cần bấm để thấy Nhật chủ/Mệnh. */
export function CHomeBaziPreviewCard({ profile }: CHomeBaziPreviewCardProps) {
  const pkg = UI_PACKAGES.find((p) => p.sku === "luan_bat_tu");
  const yearCanChi = fallbackFlowYearCanChiLabel(currentYearVn()) ?? "";
  const { menhProse, menhLoading, laSoDisplay } = useBaziPaywallMenhTeaser(profile);

  const laSo = laSoDisplay ?? ((profile.la_so as LaSoJson | null) ?? null);
  const reveal = laSo ? laSoJsonToRevealProps(laSo) : null;
  const tagline = laSo ? extractMenhTagline(laSo) : null;
  const priceLabel = pkg?.priceLabel ?? catalogPriceLabel("luan_bat_tu");
  const prosePreview = menhProse ? truncateMenhProsePreview(menhProse, 3) : null;
  const proseFallback = !prosePreview && !menhLoading ? tagline : null;

  if (!profileHasLaso(profile.la_so) || !reveal) {
    return (
      <Link
        to="/toi/luan-bat-tu"
        className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
        style={{ background: "#fff", borderColor: CT.hairline, color: CT.ink }}
      >
        <CBaziAddonPriceBadge priceLabel={priceLabel} />
        <div
          className="pr-[46%] font-[family-name:var(--display)] text-[19.5px] font-extrabold uppercase tracking-[-0.01em]"
          style={{ color: CT.ink }}
        >
          {LUAN_LA_SO_BAT_TU_TITLE}
        </div>
        <div className="mt-1 font-serif text-xs" style={{ color: CT.muted }}>
          {LUAN_LA_SO_BAT_TU_TAGLINE}
        </div>
      </Link>
    );
  }

  const nhatChuLabel =
    reveal.hanh !== "—" ? `${reveal.nhatChu} ${reveal.hanh}` : reveal.nhatChu;
  const menhLabel = reveal.menh !== "—" ? reveal.menh : "—";
  const detail = laSo ? laSoJsonToChiTiet(laSo) : null;

  return (
    <Link
      to="/toi/luan-bat-tu"
      className="relative mt-[22px] block cursor-pointer border px-4 py-3.5 no-underline"
      style={{ background: "#fff", borderColor: CT.hairline, color: CT.ink }}
    >
      <CBaziAddonPriceBadge priceLabel={priceLabel} />
      <div
        className="pr-[46%] font-[family-name:var(--display)] text-[17px] font-extrabold uppercase tracking-[-0.01em]"
        style={{ color: CT.ink }}
      >
        {LUAN_LA_SO_BAT_TU_TITLE}
      </div>

      <div className="mt-3 space-y-2">
        <FactRow label="Nhật chủ" value={nhatChuLabel} />
        {menhLabel !== "—" ? <FactRow label="Mệnh" value={menhLabel} /> : null}
      </div>

      {detail ? (
        <CBaziNguHanhBars nguHanh={detail.nguHanh} variant="compact" />
      ) : null}

      {menhLoading ? (
        <div className="mt-3 space-y-2" aria-busy aria-label="Đang tải luận tổng quan">
          <div
            className="h-3 w-full rounded-sm"
            style={{ background: "rgba(154,124,34,0.12)" }}
          />
          <div
            className="h-3 w-[92%] rounded-sm"
            style={{ background: "rgba(154,124,34,0.10)" }}
          />
          <div
            className="h-3 w-[78%] rounded-sm"
            style={{ background: "rgba(154,124,34,0.08)" }}
          />
        </div>
      ) : prosePreview ? (
        <p
          className="mt-3 font-serif text-[13px] italic leading-[1.65]"
          style={{ color: CT.ink2 }}
        >
          &ldquo;{prosePreview}&rdquo;
        </p>
      ) : proseFallback ? (
        <p
          className="mt-3 font-serif text-[13px] italic leading-[1.65]"
          style={{ color: CT.ink2 }}
        >
          {proseFallback}
        </p>
      ) : null}

      <CBaziLockedChaptersHomeTeaser yearCanChi={yearCanChi} />
    </Link>
  );
}
