import { useEffect, useState } from "react";
import { Download, ExternalLink, Smartphone } from "lucide-react";
import { Link } from "react-router";

import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "unknown" | "installable" | "installed" | "ios";

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

const DISMISSED_KEY = "pwa_install_dismissed";

const PRIVACY_EMAIL =
  "mailto:privacy@ngaylanhthangtot.vn?subject=Y%C3%AAu%20c%E1%BA%A7u%20v%E1%BB%9Bi%20d%E1%BB%AF%20li%E1%BB%87u%20c%C3%A1%20nh%C3%A2n";

export default function AppCaiDatApp() {
  const [installState, setInstallState] = useState<InstallState>("unknown");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "true",
  );

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
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  function IosSteps() {
    return (
      <div className="flex flex-col gap-2.5 mt-3">
        <p
          className="text-surface-foreground/60 text-[10px] uppercase tracking-wider mb-1"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Safari · iOS
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          1. Nhấn nút{" "}
          <span className="text-foreground font-medium">Chia sẻ</span> (hình vuông
          có mũi tên lên) ở thanh dưới Safari.
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          2. Cuộn xuống chọn{" "}
          <span className="text-foreground font-medium">
            Thêm vào Màn hình chính
          </span>
          .
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          3. Nhấn <span className="text-foreground font-medium">Thêm</span> ở góc
          trên phải.
        </p>
      </div>
    );
  }

  function AndroidSteps() {
    return (
      <div className="flex flex-col gap-2.5 mt-3">
        <p
          className="text-surface-foreground/60 text-[10px] uppercase tracking-wider mb-1"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Chrome · Android
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          1. Nhấn nút <span className="text-foreground font-medium">⋮</span> (ba
          chấm) góc trên phải Chrome.
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          2. Chọn{" "}
          <span className="text-foreground font-medium">
            Thêm vào màn hình chính
          </span>
          .
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          3. Nhấn <span className="text-foreground font-medium">Thêm</span> để xác
          nhận.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-svh bg-background px-4 pb-8 max-w-lg mx-auto">
      <ScreenHeader title="Cài đặt ứng dụng" />

      <div className="flex flex-col gap-4">
        {!dismissed ? (
          <div
            className="bg-card border border-border px-4 py-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                }}
              >
                <Smartphone
                  size={18}
                  className="text-surface-foreground"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium mb-0.5">
                  Thêm vào màn hình chính
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Thêm vào màn hình chính để mở nhanh — không cần nhớ đường link.
                </p>
              </div>
            </div>

            {installState === "installed" ? (
              <p
                className="text-success text-xs"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                Đã cài đặt.
              </p>
            ) : installState === "installable" ? (
              <div className="flex flex-col gap-2">
                <Button size="cta_sm" type="button" onClick={() => void handleInstall()}>
                  <Download size={14} strokeWidth={1.5} />
                  Cài ứng dụng
                </Button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-muted-foreground text-xs py-1"
                  style={{ minHeight: 36 }}
                >
                  Bỏ qua
                </button>
              </div>
            ) : installState === "ios" ? (
              <div>
                <IosSteps />
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-muted-foreground text-xs pt-4 pb-1"
                  style={{ minHeight: 36 }}
                >
                  Bỏ qua
                </button>
              </div>
            ) : (
              <div>
                <IosSteps />
                <div className="border-t border-border my-3" />
                <AndroidSteps />
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-muted-foreground text-xs pt-4 pb-1"
                  style={{ minHeight: 36 }}
                >
                  Bỏ qua
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div
          className="bg-card border border-border px-4 py-4 space-y-3"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="text-foreground text-sm font-medium">
            Quyền với dữ liệu cá nhân
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Để xóa lá số hoặc dữ liệu đã lưu theo chính sách bảo mật, gửi yêu cầu
            qua email — chúng tôi sẽ xử lý trong thời hạn luật định.
          </p>
          <Button variant="outline" size="cta_sm" className="w-full" asChild>
            <a href={PRIVACY_EMAIL}>Gửi yêu cầu qua email</a>
          </Button>
        </div>

        <div
          className="bg-card border border-border px-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <a
            href="mailto:hotro@ngaylanhthangtot.vn"
            className="w-full flex items-center justify-between py-3.5 text-foreground text-sm"
            style={{ minHeight: 52 }}
          >
            Liên hệ hỗ trợ
            <ExternalLink size={14} className="text-muted-foreground shrink-0" strokeWidth={1.5} />
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          <Link
            to="/app/cai-dat"
            className="text-primary underline underline-offset-4"
          >
            ← Quay lại Cài đặt
          </Link>
        </p>
      </div>
    </main>
  );
}
