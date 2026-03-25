/**
 * Minimal HTML with Open Graph tags for crawlers (Zalo, Facebook, etc.).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://ngaylanhthangtot.vn").replace(
    /\/$/,
    "",
  );

  if (!supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const url = new URL(req.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  if (!token || token.length > 64 || !/^[a-f0-9]+$/i.test(token)) {
    return new Response("Bad token", { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: row, error } = await admin
    .from("share_tokens")
    .select("payload, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("share-og", error);
    return new Response("Database error", { status: 500 });
  }

  let title = "Ngày Lành Tháng Tốt";
  let desc =
    "Xem gợi ý ngày tốt theo Bát Tự — dùng thử miễn phí.";

  if (row) {
    const exp = row.expires_at as string | null;
    if (exp && new Date(exp) < new Date()) {
      title = "Liên kết đã hết hạn";
      desc = "Tạo thẻ chia sẻ mới trong ứng dụng Ngày Lành Tháng Tốt.";
    } else {
      const raw = row.payload as Record<string, unknown> | null;
      if (raw && typeof raw.headline === "string" && raw.headline.trim()) {
        title = raw.headline.trim().slice(0, 120);
      }
      if (raw && typeof raw.summary === "string" && raw.summary.trim()) {
        desc = raw.summary.trim().slice(0, 300);
      } else if (
        raw &&
        typeof raw.reason_short === "string" &&
        raw.reason_short.trim()
      ) {
        desc = raw.reason_short.trim().slice(0, 300);
      }
    }
  } else {
    title = "Không tìm thấy";
    desc = "Liên kết không tồn tại hoặc đã bị gỡ.";
  }

  const pagePath = `/x/${token}`;
  const canonical = `${siteUrl}${pagePath}`;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(desc)}" />
  <meta property="og:url" content="${escHtml(canonical)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${escHtml(desc)}" />
  <link rel="canonical" href="${escHtml(canonical)}" />
</head>
<body>
  <p><a href="${escHtml(canonical)}">${escHtml(title)}</a></p>
  <p>${escHtml(desc)}</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
