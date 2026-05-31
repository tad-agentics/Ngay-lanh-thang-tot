import type { ThreadTurn } from "./thread-history.ts";

export type LaSoChiTietSection = { id: string; title: string; text: string };

export type GenerateContext = {
  req: Request;
  endpoint: string;
  data: unknown;
  question: string;
  variant: "" | "inline" | "teaser";
  preview: boolean;
  /** `la-so-chi-tiet` — chỉ sinh §02 (supplement khi full bundle thiếu traits). */
  onlyTinhCach: boolean;
  /** `luu-nien` — chỉ sinh §03 life_areas. */
  onlyLuuNienLife: boolean;
  /** `luu-nien` — chỉ sinh §05 core (`luu_nien_ung_xu`, …). */
  onlyLuuNienCore: boolean;
  promptBody: Record<string, unknown>;
  payload: string;
  cacheKey: string;
  admin: ReturnType<
    typeof import("https://esm.sh/@supabase/supabase-js@2.49.1").createClient
  > | null;
  now: number;
  /** day-detail follow-up: anchor luận giải (full turn). */
  anchorReading: string;
  /** day-detail follow-up: prior user/assistant turns (max 8 messages). */
  threadHistory: ThreadTurn[];
};

export type GenerateResult = {
  reading: string | null;
  sections?: LaSoChiTietSection[] | null;
  dayReadings?: Record<string, string> | null;
};

export type GenerateReadingFn = (ctx: GenerateContext) => Promise<GenerateResult>;
