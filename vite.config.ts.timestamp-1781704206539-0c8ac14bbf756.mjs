import "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import.meta.url;
var vite_config_default = defineConfig({
	base: process.env.BASE_PATH ?? "/",
	plugins: [react()],
	resolve: { alias: { "@": path.resolve("/sessions/sharp-funny-carson/mnt/mimari/actionplan", "src") } },
	build: {
		outDir: "dist",
		sourcemap: false,
		chunkSizeWarningLimit: 900
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
			exclude: [
				"**/*.config.*",
				"tests/**",
				"tools/**",
				"dist/**"
			]
		}
	}
});
//#endregion
export { vite_config_default as default };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZS5jb25maWcuanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiL3Nlc3Npb25zL3NoYXJwLWZ1bm55LWNhcnNvbi9tbnQvbWltYXJpL2FjdGlvbnBsYW4vdml0ZS5jb25maWcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHBhdGggZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcblxuLy8gR2l0SHViIFBhZ2VzIGFsdC15b2w6IGh0dHBzOi8va2FyYWNhaXNtYWlsLmdpdGh1Yi5pby9hY3Rpb25wbGFuL1xuLy8gWWVyZWwgZ2VsacWfdGlybWVkZSBcIi9cIiBrdWxsYW7EsWzEsXI7IENJJ2RhIEJBU0VfUEFUSD1cIi9hY3Rpb25wbGFuL1wiIHZlcmlsaXIuXG5jb25zdCBiYXNlID0gcHJvY2Vzcy5lbnYuQkFTRV9QQVRIID8/IFwiL1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlLFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogOTAwLFxuICB9LFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICAgIHNldHVwRmlsZXM6IFtcIi4vdGVzdHMvc2V0dXAudHNcIl0sXG4gICAgaW5jbHVkZTogW1widGVzdHMvKiovKi50ZXN0Lnt0cyx0c3h9XCIsIFwic3JjLyoqLyoudGVzdC57dHMsdHN4fVwiXSxcbiAgICBleGNsdWRlOiBbXCJ0ZXN0cy9lMmUvKipcIiwgXCJub2RlX21vZHVsZXMvKipcIl0sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiBcInY4XCIsXG4gICAgICByZXBvcnRzRGlyZWN0b3J5OiBcIi4vY292ZXJhZ2VcIixcbiAgICAgIGV4Y2x1ZGU6IFtcIioqLyouY29uZmlnLipcIiwgXCJ0ZXN0cy8qKlwiLCBcInRvb2xzLyoqXCIsIFwiZGlzdC8qKlwiXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7O0FBU0EsSUFBQSxzQkFBZSxhQUFhO0NBQzFCLE1BSFcsUUFBUSxJQUFJLGFBQWE7Q0FJcEMsU0FBUyxDQUFDLE1BQU0sQ0FBQztDQUNqQixTQUFTLEVBQ1AsT0FBTyxFQUNMLEtBQUssS0FBSyxRQUFBLHNEQUFtQixLQUFLLEVBQ3BDLEVBQ0Y7Q0FDQSxPQUFPO0VBQ0wsUUFBUTtFQUNSLFdBQVc7RUFDWCx1QkFBdUI7Q0FDekI7Q0FDQSxNQUFNO0VBQ0osU0FBUztFQUNULGFBQWE7RUFDYixZQUFZLENBQUMsa0JBQWtCO0VBQy9CLFNBQVMsQ0FBQyw0QkFBNEIsd0JBQXdCO0VBQzlELFNBQVMsQ0FBQyxnQkFBZ0IsaUJBQWlCO0VBQzNDLFVBQVU7R0FDUixVQUFVO0dBQ1Ysa0JBQWtCO0dBQ2xCLFNBQVM7SUFBQztJQUFpQjtJQUFZO0lBQVk7R0FBUztFQUM5RDtDQUNGO0FBQ0YsQ0FBQyJ9