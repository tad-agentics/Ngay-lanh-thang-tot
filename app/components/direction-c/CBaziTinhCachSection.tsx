import { Mono } from "~/components/brand";
import { CBaziNlttLuanProse } from "~/components/direction-c/CBaziNlttLuanRow";
import { BaziChapterEmpty } from "~/components/direction-c/BaziSectionHeading";
import { CT } from "~/lib/c-tokens";
import type { PersonalityTraitView } from "~/lib/personality-traits-ui";

type CBaziTinhCachSectionProps = {
  traits: PersonalityTraitView[];
  introProse: string;
  prose: string;
  emptyReason: string | null;
};

export function CBaziTinhCachSection({
  traits,
  introProse,
  prose,
  emptyReason,
}: CBaziTinhCachSectionProps) {
  const hasTraits = traits.length > 0;
  const hasIntro = Boolean(introProse.trim());
  const hasFallback = Boolean(prose.trim());

  if (emptyReason && !hasTraits && !hasIntro && !hasFallback) {
    return <BaziChapterEmpty message={emptyReason} />;
  }

  return (
    <div className="mt-3">
      {hasIntro ? (
        <p
          className="text-[13.5px] leading-relaxed whitespace-pre-wrap"
          style={{ color: CT.ink }}
        >
          {introProse}
        </p>
      ) : null}

      {hasTraits ? (
        <div className={hasIntro ? "mt-4" : ""}>
          {traits.map((t, i) => (
            <div
              key={t.id}
              className="border-t py-3 first:border-t-0 first:pt-0"
              style={{ borderColor: CT.hairline2 }}
            >
              <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
                {t.title}
              </Mono>
              <p
                className="mt-1 font-serif text-[12.5px] leading-snug"
                style={{ color: CT.ink2 }}
              >
                {t.text}
              </p>
            </div>
          ))}
        </div>
      ) : hasFallback ? (
        <CBaziNlttLuanProse text={prose} compact />
      ) : null}

      {!hasTraits && !hasIntro && !hasFallback && emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
