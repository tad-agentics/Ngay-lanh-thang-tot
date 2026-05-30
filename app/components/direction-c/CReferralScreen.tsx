import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import type { ReferralDashboardResponse } from "~/lib/api-types";
import { CT, DISPLAY2 } from "~/lib/c-tokens";
import { fetchReferralDashboard } from "~/lib/referral-dashboard";
import { formatVnd } from "~/lib/payos-display";

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`Đã sao chép ${label}`),
    () => toast.error("Không sao chép được."),
  );
}

function formatRewardDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ReferralSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-[26px] first:mt-2">
      <Mono className="mb-1 text-[9.5px]" style={{ color: CT.muted }}>
        {title}
      </Mono>
      <div>{children}</div>
    </section>
  );
}

function StatTile({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white px-3 py-3.5 text-center">
      <div
        className="font-[family-name:var(--display-2)] text-[26px] font-extrabold tabular-nums leading-none tracking-[-0.015em]"
        style={{ color: accent ? CT.goldDeep : CT.ink }}
      >
        {value}
      </div>
      <div className="mt-1 font-serif text-[12px]" style={{ color: CT.muted }}>
        {label}
      </div>
    </div>
  );
}

export function CReferralScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchReferralDashboard();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setData(null);
      return;
    }
    setData(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      className="flex min-h-[100svh] flex-col"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Giới thiệu bạn bè" />

      <div className="flex-1 overflow-auto px-6 pb-[100px] pt-1">
        <p
          className="m-0 font-serif text-[14px] leading-relaxed"
          style={{ color: CT.ink2 }}
        >
          Chia sẻ mã hoặc link mời. Khi bạn bè mua gói lịch cát tường bằng mã của
          bạn, hệ thống ghi nhận thưởng cho bạn theo bảng dưới.
        </p>

        {loading ? (
          <p className="mt-8 font-serif text-[13.5px]" style={{ color: CT.muted }}>
            Đang tải…
          </p>
        ) : error ? (
          <div className="mt-6">
            <p className="font-serif text-[13.5px]" style={{ color: CT.red }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 cursor-pointer border px-4 py-2.5 font-[family-name:var(--display-2)] text-[11.5px] font-bold uppercase tracking-[0.06em]"
              style={{ borderColor: CT.goldDeep, color: CT.ink }}
            >
              Thử lại
            </button>
          </div>
        ) : data ? (
          <>
            <ReferralSection title="Mã mời của bạn">
              <div
                className="border bg-white px-4 py-4"
                style={{ borderColor: CT.hairline }}
              >
                <div
                  className="font-[family-name:var(--display-2)] text-[32px] font-extrabold tracking-[0.1em] tabular-nums"
                  style={{ color: CT.goldDeep }}
                >
                  {data.referral_code}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => copyText("mã giới thiệu", data.referral_code)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 border py-2.5 font-[family-name:var(--display-2)] text-[11.5px] font-bold uppercase tracking-[0.06em]"
                    style={{ borderColor: CT.goldDeep, color: CT.ink }}
                  >
                    <Copy className="size-3.5 shrink-0" aria-hidden />
                    Sao chép mã
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText("link mời", data.invite_url)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 border-none py-2.5 font-[family-name:var(--display-2)] text-[11.5px] font-extrabold uppercase tracking-[0.06em]"
                    style={{ ...DISPLAY2, background: CT.forest, color: CT.cream }}
                  >
                    <Copy className="size-3.5 shrink-0" aria-hidden />
                    Sao chép link đăng ký
                  </button>
                </div>
              </div>
            </ReferralSection>

            <ReferralSection title="Thống kê">
              <div
                className="grid grid-cols-2 gap-px"
                style={{ background: CT.hairline }}
              >
                <StatTile
                  value={String(data.referees_count)}
                  label="người đã mua gói"
                />
                <StatTile
                  value={formatVnd(data.total_reward_vnd)}
                  label="thưởng đã ghi nhận"
                  accent
                />
              </div>
            </ReferralSection>

            <ReferralSection title="Mức thưởng">
              <div
                className="border bg-white"
                style={{ borderColor: CT.hairline }}
              >
                {data.reward_tiers.map((tier, i) => (
                  <div
                    key={tier.package_sku}
                    className="flex items-baseline justify-between gap-3 px-3.5 py-3"
                    style={{
                      borderBottom:
                        i < data.reward_tiers.length - 1
                          ? `1px solid ${CT.hairline2}`
                          : undefined,
                    }}
                  >
                    <span className="font-serif text-[13.5px]" style={{ color: CT.ink }}>
                      {tier.label}
                    </span>
                    <span
                      className="shrink-0 font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
                      style={{ color: CT.goldDeep }}
                    >
                      +{formatVnd(tier.reward_vnd)}
                    </span>
                  </div>
                ))}
              </div>
            </ReferralSection>

            <ReferralSection title="Lịch sử ghi nhận">
              {data.recent_rewards.length === 0 ? (
                <p className="font-serif text-[13.5px] leading-relaxed" style={{ color: CT.muted }}>
                  Chưa có khoản thưởng nào. Khi bạn bè thanh toán gói lịch thành công,
                  giao dịch sẽ hiện tại đây.
                </p>
              ) : (
                <div
                  className="border bg-white"
                  style={{ borderColor: CT.hairline }}
                >
                  {data.recent_rewards.map((row, i) => (
                    <div
                      key={row.id}
                      className="flex items-baseline justify-between gap-3 px-3.5 py-3"
                      style={{
                        borderBottom:
                          i < data.recent_rewards.length - 1
                            ? `1px solid ${CT.hairline2}`
                            : undefined,
                      }}
                    >
                      <div className="min-w-0">
                        <div
                          className="font-[family-name:var(--display-2)] text-[13px] font-semibold tracking-[-0.005em]"
                          style={{ color: CT.ink }}
                        >
                          {row.package_label}
                        </div>
                        <div
                          className="mt-0.5 font-serif text-[11.5px]"
                          style={{ color: CT.muted }}
                        >
                          {formatRewardDate(row.created_at)}
                        </div>
                      </div>
                      <span
                        className="shrink-0 font-[family-name:var(--display-2)] text-sm font-bold tabular-nums"
                        style={{ color: CT.goldDeep }}
                      >
                        +{formatVnd(row.reward_vnd)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ReferralSection>

            <p
              className="mt-8 border-t pt-5 font-serif text-[12px] leading-relaxed"
              style={{ borderColor: CT.hairline, color: CT.muted }}
            >
              Số tiền hiển thị là thưởng đã ghi nhận trên hệ thống sau khi bạn bè
              thanh toán thành công. Chi trả thực tế (nếu có) sẽ do đội ngũ liên hệ
              theo chính sách hiện hành.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
