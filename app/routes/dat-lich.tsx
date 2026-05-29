import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Mono } from "~/components/brand";
import type { PackageSku } from "~/lib/api-types";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";
import { subscriptionStatusLine } from "~/lib/entitlements";
import { createPayosCheckout } from "~/lib/payos";
import {
  PAY_CONFIRM_ADDON_META,
  PAY_CONFIRM_TIER_META,
  priceDisplay,
} from "~/lib/pay-confirm-ui";
import {
  ADDON_SKUS,
  SUBSCRIPTION_SKUS,
  UI_PACKAGES,
} from "~/lib/packages";
import { useProfile } from "~/hooks/useProfile";

const SUBSCRIPTION_TIERS = UI_PACKAGES.filter((p) =>
  SUBSCRIPTION_SKUS.includes(p.sku),
);
const ADDON_PACKAGES = UI_PACKAGES.filter((p) => ADDON_SKUS.includes(p.sku));

const TIER_META = PAY_CONFIRM_TIER_META;
const ADDON_META = PAY_CONFIRM_ADDON_META;

export default function DatLichRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  const [busySku, setBusySku] = useState<PackageSku | null>(null);
  const [failedSku, setFailedSku] = useState<PackageSku | null>(null);
  const tierRefs = useRef<Partial<Record<PackageSku, HTMLDivElement | null>>>({});

  const planParam = searchParams.get("plan");
  const preselectedSku = useMemo((): PackageSku | null => {
    if (planParam && SUBSCRIPTION_SKUS.includes(planParam as PackageSku)) {
      return planParam as PackageSku;
    }
    return null;
  }, [planParam]);

  const statusLine = subscriptionStatusLine(profile);

  useEffect(() => {
    if (!preselectedSku) return;
    const el = tierRefs.current[preselectedSku];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [preselectedSku]);

  async function checkout(sku: PackageSku) {
    if (ADDON_SKUS.includes(sku)) {
      navigate(`/luan/mua/xac-nhan?sku=${sku}&start=1`);
      return;
    }

    setFailedSku(null);
    setBusySku(sku);
    const origin = window.location.origin;
    const result = await createPayosCheckout({
      package_sku: sku,
      return_url: `${origin}/thanh-cong`,
      cancel_url: `${origin}/dat-lich/that-bai`,
    });
    setBusySku(null);
    if (!result.ok) {
      setFailedSku(sku);
      toast.error(result.message);
      return;
    }
    navigate("/dat-lich/xac-nhan", {
      state: { sku, checkout: result.data },
    });
  }

  return (
    <div
      className="flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <div className="flex items-center gap-2.5 px-[22px] pb-1 pt-1.5">
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => void navigate(-1)}
          className="cursor-pointer border-none bg-transparent p-0 font-serif text-lg"
          style={{ color: CT.goldDeep }}
        >
          ‹
        </button>
        <span className="font-serif text-[12.5px]" style={{ color: CT.muted }}>
          Tôi · Đặt lịch
        </span>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-[100px] pt-3.5">
        <h1
          className="m-0 font-[family-name:var(--display)] text-[34px] font-extrabold uppercase leading-[0.98] tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          Lịch của bạn,
          <br />
          <span
            className="font-serif text-[34px] font-bold italic normal-case tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            cho cả năm.
          </span>
        </h1>

        {statusLine ? (
          <p
            className="mt-3 font-serif text-[13px] leading-snug"
            style={{ color: CT.ink2 }}
          >
            {statusLine}
          </p>
        ) : null}

        <div
          className="mt-[22px] flex items-baseline gap-2.5 border-b pb-1.5"
          style={{ borderColor: CT.ink }}
        >
          <span
            className="font-[family-name:var(--mono)] text-[11px] tracking-[0.18em]"
            style={{ color: CT.goldDeep }}
          >
            A
          </span>
          <span
            className="text-[17px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ ...DISPLAY, color: CT.ink }}
          >
            Gói lịch · đăng ký
          </span>
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {SUBSCRIPTION_TIERS.map((pkg) => {
            const meta = TIER_META[pkg.sku];
            const hero = pkg.featured;
            const isBusy = busySku === pkg.sku;
            const isFailed = failedSku === pkg.sku;
            const isPreselected = preselectedSku === pkg.sku;
            const price = priceDisplay(pkg.priceLabel);

            return (
              <div
                key={pkg.sku}
                ref={(el) => {
                  tierRefs.current[pkg.sku] = el;
                }}
                className="relative px-4 py-4"
                style={{
                  background: hero ? CT.forest : "#fff",
                  color: hero ? CT.cream : CT.ink,
                  border: hero
                    ? `1.5px solid ${CT.gold}`
                    : isPreselected
                      ? `2px solid ${CT.goldDeep}`
                      : `1px solid ${CT.hairline}`,
                  boxShadow: hero ? "0 12px 26px rgba(29,49,41,0.2)" : "none",
                }}
              >
                {hero ? (
                  <div
                    className="absolute -top-2.5 left-3.5 px-2 py-0.5 font-[family-name:var(--mono)] text-[9px] font-extrabold tracking-[0.18em]"
                    style={{ background: CT.gold, color: CT.forest }}
                  >
                    ★ TỐT NHẤT
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <div
                      className="text-[22px] font-extrabold uppercase tracking-[-0.01em]"
                      style={DISPLAY}
                    >
                      {pkg.title}
                    </div>
                    <div
                      className="mt-0.5 font-serif text-xs"
                      style={{ color: hero ? "rgba(237,231,211,0.65)" : CT.muted }}
                    >
                      {meta?.sub ?? pkg.subtitle}
                    </div>
                  </div>
                  <div className="text-right">
                    {meta?.baseline ? (
                      <div
                        className="mb-0.5 font-serif text-xs line-through tabular-nums"
                        style={{
                          color: hero ? "rgba(237,231,211,0.55)" : CT.muted,
                        }}
                      >
                        {meta.baseline}đ
                      </div>
                    ) : null}
                    <div
                      className="text-2xl font-extrabold leading-none tabular-nums tracking-[-0.015em]"
                      style={{
                        ...DISPLAY2,
                        color: hero ? CT.gold : CT.goldDeep,
                      }}
                    >
                      {price}
                    </div>
                    <div
                      className="mt-1 font-serif text-[11.5px]"
                      style={{ color: hero ? "rgba(237,231,211,0.65)" : CT.muted }}
                    >
                      đ · {meta?.per ?? "gói"}
                    </div>
                  </div>
                </div>

                {hero ? (
                  <>
                    <div
                      className="mt-2.5 flex items-baseline justify-between gap-2 px-2.5 py-2"
                      style={{ background: "rgba(197,165,90,0.18)" }}
                    >
                      <Mono
                        style={{
                          color: CT.gold,
                          fontSize: 9.5,
                          letterSpacing: "0.12em",
                        }}
                      >
                        {meta?.save}
                      </Mono>
                      <span
                        className="text-[11px] font-bold"
                        style={{ ...DISPLAY2, color: CT.gold }}
                      >
                        tiết kiệm 52,6%
                      </span>
                    </div>
                    <div
                      className="mt-2.5 font-serif text-[11.5px] leading-snug"
                      style={{ color: "rgba(237,231,211,0.75)" }}
                    >
                      Gồm: Lịch{" "}
                      <strong className="font-semibold" style={{ color: CT.cream }}>
                        449k
                      </strong>{" "}
                      + Luận giải Bát tự{" "}
                      <strong className="font-semibold" style={{ color: CT.cream }}>
                        299k
                      </strong>{" "}
                      + Luận giải Tiểu Vận 2026{" "}
                      <strong className="font-semibold" style={{ color: CT.cream }}>
                        199k
                      </strong>
                    </div>
                  </>
                ) : meta?.save ? (
                  <div
                    className="mt-1.5 font-[family-name:var(--mono)] text-[10px] uppercase tracking-[0.08em]"
                    style={{ color: CT.goldDeep }}
                  >
                    {meta.save}
                  </div>
                ) : null}

                {isFailed ? (
                  <div
                    className="mt-3 flex items-center justify-between gap-2 px-3 py-2"
                    style={{
                      background: "rgba(139,26,26,0.08)",
                      border: "1px solid rgba(139,26,26,0.25)",
                    }}
                  >
                    <Mono style={{ color: CT.red, fontSize: 10 }}>
                      Đơn tạm thời — PayOS chưa phản hồi
                    </Mono>
                    <button
                      type="button"
                      onClick={() => void checkout(pkg.sku)}
                      className="cursor-pointer border-none px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                      style={{ ...DISPLAY2, background: CT.red, color: "#fff" }}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={busySku !== null}
                  onClick={() => void checkout(pkg.sku)}
                  className="mt-3 w-full cursor-pointer py-[11px] text-[11.5px] font-extrabold uppercase tracking-[0.08em] disabled:opacity-60"
                  style={{
                    ...DISPLAY2,
                    background: hero ? CT.gold : "transparent",
                    color: hero ? CT.forest : CT.ink,
                    border: hero ? "none" : `1px solid ${CT.goldDeep}`,
                  }}
                >
                  {isBusy
                    ? "Đang tạo đơn…"
                    : hero
                      ? `Đặt lịch năm — ${priceDisplay(pkg.priceLabel)}đ`
                      : "Chọn gói này"}
                </button>
              </div>
            );
          })}
        </div>

        <p
          className="mt-[22px] font-serif text-xs leading-relaxed"
          style={{ color: CT.muted }}
        >
          Mọi gói đều có: lịch cá nhân theo lá số · trang hôm nay · tháng · tra
          cứu ngày tốt không giới hạn · hợp tuổi.
        </p>

        <div
          className="mt-9 flex items-baseline gap-2.5 border-b pb-1.5"
          style={{ borderColor: CT.ink }}
        >
          <span
            className="font-[family-name:var(--mono)] text-[11px] tracking-[0.18em]"
            style={{ color: CT.goldDeep }}
          >
            B
          </span>
          <span
            className="text-[17px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ ...DISPLAY, color: CT.ink }}
          >
            Mua lẻ · không cần gói lịch
          </span>
        </div>

        <div className="mt-3.5 flex flex-col gap-2">
          {ADDON_PACKAGES.map((pkg) => {
            const meta = ADDON_META[pkg.sku];
            const isBusy = busySku === pkg.sku;
            const price = priceDisplay(pkg.priceLabel);

            return (
              <div
                key={pkg.sku}
                className="flex items-start justify-between gap-2.5 border px-3.5 py-3.5"
                style={{ background: "#fff", borderColor: CT.hairline }}
              >
                <div className="flex-1">
                  <div
                    className="text-sm font-bold tracking-[-0.005em]"
                    style={{ ...DISPLAY2, color: CT.ink }}
                  >
                    {meta?.title ?? pkg.title}
                  </div>
                  <div className="mt-0.5 font-serif text-[11.5px]" style={{ color: CT.muted }}>
                    {meta?.sub ?? pkg.subtitle}
                  </div>
                  <button
                    type="button"
                    disabled={busySku !== null}
                    onClick={() => void checkout(pkg.sku)}
                    className="mt-2.5 cursor-pointer border-none bg-transparent p-0 text-[11px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
                    style={{ ...DISPLAY2, color: CT.goldDeep }}
                  >
                    {isBusy ? "Đang tạo đơn…" : "Mua →"}
                  </button>
                </div>
                <div className="text-right">
                  <div
                    className="text-[17px] font-extrabold leading-none tabular-nums tracking-[-0.015em]"
                    style={{ ...DISPLAY2, color: CT.goldDeep }}
                  >
                    {price}
                  </div>
                  <div className="mt-0.5 font-serif text-[10.5px]" style={{ color: CT.muted }}>
                    đ · {meta?.per ?? "một lần"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-3.5 border-l-[3px] px-4 py-3.5"
          style={{
            background: "rgba(154,124,34,0.08)",
            borderColor: CT.goldDeep,
          }}
        >
          <Mono style={{ color: CT.goldDeep, fontSize: 9 }}>So sánh nhanh</Mono>
          <div
            className="mt-2 font-serif text-[13px] leading-relaxed"
            style={{ color: CT.ink }}
          >
            Mua lẻ cả 2 luận giải ={" "}
            <strong className="font-bold" style={{ ...DISPLAY2, color: CT.ink }}>
              498.000đ
            </strong>{" "}
            — nhưng <strong className="font-semibold">không có lịch</strong>.
          </div>
          <div
            className="mt-1.5 font-serif text-[13px] leading-relaxed"
            style={{ color: CT.ink2 }}
          >
            Lịch năm{" "}
            <strong className="font-bold" style={{ ...DISPLAY2, color: CT.goldDeep }}>
              449.000đ
            </strong>{" "}
            đã bao gồm cả 2 — rẻ hơn{" "}
            <strong className="font-semibold" style={{ color: CT.greenMute }}>
              49.000đ
            </strong>{" "}
            mà còn có lịch dùng cả năm.
          </div>
        </div>

        <p
          className="mt-[22px] text-center font-serif text-[11.5px] leading-relaxed"
          style={{ color: CT.muted }}
        >
          Thanh toán qua PayOS · MoMo · VietQR · thẻ
          <br />
          Hoàn tiền 7 ngày · không tự gia hạn
        </p>
      </div>
    </div>
  );
}
