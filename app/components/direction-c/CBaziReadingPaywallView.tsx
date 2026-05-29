import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CBaziMenhTongQuanBlock } from "~/components/direction-c/CBaziMenhTongQuanBlock";
import { CBaziPhongThuySection } from "~/components/direction-c/CBaziPhongThuySection";
import { CBaziQuyNhanSection } from "~/components/direction-c/CBaziQuyNhanSection";
import { CBaziTinhCachSection } from "~/components/direction-c/CBaziTinhCachSection";
import { CBaziVanNamSection } from "~/components/direction-c/CBaziVanNamSection";
import { CPayConfirmSheet } from "~/components/direction-c/CPayConfirmSheet";
import { BaziSectionHeading } from "~/components/direction-c/BaziSectionHeading";
import type { LaSoJson } from "~/lib/api-types";
import type { CreatePayosCheckoutResponse } from "~/lib/api-types";
import {
  baziPaywallLockedChapters,
  type BaziPaywallLockedChapter,
} from "~/lib/bazi-paywall-mock";
import { loadBaziPaywallBundle } from "~/lib/bazi-reading-load";
import {
  baziOutlineSections,
  fallbackFlowYearCanChiLabel,
  flowYearCanChiFromFacts,
} from "~/lib/bazi-reading-outline";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT } from "~/lib/c-tokens";
import { fetchLuuNienYearFacts } from "~/lib/luu-nien-facts";
import { createPayosCheckout } from "~/lib/payos";
import { addonSubscriptionUpsell, priceDisplay } from "~/lib/pay-confirm-ui";
import type { Profile } from "~/lib/profile-context";
import { UI_PACKAGES } from "~/lib/packages";

function birthLine(profile: {
  display_name: string | null;
  ngay_sinh: string | null;
  gio_sinh: string | null;
}): string {
  const parts: string[] = [];
  if (profile.display_name) parts.push(profile.display_name);
  if (profile.ngay_sinh) parts.push(`sinh ${profile.ngay_sinh}`);
  if (profile.gio_sinh) parts.push(`giờ ${profile.gio_sinh}`);
  return parts.join(" · ");
}

function PaywallLockedChapterBody({ chapter }: { chapter: BaziPaywallLockedChapter }) {
  switch (chapter.key) {
    case "tinh_cach":
      return (
        <CBaziTinhCachSection
          traits={chapter.traits}
          introProse={chapter.introProse}
          prose=""
          emptyReason={null}
        />
      );
    case "van_nam":
      return (
        <CBaziVanNamSection facts={chapter.facts} prose="" emptyReason={null} />
      );
    case "phong_thuy":
      return (
        <CBaziPhongThuySection facts={chapter.facts} prose="" emptyReason={null} />
      );
    case "quy_nhan":
      return (
        <CBaziQuyNhanSection
          quyNhan={chapter.quyNhan}
          daiVanNext={chapter.daiVanNext}
          prose=""
          emptyReason={null}
        />
      );
  }
}

/** Direction C Secondary — khớp Design System `.btn-secondary`. */
const PAYWALL_SECONDARY_BTN_CLASS =
  "flex w-full cursor-pointer border bg-transparent px-3.5 py-2.5 font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]";

