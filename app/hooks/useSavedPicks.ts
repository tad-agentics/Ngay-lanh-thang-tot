import { useCallback, useEffect, useState } from "react";
import type { Json } from "~/lib/database.types";
import { supabase } from "~/lib/supabase";

export interface SavedPick {
  id: string;
  saved_at: string;
  source_endpoint: string;
  payload: unknown;
  label: string | null;
  day_iso: string | null;
  score: number | null;
}

interface UseSavedPicksReturn {
  picks: SavedPick[];
  loading: boolean;
  error: string | null;
  savePick: (args: {
    source_endpoint: string;
    payload: unknown;
    label?: string;
    day_iso?: string;
    score?: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  deletePick: (id: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => void;
}

export function useSavedPicks(): UseSavedPicksReturn {
  const [picks, setPicks] = useState<SavedPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const { data, error: err } = await supabase
        .from("saved_picks")
        .select("id, saved_at, source_endpoint, payload, label, day_iso, score")
        .order("saved_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setPicks((data as SavedPick[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [rev]);

  const savePick = useCallback(async ({
    source_endpoint,
    payload,
    label,
    day_iso,
    score,
  }: {
    source_endpoint: string;
    payload: unknown;
    label?: string;
    day_iso?: string;
    score?: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Chưa đăng nhập." };
    const { error: err } = await supabase
      .from("saved_picks")
      .insert({
        user_id: user.id,
        source_endpoint,
        payload: payload as unknown as Json,
        label: label ?? null,
        day_iso: day_iso ?? null,
        score: score ?? null,
      });
    if (err) return { ok: false, error: err.message };
    setRev((r) => r + 1);
    return { ok: true };
  }, []);

  const deletePick = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from("saved_picks")
      .delete()
      .eq("id", id);
    if (err) return { ok: false, error: err.message };
    setRev((r) => r + 1);
    return { ok: true };
  }, []);

  const refresh = useCallback(() => setRev((r) => r + 1), []);

  return { picks, loading, error, savePick, deletePick, refresh };
}
