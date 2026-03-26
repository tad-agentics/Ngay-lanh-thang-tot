import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const ShareCardCanvas = lazy(() =>
  import("~/components/chia-se/ShareCardCanvas").then((m) => ({
    default: m.ShareCardCanvas,
  })),
);
import { CreditGate } from "~/components/CreditGate";
import { CreditsHeaderChip } from "~/components/CreditsHeaderChip";
import { ErrorBanner } from "~/components/ErrorBanner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { useProfile } from "~/hooks/useProfile";
import { laSoJsonToRevealProps } from "~/lib/la-so-ui";
import { createShareToken } from "~/lib/share-token";

export type ChiaSeLocationState = {
  suKien?: string;
  day?: {
    dateLabel?: string;
    lunarLabel?: string;
    reasons?: string[];
  };
  grade?: "A" | "B" | "C";
  resultType?: string;
};

function ChiaSeCard({
  state,
}: {
  state: ChiaSeLocationState;
}) {
  const { profile, refresh } = useProfile();
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const createOnce = useRef(false);

  const menh = profile
    ? laSoJsonToRevealProps(profile.la_so)?.menh ?? "—"
    : "—";

  const suKien = state.suKien ?? "Khai trương";
  const day = state.day ?? {};
  const grade = state.grade;
  const resultType = state.resultType ?? "day_pick";
  const dateLabel = day.dateLabel ?? "—";
  const lunarLabel = day.lunarLabel ?? "";
  const reasonShort =
    day.reasons?.[0] ?? "Ngày Hoàng Đạo, giờ tốt phù hợp";

  useEffect(() => {
    if (createOnce.current) return;
    createOnce.current = true;

    void (async () => {
      const headline = `Ngày lành cho ${suKien}`;
      const res = await createShareToken({
        result_type: resultType,
        payload: {
          headline,
          summary: reasonShort,
          event_label: suKien,
          date_label: dateLabel,
          lunar_label: lunarLabel,
          reason_short: reasonShort,
          menh,
          grade: grade ?? "",
        },
      });
      if (!res.ok) {
        createOnce.current = false;
        setCreateErr(res.message);
        return;
      }
      setToken(res.token);
      await refresh();
    })();
  }, [
    suKien,
    resultType,
    dateLabel,
    lunarLabel,
    reasonShort,
    menh,
    grade,
    refresh,
  ]);

  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/x/${token}`
      : undefined;

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ngày lành cho ${suKien}`,
          text: `${dateLabel} — ${reasonShort}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Đã copy liên kết.");
      }
      setSent(true);
    } catch {
      /* user cancelled */
    }
  };

  const handleSaveImage = () => {
    toast.message("Lưu ảnh — sẽ bổ sung (html2canvas).");
    setSent(true);
  };

  if (createErr) {
    return (
      <>
        <ErrorBanner message={createErr} />
        <Link
          to="/app/mua-luong"
          className="inline-block text-sm text-primary underline underline-offset-4 mt-2"
        >
          Mua lượng
        </Link>
      </>
    );
  }

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Đang tạo liên kết chia sẻ…
      </p>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm py-8">Đang tải thẻ…</p>
        }
      >
        <ShareCardCanvas
          eventLabel={suKien}
          date={dateLabel}
          lunarDate={lunarLabel}
          reasonShort={reasonShort}
          menh={menh}
          grade={grade}
          shareUrl={shareUrl}
          onShare={() => void handleShare()}
          onSaveImage={handleSaveImage}
        />
      </Suspense>
      {sent ? (
        <p
          className="text-muted-foreground text-xs text-center mt-4"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          Đã gửi.
        </p>
      ) : null}
    </>
  );
}

export default function AppChiaSe() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? null) as ChiaSeLocationState | null;

  useEffect(() => {
    if (!state) {
      toast.error("Thiếu dữ liệu chia sẻ — quay lại Chọn ngày hoặc Hợp tuổi.");
      navigate("/app", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div className="px-4 pb-8">
      <ScreenHeader
        title="Chia sẻ ngày lành"
        endAdornment={<CreditsHeaderChip />}
      />

      <CreditGate featureKey="share_card">
        <ChiaSeCard state={state} />
      </CreditGate>
    </div>
  );
}
