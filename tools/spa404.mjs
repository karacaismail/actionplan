#!/usr/bin/env node
// GitHub Pages SPA derin-URL fallback: dist/index.html -> dist/404.html
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve(process.cwd(), "dist");
const src = path.join(dist, "index.html");
const dst = path.join(dist, "404.html");
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  console.log("[spa404] dist/404.html oluşturuldu.");
} else {
  console.warn("[spa404] dist/index.html yok, atlandı.");
}
