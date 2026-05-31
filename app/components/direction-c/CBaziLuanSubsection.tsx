import type { ReactNode } from "react";

import { Mono } from "~/components/brand";
import {
  CBaziNlttLuanInkLoading,
  CBaziNlttLuanProse,
} from "~/components/direction-c/CBaziNlttLuanRow";
import { CT } from "~/lib/c-tokens";
import { splitNlttLuanParagraphs } from "~/lib/nltt-luan-prose";

type CBaziLuanSubsectionProps = {
  label: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

/** Một mục luận con (§02 trait / §03 life area) — layout thống nhất. */
export function CBaziLuanSubsection({
  label,
  subtitle,
  children,
  className,
}: CBaziLuanSubsectionProps) {
  return (
    <div
      className={["border-t py-3 first:border-t-0 first:pt-0", className]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: CT.hairline2 }}
    >
      <div
        className="font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-tight"
        style={{ color: CT.ink }}
      >
        {label}
      </div>
      {subtitle ? (
        <Mono className="mt-0.5 text-[10px]" style={{ color: CT.goldDeep }}>
          {subtitle}
        </Mono>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Thân luận — tách đoạn giống §01 NLTT / §03 cũ. */
export function CBaziLuanSubsectionProse({ text }: { text: string }) {
  const paragraphs = splitNlttLuanParagraphs(text.trim());
  if (paragraphs.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {paragraphs.map((para) => (
        <p
          key={para.slice(0, 48)}
          className="font-serif text-[12.5px] leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

type CBaziLuanSubsectionStateProps = {
  label: string;
  subtitle?: string;
  text: string;
  luanLoading?: boolean;
  luanFailed?: boolean;
  failedMessage?: string;
  onRetry?: () => void;
};

/** Trait / life area — hiện prose ngay khi có `text`, loading/failed theo mục. */
export function CBaziLuanSubsectionWithState({
  label,
  subtitle,
  text,
  luanLoading = false,
  luanFailed = false,
  failedMessage = "Chưa luận được mục này — thử Tải lại luận.",
  onRetry,
}: CBaziLuanSubsectionStateProps) {
  const trimmed = text.trim();
  return (
    <CBaziLuanSubsection label={label} subtitle={subtitle}>
      {trimmed ? (
        <CBaziLuanSubsectionProse text={trimmed} />
      ) : luanLoading ? (
        <div role="status" aria-live="polite">
          <CBaziNlttLuanInkLoading message="Đang luận" compact />
        </div>
      ) : luanFailed ? (
        <CBaziNlttLuanProse
          failed
          failedMessage={failedMessage}
          onRetry={onRetry}
          compact
        />
      ) : null}
    </CBaziLuanSubsection>
  );
}
