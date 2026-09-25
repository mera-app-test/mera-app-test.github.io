/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

// Okruženje builda postavlja CI (MERA_ENV = "prod" | "test"). Lokalno: "dev".
const allowedEnvs = ["prod", "test", "dev"] as const;
type MeraEnv = (typeof allowedEnvs)[number];
const rawEnv = process.env.MERA_ENV ?? "dev";
if (!allowedEnvs.includes(rawEnv as MeraEnv)) {
  throw new Error(`Nepoznat MERA_ENV: "${rawEnv}". Dozvoljeno: ${allowedEnvs.join(", ")}`);
}
const meraEnv = rawEnv as MeraEnv;

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};
const buildSha = (process.env.GITHUB_SHA ?? "local").slice(0, 7);
const builtAt = new Date().toISOString();

export default defineConfig({
  // Organizacijski Pages sajt je u korenu domena (https://<org>.github.io/), zato base = "/".
  base: "/",
  define: {
    __MERA_ENV__: JSON.stringify(meraEnv),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(buildSha),
    __BUILT_AT__: JSON.stringify(builtAt),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: meraEnv === "test" ? "Mera TEST" : "Mera",
        short_name: meraEnv === "test" ? "Mera TEST" : "Mera",
        description: "Plan ishrane prema tvom cilju",
        lang: "sr-Latn",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F2F5F3",
        theme_color: meraEnv === "test" ? "#8A5A12" : "#1F4A40",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        // Prototip izgleda nije deo aplikacije: service worker ga ne sme zameniti glavnim ekranom.
        navigateFallbackDenylist: [/^\/prototip\.html/],
        // Vlasnik otvara linkove sa ?v=… (zaobilaženje keša); parametar ne sme da menja koji se fajl služi.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
      },
    }),
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
