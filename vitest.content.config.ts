/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * İçerik kalite kapısı için AYRI vitest config (Faz A2).
 * Yalnız tests/content/** koşar. Ana `npm test` bu klasörü hariç tutar (vitest.config.ts),
 * böylece içerik doldurulurken (Küme B) yayın hattı yeşil kalır.
 * `npm run test:content` ile çalıştırılır; Faz F2'de ana CI'ya bloklayıcı eklenir.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/content/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "tests/e2e/**"],
  },
});
