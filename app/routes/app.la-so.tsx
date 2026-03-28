import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const LasoRevealSequence = lazy(() =>
  import("~/components/la-so/LasoRevealSequence").then((m) => ({
    default: m.LasoRevealSequence,
  })),
);
import { AiReadingBlock } from "~/components/AiReadingBlock";
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
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { useProfile } from "~/hooks/useProfile";
import {
  BAT_TU_BIRTH_TIME_OPTIONS,
  ddMmYyyyInputToBatTuBirthDate,
  gioiTinhToBatTuGender,
  gioSinhToBatTuBirthTime,
  isoYmdToDdMmYyyyInput,
  sanitizeDdMmYyyyInput,
} from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { invokeGenerateReading } from "~/lib/generate-reading";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { cn } from "~/components/ui/utils";

type Phase = "form" | "confirm" | "loading" | "revealing" | "done";

const GIOI_TINH_LABEL: Record<string, string> = { nam: "Nam", nu: "Nữ" };

const UNSET = "__unset__";

/** Mỗi phần Dụng Thần (sau dấu phẩy) giống Make: in đậm từng hành. */
function IntroDungThanParts({ dungThan }: { dungThan: string }) {
  const parts = dungThan
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return <span className="text-foreground font-medium">—</span>;
  }
  if (parts.length === 1) {
    return <span className="text-foreground font-medium">{parts[0]}</span>;
  }
  return parts.map((p, i) => (
    <span key={`${p}-${i}`}>
      {i > 0 ? ", " : null}
      <span className="text-foreground font-medium">{p}</span>
    </span>
  ));
}

function labelForBirthTimeCode(code: string): string {
  if (code === UNSET) return "Không chọn";
  const opt = BAT_TU_BIRTH_TIME_OPTIONS.find((o) => String(o.value) === code);
  return opt?.label ?? code;
}

