import { CBaziMenhTongQuanBlock } from "~/components/direction-c/CBaziMenhTongQuanBlock";
import { CBaziPhongThuySection } from "~/components/direction-c/CBaziPhongThuySection";
import { CBaziQuyNhanSection } from "~/components/direction-c/CBaziQuyNhanSection";
import { CBaziTinhCachSection } from "~/components/direction-c/CBaziTinhCachSection";
import { BaziSectionHeading } from "~/components/direction-c/BaziSectionHeading";
import { CBaziVanNamSection } from "~/components/direction-c/CBaziVanNamSection";
import type { BaziDisplayChapter } from "~/lib/bazi-reading-outline";
import type { Profile } from "~/lib/profile-context";

type CBaziReadingChapterProps = {
  chapter: BaziDisplayChapter;
  profile: Profile;
  onRetryMenh?: () => void;
};

export function CBaziReadingChapter({
  chapter,
  profile,
  onRetryMenh,
}: CBaziReadingChapterProps) {
  return (
    <section className="mt-8 first:mt-6">
      <BaziSectionHeading index={chapter.index} title={chapter.title} />
      {chapter.kind === "menh" ? (
        <CBaziMenhTongQuanBlock
          profile={profile}
          laSo={chapter.laSo}
          prose={chapter.prose}
          emptyReason={chapter.emptyReason}
          onRetryProse={onRetryMenh}
        />
      ) : null}
      {chapter.kind === "tinh_cach" ? (
        <CBaziTinhCachSection
          traits={chapter.traits}
          introProse={chapter.introProse}
          prose={chapter.prose}
          emptyReason={chapter.emptyReason}
        />
      ) : null}
      {chapter.kind === "van_nam" ? (
        <CBaziVanNamSection
          facts={chapter.facts}
          yearIntroProse={chapter.yearIntroProse}
          lifeAreas={chapter.lifeAreas}
          prose={chapter.prose}
          emptyReason={chapter.emptyReason}
        />
      ) : null}
      {chapter.kind === "phong_thuy" ? (
        <CBaziPhongThuySection
          facts={chapter.facts}
          prose={chapter.prose}
          emptyReason={chapter.emptyReason}
        />
      ) : null}
      {chapter.kind === "quy_nhan" ? (
        <CBaziQuyNhanSection
          quyNhan={chapter.quyNhan}
          daiVanNext={chapter.daiVanNext}
          prose={chapter.prose}
          emptyReason={chapter.emptyReason}
        />
      ) : null}
    </section>
  );
}
