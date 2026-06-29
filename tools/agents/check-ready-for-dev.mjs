#!/usr/bin/env node
/**
 * check-ready-for-dev — DEFINITION OF READY KAPISI (DX — BLOKLAYICI).
 *
 * docs/ready-for-dev-gate.md'in makine karşılığı. check-execution-readiness'i TAMAMLAR (çakışmaz):
 * exec-readiness owner+refs+schedule+AC+rollback'i; bu kapı UYGULAMA BAĞINI zorlar.
 *
 * Kural: phase="development" olan bir düğüm KOD'a hazır sayılır ancak şu varsa:
 *  - traceability.repoPath (≥1)      → kodun hangi repo yoluna yazılacağı belli
 *  - traceability.testCommand (≥1)   → hangi testle kanıtlanacağı belli
 *  - traceability.implementationStatus ≠ "not-started" (yani scaffolded/in-progress/implemented/verified)
 * Böylece "development fazındayım ama nereye/neyle kodlayacağım belli değil" durumu engellenir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const OK_STATUS = new Set(["scaffolded", "in-progress", "implemented", "verified"]);

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const fails = [];
let devN = 0;
for (const n of nodes) {
  if (n.phase !== "development") continue;
  devN++;
  const t = n.traceability ?? {};
  if (!Array.isArray(t.repoPath) || t.repoPath.length === 0)
    fails.push(`dor-repoPath-yok: ${n.id}`);
  if (!Array.isArray(t.testCommand) || t.testCommand.length === 0)
    fails.push(`dor-testCommand-yok: ${n.id}`);
  if (!OK_STATUS.has(t.implementationStatus))
    fails.push(`dor-implStatus-gecersiz: ${n.id} (${t.implementationStatus ?? "yok"})`);
}

console.log(`[ready-for-dev] development fazı: ${devN} düğüm · ihlal: ${fails.length}`);
if (fails.length) {
  console.error("\nSONUÇ: KIRMIZI ✗ — development fazındaki düğümler uygulama bağı taşımalı:");
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — development düğümleri repoPath+testCommand+implementationStatus taşıyor.",
);
