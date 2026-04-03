import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

import {
  clearPendingReferralCode,
  readPendingReferralCode,
} from "~/lib/pending-referral";
import { supabase } from "~/lib/supabase";

export type ReferralClaimResponse = {
  ok: boolean;
  error_code?: string;
};

function toastReferralResult(body: ReferralClaimResponse | null): void {
  if (!body) {
    toast.error("Phản hồi không hợp lệ từ máy chủ.");
    return;
  }
  if (body.ok && body.error_code === "success") {
    toast.success(
      "Đã áp dụng mã giới thiệu — bạn và người mời nhận thưởng lượng.",
    );
    return;
  }
  switch (body.error_code) {
    case "already_redeemed":
      return;
    case "invalid_code":
      toast.message("Mã giới thiệu không hợp lệ.");
      return;
    case "self":
      toast.message("Bạn không thể dùng mã của chính mình.");
      return;
    default:
      toast.error("Không áp dụng được mã giới thiệu. Thử lại sau.");
  }
}

/** Reads pending code from sessionStorage (OAuth), invokes Edge function, then clears storage. */
export async function tryConsumePendingReferralClaim(
  session: Session,
): Promise<void> {
  const code = readPendingReferralCode();
  if (!code) return;
  clearPendingReferralCode();

  const { data, error } = await supabase.functions.invoke<ReferralClaimResponse>(
    "referral-claim",
    {
      body: { code },
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (error) {
    toast.error("Không kết nối được máy chủ để áp dụng mã giới thiệu.");
    return;
  }

  toastReferralResult(data ?? null);
  if (data?.ok) {
    window.dispatchEvent(new Event("ngaytot:profile-refresh"));
  }
}
