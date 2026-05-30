import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/** App unit tests only — Edge/Deno tests live under `supabase/functions/` (run with `deno test`). */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.ts"],
  },
});
