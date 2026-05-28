import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { BackBar, Mono } from "~/components/brand";
import { CConfirmDialog } from "~/components/direction-c/CConfirmDialog";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import { useSubscription } from "~/hooks/useSubscription";
import { CT } from "~/lib/c-tokens";
import { subscriptionDaysUntil } from "~/lib/entitlements";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "unknown" | "installable" | "installed" | "ios";

const DISMISSED_KEY = "pwa_install_dismissed";
const APP_VERSION = "1.0.4";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  );
}

type RowProps = {
  label: string;
  value?: string | null;
  arrow?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
};

function SettingsRow({
  label,
  value,
  arrow = "›",
  to,
  href,
  onClick,
  danger,
  last,
}: RowProps) {
  const inner = (
    <>
      <div
        className="font-[family-name:var(--font-display-2)] text-sm font-semibold tracking-[-0.005em]"
        style={{ color: danger ? CT.red : CT.ink }}
      >
        {label}
      </div>
      <div className="flex shrink-0 items-baseline gap-2.5">
        {value ? (
          <span className="font-serif text-[12.5px]" style={{ color: CT.muted }}>
            {value}
          </span>
        ) : null}
        <span className="font-serif text-sm" style={{ color: danger ? CT.red : CT.muted }}>
          {arrow}
        </span>
      </div>
    </>
  );

  const rowClass =
    "flex w-full cursor-pointer items-baseline justify-between border-none bg-transparent py-3 text-left no-underline";
  const borderStyle = last ? undefined : { borderBottom: `1px solid ${CT.hairline2}` };

  if (to) {
    return (
      <Link to={to} className={rowClass} style={borderStyle}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={rowClass} style={{ ...borderStyle, color: CT.ink }}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={rowClass} style={borderStyle}>
      {inner}
    </button>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-2">
      <Mono className="mb-1 text-[9px]" style={{ color: CT.muted }}>
        {title}
      </Mono>
      <div>{children}</div>
    </section>
  );
}

export function CSettingsScreen() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { expiresAt, isActive } = useSubscription();
  const [installState, setInstallState] = useState<InstallState>("unknown");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "true",
  );
  const [logoutOpen, setLogoutOpen] = useState(false);

  const planLabel = useMemo(() => {
    if (!isActive || !expiresAt) return "chưa có gói";
    const days = subscriptionDaysUntil(expiresAt);
    const months =
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    let tier = "1 tháng";
    if (months >= 11) tier = "1 năm";
    else if (months >= 5) tier = "6 tháng";
    if (days == null) return tier;
    return `${tier} · còn ${days} ngày`;
  }, [expiresAt, isActive]);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setInstallState("installed");
      return;
    }
    if (isIos()) {
      setInstallState("ios");
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState("installable");
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setInstallState("installed");
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallState("installed");
      setDeferredPrompt(null);
      localStorage.setItem(DISMISSED_KEY, "true");
      setDismissed(true);
    }
  }

  async function confirmLogout() {
    setLogoutOpen(false);
    await signOut();
    navigate("/dang-nhap", { replace: true });
  }

  return (
    <div
      className="flex min-h-full flex-col pb-10"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Cài đặt" />

      <div className="flex-1 overflow-auto px-6 pb-8">
        {!dismissed && installState !== "installed" ? (
          <div
            className="mt-2 border px-4 py-4"
            style={{ borderColor: CT.hairline }}
          >
            <p className="m-0 font-[family-name:var(--font-display-2)] text-base font-semibold">
              Thêm vào màn hình chính
            </p>
            <p className="mt-1 text-sm leading-snug" style={{ color: CT.muted }}>
              Mở nhanh như app — không cần nhớ đường link.
            </p>
            {installState === "installable" ? (
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 border-none py-3 font-[family-name:var(--font-display-2)] text-xs font-bold uppercase tracking-[0.06em]"
                style={{ background: CT.forest, color: CT.cream }}
              >
                <Download size={14} />
                Cài ứng dụng
              </button>
            ) : (
              <p className="mt-2 text-sm" style={{ color: CT.muted }}>
                Safari / Chrome: Chia sẻ → Thêm vào Màn hình chính.
              </p>
            )}
          </div>
        ) : null}

        <SettingsSection title="Tài khoản">
          <SettingsRow
            label="Email"
            value={profile?.email ?? "—"}
            arrow="khoá"
            onClick={() => toast.message("Email liên kết tài khoản — không đổi tại đây.")}
          />
          <SettingsRow label="Đổi mật khẩu" to="/quen-mat-khau" />
          <SettingsRow
            label="Đăng nhập 2 lớp"
            value="tắt"
            onClick={() => toast.message("Tính năng sắp có.")}
            last
          />
        </SettingsSection>

        <SettingsSection title="Lịch của tôi">
          <SettingsRow
            label="Gói hiện tại"
            value={planLabel}
            to="/dat-lich"
          />
          <SettingsRow
            label="Lịch sử thanh toán"
            href="mailto:hotro@ngaylanhthangtot.vn?subject=Y%C3%AAu%20c%E1%BA%A7u%20l%E1%BB%8Bch%20s%E1%BB% AD%20thanh%20to%C3%A1n"
          />
          <SettingsRow label="Phương thức thanh toán" value="PayOS" arrow="›" last />
        </SettingsSection>

        <SettingsSection title="Hiển thị">
          <SettingsRow label="Ngôn ngữ" value="Tiếng Việt" arrow="›" />
          <SettingsRow
            label="Hiện chữ Hán Việt nặng"
            value="tắt"
            onClick={() => toast.message("Tính năng sắp có.")}
            last
          />
        </SettingsSection>

        <SettingsSection title="Hỗ trợ">
          <SettingsRow label="Câu hỏi thường gặp" to="/" />
          <SettingsRow
            label="Liên hệ"
            href="mailto:hotro@ngaylanhthangtot.vn"
          />
          <SettingsRow label="Điều khoản · Bảo mật" to="/dieu-khoan" last />
        </SettingsSection>

        <div
          className="mt-8 border-t pt-5"
          style={{ borderColor: CT.hairline }}
        >
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-3 text-left"
          >
            <LogOut size={14} style={{ color: CT.red }} />
            <span
              className="font-[family-name:var(--font-display-2)] text-sm font-semibold tracking-[-0.005em]"
              style={{ color: CT.red }}
            >
              Đăng xuất
            </span>
          </button>
        </div>

        <p
          className="mt-6 text-center font-[family-name:var(--font-mono)] text-[9.5px] tracking-[0.06em]"
          style={{ color: CT.muted }}
        >
          v{APP_VERSION} · ngaylanhthangtot.vn
        </p>

        <Link
          to="/toi"
          className="mt-4 block text-center text-sm no-underline"
          style={{ color: CT.goldDeep }}
        >
          ← Quay lại Tôi
        </Link>
      </div>

      <CConfirmDialog
        open={logoutOpen}
        title={
          <>
            Đăng xuất khỏi
            <br />
            lịch của bạn?
          </>
        }
        description="Lá số và sổ ngày của bạn vẫn được lưu trên cloud. Đăng nhập lại bất cứ lúc nào."
        confirmLabel="Đăng xuất"
        onConfirm={() => void confirmLogout()}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}
