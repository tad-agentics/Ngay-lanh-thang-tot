import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  btnPrimaryGold,
  C,
  CForestShell,
  inputLabel,
  inputUnderline,
} from "~/components/auth/c-auth-ui";
import { BackBar, Mono } from "~/components/brand";
import { applyLandingPrefillToProfile } from "~/lib/apply-landing-prefill-profile";
import {
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
  isoYmdToDdMmYyyyInput,
} from "~/lib/bat-tu-birth";
import {
  landingSignupPrefillHasAny,
  parseLandingSignupPrefill,
} from "~/lib/landing-cta-constants";
import { resolvePostLoginPath } from "~/lib/auth-post-login";
import {
  returnToFromSearchParams,
  stashPendingReturnTo,
} from "~/lib/pending-return-to";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

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
  const returnTo = useMemo(
    () => returnToFromSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    if (returnTo) stashPendingReturnTo(returnTo);
  }, [returnTo]);

  const [fullName, setFullName] = useState(prefill.displayName ?? "");
  const [email, setEmail] = useState("");
  const [ngaySinh, setNgaySinh] = useState(
    prefill.ngaySinh ? isoYmdToDdMmYyyyInput(prefill.ngaySinh) : "",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [lunarNote, setLunarNote] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    const ngayIso = ddMmYyyyInputToIsoDate(ngaySinh.trim());
    if (!ngayIso) {
      toast.error("Nhập ngày sinh theo định dạng DD/MM/YYYY.");
      return;
    }

    setBusy(true);
    stashPendingReferralCode(referralFromUrl);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
          ...(referralFromUrl
            ? { referral_code: referralFromUrl.toUpperCase() }
            : {}),
        },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    const session = data.session;
    const uid = data.user?.id;

    if (session && uid) {
      const patch = {
        display_name: fullName.trim() || undefined,
        ngay_sinh: ngayIso,
      };
      const { error: profileError } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", uid);
      if (profileError) {
        toast.error("Tài khoản đã tạo nhưng chưa lưu được hồ sơ — thử lại.");
        setBusy(false);
        return;
      }
      if (landingSignupPrefillHasAny(prefill)) {
        const pe = await applyLandingPrefillToProfile(uid, prefill);
        if (pe) {
          toast.error(
            "Tài khoản đã tạo nhưng chưa lưu được thông tin từ form trang chủ.",
          );
        }
      }
      toast.success("Đã tạo tài khoản.");
      const dest = await resolvePostLoginPath();
      navigate(dest, { replace: true });
    } else {
      toast.success(
        "Đã gửi email xác nhận (nếu bật). Mở link trong thư rồi đăng nhập.",
      );
      navigate("/dang-nhap", { replace: true });
    }
    setBusy(false);
  }

  return (
    <CForestShell>
      <BackBar
        dark
        onBack={() => navigate(referralFromUrl ? `/dang-nhap?ref=${encodeURIComponent(referralFromUrl)}` : "/dang-nhap")}
        endAdornment={
          <Mono style={{ color: "rgba(200,188,152,0.5)", fontSize: 9.5 }}>
            1 / 2
          </Mono>
        }
      />

      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{
          flex: 1,
          padding: "12px 28px 24px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Mono style={{ color: C.gold, fontSize: 10.5, letterSpacing: "0.22em" }}>
          Lập lá số · bước 1
        </Mono>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 36.5,
            color: C.cream,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.015em",
            margin: "12px 0 6px",
          }}
        >
          Thông tin bản mệnh
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 14,
            color: "rgba(237,231,211,0.65)",
            lineHeight: 1.55,
            maxWidth: 280,
          }}
        >
          Lá số Bát Tự Tứ Trụ cần chính xác ngày, tháng, năm và giờ sinh. Sai lệch một giờ sinh, toàn bộ luận đoán cát hung sẽ thay đổi.
        </p>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div>
            <div style={inputLabel}>Họ và tên</div>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={inputUnderline(true)}
            />
          </div>
          <div>
            <div style={inputLabel}>Email</div>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputUnderline()}
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <div style={inputLabel}>Ngày sinh dương lịch</div>
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 12.5,
                  color: "rgba(237,231,211,0.5)",
                }}
              >
                hoặc{" "}
                <button
                  type="button"
                  onClick={() => setLunarNote(true)}
                  style={{
                    color: C.gold,
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    cursor: "pointer",
                  }}
                >
                  chọn Âm lịch
                </button>
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/YYYY"
              value={ngaySinh}
              onChange={(e) => {
                setNgaySinh(formatDdMmYyyyWithAutoSlash(e.target.value));
                if (lunarNote) setLunarNote(false);
              }}
              required
              style={inputUnderline()}
            />
            {lunarNote ? (
              <p
                style={{
                  marginTop: 6,
                  fontFamily: "var(--serif)",
                  fontSize: 11.5,
                  color: "rgba(237,231,211,0.55)",
                  lineHeight: 1.45,
                }}
              >
                Tính năng nhập ngày sinh Âm lịch đang được cập nhật. Vui lòng nhập ngày Dương lịch tương ứng để lập lá số Tứ Trụ.
              </p>
            ) : null}
          </div>
          <div>
            <div style={inputLabel}>Mật khẩu</div>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={inputUnderline()}
            />
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--serif)",
                fontSize: 11.5,
                color: "rgba(237,231,211,0.45)",
              }}
            >
              Tối thiểu 8 ký tự · hoặc dùng Google ở màn trước
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ ...btnPrimaryGold, marginTop: "auto" }}
        >
          Tiếp tục — Chọn giờ sinh
        </button>
        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontFamily: "var(--serif)",
            fontSize: 11.5,
            color: "rgba(237,231,211,0.45)",
          }}
        >
          Bảo mật thông tin bản mệnh · Không chia sẻ dữ liệu
        </div>
      </form>
    </CForestShell>
  );
}
