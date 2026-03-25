import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import { supabase } from "~/lib/supabase";

export default function AppBatDau() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [finishing, setFinishing] = useState(false);

  async function enterApp() {
    if (!user) return;
    setFinishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    setFinishing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    navigate("/app", { replace: true });
  }

  const credits = profile?.credits_balance ?? null;

  return (
    <main className="flex flex-col min-h-svh bg-background px-4 max-w-lg mx-auto">
      <div className="flex flex-col items-center justify-center flex-1 pb-4 pt-10">
        <div className="mb-8 flex flex-col items-center">
          <div
            className="border border-accent/30 flex items-center justify-center mb-5"
            style={{ width: 64, height: 64, borderRadius: "var(--radius-md)" }}
          >
            <span
              style={{
                fontFamily: "var(--font-noto)",
                fontSize: 32,
                color: "var(--accent)",
              }}
            >
              吉
            </span>
          </div>

          <h1
            className="text-foreground text-center mb-3"
            style={{
              fontFamily: "var(--font-lora)",
              fontWeight: 700,
              fontSize: "var(--text-2xl)",
              lineHeight: 1.3,
            }}
          >
            Ngày Lành
            <br />
            Tháng Tốt
          </h1>

          <p
            className="text-muted-foreground text-sm text-center leading-relaxed"
            style={{ maxWidth: 280 }}
          >
            Chọn ngày, hợp tuổi, xem vận — theo lá số của bạn, bằng tiếng Việt rõ
            ràng.
          </p>
        </div>

        <div
          className="w-full border border-accent/20 bg-accent/5 px-4 py-3 mb-6"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <p className="text-foreground text-xs leading-relaxed text-center">
            {loading ? (
              "Đang tải số dư…"
            ) : credits != null ? (
              <>
                Tài khoản của bạn có{" "}
                <strong className="text-foreground">{credits}</strong> lượng
                — đủ để bắt đầu tra cứu và chọn ngày.
              </>
            ) : (
              "Kiểm tra hồ sơ trong Cài đặt nếu chưa thấy số lượng."
            )}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            size="cta_sm"
            disabled={finishing || loading || !profile}
            onClick={() => void enterApp()}
          >
            {finishing ? "Đang vào…" : "Vào trang chủ app"}
          </Button>

          <Button variant="outline" size="cta_sm" asChild>
            <Link to="/app/mua-luong">Mua thêm lượng / gói</Link>
          </Button>
        </div>
      </div>

      <div className="pb-8 pt-4 text-center">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Điều khoản và chính sách sẽ có trong mục pháp lý (Wave cross-cutting).
          Trang chủ công khai:{" "}
          <Link to="/" className="text-accent underline-offset-2 underline">
            /
          </Link>
        </p>
      </div>
    </main>
  );
}
