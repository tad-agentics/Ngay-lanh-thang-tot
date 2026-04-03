import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { BrandLogoMark } from "~/components/BrandLogoMark";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { applyLandingPrefillToProfile } from "~/lib/apply-landing-prefill-profile";
import {
  landingSignupPrefillHasAny,
  parseLandingSignupPrefill,
} from "~/lib/landing-cta-constants";
import { referralParamFromSearchParams } from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

function formatDobVi(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("vi-VN");
}

export default function DangKy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefill = useMemo(
    () => parseLandingSignupPrefill(searchParams),
    [searchParams],
  );
  const referralFromUrl = useMemo(
    () => referralParamFromSearchParams(searchParams),
    [searchParams],
  );
  const showPrefillBanner = landingSignupPrefillHasAny(prefill);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          ...(prefill.displayName ? { full_name: prefill.displayName } : {}),
          ...(referralFromUrl
            ? { referral_code: referralFromUrl.toUpperCase() }
            : {}),
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    const session = data.session;
    const uid = data.user?.id;

    if (session && uid && landingSignupPrefillHasAny(prefill)) {
      const pe = await applyLandingPrefillToProfile(uid, prefill);
      if (pe) {
        toast.error(
          "Tài khoản đã tạo nhưng chưa lưu được ngày sinh từ form — bạn có thể nhập lại trong Cài đặt.",
        );
      }
    }

    if (session) {
      toast.success("Đã tạo tài khoản.");
      navigate("/app", { replace: true });
    } else {
      toast.success(
        "Đã gửi email xác nhận (nếu bật). Mở link trong thư rồi đăng nhập để vào app.",
      );
      navigate("/dang-nhap", { replace: true });
    }
  }

  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-background px-4 py-12">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm space-y-5"
      >
        <Link
          to="/"
          className="flex flex-col items-center gap-2 no-underline text-foreground hover:opacity-90"
        >
          <BrandLogoMark size={56} />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            Ngày Lành Tháng Tốt
          </span>
        </Link>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
            Tạo tài khoản
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhận 20 lượng starter sau khi xác nhận email (theo cấu hình dự án).
          </p>
        </div>
        {referralFromUrl ? (
          <div
            className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 text-sm text-foreground"
            role="status"
          >
            <p className="font-medium text-foreground">Mã giới thiệu</p>
            <p className="text-muted-foreground leading-snug mt-1">
              Bạn đăng ký qua lời mời — sẽ nhận thưởng lượng sau khi tạo tài khoản
              (theo cấu hình hệ thống).
            </p>
          </div>
        ) : null}
        {showPrefillBanner ? (
          <div
            className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm text-foreground space-y-1.5"
            role="status"
          >
            <p className="font-medium text-foreground">Thông tin từ form trang chủ</p>
            <p className="text-muted-foreground leading-snug">
              Sau khi đăng ký, hệ thống sẽ lưu vào hồ sơ để bạn lập lá số nhanh hơn.
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
              {prefill.displayName ? (
                <li>
                  <span className="text-foreground/90">Họ tên:</span>{" "}
                  {prefill.displayName}
                </li>
              ) : null}
              {prefill.ngaySinh ? (
                <li>
                  <span className="text-foreground/90">Ngày sinh:</span>{" "}
                  {formatDobVi(prefill.ngaySinh)}
                </li>
              ) : null}
              {prefill.rawGioLabel === "Chưa biết giờ sinh" ? (
                <li>
                  <span className="text-foreground/90">Giờ sinh:</span> chưa xác
                  định
                </li>
              ) : prefill.gioSinh ? (
                <li>
                  <span className="text-foreground/90">Giờ sinh:</span> đã chọn
                  (theo khung trên landing)
                </li>
              ) : prefill.rawGioLabel ? (
                <li>
                  <span className="text-foreground/90">Giờ sinh:</span> chưa nhận
                  diện — chỉnh trong Cài đặt nếu cần
                </li>
              ) : null}
              {prefill.gioiTinh ? (
                <li>
                  <span className="text-foreground/90">Giới tính:</span>{" "}
                  {prefill.gioiTinh === "nam" ? "Nam" : "Nữ"}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          Đăng ký
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            to={
              referralFromUrl
                ? `/dang-nhap?ref=${encodeURIComponent(referralFromUrl)}`
                : "/dang-nhap"
            }
            className="text-primary underline-offset-4 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
