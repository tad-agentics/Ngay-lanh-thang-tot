import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("motion")) return "motion";
          if (id.includes("lucide-react")) return "lucide";
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      /** Allow intentional precache size cap; runtimeCaching still caches /assets after first load. */
      showMaximumFileSizeToCacheInBytesWarning: true,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        /** Skip large hashed bundles in precache; they load on demand and enter runtime cache below. */
        maximumFileSizeToCacheInBytes: 160 * 1024,
        /** Match React Router SPA shell (not prerendered `/` landing in index.html). */
        navigateFallback: "/__spa-fallback.html",
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/icons\//,
          /^\/fonts\//,
          /^\/screenshots\//,
          /^\/manifest\.json$/,
          /^\/robots\.txt$/,
          /^\/sitemap\.xml$/,
          /^\/sw\.js$/,
          /\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2|json)$/i,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/assets/") &&
              /\.(?:js|css)$/i.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets",
              expiration: {
                maxEntries: 96,
                maxAgeSeconds: 60 * 60 * 24 * 35,
              },
            },
          },
        ],
      },
    }),
  ],
});
