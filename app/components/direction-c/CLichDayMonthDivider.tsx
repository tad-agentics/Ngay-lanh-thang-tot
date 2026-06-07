import { CT } from "~/lib/c-tokens";

export function CLichDayMonthDivider() {
  return (
    <div
      className="my-6 flex items-center gap-3"
      role="separator"
      aria-label="Cả tháng · chạm để xem ngày khác"
    >
      <span className="h-px flex-1" style={{ background: CT.hairline }} aria-hidden />
      <span
        className="shrink-0 text-center uppercase"
        style={{
          fontFamily: "var(--display-2)",
          fontWeight: 700,
          fontSize: 10.5,
          letterSpacing: "0.12em",
          color: CT.goldDeep,
          lineHeight: 1.2,
        }}
      >
        Cả tháng · chạm để xem ngày khác
      </span>
      <span className="h-px flex-1" style={{ background: CT.hairline }} aria-hidden />
    </div>
  );
}
