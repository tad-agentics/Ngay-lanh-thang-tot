import { CBaziMenhTongQuanBlock } from "~/components/direction-c/CBaziMenhTongQuanBlock";
import { CBaziPhongThuySection } from "~/components/direction-c/CBaziPhongThuySection";
import { CBaziQuyNhanSection } from "~/components/direction-c/CBaziQuyNhanSection";
import { BaziSectionHeading } from "~/components/direction-c/BaziSectionHeading";
import { BaziChapterProse } from "~/components/direction-c/BaziSectionHeading";
import { CBaziVanNamSection } from "~/components/direction-c/CBaziVanNamSection";
import type { BaziDisplayChapter } from "~/lib/bazi-reading-outline";
import type { Profile } from "~/lib/profile-context";

type CBaziReadingChapterProps = {
  chapter: BaziDisplayChapter;
  profile: Profile;
};

export function CBaziReadingChapter({ chapter, profile }: CBaziReadingChapterProps) {
  return (
    <section className="mt-8 first:mt-6">
      <BaziSectionHeading index={chapter.index} title={chapter.title} />
      {chapter.kind === "menh" ? (
        <CBaziMenhTongQuanBlock profile={profile} laSo={chapter.laSo} />
      ) : null}
      {chapter.kind === "prose" ? (
        chapter.prose ? (
          <BaziChapterProse text={chapter.prose} />
        ) : chapter.emptyReason ? (
          <p className="mt-3 font-serif text-sm text-[var(--muted)]">{chapter.emptyReason}</p>
        ) : null
      ) : null}
      {chapter.kind === "van_nam" ? (
        <CBaziVanNamSection
          facts={chapter.facts}
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
          facts={chapter.facts}
          prose={chapter.prose}
          emptyReason={chapter.emptyReason}
        />
      ) : null}
    </section>
  );
}
