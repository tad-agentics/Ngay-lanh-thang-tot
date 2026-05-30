import type { KeyboardEvent } from "react";

import { C, inputLabel } from "~/components/auth/c-auth-ui";

const OPTIONS = [
  { value: "nam" as const, label: "Nam" },
  { value: "nu" as const, label: "Nữ" },
] as const;

export function GioiTinhPick({
  value,
  onChange,
  dark = true,
}: {
  value: "nam" | "nu" | null;
  onChange: (v: "nam" | "nu") => void;
  dark?: boolean;
}) {
  const mute = dark ? "rgba(237,231,211,0.55)" : C.muted;
  const ink = dark ? C.cream : C.ink;

  function onRadioKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "ArrowUp" &&
      e.key !== "ArrowDown"
    ) {
      return;
    }
    e.preventDefault();
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (index + 1) % OPTIONS.length
        : (index - 1 + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next]!.value);
  }

  return (
    <div>
      <div style={inputLabel}>Giới tính</div>
      <div
        className="mt-2 flex gap-2"
        role="radiogroup"
        aria-label="Giới tính"
      >
        {OPTIONS.map((opt, index) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || value == null ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onRadioKeyDown(e, index)}
              style={{
                flex: 1,
                padding: "11px 8px",
                fontFamily: "var(--display-2)",
                fontWeight: selected ? 800 : 600,
                fontSize: 13.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                background: selected ? C.gold : "transparent",
                color: selected ? C.forest : ink,
                border: `1px solid ${selected ? C.gold : "rgba(197,165,90,0.28)"}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p
        style={{
          marginTop: 6,
          fontFamily: "var(--serif)",
          fontSize: 11.5,
          color: mute,
          lineHeight: 1.45,
        }}
      >
        Dùng để luận đại vận và cung Mệnh chính xác theo Bát Tự.
      </p>
    </div>
  );
}
