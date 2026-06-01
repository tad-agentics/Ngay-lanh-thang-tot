import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { BirthHourCanhPicker } from "~/components/auth/BirthHourCanhPicker";
import { GioiTinhPick } from "~/components/auth/GioiTinhPick";
import {
  btnPrimaryGold,
  C,
  CANH_HOURS,
  CForestShell,
  inputLabel,
  inputUnderline,
} from "~/components/auth/c-auth-ui";
import { BackBar, Mono } from "~/components/brand";
import { applyLandingPrefillToProfile } from "~/lib/apply-landing-prefill-profile";
import { useAuth } from "~/lib/auth";
import {
  displayNameFromAuthUser,
  emailFromAuthUser,
  isCompletingAuthOnboarding,
  oauthProviderLabel,
} from "~/lib/auth-onboarding";
import { resolvePostLoginPath } from "~/lib/auth-post-login";
import {
  batTuBirthTimeCodeToGioSinh,
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
  isoYmdToDdMmYyyyInput,
} from "~/lib/bat-tu-birth";
import { canhPickerIndexFromGioSinh } from "~/lib/birth-hour-canh";
import {
  landingSignupPrefillHasAny,
  parseLandingSignupPrefill,
} from "~/lib/landing-cta-constants";
import { validateProfileNgaySinhIso } from "~/lib/ngay-sinh-range";
import {
  returnToFromSearchParams,
  stashPendingReturnTo,
} from "~/lib/pending-return-to";
import {
  referralParamFromSearchParams,
  stashPendingReferralCode,
} from "~/lib/pending-referral";
import type { Database } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

type OnboardingProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "display_name" | "ngay_sinh" | "gio_sinh" | "gioi_tinh"
>;

