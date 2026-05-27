import type { ReactNode } from "react";

import { LogoMark } from "~/components/brand/LogoMark";
import { useProfile } from "~/hooks/useProfile";

type CTopStripProps = {
  dark?: boolean;
  right?: ReactNode;
};

export function CTopStrip({ dark = false, right }: CTopStripProps) {
  const { profile } = useProfile();
  const name = profile?.display_name?.trim() || "bạn";
  const menh =
    profile?.la_so && typeof profile.la_so === "object"
      ? String(
          (profile.la_so as Record<string, unknown>).nap_am_label ??
            (profile.la_so as Record<string, unknown>).menh ??
            "",
        )
      : "";

  const fg = dark ? "var(--cream)" : "var(--ink)";
  const muteFg = dark ? "rgba(237,231,211,0.6)" : "var(--muted-warm)";

  return (
    <div className="flex items-center justify-between px-[22px] pb-3 pt-1.5">
      <div className="flex items-center gap-2.5">
        <LogoMark dark={dark} size={20} />
        <p
          className="font-serif text-[12.5px] leading-snug"
          style={{ color: fg }}
        >
          Lịch của <strong className="font-semibold">{name}</strong>
          {menh ? (
            <span style={{ color: muteFg }}> · {menh}</span>
          ) : null}
        </p>
      </div>
      {right}
    </div>
  );
}
