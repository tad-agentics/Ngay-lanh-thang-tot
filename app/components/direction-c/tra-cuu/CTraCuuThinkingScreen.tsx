import { BackBar, Mono } from "~/components/brand";
import { CT } from "~/lib/c-tokens";
import { NSeal } from "~/components/direction-c/tra-cuu/NSeal";

type CTraCuuThinkingScreenProps = {
  intentLabel: string;
  menh: string | null;
  rangeLabel: string;
  slow: boolean;
  onBack: () => void;
  onCancel: () => void;
};

export function CTraCuuThinkingScreen({
  intentLabel,
  menh,
  rangeLabel,
  slow,
  onBack,
  onCancel,
}: CTraCuuThinkingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: CT.paper }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <BackBar
        title="Tra cứu"
        subtitle={intentLabel}
        onBack={onBack}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-10 pb-16">
        <NSeal size={52} />
        <div className="max-w-[300px] text-center">
          <p
            className="font-serif text-[15px] leading-relaxed"
            style={{ color: CT.ink2 }}
          >
            NLTT đang soi lịch cho việc{" "}
            <strong className="font-semibold not-italic" style={{ color: CT.ink }}>
              {intentLabel.toLowerCase()}
            </strong>
            {menh ? (
              <>
                {" "}
                theo lá số{" "}
                <strong className="font-semibold not-italic" style={{ color: CT.ink }}>
                  {menh}
                </strong>
              </>
            ) : null}{" "}
            của bạn…
          </p>
          <Mono
            className="mt-3 block"
            style={{
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: CT.muted,
            }}
          >
            {rangeLabel}
          </Mono>
        </div>

        <div
          className="relative h-[1.5px] w-24 overflow-hidden"
          style={{ background: "rgba(197,165,90,0.3)" }}
        >
          <div
            className="absolute inset-y-0 w-[38%]"
            style={{
              background: CT.gold,
              animation: "traCuuScan 1.25s ease-in-out infinite",
            }}
          />
        </div>

        {slow ? (
          <p className="font-serif text-[12.5px] italic" style={{ color: CT.muted }}>
            Lịch nhiều ngày — thêm vài giây…
          </p>
        ) : null}
      </div>

      <div className="px-6 pb-8">
        <button
          type="button"
          onClick={onCancel}
          className="w-full cursor-pointer border bg-transparent py-2.5 font-serif text-[13px]"
          style={{ borderColor: CT.hairline, color: CT.muted }}
        >
          Huỷ
        </button>
      </div>

      <style>{`
        @keyframes traCuuScan {
          0% { left: -38%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
