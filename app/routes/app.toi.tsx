/**
 * /app/toi — Tab 5 · Tôi profile.
 * Identity card (display-only, no Sửa button) + Ví lượng + Cài đặt.
 * Folds /app/cai-dat. Birth-data edit ripped per project.mdc.
 * iCloud sync row omitted (PWA, not iOS-native).
 */

import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { Bell, Copy, ExternalLink, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Kanji, Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import type { LaSoJson } from "~/lib/api-types";
import { useProfile } from "~/hooks/useProfile";
import { subscriptionActive } from "~/lib/subscription";
import { laSoJsonToChiTiet, profileHasLaso } from "~/lib/la-so-ui";
import { supabase } from "~/lib/supabase";

function formatNgaySinhDisplay(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN");
}

const PILLAR_LABELS = ["Năm", "Tháng", "Ngày", "Giờ"] as const;
const PILLAR_COLORS = ["#3a5d8a", "#8b4a2a", "#9a7c22", "#3d6b4a"] as const;

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts.at(-2)![0] + parts.at(-1)![0]).toUpperCase();
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 30,
        height: 18,
        borderRadius: 9,
        background: checked ? "#3d6b4a" : "#d8d0bb",
        position: "relative",
        flexShrink: 0,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: 0,
        transition: "background 0.15s ease",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 14 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
          transition: "left 0.15s ease",
          display: "block",
        }}
      />
    </button>
  );
}

