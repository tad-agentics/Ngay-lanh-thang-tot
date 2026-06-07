import type { ReactNode } from "react";

import { Mono } from "~/components/brand";
import { CBaziPhongThuySection } from "~/components/direction-c/CBaziPhongThuySection";
import { CBaziQuyNhanSection } from "~/components/direction-c/CBaziQuyNhanSection";
import { CBaziTinhCachSection } from "~/components/direction-c/CBaziTinhCachSection";
import { CBaziVanNamSection } from "~/components/direction-c/CBaziVanNamSection";
import type { BaziPaywallLockedChapter } from "~/lib/bazi-paywall-mock";
import { CT } from "~/lib/c-tokens";
import {
  homeBaziPaywallBlurHook,
  LUAN_LA_SO_BAT_TU_TAGLINE,
} from "~/lib/luan-la-so-bat-tu-labels";

export function BaziPaywallLockedChapterBody({
  chapter,
}: {
  chapter: BaziPaywallLockedChapter;
}) {
  switch (chapter.key) {
    case "tinh_cach":
      return (
        <CBaziTinhCachSection
          traits={chapter.traits}
          introProse={chapter.introProse}
          prose=""
          emptyReason={null}
        />
      );
    case "van_nam":
      return (
        <CBaziVanNamSection facts={chapter.facts} prose="" emptyReason={null} />
      );
    case "phong_thuy":
      return (
        <CBaziPhongThuySection
          facts={chapter.facts}
          huongLuan=""
          mauLuan=""
          phiTinhLuan=""
          prose=""
          emptyReason={null}
        />
      );
    case "quy_nhan":
      return (
        <CBaziQuyNhanSection
          quyNhan={chapter.quyNhan}
          daiVanNext={chapter.daiVanNext}
          prose=""
          emptyReason={null}
        />
      );
  }
}

/** Paywall — blur + nút mở khóa. */
export function BaziPaywallLockedSectionBody({
  children,
  onUnlock,
}: {
  children: ReactNode;
  onUnlock: () => void;
}) {
  return (
    <div className="relative mt-3 min-h-[120px]">
      <div
        className="select-none"
        style={{ filter: "blur(5px)", WebkitFilter: "blur(5px)" }}
        aria-hidden
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(240,236,226,0.2) 0%, rgba(240,236,226,0.78) 45%, rgba(240,236,226,0.92) 100%)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center px-1">
        <button
          type="button"
          onClick={onUnlock}
          className="flex w-full cursor-pointer items-center justify-center border bg-transparent px-3.5 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
          style={{ borderColor: CT.goldDeep, color: CT.ink }}
        >
          Mở khóa để đọc
        </button>
      </div>
    </div>
  );
}

/** Home `/lich` — blur gợi mở + CTA giữa khối, viền vàng như nút. */
export function CBaziLockedChaptersHomeTeaser({
  yearCanChi,
  priceLabel,
}: {
  yearCanChi: string;
  priceLabel: string;
}) {
  return (
    <div className="relative mt-3 min-h-[116px] overflow-hidden">
      <div
        className="select-none px-0.5 py-2"
        style={{ filter: "blur(4px)", WebkitFilter: "blur(4px)" }}
        aria-hidden
      >
        <p
          className="font-serif text-[13px] leading-[1.65]"
          style={{ color: CT.ink2 }}
        >
          {homeBaziPaywallBlurHook(yearCanChi)}
        </p>
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.78) 42%, rgba(255,255,255,0.88) 100%)`,
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-1 py-3">
        <div
          className="w-full border px-3.5 py-2.5 text-center"
          style={{
            borderColor: CT.goldDeep,
            background: "rgba(255,255,255,0.94)",
          }}
        >
          <p
            className="mb-1.5 font-serif text-[10.5px] leading-snug"
            style={{ color: CT.muted }}
          >
            {LUAN_LA_SO_BAT_TU_TAGLINE}
          </p>
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm" style={{ color: CT.muted }}>
                ○
              </span>
              <Mono
                className="font-bold uppercase tracking-[0.06em]"
                style={{ color: CT.ink, fontSize: 10 }}
              >
                Chưa mở khoá
              </Mono>
            </div>
            <span
              className="font-[family-name:var(--display-2)] text-[13.5px] font-bold tabular-nums"
              style={{ color: CT.goldDeep }}
            >
              {priceLabel}
            </span>
            <span
              className="font-[family-name:var(--display-2)] text-[13px] font-bold uppercase tracking-[0.08em]"
              style={{ color: CT.goldDeep }}
            >
              →
            </span>
          </div>
          <p className="mt-1 font-serif text-[10.5px]" style={{ color: CT.muted }}>
            hoặc miễn phí với Lịch năm
          </p>
        </div>
      </div>
    </div>
  );
}
