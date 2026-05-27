import { useEffect, useState } from "react";
import { Download, ExternalLink, Smartphone } from "lucide-react";
import { Link } from "react-router";

import { BackBar, Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { CT } from "~/lib/c-tokens";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "unknown" | "installable" | "installed" | "ios";

const PRIVACY_EMAIL =
  "mailto:privacy@ngaylanhthangtot.vn?subject=Y%C3%AAu%20c%E1%BA%A7u%20v%E1%BB%9Bi%20d%E1%BB%AF%20li%E1%BB%87u%20c%C3%A1%20nh%C3%A2n";

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

export function CSettingsScreen() {
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

  return (
    <div
      className="flex min-h-full flex-col pb-8"
      style={{ background: CT.paper, color: CT.ink, fontFamily: "var(--serif)" }}
    >
      <BackBar title="Cài đặt" />

      <div className="flex flex-col gap-4 px-5">
        {!dismissed ? (
          <div className="border px-4 py-4" style={{ borderColor: CT.hairline }}>
            <div className="mb-3 flex items-start gap-3">
              <Smartphone size={18} strokeWidth={1.5} style={{ color: CT.goldDeep }} />
              <div>
                <p className="m-0 font-[family-name:var(--font-display-2)] text-base font-semibold">
                  Thêm vào màn hình chính
                </p>
                <p className="mt-1 text-sm leading-snug" style={{ color: CT.muted }}>
                  Mở nhanh như app — không cần nhớ đường link.
                </p>
              </div>
            </div>
            {installState === "installed" ? (
              <Mono className="text-[10px]" style={{ color: CT.goldDeep }}>
                Đã cài đặt.
              </Mono>
            ) : installState === "installable" ? (
              <Button type="button" className="w-full" onClick={() => void handleInstall()}>
                <Download size={14} />
                Cài ứng dụng
              </Button>
            ) : (
              <p className="text-sm" style={{ color: CT.muted }}>
                Safari / Chrome: Chia sẻ → Thêm vào Màn hình chính.
              </p>
            )}
          </div>
        ) : null}

        <div className="border px-4 py-4" style={{ borderColor: CT.hairline }}>
          <p className="m-0 font-[family-name:var(--font-display-2)] font-semibold">
            Quyền với dữ liệu cá nhân
          </p>
          <p className="mt-2 text-sm leading-snug" style={{ color: CT.ink2 }}>
            Gửi yêu cầu xoá lá số hoặc dữ liệu đã lưu — chúng tôi xử lý trong thời hạn luật
            định.
          </p>
          <Button variant="outline" className="mt-3 w-full" asChild>
            <a href={PRIVACY_EMAIL}>Gửi yêu cầu qua email</a>
          </Button>
        </div>

        <a
          href="mailto:hotro@ngaylanhthangtot.vn"
          className="flex items-center justify-between border px-4 py-3.5 text-sm no-underline"
          style={{ borderColor: CT.hairline, color: CT.ink }}
        >
          Liên hệ hỗ trợ
          <ExternalLink size={14} style={{ color: CT.muted }} />
        </a>

        <Link to="/toi" className="text-sm no-underline" style={{ color: CT.goldDeep }}>
          ← Quay lại Tôi
        </Link>
      </div>
    </div>
  );
}