export default function AppToi() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const [pushCount, setPushCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user.id);
      if (cancelled) return;
      setPushCount(error ? 0 : (data?.length ?? 0));
    })();
    return () => { cancelled = true; };
  }, [user]);

  async function onPushToggle(checked: boolean) {
    if (!user) return;
    if (checked) {
      void navigate("/app/thong-bao-quyen");
      return;
    }
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    setPushCount(0);
    toast.success("Đã tắt đăng ký thông báo đẩy.");
  }

  async function copyReferralCode() {
    if (!profile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      toast.success("Đã sao chép mã giới thiệu.");
    } catch {
      toast.error("Không sao chép được.");
    }
  }

  const inviteBase =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const inviteUrl =
    profile?.referral_code && inviteBase
      ? `${inviteBase}/dang-ky?ref=${encodeURIComponent(profile.referral_code)}`
      : "";

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const chiTiet = profile ? laSoJsonToChiTiet(profile.la_so as LaSoJson | null) : null;
  const thienCan = chiTiet?.thienCan ?? ["—", "—", "—", "—"];
  const diaChi = chiTiet?.diaChi ?? ["—", "—", "—", "—"];
  const displayName = profile?.display_name ?? null;
  const initStr = initials(displayName);
  const ngayLabel = profile?.ngay_sinh
    ? formatNgaySinhDisplay(profile.ngay_sinh)
    : null;

  const hasSub = profile ? subscriptionActive(profile.subscription_expires_at) : false;
  const creditsBalance = loading ? "…" : hasSub ? "∞" : String(profile?.credits_balance ?? 0);
  const pushEnabled = pushCount != null && pushCount > 0;

  type SettingsRow =
    | { type: "toggle"; label: string; sub: string | null; value: boolean; loading?: boolean; onChange: (v: boolean) => void }
    | { type: "value"; label: string; sub: string | null; val: string; danger?: boolean; action?: () => void }
    | { type: "link"; label: string; sub: string | null; to: string; danger?: boolean; icon?: LucideIcon }
    | { type: "external"; label: string; href: string }
    | { type: "action"; label: string; sub: string | null; danger?: boolean; action: () => void };

  const settingsRows: SettingsRow[] = [
    {
      type: "toggle",
      label: "Thông báo",
      sub: "3 nhịp · 7:00 · giờ tốt · cuối tuần",
      value: pushEnabled,
      loading: pushCount === null,
      onChange: (v) => void onPushToggle(v),
    },
    {
      type: "link",
      label: "Nhịp hàng ngày",
      sub: "Thông báo nhắc 3 lần/ngày",
      to: "/app/nhip/cai-dat",
      icon: Bell,
    },
    {
      type: "value",
      label: "Ngôn ngữ luận",
      sub: "Cổ điển / Hiện đại / Thực tế",
      val: "Cổ điển",
    },
    {
      type: "value",
      label: "Hiển thị chữ Hán",
      sub: "Trên thẻ ngày và phiếu tear-off",
      val: "Có",
    },
    {
      type: "link",
      label: "Riêng tư",
      sub: "Lá số chỉ trên máy của bạn",
      to: "/chinh-sach-bao-mat",
    },
    {
      type: "external",
      label: "Hỗ trợ · Liên hệ",
      href: "mailto:hotro@ngaylanhthangtot.vn",
    },
    {
      type: "link",
      label: "Cài đặt ứng dụng",
      sub: null,
      to: "/app/cai-dat-app",
    },
    {
      type: "action",
      label: "Đăng xuất",
      sub: null,
      danger: true,
      action: () => void signOut(),
    },
  ];

  return (
    <div
      style={{
        background: "var(--paper, #f0ece2)",
        minHeight: "100%",
        color: "var(--ink, #1a1a1a)",
        fontFamily: "var(--serif)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(154,124,34,0.18)" }}
      >
        <h1
          style={{
            fontFamily: "var(--display-2)",
            fontWeight: 800,
            fontSize: 16,
            textTransform: "uppercase",
            letterSpacing: "-0.005em",
            color: "var(--ink, #1a1a1a)",
            lineHeight: 1.1,
          }}
        >
          Tôi
        </h1>
        <Mono style={{ color: "#7a7050", marginTop: 2, display: "block" }} size={12}>
          Hồ sơ · ví lượng · cài đặt
        </Mono>
      </div>

      <div className="pb-8">
        {/* Identity card — forest dark */}
        <div
          className="mx-5 mt-4"
          style={{
            background: "var(--forest, #2d5a3d)",
            color: "#ede7d3",
            padding: "18px 18px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Kanji
            ch="我"
            size={180}
            drift
            style={{
              position: "absolute",
              right: -30,
              top: -40,
              color: "rgba(197,165,90,0.08)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              position: "relative",
            }}
          >
            {/* Avatar initials */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#a89270",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 22,
                color: "var(--forest, #2d5a3d)",
                flexShrink: 0,
              }}
            >
              {initStr}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--display-2)",
                  fontWeight: 700,
                  fontSize: 18,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayName ?? user?.email ?? "—"}
              </div>
              <Mono style={{ color: "#c5a55a", marginTop: 4, display: "block" }} size={10}>
                {ngayLabel ?? "CHƯA CÓ NGÀY SINH"}
              </Mono>
            </div>
            {/* No Sửa button — birth-data is set once at onboarding */}
          </div>

          {/* 4-trụ pillars */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px dashed rgba(197,165,90,0.25)",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 6,
            }}
          >
            {PILLAR_LABELS.map((label, i) => (
              <div key={label} style={{ textAlign: "center", padding: "6px 0" }}>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 8,
                    color: "rgba(200,188,152,0.55)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#ede7d3",
                    marginTop: 4,
                  }}
                >
                  {thienCan[i] ?? "—"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: PILLAR_COLORS[i],
                  }}
                >
                  {diaChi[i] ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locked-state explainer for birth data */}
        <div
          className="mx-5 mt-3"
          style={{
            borderLeft: "3px solid rgba(154,124,34,0.55)",
            padding: "10px 14px",
            background: "rgba(122,112,80,0.07)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--hanzi)",
              fontSize: 22,
              color: "#9a7c22",
              fontWeight: 700,
              lineHeight: 1,
              marginTop: 2,
              flexShrink: 0,
            }}
          >
            鎖
          </span>
          <div style={{ flex: 1 }}>
            <Mono style={{ color: "#7a7050", display: "block" }}>Ngày sinh & giờ sinh không thể thay đổi</Mono>
            <p style={{ fontFamily: "var(--serif)", fontSize: 12, color: "#3a3220", marginTop: 4, lineHeight: 1.55 }}>
              Lá số được lập một lần dựa trên thời điểm bạn chào đời.
              Nếu nhập sai — liên hệ{" "}
              <a href="mailto:hotro@ngaylanhthangtot.vn" style={{ color: "#9a7c22", textDecoration: "underline" }}>
                hotro@ngaylanhthangtot.vn
              </a>{" "}
              để được reset trong vòng 24 giờ.
            </p>
          </div>
        </div>

        {/* Lá số link */}
        {!loading ? (
          <div className="mx-5 mt-2">
            <Link
              to={hasLaso ? "/app/la-so/chi-tiet" : "/app/la-so"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: hasLaso ? "rgba(45,90,61,0.08)" : "rgba(154,124,34,0.08)",
                border: `1px solid ${hasLaso ? "rgba(45,90,61,0.25)" : "rgba(154,124,34,0.3)"}`,
                padding: "10px 14px",
                textDecoration: "none",
              }}
            >
              <span style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--ink, #1a1a1a)" }}>
                {hasLaso ? "Xem lá số Bát Tự của bạn" : "Chưa có lá số — lập ngay"}
              </span>
              <Mono style={{ color: "var(--gold, #c9a84c)" }} size={10}>›</Mono>
            </Link>
          </div>
        ) : null}

        {/* Ví lượng */}
        <div className="px-5 pt-5">
          <Mono style={{ color: "var(--gold, #c9a84c)", marginBottom: 8, display: "block" }}>
            Ví lượng
          </Mono>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(154,124,34,0.22)",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--display-2)",
                    fontWeight: 800,
                    fontSize: 36,
                    color: "var(--ink, #1a1a1a)",
                    lineHeight: 1,
                  }}
                >
                  {creditsBalance}
                </span>
                <span style={{ fontFamily: "var(--serif)", fontSize: 14, color: "#7a7050" }}>
                  lượng
                </span>
              </div>
              <Mono style={{ color: "#7a7050", marginTop: 4, display: "block" }} size={9}>
                ~10 LẦN CHỌN NGÀY · KHÔNG HẾT HẠN
              </Mono>
            </div>
            <Link
              to="/app/mua-luong"
              style={{
                fontFamily: "var(--display-2)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.08em",
                color: "#ede7d3",
                background: "var(--forest, #2d5a3d)",
                padding: "12px 16px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Mua thêm →
            </Link>
          </div>

          {/* Activity log */}
          <div
            style={{
              marginTop: 8,
              padding: "10px 14px",
              background: "rgba(154,124,34,0.06)",
              borderLeft: "3px solid var(--gold, #c9a84c)",
            }}
          >
            <Mono style={{ color: "#7a7050" }}>Hoạt động gần nhất</Mono>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                ["11/05", "Chọn ngày · Khai trương", "−2"],
                ["08/05", "Mua gói 30 lượng", "+30"],
                ["05/05", "Chọn ngày · Cưới em gái", "−2"],
              ].map(([d, l, n], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: "var(--serif)",
                    fontSize: 12,
                    color: "var(--ink, #1a1a1a)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "#7a7050",
                      width: 38,
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {d}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {l}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: n.startsWith("+") ? "#3d6b4a" : "#8b1a1a",
                      flexShrink: 0,
                    }}
                  >
                    {n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral */}
        {profile && !loading && profile.referral_code ? (
          <div className="px-5 pt-5">
            <Mono style={{ color: "var(--gold, #c9a84c)", marginBottom: 8, display: "block" }}>
              Mời bạn · nhận 10 lượng
            </Mono>
            <div
              style={{
                background: "#fff",
                border: "1px solid rgba(154,124,34,0.22)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontFamily: "var(--mono)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--ink, #1a1a1a)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.referral_code}
              </code>
              <button
                type="button"
                onClick={() => void copyReferralCode()}
                style={{
                  flexShrink: 0,
                  background: "transparent",
                  border: "1px solid rgba(154,124,34,0.3)",
                  padding: "7px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--gold-deep, #7d6219)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                <Copy size={12} strokeWidth={1.5} aria-hidden />
                Sao chép
              </button>
            </div>
            {inviteUrl ? (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2 gap-2 font-medium"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl).then(
                    () => toast.success("Đã sao chép link mời bạn."),
                    () => toast.error("Không sao chép được."),
                  );
                }}
              >
                <Copy size={14} strokeWidth={1.5} aria-hidden />
                Sao chép link đăng ký
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Settings list */}
        <div className="px-5 pt-5 pb-4">
          <Mono style={{ color: "var(--gold, #c9a84c)", marginBottom: 8, display: "block" }}>
            Cài đặt
          </Mono>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(154,124,34,0.22)",
            }}
          >
            {settingsRows.map((row, i) => (
              <SettingsRowItem key={i} row={row} index={i} />
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: "#7a7050",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Ngày Lành Tháng Tốt · v2.4 · 2026
          </div>
        </div>
      </div>
    </div>
  );
}

type SettingsRow =
  | { type: "toggle"; label: string; sub: string | null; value: boolean; loading?: boolean; onChange: (v: boolean) => void }
  | { type: "value"; label: string; sub: string | null; val: string; danger?: boolean; action?: () => void }
  | { type: "link"; label: string; sub: string | null; to: string; danger?: boolean; icon?: LucideIcon }
  | { type: "external"; label: string; href: string }
  | { type: "action"; label: string; sub: string | null; danger?: boolean; action: () => void };

function SettingsRowItem({ row, index }: { row: SettingsRow; index: number }) {
  const borderTop = index > 0 ? "1px solid rgba(154,124,34,0.15)" : "none";

  const baseStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "transparent",
    border: "none",
    borderTop,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    minHeight: 44,
    textDecoration: "none",
    color: "inherit",
  };

  const labelEl = (label: string, sub: string | null, danger?: boolean) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 13.5,
          fontWeight: 500,
          color: danger ? "#8b1a1a" : "var(--ink, #1a1a1a)",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "#7a7050",
            letterSpacing: "0.1em",
            marginTop: 3,
            textTransform: "uppercase",
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );

  if (row.type === "toggle") {
    return (
      <div style={{ ...baseStyle, cursor: "default" }}>
        {labelEl(row.label, row.sub)}
        <Toggle
          checked={row.value}
          disabled={row.loading}
          onChange={row.onChange}
        />
      </div>
    );
  }

  if (row.type === "value") {
    return (
      <button
        type="button"
        style={baseStyle}
        onClick={row.action}
        disabled={!row.action}
      >
        {labelEl(row.label, row.sub, row.danger)}
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10.5,
            color: row.danger ? "#8b1a1a" : "var(--gold, #c9a84c)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {row.val}
        </span>
      </button>
    );
  }

  if (row.type === "link") {
    const Icon = row.icon;
    return (
      <Link
        to={row.to}
        style={{ ...baseStyle, display: "flex" }}
      >
        {Icon ? (
          <Icon size={18} strokeWidth={1.5} style={{ color: "#9a7c22", flexShrink: 0 }} aria-hidden />
        ) : null}
        {labelEl(row.label, row.sub, row.danger)}
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 18,
            color: "#7a7050",
            flexShrink: 0,
          }}
        >
          ›
        </span>
      </Link>
    );
  }

  if (row.type === "external") {
    return (
      <a
        href={row.href}
        style={{ ...baseStyle, display: "flex" }}
        target="_blank"
        rel="noreferrer"
      >
        {labelEl(row.label, null)}
        <ExternalLink size={14} style={{ color: "#7a7050", flexShrink: 0 }} strokeWidth={1.5} aria-hidden />
      </a>
    );
  }

  if (row.type === "action") {
    return (
      <button type="button" style={baseStyle} onClick={row.action}>
        {labelEl(row.label, row.sub, row.danger)}
      </button>
    );
  }

  return null;
}
