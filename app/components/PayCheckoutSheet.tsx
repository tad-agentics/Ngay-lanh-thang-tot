import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import QRCode from "qrcode";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";

import type { CreatePayosCheckoutResponse } from "~/lib/api-types";
import { Button } from "~/components/ui/button";
import { useProfile } from "~/hooks/useProfile";
import { usePollPaymentOrderPaid } from "~/hooks/usePollPaymentOrderPaid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/components/ui/utils";
import { formatVnd, payosBankLabel } from "~/lib/payos-display";

function PayosQrImage({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, {
      width: 220,
      margin: 2,
      color: { dark: "#1d3129ff", light: "#ffffffff" },
    }).then(
      (url) => {
        if (!cancelled) setDataUrl(url);
      },
      () => {
        if (!cancelled) setDataUrl(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div
        className="aspect-square w-full max-w-[220px] mx-auto rounded-lg bg-muted animate-pulse"
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Mã QR chuyển khoản VietQR"
      className="w-full max-w-[220px] mx-auto rounded-lg border border-border bg-white p-2"
    />
  );
}

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`Đã sao chép ${label}`),
    () =>
      toast.error("Không sao chép được — thử chọn và sao chép thủ công."),
  );
}

export function PayCheckoutSheet({
  open,
  onOpenChange,
  payload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: CreatePayosCheckoutResponse | null;
}) {
  const navigate = useNavigate();
  const { reload } = useProfile();
  const transfer = payload?.transfer ?? null;
  const orderId = payload?.order_id;

  usePollPaymentOrderPaid(orderId, open && Boolean(orderId), {
    onPaid: async () => {
      await reload();
      toast.success("Thanh toán đã xác nhận — số dư đã cập nhật.");
      onOpenChange(false);
    },
  });

  function confirmTransfer() {
    if (!payload) return;
    onOpenChange(false);
    const q = new URLSearchParams({ order_id: payload.order_id });
    navigate(`/app/mua-luong/thanh-cong?${q.toString()}`);
  }

  function openPayosPage() {
    if (payload?.checkout_url) {
      window.open(payload.checkout_url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-2xl max-h-[90dvh] overflow-y-auto p-0 gap-0",
          "border-t border-border",
        )}
      >
        <SheetHeader className="px-4 pt-5 pb-3 space-y-1 text-left border-b border-border/60">
          <SheetTitle className="font-[family-name:var(--font-lora)] text-xl pr-10">
            Thanh toán
          </SheetTitle>
          <SheetDescription className="sr-only">
            Quét mã QR hoặc chuyển khoản theo thông tin PayOS
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-3">
          <Collapsible className="rounded-lg border border-border bg-muted/30">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors [&[data-state=open]>svg]:rotate-180">
              Có mã giảm giá?
              <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3 text-sm text-muted-foreground">
              Hiện chưa áp dụng mã giảm giá qua PayOS trên phiên bản này.
            </CollapsibleContent>
          </Collapsible>
        </div>

        {transfer ? (
          <div className="px-4 space-y-3 pb-2">
            <h3 className="text-sm font-medium text-foreground">
              Thông tin chuyển khoản
            </h3>
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
              {transfer.qr_code ? (
                <>
                  <PayosQrImage value={transfer.qr_code} />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      if (transfer.qr_code) copyText("mã QR", transfer.qr_code);
                    }}
                  >
                    <Copy className="size-4 mr-2 shrink-0" />
                    Sao chép mã QR
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Không có mã QR — dùng số tài khoản bên dưới hoặc mở PayOS.
                </p>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Ngân hàng</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {payosBankLabel(transfer.bank_bin)}
                  </p>
                </div>
                {transfer.account_number ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">
                        Số tài khoản
                      </p>
                      <p className="font-mono font-medium text-foreground mt-0.5 tracking-wide break-all">
                        {transfer.account_number}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      aria-label="Sao chép số tài khoản"
                      onClick={() => {
                        if (transfer.account_number) {
                          copyText("số tài khoản", transfer.account_number);
                        }
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                ) : null}
                {transfer.account_name ? (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Chủ tài khoản
                    </p>
                    <p className="font-medium text-foreground mt-0.5 uppercase">
                      {transfer.account_name}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-muted-foreground text-xs">Số tiền</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatVnd(transfer.amount_vnd)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Nội dung CK</p>
                  <p className="font-medium text-primary mt-0.5 break-all">
                    {transfer.transfer_content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : payload ? (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              PayOS không trả chi tiết VietQR trực tiếp lúc này. Bạn có thể mở
              trang thanh toán PayOS.
            </p>
            <Button type="button" className="w-full" onClick={openPayosPage}>
              Mở cổng PayOS
            </Button>
          </div>
        ) : null}

        <SheetFooter className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 border-t border-border/60 bg-background flex flex-col gap-2">
          <Button
            type="button"
            size="cta_sm"
            className="w-full"
            disabled={!payload}
            onClick={confirmTransfer}
          >
            Tôi đã chuyển khoản
          </Button>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Sau khi chuyển khoản đúng số tiền và nội dung, hệ thống tự cộng lượng
            khi PayOS gửi webhook. Trang này sẽ tự kiểm tra vài phút — bạn vẫn có
            thể nhấn nút dưới để sang màn hình theo dõi.
          </p>
          {payload?.checkout_url ? (
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-muted-foreground h-auto py-1"
              onClick={openPayosPage}
            >
              Mở trang thanh toán PayOS trong tab mới
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
