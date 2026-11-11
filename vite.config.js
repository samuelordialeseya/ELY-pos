import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 5180,
    strictPort: false,
    host: true
  },
  preview: {
    port: 5180,
    strictPort: false,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase") || id.includes("@firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("@phosphor-icons")) {
              return "vendor-icons";
            }
            if (id.includes("html2canvas")) {
              return "vendor-canvas";
            }
            if (id.includes("driver.js")) {
              return "vendor-tour";
            }
            if (id.includes("react") || id.includes("scheduler")) {
              return "vendor-react";
            }
          }
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: "ELY.pos — Retail Platform",
        short_name: "ELY.pos",
        description: "Fast, touch-first POS for fresh produce & small retail",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
