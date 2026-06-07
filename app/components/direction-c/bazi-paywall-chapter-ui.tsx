import type { ReactNode } from "react";

import { Mono } from "~/components/brand";
import { CBaziPhongThuySection } from "~/components/direction-c/CBaziPhongThuySection";
import { CBaziQuyNhanSection } from "~/components/direction-c/CBaziQuyNhanSection";
import { CBaziTinhCachSection } from "~/components/direction-c/CBaziTinhCachSection";
import { CBaziVanNamSection } from "~/components/direction-c/CBaziVanNamSection";
import {
  baziPaywallLockedChapters,
  type BaziPaywallLockedChapter,
} from "~/lib/bazi-paywall-mock";
import { CT } from "~/lib/c-tokens";
import { LUAN_LA_SO_BAT_TU_TAGLINE } from "~/lib/luan-la-so-bat-tu-labels";

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

/** Home `/lich` — mock chapter blur + CTA nổi trên overlay. */
export function CBaziLockedChaptersHomeTeaser({
  yearCanChi,
  priceLabel,
}: {
  yearCanChi: string;
  priceLabel: string;
}) {
  const chapters = baziPaywallLockedChapters(yearCanChi);

  return (
    <div className="relative mt-3 max-h-[148px] min-h-[108px] overflow-hidden">
      <div
        className="select-none space-y-4"
        style={{ filter: "blur(4px)", WebkitFilter: "blur(4px)" }}
        aria-hidden
      >
        {chapters.slice(0, 2).map((chapter) => (
          <div key={chapter.key}>
            <BaziPaywallLockedChapterBody chapter={chapter} />
          </div>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.72) 38%, rgba(255,255,255,0.94) 72%, rgba(255,255,255,0.98) 100%)`,
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-2 pb-2.5 pt-10">
        <p
          className="mb-2 text-center font-serif text-[11px] leading-snug"
          style={{ color: CT.muted }}
        >
          {LUAN_LA_SO_BAT_TU_TAGLINE}
        </p>
        <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm" style={{ color: CT.muted }}>
              ○
            </span>
            <Mono style={{ color: CT.muted, fontSize: 9.5 }}>Chưa mở khoá</Mono>
          </div>
          <span
            className="font-[family-name:var(--display-2)] text-[13.5px] font-bold tabular-nums"
            style={{ color: CT.goldDeep }}
          >
            {priceLabel}
          </span>
          <span className="font-serif text-[11px]" style={{ color: CT.muted }}>
            · hoặc miễn phí với Lịch năm
          </span>
          <span
            className="font-[family-name:var(--display-2)] text-[13px] font-bold uppercase tracking-[0.08em]"
            style={{ color: CT.goldDeep }}
          >
            →
          </span>
        </div>
      </div>
    </div>
  );
}
