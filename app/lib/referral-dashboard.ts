import { FunctionsHttpError } from "@supabase/supabase-js";

import type { ReferralDashboardResponse } from "~/lib/api-types";
import { supabase } from "~/lib/supabase";
import { getAccessTokenForEdgeInvoke } from "~/lib/supabase-edge-auth";

type EdgeErrorBody = {
  error?: { code?: string; message?: string };
};

function parseDashboard(data: unknown): ReferralDashboardResponse | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.referral_code !== "string" || typeof d.invite_url !== "string") {
    return null;
  }
  return {
    referral_code: d.referral_code,
    invite_url: d.invite_url,
    total_reward_vnd:
      typeof d.total_reward_vnd === "number" ? d.total_reward_vnd : 0,
    referees_count:
      typeof d.referees_count === "number" ? d.referees_count : 0,
    reward_tiers: Array.isArray(d.reward_tiers)
      ? (d.reward_tiers as ReferralDashboardResponse["reward_tiers"])
      : [],
    recent_rewards: Array.isArray(d.recent_rewards)
      ? (d.recent_rewards as ReferralDashboardResponse["recent_rewards"])
      : [],
  };
}

export async function fetchReferralDashboard(): Promise<
  | { ok: true; data: ReferralDashboardResponse }
  | { ok: false; message: string }
> {
  const accessToken = await getAccessTokenForEdgeInvoke();
  if (!accessToken) {
    return { ok: false, message: "Chưa đăng nhập." };
  }

  const { data, error } = await supabase.functions.invoke<
    ReferralDashboardResponse | EdgeErrorBody
  >("referral-dashboard", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const text = await error.context.text();
        const body = JSON.parse(text) as EdgeErrorBody;
        return {
          ok: false,
          message: body.error?.message ?? "Không tải được dữ liệu giới thiệu.",
        };
      } catch {
        return { ok: false, message: error.message };
      }
    }
    return { ok: false, message: "Không tải được dữ liệu giới thiệu." };
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    return {
      ok: false,
      message: data.error.message ?? "Không tải được dữ liệu giới thiệu.",
    };
  }

  const parsed = parseDashboard(data);
  if (!parsed) {
    return { ok: false, message: "Dữ liệu giới thiệu không hợp lệ." };
  }

  return { ok: true, data: parsed };
}
