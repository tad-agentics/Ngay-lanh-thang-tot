import type { ReactNode } from "react";

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

/** Home `/lich` — mock chapter blur (cùng nguồn paywall), tagline hiện rõ. */
export function CBaziLockedChaptersHomeTeaser({ yearCanChi }: { yearCanChi: string }) {
  const chapters = baziPaywallLockedChapters(yearCanChi);

  return (
    <div className="relative mt-3 max-h-[128px] min-h-[72px] overflow-hidden">
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
          background: `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.82) 52%, rgba(255,255,255,0.97) 100%)`,
        }}
        aria-hidden
      />
      <p
        className="relative pt-10 text-center font-serif text-[11.5px]"
        style={{ color: CT.muted }}
      >
        {LUAN_LA_SO_BAT_TU_TAGLINE}
      </p>
    </div>
  );
}
