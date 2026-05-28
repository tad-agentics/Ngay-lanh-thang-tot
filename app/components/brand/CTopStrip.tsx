import type { ReactNode } from "react";

import { LogoMark } from "~/components/brand/LogoMark";
import { useProfile } from "~/hooks/useProfile";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";

type CTopStripProps = {
  dark?: boolean;
  right?: ReactNode;
};

/** Identity strip — `c-screens-a.jsx` CTopStrip (logo 20 + serif 12.5 line). */
export function CTopStrip({ dark = false, right }: CTopStripProps) {
  const { profile } = useProfile();
  const name = profile?.display_name?.trim() || "bạn";
  const menhRaw = profile?.la_so
    ? laSoJsonToRevealProps(profile.la_so)?.menh
    : null;
  const menh = menhRaw && menhRaw !== "—" ? menhRaw : null;

  const fg = dark ? "var(--cream)" : "var(--ink)";
  const muteFg = dark ? "rgba(200,188,152,0.6)" : "var(--muted)";

  return (
    <div className="flex items-center justify-between px-[22px] pb-3 pt-1.5">
      <div className="flex items-center gap-2.5">
        <LogoMark dark={dark} size={20} />
        <div
          className="font-serif text-[12.5px] leading-[1.3]"
          style={{ color: fg }}
        >
          Lịch của <strong className="font-semibold">{name}</strong>
          {menh ? (
            <span style={{ color: muteFg }}> · {menh}</span>
          ) : null}
        </div>
      </div>
      {right}
    </div>
  );
}
