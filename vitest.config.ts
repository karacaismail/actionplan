/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig } from "vitest/config";

// Vitest ayrı tutulur (vite.config saf vite kalır) — react plugin gerekmez,
// böylece vitest'in kendi vite kopyasıyla PluginOption tip çakışması olmaz.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    // tests/content/** AYRI config ile koşar (vitest.content.config.ts + `npm run test:content`).
    // Faz F2 TAMAM: içerik kapısı CI'da AYRI bloklayıcı adım olarak koşar (deploy.yml: node checker + test:content).
    // `npm test`'ten hariç tutulur çünkü kendi config'i (node environment) ve kendi CI adımı var.
    exclude: ["tests/e2e/**", "tests/content/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      exclude: ["**/*.config.*", "tests/**", "tools/**", "dist/**"],
    },
  },
});
