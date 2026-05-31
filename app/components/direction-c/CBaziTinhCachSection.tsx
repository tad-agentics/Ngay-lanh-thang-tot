import { Mono } from "~/components/brand";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import { BaziChapterEmpty } from "~/components/direction-c/BaziSectionHeading";
import { CT } from "~/lib/c-tokens";
import type { PersonalityTraitView } from "~/lib/personality-traits-ui";

type CBaziTinhCachSectionProps = {
  traits: PersonalityTraitView[];
  introProse: string;
  prose: string;
  luanLoading?: boolean;
  luanFailed?: boolean;
  emptyReason: string | null;
  onRetryLuan?: () => void;
};

export function CBaziTinhCachSection({
  traits,
  introProse,
  prose,
  luanLoading = false,
  luanFailed = false,
  emptyReason,
  onRetryLuan,
}: CBaziTinhCachSectionProps) {
  const traitsWithText = traits.filter((t) => t.text.trim().length > 0);
  const hasTraits = traitsWithText.length > 0;
  const hasIntro = Boolean(introProse.trim());
  const hasFallback = Boolean(prose.trim());
  const showTraitShells = luanLoading && traits.length > 0;

  if (emptyReason && !hasTraits && !hasIntro && !hasFallback && !showTraitShells) {
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
      ) : luanLoading && !hasIntro ? (
        <CBaziNlttLuanInkLoading
          message="Đang luận mở đầu tính cách"
          compact
          className={traits.length > 0 ? "mb-3" : undefined}
        />
      ) : null}

      {showTraitShells ? (
        <div className={hasIntro ? "mt-4" : ""}>
          {traits.map((t) => (
            <div
              key={t.id}
              className="border-t py-3 first:border-t-0 first:pt-0"
              style={{ borderColor: CT.hairline2 }}
            >
              <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
                {t.title}
              </Mono>
              {t.text.trim() ? (
                <p
                  className="mt-1 font-serif text-[12.5px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: CT.ink2 }}
                >
                  {t.text}
                </p>
              ) : (
                <CBaziNlttLuanInkLoading
                  message="Đang luận"
                  compact
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>
      ) : hasTraits ? (
        <div className={hasIntro ? "mt-4" : ""}>
          {traitsWithText.map((t) => (
            <div
              key={t.id}
              className="border-t py-3 first:border-t-0 first:pt-0"
              style={{ borderColor: CT.hairline2 }}
            >
              <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
                {t.title}
              </Mono>
              <p
                className="mt-1 font-serif text-[12.5px] leading-relaxed whitespace-pre-wrap"
                style={{ color: CT.ink2 }}
              >
                {t.text}
              </p>
            </div>
          ))}
        </div>
      ) : hasFallback ? (
        <CBaziNlttLuanProse text={prose} compact />
      ) : luanLoading ? (
        <CBaziNlttLuanInkLoading message="Đang luận tính cách" compact />
      ) : null}

      {luanFailed && !luanLoading ? (
        <CBaziNlttLuanProse
          loading={false}
          failed
          failedMessage="Chưa tạo được luận giải tính cách. Thử tải lại luận."
          onRetry={onRetryLuan}
          compact
          className="mt-3"
        />
      ) : null}

      {!hasTraits &&
      !hasIntro &&
      !hasFallback &&
      !luanLoading &&
      !luanFailed &&
      emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
