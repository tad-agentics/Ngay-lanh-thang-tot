import type { ReactNode } from "react";
import { Link } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";

type Section = {
  title: string;
  content: string;
};

type CLegalDocumentScreenProps = {
  title: string;
  updatedLabel: string;
  sections: readonly Section[];
  homeLinkLabel?: string;
  footer?: ReactNode;
};

/** Direction C — legal / policy pages on paper surface. */
export function CLegalDocumentScreen({
  title,
  updatedLabel,
  sections,
  homeLinkLabel = "Về trang chủ",
  footer,
}: CLegalDocumentScreenProps) {
  return (
    <main
      className="min-h-svh pb-10"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="px-6">
        <BackBar title={title} />
      </div>
      <div className="mx-auto flex max-w-lg flex-col gap-5 px-6">
        <Mono style={{ color: CT.muted, fontSize: 9 }}>{updatedLabel}</Mono>
        {sections.map((s, i) => (
          <section key={s.title}>
            <div
              className="flex items-baseline gap-2.5 pb-1.5"
              style={{ borderBottom: `1px solid ${CT.hairline2}` }}
            >
              <span
                className="font-mono text-[11px]"
                style={{ color: CT.goldDeep, letterSpacing: "0.18em" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2
                className="text-sm font-extrabold uppercase tracking-[-0.005em]"
                style={DISPLAY2}
              >
                {s.title}
              </h2>
            </div>
            <p
              className="mt-2.5 text-sm leading-relaxed whitespace-pre-line"
              style={{ color: CT.ink2 }}
            >
              {s.content}
            </p>
          </section>
        ))}
        <p className="pt-2 text-sm" style={{ color: CT.muted }}>
          {footer ?? (
            <Link
              to="/"
              className="no-underline"
              style={{ ...DISPLAY2, color: CT.goldDeep, fontSize: 12 }}
            >
              {homeLinkLabel} →
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}
