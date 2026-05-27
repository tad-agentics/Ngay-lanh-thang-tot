import { Link } from "react-router";

import { BackBar } from "~/components/brand";

export default function OfflineRoute() {
  return (
    <main className="min-h-[100svh] bg-paper pb-8">
      <BackBar title="Ngoại tuyến" />
      <div className="px-[22px] py-6 text-center">
        <p className="font-serif text-base text-ink-2">
          Không có kết nối mạng. Lịch đã lưu trên thiết bị vẫn xem được khi có dữ liệu
          ngoại tuyến.
        </p>
        <Link
          to="/lich"
          className="mt-6 inline-block font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-gold-deep"
        >
          Thử lại
        </Link>
      </div>
    </main>
  );
}
