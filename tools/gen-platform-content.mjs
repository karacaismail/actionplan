#!/usr/bin/env node
/**
 * gen-platform-content — platform düğümlerinin 14 boyutunu yama dosyalarından doldurur (Faz P4-içerik).
 *
 * tools/platform-content/<id>.json yamalarını okur; ilgili düğümün 14 boyutunu status="filled",
 * provenance="swarm" ile yazar. Yamalar paralel ajanlarca üretildi (FastAPI/GraphQL/PostgreSQL bağlamı).
 * Madde sayısını 2-5 aralığına kırpar (kalite kapısı sınırı). Yalnız dimensions alanını yazar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const PATCHES = path.join(ROOT, "tools", "platform-content");
const DIMS = [
  "featureDefs",
  "security",
  "codeOptimization",
  "securityOptimization",
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "eca",
  "aiAgents",
  "testing",
  "owasp",
  "integration",
  "moduleUsage",
];

const files = fs.readdirSync(PATCHES).filter((f) => f.endsWith(".json"));
let applied = 0;
const warns = [];
for (const f of files) {
  const id = f.replace(/\.json$/, "");
  const patch = JSON.parse(fs.readFileSync(path.join(PATCHES, f), "utf8"));
  const np = path.join(NODES, f);
  if (!fs.existsSync(np)) {
    warns.push(`node yok: ${id}`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(np, "utf8"));
  for (const k of DIMS) {
    const p = patch[k];
    if (!p || !Array.isArray(p.items)) {
      warns.push(`${id}.${k} yama eksik`);
      continue;
    }
    const items = p.items
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 5);
    if (items.length < 2) warns.push(`${id}.${k} <2 madde (${items.length})`);
    n.dimensions[k] = {
      key: k,
      title: n.dimensions?.[k]?.title ?? k,
      status: "filled",
      items,
      notes: String(p.notes ?? "").trim(),
      prompt: String(p.prompt ?? "").trim(),
      provenance: "swarm",
      promptVersion: "platform-content-v1",
    };
  }
  fs.writeFileSync(np, `${JSON.stringify(n, null, 2)}\n`);
  applied++;
}
console.log(`[gen-platform-content] ${applied} düğüme 14 boyut uygulandı (provenance=swarm).`);
if (warns.length) {
  console.warn(`UYARILAR (${warns.length}):`);
  for (const w of warns) console.warn(`  - ${w}`);
}
