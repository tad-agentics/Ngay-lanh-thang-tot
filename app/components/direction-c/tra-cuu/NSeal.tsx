import { LogoMark } from "~/components/brand/LogoMark";
import { CT } from "~/lib/c-tokens";

type NSealProps = {
  size?: number;
  className?: string;
  /** Gold ring — prototype default on; tiny thread seal may omit. */
  ring?: boolean;
};

/** NLTT seal — LogoMark in forest ring (Tra cứu v2). */
export function NSeal({ size = 52, className, ring = true }: NSealProps) {
  const inner = Math.round(size * 0.66);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: CT.forest,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: ring ? `0 0 0 1.5px ${CT.gold}` : "none",
      }}
    >
      <LogoMark dark size={inner} />
    </div>
  );
}

export function NSealSmall({ className }: { className?: string }) {
  return <NSeal size={34} className={className} />;
}

export function NSealTiny({ className }: { className?: string }) {
  return <NSeal size={26} className={className} ring={false} />;
}