export default function DangKy() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [onboardingProfile, setOnboardingProfile] =
    useState<OnboardingProfileRow | null>(null);
  const [searchParams] = useSearchParams();
  const completingProfile = isCompletingAuthOnboarding(user);
  const oauthLabel = oauthProviderLabel(user);
  const accountEmail = emailFromAuthUser(user);
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
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu" | null>(
    prefill.gioiTinh ?? null,
  );
  const [selectedCanh, setSelectedCanh] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lunarNote, setLunarNote] = useState(false);

  const ngayIsoForPicker = useMemo(
    () => ddMmYyyyInputToIsoDate(ngaySinh.trim()),
    [ngaySinh],
  );

  const gioiTinhForPicker = gioiTinh;

  useEffect(() => {
    if (!user) {
      setOnboardingProfile(null);
      return;
    }
    const fromAuth = displayNameFromAuthUser(user);
    if (fromAuth) {
      setFullName((prev) => (prev.trim() ? prev : fromAuth));
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, ngay_sinh, gio_sinh, gioi_tinh")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setOnboardingProfile(data ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!onboardingProfile) return;
    if (onboardingProfile.display_name?.trim()) {
      setFullName((prev) =>
        prev.trim() ? prev : onboardingProfile.display_name!.trim(),
      );
    }
    if (onboardingProfile.ngay_sinh?.trim()) {
      setNgaySinh((prev) =>
        prev.trim()
          ? prev
          : isoYmdToDdMmYyyyInput(onboardingProfile.ngay_sinh!),
      );
    }
    const gt = onboardingProfile.gioi_tinh;
    if (gt === "nam" || gt === "nu") {
      setGioiTinh((prev) => prev ?? gt);
    }
    const idx = canhPickerIndexFromGioSinh(onboardingProfile.gio_sinh);
    if (idx != null) {
      setSelectedCanh((prev) => (prev == null ? idx : prev));
    }
  }, [onboardingProfile]);

  useEffect(() => {
    if (prefill.gioSinh && selectedCanh == null) {
      const idx = canhPickerIndexFromGioSinh(prefill.gioSinh);
      if (idx != null) setSelectedCanh(idx);
    }
  }, [prefill.gioSinh, selectedCanh]);

  useEffect(() => {
    if (authLoading || !user) return;
    void resolvePostLoginPath().then((dest) => {
      if (dest !== "/dang-ky") {
        navigate(dest, { replace: true });
      }
    });
  }, [authLoading, user, navigate]);

  async function persistBirthProfile(
    uid: string,
    ngayIso: string,
    gioSinh: string,
    gioiTinhValue: "nam" | "nu",
  ) {
    const patch = {
      display_name: fullName.trim() || undefined,
      ngay_sinh: ngayIso,
      gio_sinh: gioSinh,
      gioi_tinh: gioiTinhValue,
    };
    const { error: profileError } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", uid);
    if (profileError) return profileError.message;

    if (landingSignupPrefillHasAny(prefill)) {
      const pe = await applyLandingPrefillToProfile(uid, prefill, {
        skipBirthFields: true,
        skipDisplayName: Boolean(fullName.trim()),
      });
      if (pe) {
        window.dispatchEvent(new Event("ngaytot:profile-refresh"));
        return "Đã lưu thông tin bản mệnh nhưng chưa áp dụng được thông tin từ trang chủ.";
      }
    }
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ngayIso = ddMmYyyyInputToIsoDate(ngaySinh.trim());
    if (!ngayIso) {
      toast.error("Nhập ngày sinh theo định dạng DD/MM/YYYY.");
      return;
    }
    const ngayRange = validateProfileNgaySinhIso(ngayIso);
    if (!ngayRange.ok) {
      toast.error(ngayRange.message);
      return;
    }
    if (!gioiTinh) {
      toast.error("Chọn giới tính.");
      return;
    }
    if (selectedCanh == null) {
      toast.error("Chọn canh giờ sinh.");
      return;
    }
    const gioSinh = batTuBirthTimeCodeToGioSinh(CANH_HOURS[selectedCanh]!.code);
    if (!gioSinh) {
      toast.error("Không chọn được giờ sinh.");
      return;
    }

    if (completingProfile && user) {
      setBusy(true);
      stashPendingReferralCode(referralFromUrl);
      const err = await persistBirthProfile(
        user.id,
        ngayIso,
        gioSinh,
        gioiTinh,
      );
      if (err) {
        toast.error(err);
        setBusy(false);
        return;
      }
      toast.success("Đã lưu thông tin bản mệnh.");
      navigate("/dang-dung-lich", { replace: true });
      setBusy(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Mật khẩu cần ít nhất 8 ký tự.");
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
      const { data: profileRow, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", uid)
        .maybeSingle();
      if (!profileRow && !profileCheckError) {
        toast.error("Tài khoản đã tạo nhưng hồ sơ chưa được khởi tạo — thử đăng nhập lại.");
        setBusy(false);
        navigate("/dang-nhap", { replace: true });
        return;
      }

      const err = await persistBirthProfile(uid, ngayIso, gioSinh, gioiTinh);
      if (err) {
        toast.error(
          err.startsWith("Đã lưu")
            ? err
            : "Tài khoản đã tạo nhưng chưa lưu được hồ sơ — thử lại.",
        );
        setBusy(false);
        return;
      }
      toast.success("Đã tạo tài khoản.");
      navigate("/dang-dung-lich", { replace: true });
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
        showBack={!completingProfile}
        onBack={() =>
          navigate(
            referralFromUrl
              ? `/dang-nhap?ref=${encodeURIComponent(referralFromUrl)}`
              : "/dang-nhap",
          )
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
          Lập lá số
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
            maxWidth: 300,
          }}
        >
          {completingProfile
            ? oauthLabel
              ? `Đã liên kết tài khoản qua ${oauthLabel}. Xin vui lòng cung cấp giới tính, ngày sinh và canh giờ để thiết lập lá số Tứ Trụ bản mệnh riêng biệt.`
              : "Tài khoản của bạn đã được khởi tạo thành công. Xin vui lòng cung cấp giới tính, ngày sinh và canh giờ để lập lá số bản mệnh."
            : "Lá số Tứ Trụ (Bát Tự) được thiết lập dựa trên giới tính, ngày tháng năm sinh và canh giờ sinh chính xác của bạn. Sai lệch dù chỉ một khắc, toàn bộ quỹ đạo vận số và các phương án định điểm cát hung hằng ngày sẽ thay đổi."}
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
          {completingProfile && accountEmail ? (
            <div>
              <div style={inputLabel}>
                Email{oauthLabel ? ` · ${oauthLabel}` : ""}
              </div>
              <input
                type="email"
                readOnly
                tabIndex={-1}
                value={accountEmail}
                aria-readonly
                style={{
                  ...inputUnderline(),
                  color: "rgba(237,231,211,0.55)",
                  cursor: "default",
                }}
              />
            </div>
          ) : !completingProfile ? (
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
          ) : null}

          <GioiTinhPick value={gioiTinh} onChange={setGioiTinh} />

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
                Hệ thống đang hoàn thiện tính năng quy đổi trực tiếp từ ngày sinh Âm lịch. Để không gián đoạn quá trình lập lá số Tứ Trụ, xin vui lòng quy đổi và nhập ngày Dương lịch tương ứng.
              </p>
            ) : null}
          </div>

          <BirthHourCanhPicker
            birthDateIso={ngayIsoForPicker}
            gioiTinh={gioiTinhForPicker}
            selected={selectedCanh}
            onSelect={setSelectedCanh}
          />

          {!completingProfile ? (
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
                Mật khẩu cần tối thiểu 8 ký tự để bảo mật tài khoản.
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ ...btnPrimaryGold, marginTop: 24 }}
        >
          {busy ? "Đang lưu…" : "Hoàn tất & Dựng lịch →"}
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
          Cam kết bảo mật tuyệt đối thông tin bản mệnh · Không chia sẻ cho bên thứ ba.
        </div>
      </form>
    </CForestShell>
  );
}
