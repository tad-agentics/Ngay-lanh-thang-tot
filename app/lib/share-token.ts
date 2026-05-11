import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "~/lib/supabase";
import { getAccessTokenForEdgeInvoke } from "~/lib/supabase-edge-auth";

type ApiErr = { error?: { code?: string; message?: string } };

async function parseCreateShareHttpError(
  error: FunctionsHttpError,
): Promise<{ code: string; message: string }> {
  const fallback =
    error.message ?? "Edge Function trả lỗi (không có chi tiết).";
  const res = error.context;
  if (!res || typeof res.text !== "function") {
    return { code: "INVOKE", message: fallback };
  }
  let text = "";
  try {
    text = await res.text();
  } catch {
    return { code: "INVOKE", message: fallback };
  }
  if (text) {
    try {
      const body = JSON.parse(text) as unknown;
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        (body as ApiErr).error != null
      ) {
        const e = (body as ApiErr).error!;
        const code = typeof e.code === "string" ? e.code : "SHARE";
        const msg =
          typeof e.message === "string" && e.message.length ? e.message : fallback;
        const message =
          code === "UNAUTHORIZED"
            ? `${msg} Thử đăng xuất và đăng nhập lại.`
            : msg;
        return { code, message };
      }
    } catch {
      const short = text.length > 400 ? `${text.slice(0, 400)}…` : text;
      return { code: "INVOKE", message: short || fallback };
    }
  }
  return { code: "INVOKE", message: fallback };
}

export async function createShareToken(input: {
  result_type: string;
  payload: Record<string, string | undefined>;
}): Promise<
  | { ok: true; token: string; expires_at: string | null }
  | { ok: false; code: string; message: string }
> {
  let accessToken = await getAccessTokenForEdgeInvoke();
  if (!accessToken) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message:
        "Chưa có phiên đăng nhập hợp lệ. Thử đăng xuất và đăng nhập lại.",
    };
  }

  let data:
    | { data: { token: string; expires_at: string | null } }
    | ApiErr
    | null = null;
  let error: unknown = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await supabase.functions.invoke<
      { data: { token: string; expires_at: string | null } } | ApiErr
    >("create-share-token", {
      body: {
        result_type: input.result_type,
        payload: input.payload,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    data = out.data;
    error = out.error;

    if (!error) break;

    if (error instanceof FunctionsHttpError) {
      const parsed = await parseCreateShareHttpError(error);
      if (parsed.code === "UNAUTHORIZED" && attempt === 0) {
        const { data: ref, error: refErr } =
          await supabase.auth.refreshSession();
        if (!refErr && ref.session?.access_token) {
          accessToken = ref.session.access_token;
          continue;
        }
      }
      return { ok: false, code: parsed.code, message: parsed.message };
    }

    return {
      ok: false,
      code: "INVOKE",
      message:
        error instanceof Error
          ? error.message
          : "Không tạo liên kết được.",
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error
  ) {
    const e = data.error;
    return {
      ok: false,
      code: e.code ?? "SHARE",
      message: e.message ?? "Lỗi tạo liên kết.",
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    data.data &&
    typeof (data.data as { token?: string }).token === "string"
  ) {
    const d = data.data as { token: string; expires_at: string | null };
    return { ok: true, token: d.token, expires_at: d.expires_at ?? null };
  }

  return {
    ok: false,
    code: "UNKNOWN",
    message: "Phản hồi tạo liên kết không hợp lệ.",
  };
}

export type ShareResolvePayload = {
  result_type: string;
  payload: Record<string, string>;
  expires_at: string | null;
};

export async function fetchShareResolve(
  token: string,
): Promise<
  | { ok: true; data: ShareResolvePayload }
  | { ok: false; status: number; message: string }
> {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) {
    return { ok: false, status: 500, message: "Thiếu cấu hình Supabase." };
  }

  const url = `${base}/functions/v1/share-resolve?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      status: res.status,
      message: "Không đọc được phản hồi.",
    };
  }

  const rec = body as { data?: ShareResolvePayload; error?: { message?: string } };
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: rec.error?.message ?? "Không tải được thẻ chia sẻ.",
    };
  }

  if (rec.data && typeof rec.data.result_type === "string") {
    return { ok: true, data: rec.data };
  }

  return {
    ok: false,
    status: res.status,
    message: "Dữ liệu thẻ không hợp lệ.",
  };
}
