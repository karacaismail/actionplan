#!/usr/bin/env node
// GitHub Pages SPA derin-URL fallback: dist/index.html -> dist/404.html
// Ayrıca sık paylaşılan statik rota dizinlerini 200 dönecek şekilde hazırla.
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve(process.cwd(), "dist");
const src = path.join(dist, "index.html");
const dst = path.join(dist, "404.html");
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  console.log("[spa404] dist/404.html oluşturuldu.");

  const docsDir = path.resolve(process.cwd(), "docs");
  const docRoutes = fs.existsSync(docsDir)
    ? fs
        .readdirSync(docsDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => `docs/${path.basename(name, ".md")}`)
    : [];
  const staticRoutes = Array.from(new Set(["docs", ...docRoutes]));

  for (const route of staticRoutes) {
    const routeDir = path.join(dist, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(src, path.join(routeDir, "index.html"));
  }
  console.log(`[spa404] ${staticRoutes.length} statik rota index'i oluşturuldu.`);
} else {
  console.warn("[spa404] dist/index.html yok, atlandı.");
}
