import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import { supabase } from "~/lib/supabase";
import { urlBase64ToUint8Array } from "~/lib/web-push";

export default function AppThongBaoQuyen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "granted" | "denied">("idle");

  async function persistSubscription(sub: PushSubscription) {
    if (!user) return;
    const j = sub.toJSON();
    const key256 = j.keys?.p256dh;
    const auth = j.keys?.auth;
    if (!key256 || !auth) {
      toast.error("Không đọc được khoá đẩy.");
      return;
    }
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: key256,
        auth,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
      { onConflict: "user_id,endpoint" },
    );
    if (error) {
      toast.error(error.message);
    }
  }

  const handleAllow = async () => {
    if (!("Notification" in window)) {
      setState("denied");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        setState("denied");
        return;
      }

      const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (
        vapid &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      ) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid),
          });
          await persistSubscription(sub);
        } catch (e) {
          console.error(e);
          toast.message(
            "Đã bật thông báo trình duyệt; đăng ký đẩy PWA sẽ thử lại sau.",
          );
        }
      }

      setState("granted");
      window.setTimeout(() => navigate(-1), 1200);
    } catch {
      setState("denied");
    }
  };

  return (
    <main className="min-h-svh bg-background px-4 pb-10 max-w-lg mx-auto">
      <ScreenHeader title="Thông báo" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center py-4">
          <div
            className="border border-border flex items-center justify-center mb-5"
            style={{ width: 60, height: 60, borderRadius: "var(--radius-lg)" }}
          >
            <Bell size={26} className="text-foreground" strokeWidth={1.5} />
          </div>

          {state === "granted" ? (
            <>
              <p className="text-foreground text-sm font-medium mb-1">
                Đã bật thông báo.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Bạn sẽ nhận nhắc mùa cưới, Tết, đầu tháng.
              </p>
            </>
          ) : state === "denied" ? (
            <>
              <p className="text-foreground text-sm font-medium mb-1">
                Thông báo bị chặn.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Vào Cài đặt hệ thống để bật lại cho ứng dụng.
              </p>
            </>
          ) : (
            <>
              <p className="text-foreground text-sm font-medium mb-2">
                Nhận nhắc đúng lúc
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Bật thông báo để nhận nhắc mùa cưới, Tết, đầu tháng — đúng lúc
                cần chọn ngày.
              </p>
            </>
          )}
        </div>

        {state === "idle" ? (
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => void handleAllow()}>
              Cho phép thông báo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => navigate(-1)}
            >
              Để sau
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
        )}
      </div>
    </main>
  );
}
