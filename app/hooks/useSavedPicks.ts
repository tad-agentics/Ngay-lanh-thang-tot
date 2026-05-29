import {
  type SavedPick,
  useOptionalSavedPicks,
  useSavedPicksContext,
} from "~/lib/saved-picks-context";

export type { SavedPick };

type UseSavedPicksReturn = ReturnType<typeof useSavedPicksContext>;

const noopAsync = async () => ({ ok: false as const, error: "Chưa đăng nhập." });

const loggedOutFallback: UseSavedPicksReturn = {
  picks: [],
  loading: false,
  error: null,
  savePick: noopAsync,
  updatePick: noopAsync,
  deletePick: noopAsync,
  refresh: () => {},
};

/** Shared saved-picks state — requires `SavedPicksProvider` when logged in. */
export function useSavedPicks(): UseSavedPicksReturn {
  const ctx = useOptionalSavedPicks();
  return ctx ?? loggedOutFallback;
}
