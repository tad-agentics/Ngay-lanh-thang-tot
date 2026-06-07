/** Wall-clock budget luận giải — stay under Supabase Edge ~60s limit. */
export const GENERATE_READING_EDGE_BUDGET_MS = 52_000;

/** @deprecated Use `GENERATE_READING_EDGE_BUDGET_MS`. */
export const TIEU_VAN_EDGE_BUDGET_MS = GENERATE_READING_EDGE_BUDGET_MS;

/** Per-call ceiling passed to `llmCompletion` (clamped by remaining budget). */
export const TIEU_VAN_JSON_CALL_TIMEOUT_MS = 28_000;
export const TIEU_VAN_PROSE_CALL_TIMEOUT_MS = 22_000;

const HANDLER_RESERVE_MS = 800;

export type EdgeBudget = {
  elapsed(): number;
  remaining(): number;
  /** Enough budget for another LLM round-trip plus handler reserve. */
  canSpend(minMs: number): boolean;
  /** `defaultMs` capped to time left before reserve. */
  callTimeout(defaultMs: number): number;
};

export function createEdgeBudget(budgetMs: number): EdgeBudget {
  const started = Date.now();
  return {
    elapsed() {
      return Date.now() - started;
    },
    remaining() {
      return Math.max(0, budgetMs - (Date.now() - started));
    },
    canSpend(minMs: number) {
      return Date.now() - started + minMs + HANDLER_RESERVE_MS <= budgetMs;
    },
    callTimeout(defaultMs: number) {
      const left = Math.max(0, budgetMs - (Date.now() - started) - HANDLER_RESERVE_MS);
      return Math.min(defaultMs, Math.max(3_000, left));
    },
  };
}
