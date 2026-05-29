import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { useProfile } from "~/hooks/useProfile";
import { useAuth } from "~/lib/auth";
import {
  checkoutResponseFromOrder,
  flowForPackageSku,
  isPaymentFlowExemptPath,
  isRecoverablePendingOrder,
  isTerminalPaymentStatus,
  recoveryConfirmTarget,
  recoverySuccessPath,
  type PaymentOrderRecoveryRow,
} from "~/lib/payment-order-recovery";
import type { PackageSku } from "~/lib/api-types";
import {
  clearPendingPayment,
  readPendingPayment,
  stashPendingPayment,
  type PendingPaymentSession,
} from "~/lib/pending-payment-session";
import { supabase } from "~/lib/supabase";

export type PaymentRecoveryOffer = {
  orderId: string;
  packageSku: PackageSku;
  flow: PendingPaymentSession["flow"];
};

async function fetchPendingOrderForUser(
  userId: string,
  preferredOrderId?: string,
): Promise<PaymentOrderRecoveryRow | null> {
  if (preferredOrderId) {
    const { data } = await supabase
      .from("payment_orders")
      .select(
        "id, package_sku, status, checkout_url, amount_vnd, provider_order_code, raw_request, created_at",
      )
      .eq("id", preferredOrderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data && isRecoverablePendingOrder(data)) {
      return data as PaymentOrderRecoveryRow;
    }
  }

  const { data: rows } = await supabase
    .from("payment_orders")
    .select(
      "id, package_sku, status, checkout_url, amount_vnd, provider_order_code, raw_request, created_at",
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!rows?.length) return null;
  for (const row of rows) {
    if (isRecoverablePendingOrder(row)) {
      return row as PaymentOrderRecoveryRow;
    }
  }
  return null;
}

function offerFromRow(row: PaymentOrderRecoveryRow): PaymentRecoveryOffer {
  const packageSku = row.package_sku as PackageSku;
  return {
    orderId: row.id,
    packageSku,
    flow: flowForPackageSku(packageSku),
  };
}

/**
 * On app resume, surface a pending PayOS order so the user can verify payment.
 */
export function usePaymentRecovery() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { reload } = useProfile();
  const [offer, setOffer] = useState<PaymentRecoveryOffer | null>(null);
  const [checking, setChecking] = useState(false);
  const scanGeneration = useRef(0);

  const scan = useCallback(async () => {
    if (!user?.id) {
      setOffer(null);
      return;
    }
    if (isPaymentFlowExemptPath(location.pathname)) {
      setOffer(null);
      return;
    }

    const generation = ++scanGeneration.current;

    const local = readPendingPayment();
    const row = await fetchPendingOrderForUser(user.id, local?.orderId);

    if (generation !== scanGeneration.current) return;

    if (!row) {
      if (local) clearPendingPayment();
      setOffer(null);
      return;
    }

    const next = offerFromRow(row);
    setOffer(next);

    const checkout = checkoutResponseFromOrder(row);
    if (checkout) {
      stashPendingPayment({
        orderId: row.id,
        packageSku: next.packageSku,
        flow: next.flow,
        checkoutUrl: checkout.checkout_url,
        createdAt: row.created_at,
      });
    }
  }, [user?.id, location.pathname]);

  useEffect(() => {
    void scan();
  }, [scan]);

  useEffect(() => {
    function onResume(): void {
      if (document.visibilityState === "visible") {
        void scan();
      }
    }
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("pageshow", onResume);
    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("pageshow", onResume);
    };
  }, [scan]);

  const dismiss = useCallback(() => {
    setOffer(null);
  }, []);

  const checkPaymentStatus = useCallback(async () => {
    if (!user?.id || !offer || checking) return;
    setChecking(true);
    try {
      const { data: row } = await supabase
        .from("payment_orders")
        .select(
          "id, package_sku, status, checkout_url, amount_vnd, provider_order_code, raw_request, created_at",
        )
        .eq("id", offer.orderId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!row) {
        clearPendingPayment();
        setOffer(null);
        toast.error("Không tìm thấy đơn thanh toán.");
        return;
      }

      if (row.status === "paid") {
        clearPendingPayment();
        setOffer(null);
        await reload();
        toast.success("Thanh toán đã xác nhận.");
        navigate(
          recoverySuccessPath(offer.flow, offer.packageSku, offer.orderId),
          { replace: true },
        );
        return;
      }

      if (isTerminalPaymentStatus(row.status)) {
        clearPendingPayment();
        setOffer(null);
        toast.info(
          "Đơn thanh toán đã hết hạn hoặc bị huỷ. Bạn có thể tạo lệnh mới.",
        );
        navigate(offer.flow === "addon" ? "/toi" : "/dat-lich", {
          replace: true,
        });
        return;
      }

      const checkout = checkoutResponseFromOrder(row as PaymentOrderRecoveryRow);
      if (checkout) {
        const target = recoveryConfirmTarget(
          offer.flow,
          offer.packageSku,
          checkout,
        );
        navigate(target.pathname, {
          replace: true,
          search: target.search,
          state: target.state,
        });
        return;
      }

      navigate(recoverySuccessPath(offer.flow, offer.packageSku, offer.orderId), {
        replace: true,
      });
    } finally {
      setChecking(false);
    }
  }, [user?.id, offer, checking, navigate, reload]);

  return {
    offer,
    checking,
    dismiss,
    checkPaymentStatus,
  };
}
