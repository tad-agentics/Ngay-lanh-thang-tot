import { Mono, LogoMark } from "~/components/brand";
import { DAY_LUAN_DAT_LICH_CTA } from "~/components/direction-c/DayLuanPaywallBlur";
import { CT } from "~/lib/c-tokens";

const PAYWALL_LINE =
  "Đặt lịch cát tường để mở luận giải AI cá nhân hóa cho ngày hôm nay.";

type CHomeTodayLuanPaywallProps = {
  onDatLich: () => void;
};

export function CHomeTodayLuanPaywall({ onDatLich }: CHomeTodayLuanPaywallProps) {
  return (
    <div style={{ padding: "12px 18px 14px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: CT.forest,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            overflow: "hidden",
          }}
        >
          <LogoMark dark size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Mono style={{ color: CT.muted, fontSize: 9.5 }}>NLTT luận</Mono>
          <p
            style={{
              marginTop: 4,
              marginBottom: 0,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.6,
              color: CT.ink2,
            }}
          >
            {PAYWALL_LINE}
          </p>
          <button
            type="button"
            onClick={onDatLich}
            className="mt-2.5 w-full cursor-pointer border bg-transparent px-3.5 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
            style={{ borderColor: CT.goldDeep, color: CT.ink }}
          >
            {DAY_LUAN_DAT_LICH_CTA}
          </button>
        </div>
      </div>
    </div>
  );
}
