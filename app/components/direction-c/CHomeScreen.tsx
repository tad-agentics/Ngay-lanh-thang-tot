import { Link, useNavigate } from "react-router";

import { CTopStrip } from "~/components/brand";
import { ErrorBanner } from "~/components/ErrorBanner";
import { CLichSegmentedNav } from "~/components/direction-c/CLichSegmentedNav";
import { LichToPageCard } from "~/components/direction-c/LichToPageCard";
import { COfflineBanner } from "~/components/direction-c/COfflineBanner";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { useTodayLichData } from "~/hooks/useTodayLichData";
import { CT } from "~/lib/c-tokens";
import { ngayHomNayToLichCard } from "~/lib/lich-format";
import { todayIsoInVn } from "~/lib/today-reading-cache";
import { addDaysToIso } from "~/hooks/useStreak";

export function CHomeScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { loading, error, today, menh, canBatTu } = useTodayLichData();
  const todayIso = todayIsoInVn();

  const prevIso = addDaysToIso(todayIso, -1);
  const nextIso = addDaysToIso(todayIso, 1);

  return (
    <main
      className="flex min-h-full flex-col"
      style={{ background: CT.forest, color: CT.cream }}
    >
      {!online ? <COfflineBanner /> : null}
      <CTopStrip dark />
      <CLichSegmentedNav dark />

      <div className="flex-1 overflow-y-auto px-[22px] pb-24 pt-2">
        {error ? <ErrorBanner message={error} /> : null}
        {!canBatTu && !loading ? (
          <p
            className="font-serif text-sm"
            style={{ color: "rgba(237,231,211,0.75)", lineHeight: 1.55 }}
          >
            Hoàn thành{" "}
            <Link to="/gio-sinh" className="underline" style={{ color: CT.gold }}>
              lập lịch
            </Link>{" "}
            để xem trang hôm nay.
          </p>
        ) : null}

        {loading ? (
          <p
            className="py-12 text-center font-serif text-sm"
            style={{ color: "rgba(237,231,211,0.65)" }}
          >
            Đang mở trang hôm nay…
          </p>
        ) : null}

        {today ? (
          <LichToPageCard
            {...ngayHomNayToLichCard(today, menh, todayIso)}
            quote={today.homeSummaryLine}
            prevLabel={`‹ ${prevIso.slice(8, 10)}.${prevIso.slice(5, 7)} hôm qua`}
            nextLabel={`ngày mai ${nextIso.slice(8, 10)}.${nextIso.slice(5, 7)} ›`}
            onPrev={() => void navigate(`/ngay/${prevIso}`)}
            onNext={() => void navigate(`/ngay/${nextIso}`)}
            onVerdictClick={() =>
              void navigate(`/luan-ai/day-${todayIso}`)
            }
          />
        ) : null}
      </div>
    </main>
  );
}
