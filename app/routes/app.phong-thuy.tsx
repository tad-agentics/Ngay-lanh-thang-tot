import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Compass } from "lucide-react";
import { toast } from "sonner";

import { CreditGate } from "~/components/CreditGate";
import { GrainOverlay } from "~/components/GrainOverlay";
import { ScreenHeader } from "~/components/ScreenHeader";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { invokeBatTu } from "~/lib/bat-tu";
import { profileToBatTuPersonQuery } from "~/lib/bat-tu-birth";
import { laSoJsonToRevealProps, profileHasLaso } from "~/lib/la-so-ui";
import {
  phongThuyPayloadToView,
  type PhongThuyView,
} from "~/lib/phong-thuy-ui";

export default function AppPhongThuy() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<PhongThuyView | null>(null);

  const hasLaso = profile ? profileHasLaso(profile.la_so) : false;
  const laso = profile ? laSoJsonToRevealProps(profile.la_so) : null;
  const menh = laso?.menh ?? "";
  const dungThan = laso?.dungThan ?? "";

  useEffect(() => {
    if (!profileLoading && profile && !hasLaso) {
      navigate("/app/la-so", { replace: true });
    }
  }, [profileLoading, profile, hasLaso, navigate]);

  async function runPhongThuy() {
    if (!profile) return;
    const q = profileToBatTuPersonQuery(profile);
    if (!q.birth_date) {
      toast.error("Hồ sơ thiếu ngày sinh — cập nhật trong Cài đặt.");
      return;
    }
    setBusy(true);
    const res = await invokeBatTu({
      op: "phong-thuy",
      body: {
        birth_date: q.birth_date,
        birth_time: q.birth_time,
        gender: q.gender,
        tz: q.tz ?? "Asia/Ho_Chi_Minh",
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    const v = phongThuyPayloadToView(res.data);
    if (!v) {
      toast.error("Không đọc được phong thủy từ máy chủ.");
      return;
    }
    setView(v);
    setUnlocked(true);
  }

  if (profileLoading || !profile || !hasLaso) {
    return (
      <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto text-sm text-muted-foreground">
        Đang tải…
      </main>
    );
  }

  const display: PhongThuyView =
    unlocked && view
      ? view
      : {
          huongTot: "—",
          mauTot: "—",
          soTot: "—",
          canKy: "Mở khóa để xem chi tiết.",
          goiY: [],
        };

  return (
    <main className="min-h-svh bg-background px-4 pb-10 max-w-lg mx-auto">
      <p className="text-sm text-muted-foreground pt-4 mb-1">
        <Link to="/app" className="underline-offset-4 hover:underline">
          ← Trang chủ app
        </Link>
      </p>
      <ScreenHeader title="Phong thủy" />

      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden bg-surface text-surface-foreground px-4 py-4"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <GrainOverlay />
          <div className="relative">
            <p
              className="text-surface-foreground/50 text-[10px] mb-3"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {menh ? `MỆNH ${menh.toUpperCase()}` : "PHONG THỦY"}
            </p>

            {!unlocked ? (
              <p className="text-surface-foreground/80 text-sm leading-relaxed mb-4">
                Gợi ý hướng, màu, số và bài trí theo Dụng Thần từ lá số đã lưu.
                {dungThan ? (
                  <>
                    {" "}
                    <span className="text-accent font-medium">{dungThan}</span>
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <Compass
                  size={18}
                  className="text-accent mx-auto mb-1.5"
                  strokeWidth={1.5}
                />
                <p className="text-surface-foreground/60 text-xs mb-0.5">
                  Hướng tốt
                </p>
                <p className="text-surface-foreground text-sm font-medium">
                  {display.huongTot}
                </p>
              </div>
              <div className="text-center">
                <div className="flex gap-1 justify-center mb-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-success inline-block" />
                  <span className="w-3.5 h-3.5 rounded-full bg-accent inline-block" />
                </div>
                <p className="text-surface-foreground/60 text-xs mb-0.5">
                  Màu hợp
                </p>
                <p className="text-surface-foreground text-xs">
                  {display.mauTot}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-accent mb-0.5"
                  style={{
                    fontFamily: "var(--font-ibm-mono)",
                    fontSize: 18,
                    fontWeight: 500,
                  }}
                >
                  {display.soTot}
                </p>
                <p className="text-surface-foreground/60 text-xs">Số hợp</p>
              </div>
            </div>

            <div className="border-t border-surface-foreground/10 pt-3">
              <p className="text-surface-foreground/60 text-xs mb-1">Cần kỵ</p>
              <p className="text-surface-foreground/80 text-sm">
                {display.canKy}
              </p>
            </div>

            {dungThan ? (
              <div className="mt-3 border-t border-surface-foreground/10 pt-3">
                <p className="text-surface-foreground/60 text-xs mb-0.5">
                  Dụng Thần
                </p>
                <p className="text-accent text-sm font-medium">{dungThan}</p>
              </div>
            ) : null}
          </div>
        </div>

        {unlocked && view?.goiY.length ? (
          <div className="flex flex-col gap-2">
            {view.goiY.map((g, i) => (
              <div
                key={i}
                className="bg-card border border-border px-4 py-3"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <p className="text-foreground text-sm font-medium mb-1">
                  {g.tieu_de}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {g.mo_ta}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {!unlocked ? (
          <CreditGate featureKey="phong_thuy">
            <div
              className="border border-border bg-card px-4 py-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Gợi ý phong thủy đầy đủ — bàn làm việc, phòng ngủ, cây xanh.
              </p>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void runPhongThuy()}
              >
                {busy ? "Đang tải…" : "Mở khóa (trừ lượng)"}
              </Button>
            </div>
          </CreditGate>
        ) : null}
      </div>
    </main>
  );
}
