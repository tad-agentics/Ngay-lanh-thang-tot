import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import {
  BaziPaywallLockedChapterBody,
  BaziPaywallLockedSectionBody,
} from "~/components/direction-c/bazi-paywall-chapter-ui";
import { CBaziMenhTongQuanBlock } from "~/components/direction-c/CBaziMenhTongQuanBlock";
import { CPayConfirmSheet } from "~/components/direction-c/CPayConfirmSheet";
import { BaziSectionHeading } from "~/components/direction-c/BaziSectionHeading";
import { useBaziPaywallMenhTeaser } from "~/hooks/useBaziPaywallMenhTeaser";
import type { CreatePayosCheckoutResponse } from "~/lib/api-types";
import { baziPaywallLockedChapters } from "~/lib/bazi-paywall-mock";
import {
  baziOutlineSections,
  fallbackFlowYearCanChiLabel,
} from "~/lib/bazi-reading-outline";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import { LUAN_LA_SO_BAT_TU_TITLE } from "~/lib/luan-la-so-bat-tu-labels";
import { createPayosCheckout } from "~/lib/payos";
import { readPendingReferralCode } from "~/lib/pending-referral";
import { addonSubscriptionUpsell, priceDisplay } from "~/lib/pay-confirm-ui";
import type { Profile } from "~/lib/profile-context";
import { formatProfileBirthSubline } from "~/lib/profile-birth-line";
import { UI_PACKAGES } from "~/lib/packages";

/** Direction C Secondary — khớp Design System `.btn-secondary`. */
const PAYWALL_SECONDARY_BTN_CLASS =
  "flex w-full cursor-pointer border bg-transparent px-3.5 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]";

type CBaziReadingPaywallViewProps = {
  profile: Profile;
};

