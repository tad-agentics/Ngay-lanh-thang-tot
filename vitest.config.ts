import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/** App unit tests only — Edge/Deno tests live under `supabase/functions/` (run with `deno test`). */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
