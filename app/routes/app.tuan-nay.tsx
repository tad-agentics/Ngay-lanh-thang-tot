import { useEffect, useState } from "react";
import { Link } from "react-router";

import { ErrorBanner } from "~/components/ErrorBanner";
import { invokeBatTu } from "~/lib/bat-tu";

export default function AppTuanNay() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await invokeBatTu({ op: "weekly-summary", body: {} });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      setPayload(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-svh bg-background px-4 py-10 max-w-lg mx-auto space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link to="/app" className="underline-offset-4 hover:underline">
            ← Trang chủ app
          </Link>
        </p>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-lora)]">
          Tuần này
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tóm tắt tuần từ Bát Tự (Wave 2 — UI đầy đủ sau).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : err ? (
        <ErrorBanner message={err} />
      ) : (
        <pre className="text-xs bg-card border border-border rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </main>
  );
}
