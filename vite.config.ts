import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// PWA — uncomment ONE of these after evaluating during /init:
// Option A: vite-plugin-pwa (Workbox — more battle-tested for Vite)
// import { VitePWA } from "vite-plugin-pwa";
// Option B: @serwist/vite (if Serwist Vite plugin is mature enough at build time)
// import { serwist } from "@serwist/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),

    // PWA plugin goes here — configured during /init based on evaluation
    // VitePWA({
    //   registerType: "autoUpdate",
    //   manifest: false, // Use static public/manifest.json
    //   workbox: {
    //     globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    //     navigateFallback: "/index.html",
    //     navigateFallbackAllowlist: [/^\/app/],
    //   },
    // }),
  ],
});
