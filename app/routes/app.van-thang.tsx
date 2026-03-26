import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { ScreenHeader } from "~/components/ScreenHeader";
import { GrainOverlay } from "~/components/GrainOverlay";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { useFeatureCosts } from "~/hooks/useFeatureCosts";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { invokeBatTu } from "~/lib/bat-tu";
import { toDbFeatureKey } from "~/lib/constants";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import { mapTieuVanPayload, type TieuVanUi } from "~/lib/tieu-van-ui";
import { subscriptionActive } from "~/lib/subscription";

const VAN_FEATURE = toDbFeatureKey("van_thang");

function monthOptions(count: number): { ym: string; label: string }[] {
  const out: { ym: string; label: string }[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    const y = x.getFullYear();
    const m = x.getMonth() + 1;
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("vi-VN", {
      month: "long",
      year: "numeric",
    }).format(x);
    out.push({ ym, label });
  }
  return out;
}

function QualitativeCard({
  kicker,
  titleOptional,
  children,
}: {
  kicker: string;
  titleOptional?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="bg-card border border-border px-4 py-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <p
        className="text-muted-foreground text-[10px] mb-2 uppercase tracking-wide"
        style={{ fontFamily: "var(--font-ibm-mono)" }}
      >
        {kicker}
      </p>
      {titleOptional ? (
        <p className="text-foreground text-sm font-medium mb-2">{titleOptional}</p>
      ) : null}
      <div className="text-foreground text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function AppVanThang() {
  const { profile, loading, refresh } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const months = useMemo(() => monthOptions(6), []);
  const [monthIdx, setMonthIdx] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<string, TieuVanUi>>({});
  const [unlocking, setUnlocking] = useState(false);

  const costRow = costs[VAN_FEATURE];
  const cost = costRow?.credit_cost ?? 3;

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const q = profileToBatTuPersonQuery(profile ?? null);
  const reveal = laSoJsonToRevealProps(profile?.la_so ?? undefined);
  const nhatChuProfile = reveal?.nhatChu ?? "";

  const current = months[monthIdx] ?? months[0]!;
  const ym = current.ym;
  const isUnlocked = Boolean(unlocked[ym]);

  async function runTieuVan() {
    if (!q.birth_date || unlocking) {
      if (!q.birth_date) toast.error("Cần ngày sinh trong lá số / hồ sơ.");
      return;
    }
    setUnlocking(true);
    try {
      const res = await invokeBatTu<unknown>({
        op: "tieu-van",
        body: { ...q, month: ym },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      const ui = mapTieuVanPayload(res.data);
      setUnlocked((prev) => ({ ...prev, [ym]: ui }));
      await refresh();
    } finally {
      setUnlocking(false);
    }
  }

  if (loading || costsLoading) {
    return (
      <div className="px-4 pb-8 py-10">
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  if (!hasLaso) {
    return (
      <div className="px-4 pb-8 py-10 space-y-4">
        <ScreenHeader title="Vận tháng" />
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cần lá số tứ trụ trước khi xem vận tháng cá nhân hoá.
        </p>
        <Button asChild>
          <Link to="/app/la-so">Lập lá số</Link>
        </Button>
      </div>
    );
  }

  if (!q.birth_date) {
    return (
      <div className="px-4 pb-8 py-10 space-y-4">
        <ScreenHeader title="Vận tháng" />
        <p className="text-muted-foreground text-sm">
          Thiếu ngày sinh trên hồ sơ — bổ sung trong Cài đặt hoặc lập lại lá số.
        </p>
        <Button variant="secondary" asChild>
          <Link to="/app/cai-dat">Cài đặt</Link>
        </Button>
      </div>
    );
  }

  const detail = unlocked[ym];
  const subActive = subscriptionActive(profile?.subscription_expires_at);
  const nhatChuLine =
    detail?.nhatChuApi && detail.nhatChuApi.trim()
      ? detail.nhatChuApi
      : nhatChuProfile;

  const hasTuTruMeta =
    detail &&
    (detail.dungThanApi ||
      detail.chartStrength ||
      detail.thapThanOfMonth);

  return (
    <div className="px-4 pb-8">
      <ScreenHeader title="Vận tháng" />

      <div className="flex items-center justify-between mb-5" style={{ minHeight: 44 }}>
        <button
          type="button"
          aria-label="Tháng trước"
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          disabled={monthIdx === 0}
          className="flex items-center justify-center text-muted-foreground disabled:opacity-30"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}
        >
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
        </button>

        <div className="text-center flex-1">
          <p className="text-foreground text-sm font-medium">{current.label}</p>
        </div>

        <button
          type="button"
          aria-label="Tháng sau"
          onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={monthIdx === months.length - 1}
          className="flex items-center justify-center text-muted-foreground disabled:opacity-30"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}
        >
          <ChevronRight size={18} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-3"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-surface-foreground/50 text-xs mb-1.5"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {isUnlocked ? "THEO LÁ SỐ ĐÃ LƯU" : "KHUNG THÁNG"}
            </p>
            <p className="text-surface-foreground text-sm leading-relaxed">
              {isUnlocked && detail ? (
                <>
                  <span className="text-surface-foreground/90">{current.label}</span>
                  {detail.pillarHint !== "—" ? (
                    <> — trụ tháng {detail.pillarHint}.</>
                  ) : (
                    <>.</>
                  )}
                  {detail.userMenhLabel ? (
                    <>
                      {" "}
                      Mệnh Nạp Âm theo lá số:{" "}
                      <span className="text-accent font-medium">
                        {detail.userMenhLabel}
                      </span>
                      .
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  {current.label} — bạn đang xem khung tháng dương lịch. Mở khóa để đọc diễn
                  giải theo trụ tháng, quan hệ với mệnh và Đại Vận từ lá số, không phải lịch
                  chung.
                </>
              )}
            </p>
          </div>
        </div>

        {isUnlocked && detail ? (
          <>
            {detail.elementRelationLabel ? (
              <QualitativeCard kicker="Quan hệ tháng với mệnh">
                <p>{detail.elementRelationLabel}</p>
              </QualitativeCard>
            ) : null}

            <QualitativeCard kicker="Diễn giải">
              <div className="space-y-2">
                {nhatChuLine ? (
                  <p className="text-muted-foreground text-xs">
                    Nhật Chủ:{" "}
                    <span className="text-foreground font-medium">{nhatChuLine}</span>
                  </p>
                ) : null}
                <p>{detail.tongQuan}</p>
              </div>
            </QualitativeCard>

            {detail.tags.length > 0 ? (
              <div
                className="bg-card border border-border px-4 py-4"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                <p className="text-foreground text-sm font-medium mb-3">Nhịp tháng</p>
                <div className="flex flex-wrap gap-2">
                  {detail.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 text-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-3 leading-relaxed">
                  Các nhãn tóm tắt xu hướng — không phải điểm số, mà là hướng cảm nhận chung
                  trong tháng.
                </p>
              </div>
            ) : null}

            {hasTuTruMeta ? (
              <QualitativeCard kicker="Thêm từ tứ trụ (khi có giờ sinh)">
                <ul className="list-disc pl-5 space-y-1.5 text-sm">
                  {detail.dungThanApi ? (
                    <li>
                      Dụng Thần:{" "}
                      <span className="font-medium text-foreground">
                        {detail.dungThanApi}
                      </span>
                    </li>
                  ) : null}
                  {detail.chartStrength ? (
                    <li>
                      Thế lá số:{" "}
                      <span className="font-medium text-foreground">
                        {detail.chartStrength}
                      </span>
                    </li>
                  ) : null}
                  {detail.thapThanOfMonth ? (
                    <li>
                      Thập Thần của trụ tháng (so với Nhật Chủ):{" "}
                      <span className="font-medium text-foreground">
                        {detail.thapThanOfMonth}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </QualitativeCard>
            ) : null}

            {detail.linhVuc.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-foreground text-sm font-medium px-0.5">
                  Gợi ý theo từng lĩnh vực
                </p>
                {detail.linhVuc.map((row, idx) => (
                  <QualitativeCard key={`${ym}-linh-vuc-${idx}`} kicker={row.title}>
                    <p className="text-muted-foreground text-sm leading-relaxed">{row.body}</p>
                  </QualitativeCard>
                ))}
              </div>
            ) : null}

            <QualitativeCard kicker="Đại vận & nhịp trong tháng">
              <p className="text-muted-foreground text-sm leading-relaxed">{detail.canLuu}</p>
            </QualitativeCard>

            <p className="text-muted-foreground text-xs leading-relaxed px-0.5">
              Việc lớn trong tháng có thể đối chiếu thêm ở{" "}
              <Link to="/app/chon-ngay" className="text-primary font-medium underline underline-offset-2">
                Chọn ngày lành
              </Link>{" "}
              để chọn ngày cụ thể theo lá số.
            </p>
          </>
        ) : (
          <div
            className="border border-border bg-card px-4 py-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            {subActive || (profile?.credits_balance ?? 0) >= cost ? (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Mở khóa để xem diễn giải định tính: trụ tháng, mệnh, quan hệ ngũ hành với tháng,
                  nhịp Đại Vận và lưu ý trong tháng — không dùng điểm số, bám theo lá số đã
                  lưu.
                </p>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={unlocking}
                  onClick={() => void runTieuVan()}
                >
                  {unlocking ? "Đang mở khóa…" : `Mở khóa — ${cost} lượng`}
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Mở chi tiết vận tháng — cần{" "}
                  <span className="text-foreground" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                    {cost} lượng
                  </span>
                  . Số dư hiện tại:{" "}
                  <span className="text-foreground" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                    {subscriptionActive(profile?.subscription_expires_at)
                      ? "Không giới hạn lượng"
                      : `${profile?.credits_balance ?? 0} lượng`}
                  </span>
                  .
                </p>
                <Button type="button" className="w-full sm:w-auto" asChild>
                  <Link to="/app/mua-luong" state={{ returnTo: "/app/van-thang" }}>
                    Mua thêm lượng
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
