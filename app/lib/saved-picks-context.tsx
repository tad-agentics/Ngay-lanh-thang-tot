import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { TuTruIntent } from "~/lib/api-types";
import type { Json } from "~/lib/database.types";
import type { SavedPickSource } from "~/lib/saved-pick-mark";
import { supabase } from "~/lib/supabase";

export interface SavedPick {
  id: string;
  saved_at: string;
  source_endpoint: string;
  payload: unknown;
  label: string | null;
  day_iso: string | null;
  score: number | string | null;
  intent: TuTruIntent | string | null;
  note: string | null;
  source: SavedPickSource | string | null;
}

type SavePickArgs = {
  source_endpoint: string;
  payload: unknown;
  label: string;
  day_iso?: string;
  score?: number;
  intent?: TuTruIntent | null;
  note?: string | null;
  source?: SavedPickSource;
};

type UpdatePickArgs = {
  label: string;
  intent?: TuTruIntent | null;
  note?: string | null;
  source?: SavedPickSource;
};

type SavedPicksContextValue = {
  picks: SavedPick[];
  loading: boolean;
  error: string | null;
  savePick: (args: SavePickArgs) => Promise<{ ok: boolean; error?: string }>;
  updatePick: (
    id: string,
    args: UpdatePickArgs,
  ) => Promise<{ ok: boolean; error?: string }>;
  deletePick: (id: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => void;
};

const SavedPicksContext = createContext<SavedPicksContextValue | null>(null);

const PICK_COLUMNS =
  "id, saved_at, source_endpoint, payload, label, day_iso, score, intent, note, source";

export function SavedPicksProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [picks, setPicks] = useState<SavedPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  const loadSeqRef = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("saved_picks")
      .select(PICK_COLUMNS)
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .limit(200);
    if (seq !== loadSeqRef.current) return;
    if (err) {
      setError(err.message);
      setPicks([]);
      setLoading(false);
      return;
    }
    setPicks((data as SavedPick[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load, rev]);

  useEffect(() => {
    const onRefresh = () => setRev((r) => r + 1);
    window.addEventListener("ngaytot:saved-picks-changed", onRefresh);
    return () => window.removeEventListener("ngaytot:saved-picks-changed", onRefresh);
  }, []);

  const notifyChanged = useCallback(() => {
    setRev((r) => r + 1);
    window.dispatchEvent(new Event("ngaytot:saved-picks-changed"));
  }, []);

  const savePick = useCallback(
    async ({
      source_endpoint,
      payload,
      label,
      day_iso,
      score,
      intent,
      note,
      source,
    }: SavePickArgs) => {
      const dayKey = day_iso?.slice(0, 10);
      if (dayKey) {
        const { error: dedupeErr } = await supabase
          .from("saved_picks")
          .delete()
          .eq("user_id", userId)
          .eq("day_iso", dayKey);
        if (dedupeErr) return { ok: false, error: dedupeErr.message };
      }

      const { error: err } = await supabase.from("saved_picks").insert({
        user_id: userId,
        source_endpoint,
        payload: payload as unknown as Json,
        label: label.trim(),
        day_iso: dayKey ?? null,
        score: score ?? null,
        intent: intent ?? null,
        note: note?.trim() || null,
        source: source ?? null,
      });
      if (err) return { ok: false, error: err.message };
      notifyChanged();
      return { ok: true };
    },
    [notifyChanged, userId],
  );

  const updatePick = useCallback(
    async (id: string, { label, intent, note, source }: UpdatePickArgs) => {
      const patch: {
        label: string;
        intent: TuTruIntent | null;
        note: string | null;
        source?: SavedPickSource;
      } = {
        label: label.trim(),
        intent: intent ?? null,
        note: note?.trim() || null,
      };
      if (source !== undefined) patch.source = source;

      const { error: err } = await supabase
        .from("saved_picks")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId);
      if (err) return { ok: false, error: err.message };
      notifyChanged();
      return { ok: true };
    },
    [notifyChanged, userId],
  );

  const deletePick = useCallback(
    async (id: string) => {
      const { error: err } = await supabase
        .from("saved_picks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (err) return { ok: false, error: err.message };
      notifyChanged();
      return { ok: true };
    },
    [notifyChanged, userId],
  );

  const refresh = useCallback(() => notifyChanged(), [notifyChanged]);

  const value = useMemo(
    () => ({ picks, loading, error, savePick, updatePick, deletePick, refresh }),
    [picks, loading, error, savePick, updatePick, deletePick, refresh],
  );

  return (
    <SavedPicksContext.Provider value={value}>{children}</SavedPicksContext.Provider>
  );
}

export function useSavedPicksContext(): SavedPicksContextValue {
  const ctx = useContext(SavedPicksContext);
  if (!ctx) {
    throw new Error("useSavedPicks must be used within SavedPicksProvider");
  }
  return ctx;
}

/** Optional hook for screens that work logged-out (e.g. day detail teaser). */
export function useOptionalSavedPicks(): SavedPicksContextValue | null {
  return useContext(SavedPicksContext);
}
