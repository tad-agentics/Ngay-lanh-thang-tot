import { supabase } from "~/lib/supabase";

type ApiErr = { error?: { code?: string; message?: string } };

export async function createShareToken(input: {
  result_type: string;
  payload: Record<string, string | undefined>;
}): Promise<
  | { ok: true; token: string; expires_at: string | null }
  | { ok: false; code: string; message: string }
> {
  const { data, error } = await supabase.functions.invoke<
    { data: { token: string; expires_at: string | null } } | ApiErr
  >("create-share-token", {
    body: {
      result_type: input.result_type,
      payload: input.payload,
    },
  });

  if (error) {
    return {
      ok: false,
      code: "INVOKE",
      message: error.message ?? "Không tạo liên kết được.",
    };
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
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
