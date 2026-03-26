import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import { useProfile } from "~/hooks/useProfile";
import {
  creditsBalanceFootnote,
  creditsBalanceHeadline,
} from "~/lib/subscription";

export default function AppMuaLuongThanhCong() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { profile, loading, reload } = useProfile();
  const [longWaitHint, setLongWaitHint] = useState(false);
  const creditsFootnote = profile ? creditsBalanceFootnote(profile) : null;

  usePollPaymentOrderPaid(orderId, Boolean(orderId), {
    onPaid: async () => {
      await reload();
      toast.success("Đã xác nhận thanh toán — số dư đã cập nhật.");
      setLongWaitHint(false);
    },
    onGiveUp: () => {
      setLongWaitHint(true);
    },
  });

  return (
    <div className="px-4 pb-8 py-10 space-y-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
          Cảm ơn bạn
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Sau khi PayOS xác nhận giao dịch, số lượng hoặc gói được cập nhật qua
          webhook (thường trong vài chục giây). Trang này tự kiểm tra khi có mã
          đơn trên đường dẫn.
        </p>
        {orderId ? (
          <p className="mt-2 text-xs text-muted-foreground font-mono break-all">
            Đơn: {orderId}
          </p>
        ) : (
          <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-200/90">
            Không có mã đơn trên URL — mở lại từ bước &quot;Tôi đã chuyển
            khoản&quot; hoặc nhấn tải lại số dư bên dưới.
          </p>
        )}
        {longWaitHint ? (
          <p className="mt-3 text-sm text-amber-800/90 dark:text-amber-200/90 text-left rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            Chưa thấy xác nhận tự động. Trên{" "}
            <strong>my.payos.vn</strong> cần cấu hình webhook trỏ tới{" "}
            <code className="text-xs break-all">
              …/functions/v1/payos-webhook
            </code>{" "}
            của Supabase, và chạy{" "}
            <code className="text-xs">supabase functions deploy payos-webhook</code>
            . Kiểm tra chữ ký <code className="text-xs">PAYOS_CHECKSUM_KEY</code>{" "}
            trùng kênh PayOS. Sau đó thanh toán lại hoặc liên hệ hỗ trợ kèm mã đơn.
          </p>
        ) : null}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ…</p>
      ) : profile ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Số dư hiện tại</p>
          <p className="text-2xl font-semibold text-foreground mt-1 leading-snug">
            {creditsBalanceHeadline(profile)}
          </p>
          {creditsFootnote ? (
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {creditsFootnote}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void reload().then(() => toast.message("Đã tải lại số dư."));
          }}
        >
          Tải lại số dư
        </Button>
        <Button asChild>
          <Link to="/app">Trang chủ app</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/mua-luong">Mua thêm</Link>
        </Button>
      </div>
    </div>
  );
}