export default function AppLaSo() {
  const { profile, loading, refresh } = useProfile();

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState({
    ngaySinh: "",
    birthTimeCode: UNSET,
    gioiTinh: "" as "nam" | "nu" | "",
  });
  const [reveal, setReveal] = useState<ReturnType<
    typeof laSoJsonToRevealProps
  > | null>(null);
  const [tuTruAiReading, setTuTruAiReading] = useState<string | null>(null);
  const [tuTruAiLoading, setTuTruAiLoading] = useState(false);
  const tuTruAiGenRef = useRef(0);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;

  useEffect(() => {
    if (!profile || loading) return;
    if (hasLaso) {
      setPhase("done");
      return;
    }
    const code = gioSinhToBatTuBirthTime(profile.gio_sinh);
    setForm({
      ngaySinh: isoYmdToDdMmYyyyInput(profile.ngay_sinh),
      birthTimeCode: code !== undefined ? String(code) : UNSET,
      gioiTinh: profile.gioi_tinh ?? "",
    });
  }, [profile, loading, hasLaso]);

  function handleToConfirm() {
    if (!form.ngaySinh || !form.gioiTinh) return;
    setPhase("confirm");
  }

  async function runTuTru() {
    const birth_date = ddMmYyyyInputToBatTuBirthDate(form.ngaySinh.trim());
    if (!birth_date) {
      toast.error(
        "Ngày sinh cần đúng DD/MM/YYYY và là ngày có thật trên lịch.",
      );
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
    setTuTruAiReading(null);
    setTuTruAiLoading(false);
    const res = await invokeBatTu<unknown>({ op: "tu-tru", body });
    if (!res.ok) {
      toast.error(res.message);
      setPhase("confirm");
      return;
    }

    const tuTruGen = ++tuTruAiGenRef.current;
    setTuTruAiLoading(true);
    void invokeGenerateReading({
      endpoint: "tu-tru",
      data: res.data,
    }).then((r) => {
      if (tuTruGen !== tuTruAiGenRef.current) return;
      setTuTruAiReading(r.reading);
      setTuTruAiLoading(false);
    });

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

  const laSoNgayInvalid =
    form.ngaySinh.trim().length > 0 &&
    ddMmYyyyInputToBatTuBirthDate(form.ngaySinh.trim()) == null;

  if (loading) {
    return (
      <div className="min-h-[40vh] bg-background px-4 pb-8 py-10">
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
      <div className="min-h-[40vh] bg-background px-4 pb-8 py-24 text-center">
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-ibm-mono)" }}>
          Đang lập lá số…
        </p>
      </div>
    );
  }

  const displaySummary =
    laSoJsonToRevealProps(profile?.la_so as never) ?? reveal;

  const core = (
      <div className="min-h-[60vh] bg-background px-4 pb-24">
        <ScreenHeader
          title="Lá số tứ trụ"
          showBack={false}
          appScreenTitle
          endAdornment={<CreditsHeaderChip />}
        />

        {phase === "done" && displaySummary ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Lá số của bạn đã được lưu. Nhật Chủ{" "}
              <span className="text-foreground font-semibold">
                {displaySummary.nhatChu}
              </span>
              {" "}— Dụng Thần{" "}
              <IntroDungThanParts dungThan={displaySummary.dungThan} />.
            </p>

            <div
              className="relative overflow-hidden bg-forest text-forest-foreground px-4 py-4 shadow-sm"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <GrainOverlay />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="text-make-cta leading-none"
                      style={{
                        fontFamily: "var(--font-noto)",
                        fontSize: 52,
                        fontWeight: 700,
                      }}
                    >
                      {displaySummary.nhatChuHan}
                    </span>
                    <span
                      className="text-forest-foreground/55 text-xs mt-1 tracking-wide"
                      style={{ fontFamily: "var(--font-ibm-mono)" }}
                    >
                      Nhật Chủ
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1.5">
                      <div>
                        <p className="text-forest-foreground/55 text-xs">Nhật Chủ</p>
                        <p className="text-forest-foreground text-sm font-semibold leading-snug">
                          {displaySummary.nhatChu} — {displaySummary.hanh}
                        </p>
                      </div>
                      <div>
                        <p className="text-forest-foreground/55 text-xs">Mệnh</p>
                        <p className="text-forest-foreground text-sm font-semibold leading-snug">
                          {displaySummary.menh}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-forest-foreground/15 mb-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-forest-foreground/55 text-xs mb-0.5">Dụng Thần</p>
                    <p className="text-make-cta text-sm font-semibold leading-snug">
                      {displaySummary.dungThan}
                    </p>
                  </div>
                  <div>
                    <p className="text-forest-foreground/55 text-xs mb-0.5">Kỵ Thần</p>
                    <p className="text-make-cta text-sm font-semibold leading-snug">
                      {displaySummary.kyThan}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-forest-foreground/55 text-xs mb-0.5">Đại Vận</p>
                    <p className="text-make-cta text-sm font-semibold leading-snug">
                      {displaySummary.daiVan}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AiReadingBlock
              title="Luận giải"
              variant="on-card"
              loading={tuTruAiLoading}
              text={tuTruAiReading}
            />

            <Button
              size="default"
              asChild
              className="w-full font-semibold bg-make-cta text-make-cta-foreground hover:bg-make-cta/90 shadow-sm"
            >
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
                Dựng lá số lần đầu không trừ lượng — giống một phần của việc có tài khoản. Sau
                khi xác nhận, thông tin sinh sẽ khóa theo quy định ứng dụng.
              </p>
            </div>

            <Button type="button" className="w-full" onClick={() => void runTuTru()}>
              Xác nhận — lập lá số
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
                type="text"
                name="la-so-ngay-ddmmyyyy"
                autoComplete="off"
                placeholder="DD/MM/YYYY"
                aria-invalid={laSoNgayInvalid}
                maxLength={10}
                className="tabular-nums"
                value={form.ngaySinh}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ngaySinh: sanitizeDdMmYyyyInput(e.target.value),
                  }))
                }
              />
              {laSoNgayInvalid ? (
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
              disabled={
                !form.ngaySinh || !form.gioiTinh || laSoNgayInvalid
              }
              onClick={handleToConfirm}
            >
              Tiếp tục
            </Button>
          </div>
        ) : null}
      </div>
  );

  return core;
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
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center bg-background text-muted-foreground text-sm">
          Đang tải hiệu ứng…
        </div>
      }
    >
      <LasoRevealSequence
        {...reveal}
        onComplete={() => void onComplete()}
        onCancel={() => void onCancel()}
      />
    </Suspense>
  );
}
