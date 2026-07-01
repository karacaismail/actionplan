// vitest.config.ts
import path from "node:path";
import { defineConfig } from "file:///sessions/eager-optimistic-volta/mnt/actionplan/node_modules/vitest/dist/config.js";
var __vite_injected_original_dirname = "/sessions/eager-optimistic-volta/mnt/actionplan";
var vitest_config_default = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
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
      exclude: ["**/*.config.*", "tests/**", "tools/**", "dist/**"]
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9lYWdlci1vcHRpbWlzdGljLXZvbHRhL21udC9hY3Rpb25wbGFuXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvZWFnZXItb3B0aW1pc3RpYy12b2x0YS9tbnQvYWN0aW9ucGxhbi92aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9lYWdlci1vcHRpbWlzdGljLXZvbHRhL21udC9hY3Rpb25wbGFuL3ZpdGVzdC5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdC9jb25maWdcIiAvPlxuaW1wb3J0IHBhdGggZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcblxuLy8gVml0ZXN0IGF5clx1MDEzMSB0dXR1bHVyICh2aXRlLmNvbmZpZyBzYWYgdml0ZSBrYWxcdTAxMzFyKSBcdTIwMTQgcmVhY3QgcGx1Z2luIGdlcmVrbWV6LFxuLy8gYlx1MDBGNnlsZWNlIHZpdGVzdCdpbiBrZW5kaSB2aXRlIGtvcHlhc1x1MDEzMXlsYSBQbHVnaW5PcHRpb24gdGlwIFx1MDBFN2FrXHUwMTMxXHUwMTVGbWFzXHUwMTMxIG9sbWF6LlxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6IFwianNkb21cIixcbiAgICBzZXR1cEZpbGVzOiBbXCIuL3Rlc3RzL3NldHVwLnRzXCJdLFxuICAgIGluY2x1ZGU6IFtcInRlc3RzLyoqLyoudGVzdC57dHMsdHN4fVwiLCBcInNyYy8qKi8qLnRlc3Que3RzLHRzeH1cIl0sXG4gICAgLy8gdGVzdHMvY29udGVudC8qKiBBWVJJIGNvbmZpZyBpbGUga29cdTAxNUZhciAodml0ZXN0LmNvbnRlbnQuY29uZmlnLnRzICsgYG5wbSBydW4gdGVzdDpjb250ZW50YCkuXG4gICAgLy8gRmF6IEYyIFRBTUFNOiBpXHUwMEU3ZXJpayBrYXBcdTAxMzFzXHUwMTMxIENJJ2RhIEFZUkkgYmxva2xheVx1MDEzMWNcdTAxMzEgYWRcdTAxMzFtIG9sYXJhayBrb1x1MDE1RmFyIChkZXBsb3kueW1sOiBub2RlIGNoZWNrZXIgKyB0ZXN0OmNvbnRlbnQpLlxuICAgIC8vIGBucG0gdGVzdGAndGVuIGhhcmlcdTAwRTcgdHV0dWx1ciBcdTAwRTdcdTAwRkNua1x1MDBGQyBrZW5kaSBjb25maWcnaSAobm9kZSBlbnZpcm9ubWVudCkgdmUga2VuZGkgQ0kgYWRcdTAxMzFtXHUwMTMxIHZhci5cbiAgICBleGNsdWRlOiBbXCJ0ZXN0cy9lMmUvKipcIiwgXCJ0ZXN0cy9jb250ZW50LyoqXCIsIFwibm9kZV9tb2R1bGVzLyoqXCJdLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBwcm92aWRlcjogXCJ2OFwiLFxuICAgICAgcmVwb3J0c0RpcmVjdG9yeTogXCIuL2NvdmVyYWdlXCIsXG4gICAgICBleGNsdWRlOiBbXCIqKi8qLmNvbmZpZy4qXCIsIFwidGVzdHMvKipcIiwgXCJ0b29scy8qKlwiLCBcImRpc3QvKipcIl0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUY3QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDcEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMsa0JBQWtCO0FBQUEsSUFDL0IsU0FBUyxDQUFDLDRCQUE0Qix3QkFBd0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUk5RCxTQUFTLENBQUMsZ0JBQWdCLG9CQUFvQixpQkFBaUI7QUFBQSxJQUMvRCxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixrQkFBa0I7QUFBQSxNQUNsQixTQUFTLENBQUMsaUJBQWlCLFlBQVksWUFBWSxTQUFTO0FBQUEsSUFDOUQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
