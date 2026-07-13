#!/usr/bin/env node
// GitHub Pages SPA derin-URL fallback: dist/index.html -> dist/404.html
// Ayrıca sık paylaşılan statik rota dizinlerini 200 dönecek şekilde hazırla.
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve(process.cwd(), "dist");
const src = path.join(dist, "index.html");
const dst = path.join(dist, "404.html");

function markdownRoutes(root, current = root) {
  const routes = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) routes.push(...markdownRoutes(root, absolute));
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const relative = path.relative(root, absolute).slice(0, -3);
      routes.push(`docs/${relative.split(path.sep).join("--")}`);
    }
  }
  return routes;
}

const TASK_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function taskRoutes(nodeDir) {
  if (!fs.existsSync(nodeDir)) return [];

  const routes = [];
  const seen = new Set();
  for (const file of fs
    .readdirSync(nodeDir)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const node = JSON.parse(fs.readFileSync(path.join(nodeDir, file), "utf8"));
    const id = node?.id;
    if (typeof id !== "string" || !TASK_ID.test(id))
      throw new Error(`[spa404] geçersiz task id: ${file} -> ${JSON.stringify(id)}`);
    if (seen.has(id)) throw new Error(`[spa404] duplicate task id: ${id}`);
    seen.add(id);
    routes.push(`task/${id}`);
  }
  return routes;
}

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  console.log("[spa404] dist/404.html oluşturuldu.");

  const docsDir = path.resolve(process.cwd(), "docs");
  const docRoutes = fs.existsSync(docsDir) ? markdownRoutes(docsDir) : [];
  const nodeDir = path.resolve(process.cwd(), "src/data/generated/nodes");
  const staticRoutes = Array.from(new Set(["docs", ...docRoutes, ...taskRoutes(nodeDir)]));

  for (const route of staticRoutes) {
    const routeDir = path.join(dist, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(src, path.join(routeDir, "index.html"));
  }
  console.log(`[spa404] ${staticRoutes.length} statik rota index'i oluşturuldu.`);
} else {
  console.warn("[spa404] dist/index.html yok, atlandı.");
}