function LockedSectionBody({
  children,
  onUnlock,
}: {
  children: ReactNode;
  onUnlock: () => void;
}) {
  return (
    <div className="relative mt-3 min-h-[120px]">
      <div
        className="select-none"
        style={{
          filter: "blur(5px)",
          WebkitFilter: "blur(5px)",
        }}
        aria-hidden
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(240,236,226,0.15) 0%, rgba(240,236,226,0.72) 55%, ${CT.paper} 100%)`,
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 pt-10">
        <button
          type="button"
          onClick={onUnlock}
          className={`${PAYWALL_SECONDARY_BTN_CLASS} items-center justify-center`}
          style={{ borderColor: CT.goldDeep, color: CT.ink }}
        >
          Mở khóa để đọc
        </button>
      </div>
    </div>
  );
}

type CBaziReadingPaywallViewProps = {
  profile: Profile;
};

/** Paywall màn 18: §01 lá số live + Gemini tổng quan; §02–05 mock blur. */
export function CBaziReadingPaywallView({ profile }: CBaziReadingPaywallViewProps) {
  const navigate = useNavigate();
  const year = currentYearVn();
  const addonPkg = UI_PACKAGES.find((p) => p.sku === "luan_bat_tu");
  const yearlyUpsell = addonSubscriptionUpsell("luan_bat_tu");

  const [yearCanChi, setYearCanChi] = useState(() => fallbackFlowYearCanChiLabel(year));
  const [laSoDisplay, setLaSoDisplay] = useState<LaSoJson | null>(
    () => (profile.la_so as LaSoJson) ?? null,
  );
  const [menhProse, setMenhProse] = useState<string | null>(null);
  const [menhLoading, setMenhLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(null);
  const genRef = useRef(0);

  const outline = baziOutlineSections(yearCanChi);
  const lockedChapters = baziPaywallLockedChapters(yearCanChi);
  const lockedTitles = lockedChapters.map((s) => s.title).join(" · ");

  const menhTitle = outline.find((o) => o.key === "menh_tong_quan")?.title ?? "Mệnh tổng quan";

  const menhEmptyReason =
    !menhLoading && !menhProse?.trim() && laSoDisplay
      ? "Chưa tải được luận tổng quan lá số. Bốn chương dưới đã sẵn sàng sau khi mở khóa."
      : null;

  useEffect(() => {
    let cancelled = false;
    const gen = ++genRef.current;
    setMenhLoading(true);
    void (async () => {
      const [luuRes, paywall] = await Promise.all([
        fetchLuuNienYearFacts(profile, year),
        loadBaziPaywallBundle(profile),
      ]);
      if (cancelled || gen !== genRef.current) return;
      if (luuRes.ok) {
        const label =
          flowYearCanChiFromFacts(luuRes.data) || fallbackFlowYearCanChiLabel(year);
        if (label) setYearCanChi(label);
      }
      if (paywall.laSoDisplay) setLaSoDisplay(paywall.laSoDisplay);
      setMenhProse(paywall.menhOverview || null);
      setMenhLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, year]);

  async function startAddonCheckout() {
    setBusy(true);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: "luan_bat_tu",
      return_url: `${origin}/luan/mua/thanh-cong?sku=luan_bat_tu`,
      cancel_url: `${origin}/toi/luan-bat-tu`,
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
      <BackBar title={`Luận giải Bát Tự · ${year}`} />

      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-y-auto px-6 pb-[300px] pt-1">
          {profile ? (
            <p className="font-serif text-[12.5px] leading-snug" style={{ color: CT.muted }}>
              {birthLine(profile)}
            </p>
          ) : null}

          <section className="mt-6">
            <BaziSectionHeading index={1} title={menhTitle} />
            {menhLoading ? (
              <p className="mt-3 font-serif text-sm" style={{ color: CT.muted }}>
                Đang luận tổng quan lá số…
              </p>
            ) : null}
            <CBaziMenhTongQuanBlock
              profile={profile}
              laSo={laSoDisplay}
              prose={menhProse}
              emptyReason={menhEmptyReason}
            />
          </section>

          {lockedChapters.map((sec) => (
            <section key={sec.key} className="mt-8">
              <BaziSectionHeading index={sec.index} title={sec.title} />
              <LockedSectionBody onUnlock={openAddonPaySheet}>
                <PaywallLockedChapterBody chapter={sec} />
              </LockedSectionBody>
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
          onStartCheckout={() => void startAddonCheckout()}
          successPath={(orderId) =>
            `/luan/mua/thanh-cong?sku=luan_bat_tu&order_id=${encodeURIComponent(orderId)}`
          }
          retryTo="/toi/luan-bat-tu"
          backTo="/toi/luan-bat-tu"
          onRetry={() => {
            setCheckoutPayload(null);
            void startAddonCheckout();
          }}
          cancelLink={{ to: "/toi", label: "Quay lại" }}
        />
      ) : null}
    </main>
  );
}
