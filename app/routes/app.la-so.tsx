import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { LasoRevealSequence } from "~/components/la-so/LasoRevealSequence";
import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
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
import { CreditGate } from "~/components/CreditGate";
import { useProfile } from "~/hooks/useProfile";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  gioiTinhToBatTuGender,
  gioSinhToBatTuBirthTime,
  ngaySinhToBatTuBirthDate,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { toDbFeatureKey } from "~/lib/constants";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { cn } from "~/components/ui/utils";

type Phase = "form" | "confirm" | "loading" | "revealing" | "done";

const GIOI_TINH_LABEL: Record<string, string> = { nam: "Nam", nu: "Nữ" };

const UNSET = "__unset__";

function labelForBirthTimeCode(code: string): string {
  if (code === UNSET) return "Không chọn";
  const opt = BAT_TU_BIRTH_TIME_OPTIONS.find((o) => String(o.value) === code);
  return opt?.label ?? code;
}

const LA_SO_FEATURE = toDbFeatureKey("la_so");

export default function AppLaSo() {
  const { profile, loading, refresh } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState({
    ngaySinh: "",
    birthTimeCode: UNSET,
    gioiTinh: "" as "nam" | "nu" | "",
  });
  const [reveal, setReveal] = useState<ReturnType<
    typeof laSoJsonToRevealProps
  > | null>(null);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const costRow = costs[LA_SO_FEATURE];
  const cost = costRow?.credit_cost ?? 15;

  useEffect(() => {
    if (!profile || loading) return;
    if (hasLaso) {
      setPhase("done");
      return;
    }
    const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
    setForm({
      ngaySinh: profile.ngay_sinh?.slice(0, 10) ?? "",
      birthTimeCode: code !== undefined ? String(code) : UNSET,
      gioiTinh: profile.gioi_tinh ?? "",
    });
  }, [profile, loading, hasLaso]);

  function handleToConfirm() {
    if (!form.ngaySinh || !form.gioiTinh) return;
    setPhase("confirm");
  }

  async function runTuTru() {
    const birth_date = ngaySinhToBatTuBirthDate(
      form.ngaySinh.trim() ? form.ngaySinh.trim() : null,
    );
    if (!birth_date) {
      toast.error("Ngày sinh không hợp lệ.");
      return;
    }
    const body: Record<string, unknown> = {
      birth_date,
      tz: "Asia/Ho_Chi_Minh",
    };
    if (form.birthTimeCode !== UNSET) {
      const bt = Number(form.birthTimeCode);
      if (Number.isFinite(bt)) body.birth_time = bt;
    }
    const g = gioiTinhToBatTuGender(form.gioiTinh || null);
    if (g !== undefined) body.gender = g;

    setPhase("loading");
    const res = await invokeBatTu<unknown>({ op: "tu-tru", body });
    if (!res.ok) {
      toast.error(res.message);
      setPhase("confirm");
      return;
    }

    const props =
      laSoJsonToRevealProps(res.data) ??
      ({
        nhatChu: "—",
        nhatChuHan: "—",
        hanh: "—",
        menh: "—",
        dungThan: "—",
        kyThan: "—",
        daiVan: "—",
      } as NonNullable<ReturnType<typeof laSoJsonToRevealProps>>);

    setReveal(props);
    setPhase("revealing");
  }

  if (loading || costsLoading) {
    return (
      <div className="px-4 pb-8 py-10">
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  if (phase === "revealing" && reveal) {
    return (
      <LasoRevealBridge
        reveal={reveal}
        onComplete={async () => {
          await refresh();
          setPhase("done");
        }}
        onCancel={async () => {
          await refresh();
          setPhase("done");
        }}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="px-4 pb-8 py-24 text-center">
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-ibm-mono)" }}>
          Đang lập lá số…
        </p>
      </div>
    );
  }

  const displaySummary =
    laSoJsonToRevealProps(profile?.la_so as never) ?? reveal;

  const core = (
      <div className="px-4 pb-8">
        <ScreenHeader title="Lá số tứ trụ" />

        {phase === "done" && displaySummary ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-xs leading-relaxed mb-1">
              Lá số của bạn đã được lưu. Nhật Chủ{" "}
              <span className="text-foreground font-medium">{displaySummary.nhatChu}</span>
              {" "}— Dụng Thần{" "}
              <span className="text-foreground font-medium">{displaySummary.dungThan}</span>.
            </p>

            <div
              className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <GrainOverlay />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="text-accent leading-none"
                      style={{
                        fontFamily: "var(--font-noto)",
                        fontSize: 52,
                        fontWeight: 700,
                      }}
                    >
                      {displaySummary.nhatChuHan}
                    </span>
                    <span
                      className="text-surface-foreground/60 text-xs mt-1"
                      style={{ fontFamily: "var(--font-ibm-mono)" }}
                    >
                      Nhật Chủ
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-1.5">
                      <div>
                        <p className="text-surface-foreground/60 text-xs">Nhật Chủ</p>
                        <p className="text-surface-foreground text-sm font-medium">
                          {displaySummary.nhatChu} — {displaySummary.hanh}
                        </p>
                      </div>
                      <div>
                        <p className="text-surface-foreground/60 text-xs">Mệnh</p>
                        <p className="text-surface-foreground text-sm font-medium">{displaySummary.menh}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-surface-foreground/10 mb-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-surface-foreground/60 text-xs mb-0.5">Dụng Thần</p>
                    <p className="text-accent text-sm font-medium">{displaySummary.dungThan}</p>
                  </div>
                  <div>
                    <p className="text-surface-foreground/60 text-xs mb-0.5">Kỵ Thần</p>
                    <p className="text-surface-foreground/70 text-sm">{displaySummary.kyThan}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-surface-foreground/60 text-xs mb-0.5">Đại Vận</p>
                    <p className="text-surface-foreground text-sm">{displaySummary.daiVan}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button size="default" asChild className="w-full sm:w-auto">
              <Link to="/app/la-so/chi-tiet">Xem lá số đầy đủ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/van-thang">Vận tháng</Link>
            </Button>
          </div>
        ) : null}

        {phase === "done" && !displaySummary ? (
          <p className="text-muted-foreground text-sm">Đang tải lá số…</p>
        ) : null}

        {phase === "confirm" ? (
          <div className="flex flex-col gap-5">
            <div
              className="bg-card border border-border px-4 py-5"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div className="flex items-start gap-3 mb-4">
                <Lock size={16} className="text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Thông tin này không thể thay đổi sau khi tạo tài khoản. Bạn có chắc chắn không?
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground text-xs">Ngày sinh</span>
                  <span className="text-foreground text-xs font-medium" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                    {form.ngaySinh}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border gap-3">
                  <span className="text-muted-foreground text-xs shrink-0">Giờ sinh</span>
                  <span className="text-foreground text-xs font-medium text-right">
                    {labelForBirthTimeCode(form.birthTimeCode)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground text-xs">Giới tính</span>
                  <span className="text-foreground text-xs font-medium">
                    {GIOI_TINH_LABEL[form.gioiTinh] ?? "—"}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-xs mb-4">
                Lập lá số cần{" "}
                <span className="text-foreground" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                  {cost} lượng
                </span>
                . Gói đăng ký hoặc số lượng đủ sẽ được kiểm tra khi bạn xác nhận.
              </p>
            </div>

            <Button type="button" className="w-full" onClick={() => void runTuTru()}>
              Xác nhận — lập lá số ({cost} lượng)
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={() => setPhase("form")}>
              Xem lại thông tin
            </Button>
          </div>
        ) : null}

        {phase === "form" ? (
          <div className="flex flex-col gap-5">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cho biết ngày giờ sinh để mọi kết quả đều dành riêng cho bạn. Chỉ mất 30 giây — lưu một lần, dùng mãi.
            </p>

            <div className="space-y-2">
              <Label htmlFor="la-ngay">Ngày sinh dương lịch</Label>
              <p className="text-xs text-muted-foreground">
                Ngày sinh của bạn · Dùng để tính Can Chi và tìm ngày hợp tuổi
              </p>
              <Input
                id="la-ngay"
                type="date"
                value={form.ngaySinh}
                onChange={(e) => setForm((f) => ({ ...f, ngaySinh: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="la-gio">Giờ sinh (khung giờ)</Label>
              <p className="text-xs text-muted-foreground">
                Cùng danh mục với Cài đặt — chọn khung can chi (gửi API như tu-tru-api).
              </p>
              <Select
                value={form.birthTimeCode}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, birthTimeCode: v }))
                }
              >
                <SelectTrigger id="la-gio" className="w-full">
                  <SelectValue placeholder="Chọn khung giờ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>Chưa chọn / không rõ</SelectItem>
                  {BAT_TU_BIRTH_TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Giới tính</Label>
              <div
                className="flex border border-border overflow-hidden"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                {(["nam", "nu"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gioiTinh: g }))}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium transition-colors",
                    )}
                    style={{
                      background:
                        form.gioiTinh === g ? "var(--surface)" : "var(--card)",
                      color:
                        form.gioiTinh === g
                          ? "var(--surface-foreground)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    {GIOI_TINH_LABEL[g]}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!form.ngaySinh || !form.gioiTinh}
              onClick={handleToConfirm}
            >
              Tiếp tục
            </Button>
          </div>
        ) : null}
      </div>
  );

  const gateForm = !hasLaso && (phase === "form" || phase === "confirm");
  return gateForm ? (
    <CreditGate featureKey={LA_SO_FEATURE}>{core}</CreditGate>
  ) : (
    core
  );
}

function LasoRevealBridge({
  reveal,
  onComplete,
  onCancel,
}: {
  reveal: NonNullable<ReturnType<typeof laSoJsonToRevealProps>>;
  onComplete: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}) {
  return (
    <LasoRevealSequence
      {...reveal}
      onComplete={() => void onComplete()}
      onCancel={() => void onCancel()}
    />
  );
}
