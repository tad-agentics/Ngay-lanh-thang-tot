import { Mono } from "~/components/brand";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import {
  CBaziLuanSubsectionProse,
  CBaziLuanSubsectionWithState,
} from "~/components/direction-c/CBaziLuanSubsection";
import { BaziChapterEmpty } from "~/components/direction-c/BaziSectionHeading";
import { CT, DISPLAY } from "~/lib/c-tokens";
import type { LuuNienFactsView } from "~/lib/luu-nien-facts-ui";
import type { LuuNienLifeAreaView } from "~/lib/luu-nien-life-ui";

const TONE_BAR: Record<string, string> = {
  good: CT.greenMute,
  mid: CT.goldDeep,
  low: CT.muted,
  bad: CT.red,
};

function barTone(score: number): string {
  if (score >= 70) return TONE_BAR.good ?? CT.greenMute;
  if (score >= 55) return TONE_BAR.mid ?? CT.goldDeep;
  if (score >= 45) return TONE_BAR.low ?? CT.muted;
  return TONE_BAR.bad ?? CT.red;
}

type CBaziVanNamSectionProps = {
  facts: LuuNienFactsView | null;
  yearIntroProse?: string;
  lifeAreas?: LuuNienLifeAreaView[];
  prose: string;
  /** Chờ luận 4 lĩnh vực — không gộp nhịp năm. */
  lifeLuanLoading?: boolean;
  luanLoading?: boolean;
  /** Bundle xong — mục không có `luan` có thể retry. */
  chapterVanFailed?: boolean;
  instantProse?: boolean;
  emptyReason: string | null;
  onRetryLuan?: () => void;
};

export function CBaziVanNamSection({
  facts,
  yearIntroProse = "",
  lifeAreas = [],
  prose,
  lifeLuanLoading,
  luanLoading = false,
  chapterVanFailed = false,
  instantProse = false,
  emptyReason,
  onRetryLuan,
}: CBaziVanNamSectionProps) {
  const areas: LuuNienLifeAreaView[] =
    lifeAreas.length > 0
      ? lifeAreas
      : (facts?.lifeAreas.map((a) => ({ ...a, luan: "" })) ?? []);

  if (emptyReason && !facts && !prose && areas.length === 0) {
    return <BaziChapterEmpty message={emptyReason} />;
  }

  const rating = facts?.yearRating || facts?.yearTheme;
  const intro = yearIntroProse.trim();

  return (
    <div className="mt-3 space-y-3.5">
      {rating ? (
        <div
          className="border px-4 py-3.5"
          style={{ background: "#fff", borderColor: CT.goldDeep }}
        >
          <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
            Đánh giá năm
          </Mono>
          <div
            className="mt-1 font-[family-name:var(--display)] text-[22px] font-extrabold uppercase leading-tight tracking-tight"
            style={DISPLAY}
          >
            {rating}
          </div>
        </div>
      ) : null}

      {intro ? (
        <CBaziLuanSubsectionProse text={intro} />
      ) : luanLoading ? (
        <div role="status" aria-live="polite">
          <CBaziNlttLuanInkLoading message="Đang luận nhịp năm" compact />
        </div>
      ) : null}

      {areas.length > 0 ? (
        <div className={intro ? "mt-3" : ""}>
          {areas.map((area) => (
            <CBaziLuanSubsectionWithState
              key={area.id}
              label={area.label}
              subtitle={area.verdict || undefined}
              text={area.luan}
              luanLoading={
                area.luanLoading ??
                ((lifeLuanLoading ?? luanLoading) && !area.luan.trim())
              }
              luanFailed={area.luanFailed}
              failedMessage="Lĩnh vực này chưa luận được — thử Tải lại luận."
              onRetry={onRetryLuan}
            />
          ))}
        </div>
      ) : null}

      {facts && facts.warnings.length > 0 ? (
        <div
          className="px-3.5 py-3"
          style={{
            background: "rgba(163,32,31,0.05)",
            borderLeft: `2px solid ${CT.red}`,
          }}
        >
          {facts.warnings.map((w) => (
            <div key={w.title + w.body.slice(0, 24)} className="not-first:mt-2">
              <Mono className="text-[9px]" style={{ color: CT.red }}>
                {w.title}
              </Mono>
              <p
                className="mt-1 font-serif text-[12.5px] leading-relaxed"
                style={{ color: CT.ink2 }}
              >
                {w.body}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {facts && facts.monthScores.length >= 12 ? (
        <div>
          <Mono className="mb-1.5 text-[9px]" style={{ color: CT.muted }}>
            Đường vận 12 tháng âm
          </Mono>
          <div className="flex h-14 items-end gap-0.5">
            {facts.monthScores.map((v, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full"
                  style={{
                    height: `${Math.max(12, Math.min(100, v))}%`,
                    background: barTone(v),
                    opacity: 0.88,
                  }}
                />
                <Mono className="mt-1 text-[9.5px]" style={{ color: CT.muted }}>
                  {i + 1}
                </Mono>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {prose ? (
        <CBaziNlttLuanProse text={prose} instant={instantProse} compact />
      ) : luanLoading ? (
        <div role="status" aria-live="polite">
          <CBaziNlttLuanInkLoading message="Đang luận thực tiễn năm" compact />
        </div>
      ) : chapterVanFailed ? (
        <CBaziNlttLuanProse
          failed
          failedMessage="Vận năm chưa luận được lần này — nhấn để thử lại."
          onRetry={onRetryLuan}
          compact
        />
      ) : null}
      {!prose && !luanLoading && !chapterVanFailed && !facts && emptyReason ? (
        <BaziChapterEmpty message={emptyReason} />
      ) : null}
    </div>
  );
}
