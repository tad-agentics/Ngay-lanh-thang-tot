import { Link } from "react-router";

import { BackBar } from "~/components/brand";

export default function DatLichXacNhanRoute() {
  return (
    <main className="min-h-[100svh] bg-paper px-0 pb-8">
      <BackBar title="Xác nhận thanh toán" />
      <div className="px-[22px] pt-4">
        <p className="font-serif text-base text-ink-2">
          Hoàn tất thanh toán trên PayOS. Sau khi thanh toán, bạn sẽ được chuyển về trang
          thành công.
        </p>
        <Link
          to="/dat-lich"
          className="mt-6 inline-block font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-gold-deep"
        >
          ← Quay lại gói
        </Link>
      </div>
    </main>
  );
}