/** Paywall màn 18: §01 lá số live + DeepSeek tổng quan; §02–05 mock blur. */
export function CBaziReadingPaywallView({ profile }: CBaziReadingPaywallViewProps) {
  const navigate = useNavigate();
  const year = currentYearVn();
  const addonPkg = UI_PACKAGES.find((p) => p.sku === "luan_bat_tu");
  const yearlyUpsell = addonSubscriptionUpsell("luan_bat_tu");

  const [yearCanChi, setYearCanChi] = useState(() => fallbackFlowYearCanChiLabel(year));
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(null);

  const {
    menhProse,
    menhLoading,
    menhFailed: menhGenFailed,
    laSoDisplay,
    reload: loadMenhPreview,
  } = useBaziPaywallMenhTeaser(profile, {
    onGenFailed: () => {
      toast.error("Chưa tạo được luận tổng quan. Thử tải lại sau vài giây.");
    },
  });

  useEffect(() => {
    const label = fallbackFlowYearCanChiLabel(year);
    if (label) setYearCanChi(label);
  }, [year]);

  const outline = baziOutlineSections(yearCanChi);
  const lockedChapters = baziPaywallLockedChapters(yearCanChi);
  const lockedTitles = lockedChapters.map((s) => s.title).join(" · ");

  const menhTitle = outline.find((o) => o.key === "menh_tong_quan")?.title ?? "Mệnh tổng quan";

  const menhEmptyReason =
    menhGenFailed && laSoDisplay
      ? "Chưa tải được luận tổng quan lá số. Bốn chương dưới đã sẵn sàng sau khi mở khóa."
      : null;

  async function startAddonCheckout(codes: {
    couponCode?: string;
    referralCode?: string;
  }) {
    setBusy(true);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: "luan_bat_tu",
      return_url: `${origin}/luan/mua/thanh-cong?sku=luan_bat_tu`,
      cancel_url: `${origin}/toi/luan-bat-tu`,
      coupon_code: codes.couponCode,
      referral_code: codes.referralCode,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCheckoutPayload(result.data);
  }

  function openAddonPaySheet() {
    setCheckoutPayload(null);
    setPayOpen(true);
  }

  return (
    <main
      className="relative flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title={`${LUAN_LA_SO_BAT_TU_TITLE} · ${year}`} />

      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-y-auto px-6 pb-[300px] pt-1">
          {profile ? (
            <p className="font-serif text-[12.5px] leading-snug" style={{ color: CT.muted }}>
              {formatProfileBirthSubline(profile)}
            </p>
          ) : null}

          <section className="mt-6">
            <BaziSectionHeading index={1} title={menhTitle} />
            <CBaziMenhTongQuanBlock
              profile={profile}
              laSo={laSoDisplay}
              prose={menhProse}
              proseLoading={menhLoading}
              proseFailed={menhGenFailed}
              emptyReason={menhEmptyReason}
              onRetryProse={loadMenhPreview}
            />
          </section>

          {lockedChapters.map((sec) => (
            <section key={sec.key} className="mt-8">
              <BaziSectionHeading index={sec.index} title={sec.title} />
              <BaziPaywallLockedSectionBody onUnlock={openAddonPaySheet}>
                <BaziPaywallLockedChapterBody chapter={sec} />
              </BaziPaywallLockedSectionBody>
            </section>
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-[min(280px,38%)] h-24"
          style={{
            background: `linear-gradient(to bottom, rgba(240,236,226,0) 0%, ${CT.paper} 100%)`,
          }}
          aria-hidden
        />

        <div
          className="absolute inset-x-[18px] bottom-[max(18px,env(safe-area-inset-bottom))] border px-[18px] py-4"
          style={{
            background: "#fff",
            borderColor: CT.goldDeep,
            borderWidth: 1.5,
            boxShadow: "0 16px 36px rgba(0,0,0,0.14)",
          }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-base" style={{ color: CT.goldDeep }}>
              ★
            </span>
            <Mono className="text-[10px] tracking-[0.18em]" style={{ color: CT.goldDeep }}>
              Còn {lockedChapters.length} chương nữa
            </Mono>
          </div>
          <h3
            className="mt-1.5 font-[family-name:var(--display)] text-[20px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em]"
            style={{ color: CT.ink }}
          >
            {lockedTitles}
          </h3>
          <p className="mt-2 font-serif text-[12.5px] leading-snug" style={{ color: CT.ink2 }}>
            Bài luận giải đầy đủ đã được tạo theo lá số của bạn — mở khóa để đọc hết
            {yearlyUpsell ? " hoặc tiết kiệm với Lịch năm." : "."}
          </p>

          <div className="mt-3.5 flex flex-col gap-2">
            {yearlyUpsell ? (
              <button
                type="button"
                onClick={() => navigate(`/dat-lich?plan=${yearlyUpsell.planSku}`)}
                className="flex cursor-pointer items-baseline justify-between gap-2 border-none px-3.5 py-2.5 text-left font-[family-name:var(--display-2)] text-xs font-extrabold uppercase tracking-[0.06em]"
                style={{ background: CT.forest, color: CT.cream }}
              >
                <span className="min-w-0 flex-1">
                  Nâng lên {yearlyUpsell.planLabel} · {yearlyUpsell.benefit}
                </span>
                <span className="shrink-0 tabular-nums" style={{ color: CT.gold }}>
                  {priceDisplay(yearlyUpsell.priceLabel)}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={openAddonPaySheet}
              className={`${PAYWALL_SECONDARY_BTN_CLASS} items-baseline justify-between gap-2 text-left`}
              style={{ borderColor: CT.goldDeep, color: CT.ink }}
            >
              <span>Chỉ mua riêng Bát tự</span>
              <span className="shrink-0 tabular-nums" style={{ color: CT.goldDeep }}>
                {addonPkg ? priceDisplay(addonPkg.priceLabel) : "299.000"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {addonPkg ? (
        <CPayConfirmSheet
          open={payOpen}
          onOpenChange={setPayOpen}
          variant="addon"
          pkg={addonPkg}
          payload={checkoutPayload}
          busy={busy}
          initialReferralCode={readPendingReferralCode()}
          onStartCheckout={(codes) => void startAddonCheckout(codes)}
          successPath={(orderId) =>
            `/luan/mua/thanh-cong?sku=luan_bat_tu&order_id=${encodeURIComponent(orderId)}`
          }
          retryTo="/toi/luan-bat-tu"
          backTo="/toi/luan-bat-tu"
          onRetry={() => {
            setCheckoutPayload(null);
          }}
          cancelLink={{ to: "/toi", label: "Quay lại" }}
        />
      ) : null}
    </main>
  );
}
