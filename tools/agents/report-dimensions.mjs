#!/usr/bin/env node
/**
 * report-dimensions — 17-boyut sisteminin tek-komut sayım raporu (salt-okur).
 * Kullanım: node tools/agents/report-dimensions.mjs
 * Ne yapar? Node/boyut/ref/N-A/semantik sayımlarını üretir. Ne yapmaz? Hiçbir dosya yazmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEMANTIC_KEYS,
  SEMANTIC_RULES,
  nodeSemanticFindings,
} from "../lib/dimension-semantics.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));

let c14 = 0;
let c17 = 0;
let other = 0;
let filledCards = 0;
let failCount = 0;
let warnCount = 0;
const warnByKey = {};
const fillByKey = {};
const refCounts = {};
let naRecords = 0;
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
  const dims = n.dimensions ?? {};
  const k = Object.keys(dims).length;
  if (k === 14) c14++;
  else if (k === 17) c17++;
  else other++;
  for (const key of SEMANTIC_KEYS) {
    const d = dims[key];
    if (d && d.status !== "skeleton" && (d.items ?? []).length > 0) {
      filledCards++;
      fillByKey[key] = (fillByKey[key] ?? 0) + 1;
    }
  }
  const r = nodeSemanticFindings(n);
  failCount += r.violations.length;
  warnCount += r.warnings.length;
  for (const w of r.warnings) {
    const key = w.split(".")[1]?.split(":")[0] ?? "?";
    warnByKey[key] = (warnByKey[key] ?? 0) + 1;
  }
  for (const [rk, rv] of Object.entries(n.standardRefs ?? {}))
    if (rv) refCounts[rk] = (refCounts[rk] ?? 0) + 1;
  for (const ap of Object.values(n.applicability ?? {})) if (ap?.applies === false) naRecords++;
}

console.log(`# 17-Boyut Sayım Raporu (${new Date().toISOString().slice(0, 10)})`);
console.log(`Toplam node: ${files.length} | 14-boyut: ${c14} | 17-boyut: ${c17} | diğer: ${other}`);
console.log(
  `Dolu kart: ${filledCards} | Semantik FAIL: ${failCount} | Semantik WARN: ${warnCount}`,
);
console.log(`Açık N/A kaydı: ${naRecords}`);
console.log("\nBoyut doluluk / WARN:");
for (const key of SEMANTIC_KEYS)
  console.log(
    `  ${key.padEnd(22)} dolu=${String(fillByKey[key] ?? 0).padStart(4)} warn=${String(warnByKey[key] ?? 0).padStart(4)} (${SEMANTIC_RULES[key].enforce})`,
  );
console.log("\nstandardRefs dağılımı (dolu):");
for (const [k, c] of Object.entries(refCounts).sort(([, a], [, b]) => b - a))
  console.log(`  ${k.padEnd(24)} ${c}`);
