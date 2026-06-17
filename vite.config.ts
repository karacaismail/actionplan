import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// GitHub Pages alt-yol: https://karacaismail.github.io/actionplan/
// Yerel geliştirmede "/" kullanılır; CI'da BASE_PATH="/actionplan/" verilir.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Ağır kütüphaneleri ayrı, önbelleklenebilir parçalara böl.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("echarts") || id.includes("zrender")) return "echarts";
          if (id.includes("@xyflow") || id.includes("elkjs")) return "graph";
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler"))
            return "react-vendor";
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      exclude: ["**/*.config.*", "tests/**", "tools/**", "dist/**"],
    },
  },
});
