import { useMemo, useState } from "react";
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

function ScoreBar({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  const color =
    value >= 70
      ? "var(--success)"
      : value >= 50
        ? "var(--warning)"
        : "var(--muted-foreground)";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <span
          className="text-sm font-medium"
          style={{ color, fontFamily: "var(--font-ibm-mono)" }}
        >
          {value}
        </span>
      </div>
      <div
        className="h-1.5 bg-muted overflow-hidden"
        style={{ borderRadius: "var(--radius-pill)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${value}%`,
            background: color,
            borderRadius: "var(--radius-pill)",
          }}
        />
      </div>
      <p className="text-muted-foreground text-xs">{note}</p>
    </div>
  );
}

export default function AppVanThang() {
  const { profile, loading, refresh } = useProfile();
  const { costs, loading: costsLoading } = useFeatureCosts();
  const months = useMemo(() => monthOptions(6), []);
  const [monthIdx, setMonthIdx] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<string, TieuVanUi>>({});

  const costRow = costs[VAN_FEATURE];
  const cost = costRow?.credit_cost ?? 3;

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const q = profileToBatTuPersonQuery(profile ?? null);
  const reveal = laSoJsonToRevealProps(profile?.la_so ?? undefined);
  const nhatChu = reveal?.nhatChu ?? "";

  const current = months[monthIdx] ?? months[0]!;
  const ym = current.ym;
  const isUnlocked = Boolean(unlocked[ym]);

  async function runTieuVan() {
    if (!q.birth_date) {
      toast.error("Cần ngày sinh trong lá số / hồ sơ.");
      return;
    }
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
  const subActive =
    profile?.subscription_expires_at != null &&
    new Date(profile.subscription_expires_at) > new Date();

  return (
    <div className="px-4 pb-8">
      <ScreenHeader title="Vận tháng" />

      <div className="flex items-center justify-between mb-5" style={{ minHeight: 44 }}>
        <button
          type="button"
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          disabled={monthIdx === 0}
          className="flex items-center justify-center text-muted-foreground disabled:opacity-30"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        <div className="text-center flex-1">
          <p className="text-foreground text-sm font-medium">{current.label}</p>
        </div>

        <button
          type="button"
          onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={monthIdx === months.length - 1}
          className="flex items-center justify-center text-muted-foreground disabled:opacity-30"
          style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)" }}
        >
          <ChevronRight size={18} strokeWidth={1.5} />
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
              TỔNG QUAN MIỄN PHÍ
            </p>
            <p className="text-surface-foreground text-sm leading-relaxed">
              {current.label}
              {detail?.pillarHint ? ` — trụ tháng ${detail.pillarHint}.` : "."}
              {nhatChu
                ? ` Tương tác với Nhật Chủ ${nhatChu}: ${detail?.tongQuan ?? "Giữ nhịp tháng và các sao tốt trong lịch."}`
                : ` ${detail?.tongQuan ?? "Giữ nhịp tháng và các sao tốt trong lịch."}`}
            </p>
          </div>
        </div>

        {isUnlocked && detail ? (
          <>
            <div
              className="bg-card border border-border px-4 py-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p className="text-foreground text-sm font-medium mb-4">Các lĩnh vực</p>
              <div className="flex flex-col gap-4">
                {detail.cacGiai.map((g) => (
                  <ScoreBar key={g.label} {...g} />
                ))}
              </div>
            </div>

            <div
              className="bg-card border border-border px-4 py-3"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p className="text-muted-foreground text-xs mb-1">Trong tháng</p>
              <p className="text-foreground text-sm leading-relaxed">{detail.canLuu}</p>
            </div>
          </>
        ) : (
          <div
            className="border border-border bg-card px-4 py-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            {subActive || (profile?.credits_balance ?? 0) >= cost ? (
              <>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Chi tiết các lĩnh vực — tài vận, sự nghiệp, tình duyên, sức khoẻ
                </p>
                <Button type="button" className="w-full sm:w-auto" onClick={() => void runTieuVan()}>
                  Mở khóa — {cost} lượng
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
                    {profile?.credits_balance ?? 0} lượng
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
