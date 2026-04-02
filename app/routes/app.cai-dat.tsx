import { useEffect, useState } from "react";
import { ChevronRight, Copy, ExternalLink, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import {
  creditsBalanceFootnote,
  creditsBalanceHeadline,
} from "~/lib/subscription";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  batTuBirthTimeCodeToGioSinh,
  ddMmYyyyInputToBatTuBirthDate,
  ddMmYyyyInputToIsoDate,
  formatDdMmYyyyWithAutoSlash,
  gioSinhToBatTuBirthTime,
  gioiTinhToBatTuGender,
  isoYmdToDdMmYyyyInput,
  isPartialDdMmYyyyInput,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileHasLaso } from "~/lib/la-so-ui";
import { supabase } from "~/lib/supabase";

import { cn } from "~/components/ui/utils";
import type { User } from "@supabase/supabase-js";

const UNSET = "__unset__";

function authProviderBadge(user: User | null): string | null {
  if (!user) return null;
  const raw = user.app_metadata?.provider;
  if (raw === "google") return "Google";
  if (raw === "email") return "Email";
  if (typeof raw === "string" && raw.length > 0) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  const id = user.identities?.[0]?.provider;
  if (id === "google") return "Google";
  if (id === "email") return "Email";
  return null;
}

function formatNgaySinhDisplay(iso: string | null | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN");
}

