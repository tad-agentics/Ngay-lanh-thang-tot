import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import {
  CBaziLuanSubsectionProse,
  CBaziLuanSubsectionWithState,
} from "~/components/direction-c/CBaziLuanSubsection";
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
  const hasIntro = Boolean(introProse.trim());
  const hasFallback = Boolean(prose.trim());
  const hasTraitList = traits.length > 0;

  if (
    emptyReason &&
    !hasTraitList &&
    !hasIntro &&
    !hasFallback &&
    !luanLoading
  ) {
    return <BaziChapterEmpty message={emptyReason} />;
  }

  return (
    <div className="mt-3">
      {hasIntro ? (
        <CBaziLuanSubsectionProse text={introProse} />
      ) : luanLoading && !hasIntro && hasTraitList ? (
        <div role="status" aria-live="polite" className="mb-3">
          <CBaziNlttLuanInkLoading message="Đang luận mở đầu tính cách" compact />
        </div>
      ) : null}

      {hasTraitList ? (
        <div className={hasIntro ? "mt-4" : ""}>
          {traits.map((t) => (
            <CBaziLuanSubsectionWithState
              key={t.id}
              label={t.title}
              text={t.text}
              luanLoading={t.luanLoading}
              luanFailed={t.luanFailed}
              failedMessage="Mục này chưa luận được — thử Tải lại luận."
              onRetry={onRetryLuan}
            />
          ))}
        </div>
      ) : hasFallback ? (
        <CBaziNlttLuanProse text={prose} compact />
      ) : luanLoading ? (
        <div role="status" aria-live="polite">
          <CBaziNlttLuanInkLoading message="Đang luận tính cách" compact />
        </div>
      ) : null}

      {luanFailed && !luanLoading && !hasTraitList ? (
        <CBaziNlttLuanProse
          failed
          failedMessage="Tính cách chưa luận được lần này — nhấn để thử lại."
          onRetry={onRetryLuan}
          compact
          className="mt-3"
        />
      ) : null}

      {!hasTraitList &&
      !hasIntro &&
      !hasFallback &&
      !luanLoading &&
      !luanFailed &&
      emptyReason ? (
        <p className="mt-2 font-serif text-sm" style={{ color: CT.muted }}>
          {emptyReason}
        </p>
      ) : null}
    </div>
  );
}
