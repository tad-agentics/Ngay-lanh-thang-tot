import { CT } from "~/lib/c-tokens";

export function PaySuccessStamp({ size = 88.5 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none" aria-hidden>
      <circle
        cx="44"
        cy="44"
        r="42"
        stroke={CT.goldDeep}
        strokeWidth="1.5"
        fill="rgba(154,124,34,0.06)"
      />
      <circle
        cx="44"
        cy="44"
        r="36"
        stroke={CT.goldDeep}
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M28 46 L40 58 L60 32"
        stroke={CT.goldDeep}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PayFailureMark({ size = 80.5 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>
      <circle
        cx="40"
        cy="40"
        r="38"
        stroke={CT.red}
        strokeWidth="1.5"
        fill="rgba(163,32,31,0.05)"
      />
      <circle
        cx="40"
        cy="40"
        r="32"
        stroke={CT.red}
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M28 28 L52 52 M52 28 L28 52"
        stroke={CT.red}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
