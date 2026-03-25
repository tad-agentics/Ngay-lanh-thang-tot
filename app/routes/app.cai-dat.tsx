import { useEffect, useState } from "react";
import { Link } from "react-router";
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
import { useAuth } from "~/lib/auth";
import { useProfile } from "~/hooks/useProfile";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  batTuBirthTimeCodeToGioSinh,
  gioSinhToBatTuBirthTime,
} from "~/lib/bat-tu-birth";
import { supabase } from "~/lib/supabase";

const UNSET = "__unset__";

export default function AppCaiDat() {
  const { user, signOut } = useAuth();
  const { profile, loading, refresh } = useProfile();
  const [ngaySinh, setNgaySinh] = useState("");
  const [birthTimeCode, setBirthTimeCode] = useState<string>(UNSET);
  const [gioiTinh, setGioiTinh] = useState<string>(UNSET);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile || loading) return;
    setNgaySinh(profile.ngay_sinh?.slice(0, 10) ?? "");
    const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
    setBirthTimeCode(code !== undefined ? String(code) : UNSET);
    setGioiTinh(profile.gioi_tinh ?? UNSET);
  }, [profile, loading]);

  const birthLocked = Boolean(profile?.birth_data_locked_at);

  async function saveBirth() {
    if (!user || birthLocked) return;
    setSaving(true);
    const gioSinh =
      birthTimeCode === UNSET
        ? null
        : batTuBirthTimeCodeToGioSinh(Number(birthTimeCode));
    if (birthTimeCode !== UNSET && !gioSinh) {
      toast.error("Giờ sinh không hợp lệ.");
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        ngay_sinh: ngaySinh.trim() ? ngaySinh.trim() : null,
        gio_sinh: gioSinh,
        gioi_tinh: gioiTinh === UNSET ? null : (gioiTinh as "nam" | "nu"),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Đã lưu thông tin sinh.");
    await refresh();
  }

  return (
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link to="/app" className="underline-offset-4 hover:underline">
            ← Trang chủ app
          </Link>
        </p>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
          Cài đặt
        </h1>
      </div>
      <section className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Email</span>
          <br />
          <span className="break-all">{user?.email}</span>
        </p>
        {loading ? (
          <p className="text-muted-foreground">Đang tải…</p>
        ) : profile ? (
          <>
            <p>
              <span className="text-muted-foreground">Lượng</span>
              <br />
              <strong>{profile.credits_balance}</strong>
            </p>
            {profile.subscription_expires_at ? (
              <p>
                <span className="text-muted-foreground">Gói đang dùng đến</span>
                <br />
                {new Date(profile.subscription_expires_at).toLocaleDateString(
                  "vi-VN",
                )}
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-4 text-sm">
        <p className="font-medium text-foreground">Thông tin Bát Tự</p>
        {birthLocked ? (
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Ngày giờ sinh đã khóa sau khi lập lá số — không chỉnh sửa được. Xem{" "}
            <Link to="/app/la-so" className="underline underline-offset-4">
              lá số
            </Link>
            .
          </p>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Giờ sinh dùng khung can chi (giá trị gửi API giống dropdown trong tài liệu
            tu-tru-api).
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="ngay-sinh">Ngày sinh</Label>
          <Input
            id="ngay-sinh"
            type="date"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            disabled={loading || !profile || birthLocked}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gio-sinh">Giờ sinh (khung giờ)</Label>
          <Select
            value={birthTimeCode}
            onValueChange={setBirthTimeCode}
            disabled={loading || !profile || birthLocked}
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
            disabled={loading || !profile || birthLocked}
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
          disabled={saving || loading || !profile || birthLocked}
          onClick={() => void saveBirth()}
        >
          {saving ? "Đang lưu…" : "Lưu thông tin sinh"}
        </Button>
      </section>

      <Button variant="outline" asChild className="w-full">
        <Link to="/app/mua-luong">Mua lượng / gói</Link>
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => void signOut()}
      >
        Đăng xuất
      </Button>
    </main>
  );
}