export default function AppCaiDat() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [ngaySinh, setNgaySinh] = useState("");
  const [birthTimeCode, setBirthTimeCode] = useState<string>(UNSET);
  const [gioiTinh, setGioiTinh] = useState<string>(UNSET);
  const [saving, setSaving] = useState(false);
  const [pushCount, setPushCount] = useState<number | null>(null);

  useEffect(() => {
    if (!profile || loading) return;
    setNgaySinh(isoYmdToDdMmYyyyInput(profile.ngay_sinh));
    const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
    setBirthTimeCode(code !== undefined ? String(code) : UNSET);
    setGioiTinh(profile.gioi_tinh ?? UNSET);
  }, [profile, loading]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error) setPushCount(0);
      else setPushCount(data?.length ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const birthLocked = Boolean(profile?.birth_data_locked_at);
  const creditsFootnote = profile ? creditsBalanceFootnote(profile) : null;
  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const provider = authProviderBadge(user);

  const inviteBase =
    (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const inviteUrl =
    profile?.referral_code && inviteBase
      ? `${inviteBase}/dang-ky?ref=${encodeURIComponent(profile.referral_code)}`
      : "";

  async function copyReferralCode() {
    if (!profile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      toast.success("Đã sao chép mã giới thiệu.");
    } catch {
      toast.error("Không sao chép được — thử chọn và copy thủ công.");
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Đã sao chép link mời bạn.");
    } catch {
      toast.error("Không sao chép được — thử copy thủ công.");
    }
  }

  async function saveBirth() {
    if (!user || birthLocked) return;
    setSaving(true);
    const hadLaso = profile ? profileHasLaso(profile.la_so) : true;
    const gioSinh =
      birthTimeCode === UNSET
        ? null
        : batTuBirthTimeCodeToGioSinh(Number(birthTimeCode));
    if (birthTimeCode !== UNSET && !gioSinh) {
      toast.error("Giờ sinh không hợp lệ.");
      setSaving(false);
      return;
    }
    let ngayIso: string | null = null;
    const rawNgay = ngaySinh.trim();
    if (rawNgay.length > 0) {
      ngayIso = ddMmYyyyInputToIsoDate(rawNgay);
      if (!ngayIso) {
        toast.error(
          "Ngày sinh cần đúng DD/MM/YYYY và là ngày có thật trên lịch.",
        );
        setSaving(false);
        return;
      }
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        ngay_sinh: ngayIso,
        gio_sinh: gioSinh,
        gioi_tinh: gioiTinh === UNSET ? null : (gioiTinh as "nam" | "nu"),
      })
      .eq("id", user.id);
    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }

    let lasoBootstrapError: string | null = null;
    let lasoBootstrapOk = false;
    if (!hadLaso && ngayIso && gioiTinh !== UNSET) {
      const birth_date = ddMmYyyyInputToBatTuBirthDate(ngaySinh.trim());
      if (birth_date) {
        const body: Record<string, unknown> = {
          birth_date,
          tz: "Asia/Ho_Chi_Minh",
        };
        if (birthTimeCode !== UNSET) {
          const bt = Number(birthTimeCode);
          if (Number.isFinite(bt)) body.birth_time = bt;
        }
        const g = gioiTinhToBatTuGender(gioiTinh as "nam" | "nu");
        if (g !== undefined) body.gender = g;

        const res = await invokeBatTu<unknown>({ op: "tu-tru", body });
        if (res.ok) lasoBootstrapOk = true;
        else lasoBootstrapError = res.message;
      }
    }

    setSaving(false);
    await refresh();

    if (lasoBootstrapError) {
      toast.success("Đã lưu thông tin sinh.");
      toast.error(`Chưa tạo được lá số tự động: ${lasoBootstrapError}`);
    } else if (lasoBootstrapOk) {
      toast.success("Đã lưu và tạo lá số.");
    } else {
      toast.success("Đã lưu thông tin sinh.");
    }
  }

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
    if (error) {
      toast.error(error.message);
      return;
    }
    setPushCount(0);
    toast.success("Đã tắt đăng ký thông báo đẩy.");
  }

  const ngayLabel = profile?.ngay_sinh
    ? formatNgaySinhDisplay(profile.ngay_sinh)
    : null;

  const ngaySinhEditInvalid =
    ngaySinh.trim().length > 0 &&
    ddMmYyyyInputToBatTuBirthDate(ngaySinh.trim()) == null &&
    !isPartialDdMmYyyyInput(ngaySinh);

  return (
    <div className="min-h-[60vh] bg-background pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground font-[family-name:var(--font-lora)]">
          Cài đặt
        </h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <section className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-3">Tài khoản</p>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-foreground break-all min-w-0 flex-1">
              {user?.email ?? "—"}
            </p>
            {provider ? (
              <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-md border border-border bg-muted/50 text-foreground">
                {provider}
              </span>
            ) : null}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">Ngày sinh</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Lock className="size-3.5" aria-hidden strokeWidth={1.75} />
              <span>
                {birthLocked
                  ? "Không thể thay đổi"
                  : "Có thể chỉnh trước khi khóa"}
              </span>
            </div>
          </div>
          <p className="text-sm text-foreground leading-snug">
            {ngayLabel ??
              "Chưa có — lập lá số để lưu ngày sinh."}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {birthLocked
              ? "Không thể thay đổi — liên hệ hỗ trợ nếu nhập sai."
              : "Sau khi lập lá số, ngày sinh sẽ khóa theo chính sách."}
          </p>
        </section>

        <Link
          to={hasLaso ? "/app/la-so/chi-tiet" : "/app/la-so"}
          className={cn(
            "rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm",
            "flex items-center justify-between gap-3 min-h-[4.25rem]",
            "text-left transition-colors hover:bg-muted/40 active:bg-muted/55",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Lá số tứ trụ</p>
            <p
              className={cn(
                "text-sm font-semibold leading-snug",
                hasLaso ? "text-foreground" : "text-primary",
              )}
            >
              {hasLaso ? "Xem lá số của bạn" : "Chưa có lá số — lập ngay"}
            </p>
          </div>
          <ChevronRight
            className="text-muted-foreground shrink-0"
            size={18}
            strokeWidth={1.5}
            aria-hidden
          />
        </Link>

        <section className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs text-muted-foreground">Số dư lượng</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : profile ? (
            <>
              <p className="text-2xl font-bold text-foreground tabular-nums leading-snug">
                {creditsBalanceHeadline(profile)}
              </p>
              {creditsFootnote ? (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {creditsFootnote}
                </p>
              ) : null}
              <Button variant="outline" asChild className="w-full font-medium">
                <Link to="/app/mua-luong">Mua thêm lượng</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa đọc được hồ sơ.</p>
          )}
        </section>

        {profile && !loading ? (
          <section className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm space-y-3">
            <p className="text-xs text-muted-foreground">Mời bạn</p>
            <p className="text-sm text-foreground leading-snug">
              Mỗi người bạn giới thiệu đăng ký — bạn và họ cùng nhận 10 lượng.
            </p>
            {profile.referral_code ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-semibold tracking-wide text-foreground tabular-nums">
                    {profile.referral_code}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-2 font-medium"
                    onClick={() => void copyReferralCode()}
                  >
                    <Copy className="size-4" aria-hidden />
                    Sao chép mã
                  </Button>
                </div>
                {inviteUrl ? (
                  <>
                    <p className="text-[11px] text-muted-foreground break-all leading-relaxed">
                      {inviteUrl}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full gap-2 font-medium"
                      onClick={() => void copyInviteLink()}
                    >
                      <Copy className="size-4" aria-hidden />
                      Sao chép link đăng ký
                    </Button>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mã giới thiệu chưa sẵn sàng ở hồ sơ hiện tại. Bấm làm mới để đồng
                  bộ lại dữ liệu.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-medium"
                  onClick={() => void refresh()}
                >
                  Làm mới mã giới thiệu
                </Button>
              </>
            )}
          </section>
        ) : null}

        <section className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Thông báo
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Thông báo nhỏ — mùa cưới, Tết, đầu tháng. Tắt bất cứ lúc nào.
              </p>
            </div>
            <Switch
              className="mt-0.5 shrink-0"
              checked={pushCount != null && pushCount > 0}
              disabled={pushCount === null || !user}
              onCheckedChange={(c) => void onPushToggle(c)}
              aria-label="Bật thông báo đẩy"
            />
          </div>
        </section>

        {!birthLocked && profile ? (
          <details className="rounded-[var(--radius-lg)] border border-border bg-card shadow-sm group">
            <summary className="list-none cursor-pointer px-4 py-3.5 text-sm font-medium text-foreground flex items-center justify-between gap-2">
              Cập nhật ngày giờ sinh (Bát Tự)
              <ChevronRight
                className="text-muted-foreground shrink-0 transition-transform group-open:rotate-90"
                size={16}
                strokeWidth={1.5}
              />
            </summary>
            <div className="px-4 pb-4 pt-0 space-y-4 text-sm border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed pt-3">
                Giờ sinh theo khung can chi (tu-tru-api). Lưu xong có thể tự tạo
                lá số khi đủ ngày sinh và giới tính.
              </p>
              <div className="space-y-2">
                <Label htmlFor="ngay-sinh">Ngày sinh</Label>
                <Input
                  id="ngay-sinh"
                  type="text"
                  autoComplete="off"
                  placeholder="DD/MM/YYYY"
                  aria-invalid={ngaySinhEditInvalid}
                  maxLength={10}
                  className="tabular-nums"
                  value={ngaySinh}
                  onChange={(e) =>
                    setNgaySinh(formatDdMmYyyyWithAutoSlash(e.target.value))
                  }
                  disabled={loading || !profile}
                />
                {ngaySinhEditInvalid ? (
                  <p
                    className="text-[11px] text-destructive leading-relaxed"
                    role="alert"
                  >
                    Nhập đúng DD/MM/YYYY và ngày phải có thật (ví dụ 20/05/1990).
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Định dạng DD/MM/YYYY.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gio-sinh">Giờ sinh (khung giờ)</Label>
                <Select
                  value={birthTimeCode}
                  onValueChange={setBirthTimeCode}
                  disabled={loading || !profile}
                >
                  <SelectTrigger id="gio-sinh" className="w-full">
                    <SelectValue placeholder="Chọn khung giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET}>Chưa chọn</SelectItem>
                    {BAT_TU_BIRTH_TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gioi-tinh">Giới tính</Label>
                <Select
                  value={gioiTinh}
                  onValueChange={setGioiTinh}
                  disabled={loading || !profile}
                >
                  <SelectTrigger id="gioi-tinh" className="w-full">
                    <SelectValue placeholder="Chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET}>Chưa chọn</SelectItem>
                    <SelectItem value="nam">Nam</SelectItem>
                    <SelectItem value="nu">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={
                  saving ||
                  loading ||
                  !profile ||
                  (ngaySinh.trim().length > 0 &&
                    ddMmYyyyInputToBatTuBirthDate(ngaySinh.trim()) == null)
                }
                onClick={() => void saveBirth()}
              >
                {saving ? "Đang lưu…" : "Lưu thông tin sinh"}
              </Button>
            </div>
          </details>
        ) : null}

        <section
          className="rounded-[var(--radius-lg)] border border-border bg-card text-sm overflow-hidden shadow-sm"
          aria-label="Pháp lý và ứng dụng"
        >
          {(
            [
              { label: "Cài đặt ứng dụng", to: "/app/cai-dat-app" as const },
              { label: "Chính sách bảo mật", to: "/chinh-sach-bao-mat" as const },
              { label: "Điều khoản sử dụng", to: "/dieu-khoan" as const },
            ] as const
          ).map((item, i, arr) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3.5 text-foreground hover:bg-muted/50 transition-colors",
                i < arr.length - 1 && "border-b border-border",
              )}
              style={{ minHeight: 48 }}
            >
              <span>{item.label}</span>
              <ChevronRight
                size={16}
                className="text-muted-foreground shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
            </Link>
          ))}
          <a
            href="mailto:hotro@ngaylanhthangtot.vn"
            className="flex items-center justify-between gap-3 px-4 py-3.5 text-foreground border-t border-border hover:bg-muted/50 transition-colors"
            style={{ minHeight: 48 }}
          >
            <span>Liên hệ hỗ trợ</span>
            <ExternalLink
              size={14}
              className="text-muted-foreground shrink-0"
              strokeWidth={1.5}
              aria-hidden
            />
          </a>
        </section>

        <Button
          type="button"
          variant="secondary"
          className="w-full font-medium"
          onClick={() => void signOut()}
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
