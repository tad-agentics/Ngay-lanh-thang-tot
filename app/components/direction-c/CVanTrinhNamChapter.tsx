import { BaziSectionHeading } from "~/components/direction-c/BaziSectionHeading";
import { VanTrinhNamClosing } from "~/components/direction-c/van-trinh-nam/VanTrinhNamClosing";
import { VanTrinhNamMechanicsAccordion } from "~/components/direction-c/van-trinh-nam/VanTrinhNamMechanicsAccordion";
import { VanTrinhNamMonthAccordion } from "~/components/direction-c/van-trinh-nam/VanTrinhNamMonthAccordion";
import { VanTrinhNamPartA } from "~/components/direction-c/van-trinh-nam/VanTrinhNamPartA";
import type { VanTrinhNamDisplayBlock } from "~/lib/van-trinh-nam-outline";
import { disclaimerCopyVi } from "~/lib/van-trinh-nam-signals";
import { CT } from "~/lib/c-tokens";

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
  if (block.kind === "mechanics") {
    return (
      <section className="mt-6">
        <VanTrinhNamMechanicsAccordion ctx={block.ctx} />
        {block.ctx.meta.disclaimers.length > 0 ? (
          <footer className="mt-4 space-y-1">
            {block.ctx.meta.disclaimers.map((d) => (
              <p
                key={d}
                className="font-serif text-[11px] leading-snug"
                style={{ color: CT.muted }}
              >
                {disclaimerCopyVi(d)}
              </p>
            ))}
          </footer>
        ) : null}
      </section>
    );
  }

  const headingId = `van-trinh-${block.key}`;
  return (
    <section className="mt-8 first:mt-6" aria-labelledby={headingId}>
      <BaziSectionHeading
        index={block.index}
        title={block.title}
        id={headingId}
      />
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
