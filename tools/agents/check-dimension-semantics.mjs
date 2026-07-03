#!/usr/bin/env node
/**
 * check-dimension-semantics (17-boyut sözleşmesi — dimension-contract-17.md).
 * Ne yapar? 17 boyutun DOLU kartlarını must+anyOf sözleşmesine karşı denetler.
 *   - FAIL kademesi (day-2: dataLifecycle/observability/reliability): ihlal = KIRMIZI.
 *   - WARN kademesi (miras 14): ihlal sayılır ve raporlanır, BLOKLAMAZ (ratchet).
 *     Gerekçe: mevcut zengin içerik domain diliyle yazılmış; FAIL'e çevirme kararı
 *     içerik-iyileştirme swarm turuyla birlikte insanındır.
 * Ne yapmaz? Boş/iskelet kartı zorlamaz (lazy migration).
 * Kural kaynağı TEK: tools/lib/dimension-semantics.mjs (vitest aynısını import eder).
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
const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));

const violations = [];
const warnings = [];
const warnByKey = {};
let filledCount = 0;
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(nodesDir, f), "utf8"));
  for (const key of SEMANTIC_KEYS) {
    const dim = n.dimensions?.[key];
    if (dim && dim.status !== "skeleton" && (dim.items ?? []).length > 0) filledCount++;
  }
  const r = nodeSemanticFindings(n);
  violations.push(...r.violations);
  for (const w of r.warnings) {
    warnings.push(w);
    const key = w.split(".")[1]?.split(":")[0] ?? "?";
    warnByKey[key] = (warnByKey[key] ?? 0) + 1;
  }
}

const failKeys = SEMANTIC_KEYS.filter((k) => SEMANTIC_RULES[k].enforce === "fail");
console.log(
  `Semantik boyut kapısı — ${files.length} düğüm; ${filledCount} dolu kart denetlendi (17 boyut).`,
);
console.log(`FAIL kademesi (${failKeys.join(", ")}): ${violations.length} ihlal.`);
const warnDist = warnings.length ? ` Boyut dağılımı: ${JSON.stringify(warnByKey)}` : "";
console.log(`WARN kademesi (miras 14 — ratchet, bloklamaz): ${warnings.length} uyarı.${warnDist}`);
if (violations.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${violations.length} ihlal`);
for (const m of violations.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
