import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Logo, Mono } from "~/components/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { applyLandingPrefillToProfile } from "~/lib/apply-landing-prefill-profile";
import {
  landingSignupPrefillHasAny,
  parseLandingSignupPrefill,
} from "~/lib/landing-cta-constants";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

function formatDobVi(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("vi-VN");
}

const shell: CSSProperties = {
  background: "radial-gradient(ellipse at 50% 0%, #2a4738 0%, #1d3129 50%, #131f1a 100%)",
  minHeight: "100svh",
  color: "var(--cream, #ede7d3)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 16px",
  boxSizing: "border-box",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(0,0,0,0.2)",
  border: "1px solid rgba(197,165,90,0.3)",
  borderRadius: "var(--radius-md, 6px)",
  color: "var(--cream, #ede7d3)",
  fontFamily: "var(--serif)",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  caretColor: "var(--gold, #c5a55a)",
};

const btnPrimary: CSSProperties = {
  width: "100%",
  backgroundColor: "var(--cream, #ede7d3)",
  color: "var(--ink, #18150e)",
  fontFamily: "var(--display-2)",
  fontWeight: 700,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  border: "none",
  padding: "14px 20px",
  borderRadius: "var(--radius-md, 6px)",
};

const linkAccent: CSSProperties = {
  color: "var(--gold, #c5a55a)",
  textDecoration: "underline",
  textUnderlineOffset: 4,
};

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
    // Stash to sessionStorage so tryConsumePendingReferralClaim (ProfileProvider)
    // picks it up after the session is established — same mechanism as OAuth login.
    stashPendingReferralCode(referralFromUrl);
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
    <main style={shell}>
      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{
          width: "100%",
          maxWidth: 384,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Logo dark size={36} />
        </Link>
        <div style={{ padding: "6px 4px 0" }}>
          <Mono style={{ color: "var(--gold, #c5a55a)" }} size={11}>
            Đăng ký · 30 giây
          </Mono>
          <div
            style={{
              fontFamily: "var(--display-2)",
              fontWeight: 800,
              fontSize: 24,
              color: "var(--cream, #ede7d3)",
              marginTop: 4,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            Tạo tài khoản
          </div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "rgba(200,188,152,0.7)",
              marginTop: 4,
            }}
          >
            Nhận 20 lượng starter sau khi xác nhận email (theo cấu hình dự án).
          </div>
        </div>
        {referralFromUrl ? (
          <div
            style={{
              background: "rgba(139,26,26,0.18)",
              border: "1px solid rgba(196,77,77,0.45)",
              borderRadius: "var(--radius-md, 6px)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
            role="status"
          >
            <span
              style={{
                fontFamily: "var(--hanzi, serif)",
                fontSize: 22,
                color: "#e58a5c",
                fontWeight: 700,
                lineHeight: 1,
              }}
              aria-hidden
            >
              禮
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Mono style={{ color: "#e58a5c" }} size={11}>
                Mã giới thiệu
              </Mono>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 13,
                  color: "var(--cream, #ede7d3)",
                  margin: "4px 0 0",
                  lineHeight: 1.45,
                }}
              >
                Bạn đăng ký qua lời mời — sẽ nhận thưởng lượng sau khi tạo tài khoản
                (theo cấu hình hệ thống).
              </p>
            </div>
          </div>
        ) : null}
        {showPrefillBanner ? (
          <div
            style={{
              background: "rgba(197,165,90,0.1)",
              border: "1px solid var(--gold, #c5a55a)",
              borderRadius: "var(--radius-md, 6px)",
              padding: "12px 14px",
            }}
            role="status"
          >
            <Mono style={{ color: "var(--gold, #c5a55a)" }} size={11}>
              Thông tin từ form trang chủ
            </Mono>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 13,
                color: "rgba(237,231,211,0.88)",
                margin: "6px 0 0",
                lineHeight: 1.45,
              }}
            >
              Sau khi đăng ký, hệ thống sẽ lưu vào hồ sơ để bạn lập lá số nhanh hơn.
            </p>
            <ul
              style={{
                margin: "10px 0 0",
                paddingLeft: 18,
                fontFamily: "var(--mono)",
                fontSize: 12,
                color: "rgba(237,231,211,0.9)",
                letterSpacing: "0.06em",
                lineHeight: 1.5,
              }}
            >
              {prefill.displayName ? (
                <li>
                  <span style={{ color: "var(--cream)" }}>Họ tên:</span>{" "}
                  {prefill.displayName}
                </li>
              ) : null}
              {prefill.ngaySinh ? (
                <li>
                  <span style={{ color: "var(--cream)" }}>Ngày sinh:</span>{" "}
                  {formatDobVi(prefill.ngaySinh)}
                </li>
              ) : null}
              {prefill.rawGioLabel === "Chưa biết giờ sinh" ? (
                <li>
                  <span style={{ color: "var(--cream)" }}>Giờ sinh:</span> chưa xác
                  định
                </li>
              ) : prefill.gioSinh ? (
                <li>
                  <span style={{ color: "var(--cream)" }}>Giờ sinh:</span> đã chọn
                  (theo khung trên landing)
                </li>
              ) : prefill.rawGioLabel ? (
                <li>
                  <span style={{ color: "var(--cream)" }}>Giờ sinh:</span> chưa nhận
                  diện — chỉnh trong Cài đặt nếu cần
                </li>
              ) : null}
              {prefill.gioiTinh ? (
                <li>
                  <span style={{ color: "var(--cream)" }}>Giới tính:</span>{" "}
                  {prefill.gioiTinh === "nam" ? "Nam" : "Nữ"}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label htmlFor="email" style={{ margin: 0, padding: 0 }}>
            <Mono style={{ color: "rgba(200,188,152,0.75)" }} size={11}>
              Email
            </Mono>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            className="min-w-0"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label htmlFor="password" style={{ margin: 0, padding: 0 }}>
            <Mono style={{ color: "rgba(200,188,152,0.75)" }} size={11}>
              Mật khẩu · tối thiểu 8 ký tự
            </Mono>
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
            className="min-w-0"
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full" style={btnPrimary}>
          Đăng ký
        </Button>
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--serif)",
            fontSize: 14,
            color: "rgba(237, 231, 211, 0.78)",
            margin: 0,
          }}
        >
          Đã có tài khoản?{" "}
          <Link
            to={
              referralFromUrl
                ? `/dang-nhap?ref=${encodeURIComponent(referralFromUrl)}`
                : "/dang-nhap"
            }
            style={linkAccent}
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </main>
  );
}
