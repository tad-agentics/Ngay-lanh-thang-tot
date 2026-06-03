import { BaziSectionHeading } from "~/components/direction-c/BaziSectionHeading";
import { VanTrinhNamClosing } from "~/components/direction-c/van-trinh-nam/VanTrinhNamClosing";
import { VanTrinhNamMonthAccordion } from "~/components/direction-c/van-trinh-nam/VanTrinhNamMonthAccordion";
import { VanTrinhNamPartA } from "~/components/direction-c/van-trinh-nam/VanTrinhNamPartA";
import type { VanTrinhNamDisplayBlock } from "~/lib/van-trinh-nam-outline";

export function CVanTrinhNamChapter({
  block,
  year,
  instantProse,
  onRetryLuan,
}: {
  block: VanTrinhNamDisplayBlock;
  year: number;
  instantProse?: boolean;
  onRetryLuan?: () => void;
}) {
  const headingId = `van-trinh-${block.key}`;
  return (
    <section className="mt-8 first:mt-6" aria-labelledby={headingId}>
      {block.kind !== "month" ? (
        <BaziSectionHeading
          index={block.index}
          title={block.title}
          id={headingId}
        />
      ) : null}
      {block.kind === "part_a" ? (
        <VanTrinhNamPartA
          block={block}
          instantProse={instantProse}
          onRetryLuan={onRetryLuan}
        />
      ) : null}
      {block.kind === "month" ? (
        <VanTrinhNamMonthAccordion
          block={block}
          year={year}
          headingId={headingId}
          instantProse={instantProse}
          onRetryLuan={onRetryLuan}
        />
      ) : null}
      {block.kind === "closing" ? (
        <VanTrinhNamClosing
          prose={block.prose}
          luanLoading={block.luanLoading}
          luanFailed={block.luanFailed}
          instantProse={instantProse}
          onRetryLuan={onRetryLuan}
        />
      ) : null}
    </section>
  );
}
