#!/usr/bin/env node
/**
 * check-dimension-applicability (ADR-0027 — BLOKLAYICI). Bir boyut bu düğüme uygulanmıyorsa
 * (applies=false) GEREKÇE zorunlu; ayrıca anahtar geçerli bir boyut anahtarı olmalı.
 * Boş applicability serbest (tüm boyutlar uygulanır varsayılır). Jenerik dolgu yerine N/A disiplini.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIMENSION_KEYS = new Set([
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
]);
const v = [];
const fail = (m) => v.push(m);

const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));
let naCount = 0;
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(nodesDir, f), "utf8"));
  const ap = n.applicability || {};
  for (const [key, val] of Object.entries(ap)) {
    if (!DIMENSION_KEYS.has(key)) fail(`${n.id}: applicability geçersiz boyut anahtarı "${key}"`);
    if (val && val.applies === false) {
      naCount++;
      if (!val.reason || !String(val.reason).trim())
        fail(`${n.id}: applicability "${key}" applies=false ama gerekçe (reason) yok`);
    }
  }
}

console.log(`Boyut uygulanabilirliği — ${files.length} düğüm; ${naCount} N/A işareti (gerekçeli).`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
