#!/usr/bin/env node
/**
 * quality-lint — kalite kapısı (CI bloklayıcı).
 *  - Golden düğümler (allowlist) max çıtada kalmalı (≥ GOLDEN_MIN, 14 boyut dolu).
 *  - "human"/"swarm" köken iddiası taşıyan düğümler eşik altı OLAMAZ (≥ CLAIM_MIN);
 *    bu, zenginleştirme iddiasının kalitesiz yapılmasını engeller.
 *  - "template" düğümler backlog'tur; raporlanır ama kapıyı düşürmez.
 * Skorlama tools/lib/score.mjs (uygulama ile ortak).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditNode } from "./lib/score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const GOLDEN = new Set(["product", "customer", "s-crm"]);
const GOLDEN_MIN = 2.3;
const CLAIM_MIN = 2.0;

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const violations = [];
let goldenOk = 0;
let claimChecked = 0;

for (const n of nodes) {
  const a = auditNode(n);
  if (GOLDEN.has(n.id)) {
    if (a.filled < 14) violations.push(`golden ${n.id}: 14 boyut dolu değil (${a.filled}/14)`);
    if (a.score < GOLDEN_MIN) violations.push(`golden ${n.id}: skor ${a.score} < ${GOLDEN_MIN}`);
    else goldenOk++;
  } else if (a.provenance === "human" || a.provenance === "swarm" || a.provenance === "mixed") {
    claimChecked++;
    if (a.score < CLAIM_MIN)
      violations.push(`${n.id} (${a.provenance}): skor ${a.score} < ${CLAIM_MIN} — köken iddiası kalitesiz`);
  }
}

console.log(
  `[quality-lint] golden ok: ${goldenOk}/${GOLDEN.size} · köken-iddialı denetlenen: ${claimChecked} · ihlal: ${violations.length}`,
);
if (violations.length) {
  for (const v of violations) console.error(`  ✗ ${v}`);
  process.exit(1);
}
console.log("[quality-lint] geçti.");
