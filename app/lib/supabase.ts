import { createClient } from "@supabase/supabase-js";

import type { Database } from "~/lib/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// During SSR prerender at build time the env vars may not be present.
// We create the client with placeholder values in that case — the client
// is never actually called during prerender (all data fetching is client-side).
const _url = supabaseUrl ?? "https://placeholder.supabase.co";
const _key = supabaseKey ?? "placeholder";

if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== "undefined") {
    // Only throw at runtime in the browser where the client is actually used.
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — check .env.local",
    );
  }
  // SSR/prerender: warn but don't throw — all Supabase calls are client-side.
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY not set (SSR build context — safe to ignore).",
  );
}

export const supabase = createClient<Database>(_url, _key, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
  },
});
