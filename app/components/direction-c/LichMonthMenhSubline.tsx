import { CT } from "~/lib/c-tokens";

export type LichMonthMenhSublineProps = {
  lunarMonthLabel: string | null;
  menh: string;
  refreshing?: boolean;
};

export function LichMonthMenhSubline({
  lunarMonthLabel,
  menh,
  refreshing,
}: LichMonthMenhSublineProps) {
  return (
    <>
      {lunarMonthLabel ? (
        <>
          {lunarMonthLabel}
          {" · "}
        </>
      ) : null}
      chấm theo bản mệnh{" "}
      <strong style={{ color: CT.ink, fontWeight: 600 }}>{menh}</strong>
      {refreshing ? (
        <>
          {" · "}
          <span style={{ color: CT.goldDeep, fontStyle: "italic" }}>
            Đang cập nhật…
          </span>
        </>
      ) : null}
    </>
  );
}
