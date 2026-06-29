#!/usr/bin/env node
/**
 * check-standards-coverage (ADR-0027 — BLOKLAYICI). Düğüm `standardRefs` referans BÜTÜNLÜĞÜ:
 * her set edilen ref gerçek bir standarda (src/data/standards/<id>.json) ya da
 * techProfileRef için tech-profile id'sine çözülmeli. Boş ref serbest (lazy). Kapsam raporlanır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);
const rj = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const stdDir = path.join(ROOT, "src", "data", "standards");
const standardIds = new Set(
  fs
    .readdirSync(stdDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, "")),
);
const techIds = new Set(
  rj(path.join(ROOT, "src", "data", "tech-profiles.json")).profiles.map((p) => p.id),
);

const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));
let withRef = 0;
let refCount = 0;
for (const f of files) {
  const n = rj(path.join(nodesDir, f));
  const sr = n.standardRefs || {};
  let has = false;
  for (const [k, val] of Object.entries(sr)) {
    if (!val) continue;
    has = true;
    refCount++;
    const pool = k === "techProfileRef" ? techIds : standardIds;
    if (!pool.has(val)) fail(`${n.id}: standardRefs.${k} "${val}" çözülemiyor`);
  }
  if (has) withRef++;
}

console.log(
  `Standart kapsamı — ${standardIds.size} standart, ${techIds.size} tech-profile; ${withRef}/${files.length} düğümde ≥1 ref (${refCount} ref).`,
);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓ (referans bütünlüğü tam)");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} dangling ref`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
