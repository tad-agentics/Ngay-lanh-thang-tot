import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CPayConfirmSheet } from "~/components/direction-c/CPayConfirmSheet";
import type { CreatePayosCheckoutResponse } from "~/lib/api-types";
import { baziPaywallLockedSections } from "~/lib/bazi-paywall-mock";
import { loadBaziLaSoChiTietSections } from "~/lib/bazi-reading-load";
import { currentYearVn } from "~/lib/bazi-reading-session";
import { CT, DISPLAY } from "~/lib/c-tokens";
import { createPayosCheckout } from "~/lib/payos";
import { addonSubscriptionUpsell, priceDisplay } from "~/lib/pay-confirm-ui";
import type { Profile } from "~/lib/profile-context";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
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

function SectionHeading({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  return (
    <div
      className="flex items-baseline gap-2.5 border-b pb-1.5"
      style={{ borderColor: CT.ink }}
    >
      <span
        className="font-mono text-[11.5px]"
        style={{ color: CT.goldDeep, letterSpacing: "0.18em" }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <span className="text-lg font-extrabold uppercase tracking-tight" style={DISPLAY}>
        {title}
      </span>
    </div>
  );
}

function LockedSectionBody({ mockText }: { mockText: string }) {
  return (
    <div className="relative mt-3">
      <p
        className="m-0 text-[14px] leading-relaxed select-none"
        style={{
          color: CT.ink2,
          filter: "blur(5px)",
          WebkitFilter: "blur(5px)",
        }}
        aria-hidden
      >
        {mockText}
      </p>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(240,236,226,0.15) 0%, rgba(240,236,226,0.72) 55%, ${CT.paper} 100%)`,
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2"
        aria-hidden
      >
        <span className="text-[11px]" style={{ color: CT.goldDeep }}>
          ◆
        </span>
        <Mono className="text-[9px] tracking-[0.14em]" style={{ color: CT.goldDeep }}>
          Đã phân tích · mở khóa để đọc
        </Mono>
      </div>
    </div>
  );
}

type CBaziReadingPaywallViewProps = {
  profile: Profile;
};

/** Paywall: chương 01 thật; 4 chương mock + blur; CTA mở sheet thanh toán. */
export function CBaziReadingPaywallView({ profile }: CBaziReadingPaywallViewProps) {
  const navigate = useNavigate();
  const year = currentYearVn();
  const reveal = profile.la_so ? laSoJsonToRevealProps(profile.la_so) : null;
  const addonPkg = UI_PACKAGES.find((p) => p.sku === "luan_bat_tu");
  const yearlyUpsell = addonSubscriptionUpsell("luan_bat_tu");
  const lockedSections = baziPaywallLockedSections();

  const [previewSection, setPreviewSection] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutPayload, setCheckoutPayload] =
    useState<CreatePayosCheckoutResponse | null>(null);
  const genRef = useRef(0);

  const lockedTitles = lockedSections.map((s) => s.title).join(" · ");

  useEffect(() => {
    let cancelled = false;
    const gen = ++genRef.current;
    setPreviewLoading(true);
    void (async () => {
      const sections = await loadBaziLaSoChiTietSections(profile, { preview: true });
      if (cancelled || gen !== genRef.current) return;
      const first = sections[0];
      setPreviewSection(
        first ? { title: first.title, text: first.text } : null,
      );
      setPreviewLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

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

  const previewTitle = previewSection?.title ?? "Tính cách";

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

          {reveal ? (
            <h2
              className="mt-3 text-[26.5px] font-extrabold uppercase leading-none tracking-[-0.015em]"
              style={{ ...DISPLAY, color: CT.ink }}
            >
              {reveal.nhatChu}
              {reveal.hanh !== "—" ? ` ${reveal.hanh}` : ""}
              {reveal.menh !== "—" ? (
                <>
                  {" "}
                  <span
                    className="font-serif text-[26.5px] font-bold italic normal-case tracking-normal"
                    style={{ color: CT.goldDeep }}
                  >
                    {reveal.menh}
                  </span>
                </>
              ) : null}
            </h2>
          ) : null}

          <section className="mt-6">
            <SectionHeading index={1} title={previewTitle} />
            {previewLoading ? (
              <p className="mt-3 font-serif text-sm" style={{ color: CT.muted }}>
                Đang luận giải chương Tính cách…
              </p>
            ) : previewSection ? (
              <p
                className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap"
                style={{ color: CT.ink2 }}
              >
                {previewSection.text}
              </p>
            ) : (
              <p className="mt-3 font-serif text-sm" style={{ color: CT.muted }}>
                Chưa tải được đoạn mở đầu. Bốn chương dưới đã sẵn sàng sau khi mở khóa.
              </p>
            )}
          </section>

          {lockedSections.map((sec) => (
            <section key={sec.id} className="mt-8">
              <SectionHeading index={sec.index} title={sec.title} />
              <LockedSectionBody mockText={sec.mockText} />
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
              Còn {lockedSections.length} chương nữa
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
              className="flex cursor-pointer items-baseline justify-between gap-2 border bg-transparent px-3.5 py-2.5 text-left font-[family-name:var(--display-2)] text-xs font-bold uppercase tracking-[0.06em]"
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
