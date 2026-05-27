import { Link } from "react-router";

import { Button } from "~/components/ui/button";

type CSubExpiredProps = {
  onDismiss?: () => void;
};

/** Direction C — subscription expired blocker (artboard 38). */
export function CSubExpired({ onDismiss }: CSubExpiredProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="sub-expired-title"
    >
      <div className="w-full max-w-md rounded-lg bg-paper p-6 shadow-lg">
        <h2
          id="sub-expired-title"
          className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase text-ink"
        >
          Lịch đã hết hạn
        </h2>
        <p className="mt-2 font-serif text-base text-ink-2">
          Gia hạn lịch để tiếp tục xem ngày cá nhân hoá, tra cứu và luận giải.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild className="min-h-[44px] w-full">
            <Link to="/dat-lich">Gia hạn lịch</Link>
          </Button>
          {onDismiss ? (
            <Button type="button" variant="outline" className="min-h-[44px] w-full" onClick={onDismiss}>
              Để sau
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
