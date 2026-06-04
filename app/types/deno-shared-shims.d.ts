/**
 * Type shims for Deno-runtime `supabase/functions/_shared/*` modules that are
 * imported by Vitest unit tests (shared validation logic). These declarations
 * only affect `tsc` typechecking — the real types are resolved by `deno check`.
 * App/browser code must never rely on `Deno` or `https://esm.sh/*` imports.
 */
declare const Deno: {
  env: { get(key: string): string | undefined };
};

declare module "https://esm.sh/@supabase/supabase-js@2.49.1" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type SupabaseClient<T = any> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createClient: any;
}

declare module "https://esm.sh/*";
