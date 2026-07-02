#!/usr/bin/env node
/**
 * check-dimension-semantics (gap-2026-07-02-06 tur 2 — BLOKLAYICI).
 * Ne yapar? dataLifecycle/observability/reliability boyutu DOLU olan her düğümde
 * zorunlu kavram ailelerini arar (retention, SLO, idempotency...). Biçim kapısı
 * (check-content) "2-5 madde" der; bu kapı "madde KONUYU kapsıyor mu" der.
 * Ne yapmaz? Boş/iskelet boyutu zorlamaz (lazy migration korunur); miras 14 boyuta bakmaz.
 * Kural kaynağı TEK: tools/lib/dimension-semantics.mjs (vitest de aynısını import eder).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEMANTIC_KEYS, nodeSemanticViolations } from "../lib/dimension-semantics.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));

const violations = [];
let filledCount = 0;
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(nodesDir, f), "utf8"));
  for (const key of SEMANTIC_KEYS) {
    const dim = n.dimensions?.[key];
    if (dim && dim.status !== "skeleton" && (dim.items ?? []).length > 0) filledCount++;
  }
  violations.push(...nodeSemanticViolations(n));
}

console.log(
  `Semantik boyut kapısı — ${files.length} düğüm; ${filledCount} dolu yeni-boyut kartı denetlendi.`,
);
if (violations.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${violations.length} ihlal`);
for (const m of violations.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
