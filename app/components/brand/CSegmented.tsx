type CSegmentedProps = {
  options: { label: string; to?: string }[];
  dark?: boolean;
  /** Controlled index (use with onSelect). */
  activeIndex?: number;
  onSelect?: (index: number) => void;
};

export function CSegmented({
  options,
  dark = false,
  activeIndex,
  onSelect,
}: CSegmentedProps) {
  const trackBg = dark
    ? "rgba(237,231,211,0.06)"
    : "rgba(154,124,34,0.07)";
  const activeBg = dark ? "var(--gold)" : "var(--forest)";
  const activeFg = dark ? "var(--forest)" : "var(--cream)";
  const inactiveFg = dark ? "rgba(237,231,211,0.6)" : "var(--muted)";

  return (
    <div
      className="mx-[22px] flex gap-0.5 rounded-full p-[3px]"
      style={{ background: trackBg }}
    >
      {options.map((opt, i) => {
        const sel = activeIndex === i;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSelect?.(i)}
            className="flex-1 cursor-pointer rounded-full border-none py-[9px] text-center font-[family-name:var(--display-2)] text-[11.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap"
            style={{
              background: sel ? activeBg : "transparent",
              color: sel ? activeFg : inactiveFg,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
