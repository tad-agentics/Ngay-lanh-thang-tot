/** Logo — full lockup (mark + wordmark). Use on splash, landing, share artefact, footer only. */

const GOLD_LIGHT = "#c9a84c";

export function Logo({
  dark = false,
  size = 36,
  showUrl = false,
  className,
}: {
  dark?: boolean;
  size?: number;
  showUrl?: boolean;
  className?: string;
}) {
  const src = dark ? "/logo-mark-reversed.svg" : "/logo-mark.svg";
  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <img
        src={src}
        width={size}
        height={size}
        alt="Ngày Lành Tháng Tốt"
        style={{ display: "block" }}
        decoding="async"
      />
      <div
        style={{
          width: 1,
          alignSelf: "stretch",
          minHeight: size * 0.78,
          background: GOLD_LIGHT,
          margin: `${size * 0.05}px ${size * 0.32}px`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: size * 0.56,
            color: dark ? "var(--cream)" : "var(--ink)",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          Ngày Lành
        </span>
        <span
          style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: size * 0.16,
            letterSpacing: "0.36em",
            color: GOLD_LIGHT,
            textTransform: "uppercase",
            marginTop: size * 0.07,
            paddingLeft: 2,
          }}
        >
          Tháng Tốt
        </span>
        {showUrl && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: size * 0.1,
              letterSpacing: "0.1em",
              color: dark ? "#7a9a80" : "#7a7050",
              marginTop: size * 0.1,
              paddingLeft: 2,
            }}
          >
            ngaylanhthangtot.vn
          </span>
        )}
      </div>
    </div>
  );
}
