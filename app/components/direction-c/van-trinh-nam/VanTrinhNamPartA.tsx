import { CBaziLuanSubsectionWithState } from "~/components/direction-c/CBaziLuanSubsection";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import { Mono } from "~/components/brand";
import { CT, DISPLAY } from "~/lib/c-tokens";
import {
  partAProse,
  type VanTrinhNamDisplayBlock,
} from "~/lib/van-trinh-nam-outline";
import { verdictSignalLabel } from "~/lib/van-trinh-nam-signals";
import { VanTrinhNamYearChart } from "~/components/direction-c/van-trinh-nam/VanTrinhNamYearChart";

export function VanTrinhNamPartA({
  block,
  instantProse,
  onRetryLuan,
}: {
  block: Extract<VanTrinhNamDisplayBlock, { kind: "part_a" }>;
  instantProse?: boolean;
  onRetryLuan?: () => void;
}) {
  const { ctx, sections, chapterLoad, chartValues } = block;
  const hook = ctx.part_a.hook_year;
  const loadA = chapterLoad.part_a === "loading";
  const failedA = chapterLoad.part_a === "failed";

  const ranking =
    ctx.part_a.year_aspect_ranking.length > 0
      ? ctx.part_a.year_aspect_ranking
      : ctx.part_a.four_aspects_year.map((a) => a.aspect_id);

  const aspects = ranking
    .map((id) => ctx.part_a.four_aspects_year.find((a) => a.aspect_id === id))
    .filter((a): a is NonNullable<typeof a> => a != null);

  const transition = ctx.part_a.you_this_year.dai_van.transition_in_year;

  return (
    <div className="mt-3 space-y-3.5">
      <div
        className="border px-4 py-3.5"
        style={{ background: "#fff", borderColor: CT.goldDeep }}
      >
        <Mono className="text-[9px]" style={{ color: CT.goldDeep }}>
          Đánh giá năm {hook.year}
        </Mono>
        <div
          className="mt-1 font-[family-name:var(--display)] text-[22px] font-extrabold uppercase leading-tight tracking-tight"
          style={DISPLAY}
        >
          {hook.year_can_chi}
          {hook.year_rating ? ` · ${hook.year_rating}` : ""}
        </div>
      </div>

      {partAProse(sections, "a1_hook") ? (
        <CBaziNlttLuanProse
          text={partAProse(sections, "a1_hook")}
          instant={instantProse}
          compact
        />
      ) : loadA ? (
        <CBaziNlttLuanInkLoading message="Đang luận nhịp năm" compact />
      ) : null}

      {partAProse(sections, "a2_you") ? (
        <CBaziNlttLuanProse
          text={partAProse(sections, "a2_you")}
          instant={instantProse}
          compact
        />
      ) : loadA ? (
        <CBaziNlttLuanInkLoading message="Đang luận bạn trong năm" compact />
      ) : null}

      {aspects.map((area) => {
        const prose = partAProse(sections, `a3_${area.aspect_id}`);
        const verdict = verdictSignalLabel(area.verdict_signal);
        return (
          <CBaziLuanSubsectionWithState
            key={area.aspect_id}
            label={area.label_vi}
            subtitle={verdict ?? undefined}
            text={prose}
            luanLoading={loadA && !prose}
            luanFailed={failedA && !prose}
            failedMessage="Mảng này chưa luận được — thử Tải lại luận."
            onRetry={onRetryLuan}
          />
        );
      })}

      {transition ? (
        <div
          className="px-3.5 py-3"
          style={{
            background: "rgba(163,32,31,0.05)",
            borderLeft: `2px solid ${CT.red}`,
          }}
        >
          <Mono className="text-[9px]" style={{ color: CT.red }}>
            Đại vận đổi trong năm
          </Mono>
          <p
            className="mt-1 font-serif text-[12.5px] leading-relaxed"
            style={{ color: CT.ink2 }}
          >
            Từ tháng {transition.applies_from_month}: {transition.from_display} →{" "}
            {transition.to_display}
          </p>
        </div>
      ) : null}

      <VanTrinhNamYearChart values={chartValues} />
    </div>
  );
}
