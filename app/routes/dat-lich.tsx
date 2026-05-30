import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Mono } from "~/components/brand";
import type { PackageSku } from "~/lib/api-types";
import { CT, DISPLAY, DISPLAY2 } from "~/lib/c-tokens";
import { subscriptionStatusLine } from "~/lib/entitlements";
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

    navigate("/dat-lich/xac-nhan", { state: { sku } });
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
        <span className="font-serif text-[13px]" style={{ color: CT.muted }}>
          Tôi · Đăng ký lịch cát tường
        </span>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-[100px] pt-3.5">
        <h1
          className="m-0 font-[family-name:var(--display)] text-[34.5px] font-extrabold uppercase leading-[0.98] tracking-[-0.015em]"
          style={{ color: CT.ink }}
        >
          Lịch cát tường,
          <br />
          <span
            className="font-serif text-[34.5px] font-bold italic normal-case tracking-normal"
            style={{ color: CT.goldDeep }}
          >
            đồng hành trọn năm.
          </span>
        </h1>

        {statusLine ? (
          <p
            className="mt-3 font-serif text-[13.5px] leading-snug"
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
            className="font-[family-name:var(--mono)] text-[11.5px] tracking-[0.18em]"
            style={{ color: CT.goldDeep }}
          >
            A
          </span>
          <span
            className="text-[17.5px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ ...DISPLAY, color: CT.ink }}
          >
            Đăng ký lịch cát tường
          </span>
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {SUBSCRIPTION_TIERS.map((pkg) => {
            const meta = TIER_META[pkg.sku];
            const hero = pkg.featured;
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
                    className="absolute -top-2.5 left-3.5 px-2 py-0.5 font-[family-name:var(--mono)] text-[9.5px] font-extrabold tracking-[0.18em]"
                    style={{ background: CT.gold, color: CT.forest }}
                  >
                    ★ TỐT NHẤT
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <div
                      className="text-[22.5px] font-extrabold uppercase tracking-[-0.01em]"
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
                      className="mt-1 font-serif text-[12px]"
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
                          fontSize: 10,
                          letterSpacing: "0.12em",
                        }}
                      >
                        {meta?.save}
                      </Mono>
                      <span
                        className="text-[11.5px] font-bold"
                        style={{ ...DISPLAY2, color: CT.gold }}
                      >
                        tiết kiệm 27,2%
                      </span>
                    </div>
                    <div
                      className="mt-2.5 font-serif text-[12px] leading-snug"
                      style={{ color: "rgba(237,231,211,0.75)" }}
                    >
                      Gồm: Lịch cả năm + Luận giải Bát tự{" "}
                      <strong className="font-semibold" style={{ color: CT.cream }}>
                        299k
                      </strong>{" "}
                      + Luận giải Tiểu vận{" "}
                      <strong className="font-semibold" style={{ color: CT.cream }}>
                        199k
                      </strong>
                    </div>
                  </>
                ) : meta?.save ? (
                  <div
                    className="mt-1.5 font-[family-name:var(--mono)] text-[10.5px] uppercase tracking-[0.08em]"
                    style={{ color: CT.goldDeep }}
                  >
                    {meta.save}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void checkout(pkg.sku)}
                  className="mt-3 w-full cursor-pointer py-[11px] text-[12px] font-extrabold uppercase tracking-[0.08em]"
                  style={{
                    ...DISPLAY2,
                    background: hero ? CT.gold : "transparent",
                    color: hero ? CT.forest : CT.ink,
                    border: hero ? "none" : `1px solid ${CT.goldDeep}`,
                  }}
                >
                  {hero
                    ? `Đăng ký lịch năm — ${priceDisplay(pkg.priceLabel)}đ`
                    : "Đăng ký gói này"}
                </button>
              </div>
            );
          })}
        </div>

        <p
          className="mt-[22px] font-serif text-xs leading-relaxed"
          style={{ color: CT.muted }}
        >
          Gói 3 tháng: lịch cá nhân · tra cứu ngày tốt · hợp tuổi. Gói 6 tháng thêm
          luận Tiểu vận. Gói năm mở full luận Bát tự và toàn bộ tính năng.
        </p>

        <div
          className="mt-9 flex items-baseline gap-2.5 border-b pb-1.5"
          style={{ borderColor: CT.ink }}
        >
          <span
            className="font-[family-name:var(--mono)] text-[11.5px] tracking-[0.18em]"
            style={{ color: CT.goldDeep }}
          >
            B
          </span>
          <span
            className="text-[17.5px] font-extrabold uppercase tracking-[-0.005em]"
            style={{ ...DISPLAY, color: CT.ink }}
          >
            Mở luận giải chuyên sâu
          </span>
        </div>

        <div className="mt-3.5 flex flex-col gap-2">
          {ADDON_PACKAGES.map((pkg) => {
            const meta = ADDON_META[pkg.sku];
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
                  <div className="mt-0.5 font-serif text-[12px]" style={{ color: CT.muted }}>
                    {meta?.sub ?? pkg.subtitle}
                  </div>
                  <button
                    type="button"
                    onClick={() => void checkout(pkg.sku)}
                    className="mt-2.5 cursor-pointer border-none bg-transparent p-0 text-[11.5px] font-bold uppercase tracking-[0.06em]"
                    style={{ ...DISPLAY2, color: CT.goldDeep }}
                  >
                    Khai mở →
                  </button>
                </div>
                <div className="text-right">
                  <div
                    className="text-[17.5px] font-extrabold leading-none tabular-nums tracking-[-0.015em]"
                    style={{ ...DISPLAY2, color: CT.goldDeep }}
                  >
                    {price}
                  </div>
                  <div className="mt-0.5 font-serif text-[11px]" style={{ color: CT.muted }}>
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
          <Mono style={{ color: CT.goldDeep, fontSize: 9.5 }}>So sánh nhanh</Mono>
          <div
            className="mt-2 font-serif text-[13.5px] leading-relaxed"
            style={{ color: CT.ink }}
          >
            Mở lẻ cả hai bản luận giải ={" "}
            <strong className="font-bold" style={{ ...DISPLAY2, color: CT.ink }}>
              498.000đ
            </strong>{" "}
            — nhưng <strong className="font-semibold">không kèm Lịch cát tường</strong>.
          </div>
          <div
            className="mt-1.5 font-serif text-[13.5px] leading-relaxed"
            style={{ color: CT.ink2 }}
          >
            Gói năm{" "}
            <strong className="font-bold" style={{ ...DISPLAY2, color: CT.goldDeep }}>
              799.000đ
            </strong>{" "}
            đã tích hợp trọn vẹn cả hai bản luận + lịch cả năm — tiết kiệm ngay{" "}
            <strong className="font-semibold" style={{ color: CT.greenMute }}>
              298.000đ
            </strong>{" "}
            so với mua lẻ từng phần.
          </div>
        </div>

        <p
          className="mt-[22px] text-center font-serif text-[12px] leading-relaxed"
          style={{ color: CT.muted }}
        >
          Thanh toán bảo mật qua PayOS · VietQR
          <br />
          Cam kết hoàn tiền trong 7 ngày · Không tự động gia hạn
        </p>
      </div>
    </div>
  );
}
