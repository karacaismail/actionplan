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
// moduleUsage tamlık çıtası: dolu (non-skeleton) moduleUsage en az bu kadar madde + notes taşımalı.
// "Modül Kullanımı" boyutu sistematik olarak 1-satırda kalmıştı; bu kapı tamlığı kilitler.
const MU_MIN_ITEMS = 3;
const isNa = (n, key) => n.applicability?.[key]?.status === "na";
// Skor tabanı: hiçbir dolu düğüm bu eşiğin altına düşmemeli (içerik zenginleştirme ratchet'i;
// moduleUsage tamlık + tag zenginleştirme + kısa-madde genişletme sonrası min ≈ 2.46).
const SCORE_FLOOR = 2.4;

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const violations = [];
let goldenOk = 0;
let claimChecked = 0;
let muChecked = 0;

for (const n of nodes) {
  const a = auditNode(n);
  // moduleUsage tamlık: N/A değilse ve skeleton değilse ≥3 madde + notes zorunlu.
  const mu = n.dimensions?.moduleUsage;
  if (mu && mu.status !== "skeleton" && !isNa(n, "moduleUsage")) {
    muChecked++;
    const items = mu.items ?? [];
    if (items.length < MU_MIN_ITEMS)
      violations.push(`${n.id}.moduleUsage: ${items.length} madde < ${MU_MIN_ITEMS}`);
    if (!(mu.notes ?? "").trim()) violations.push(`${n.id}.moduleUsage: notes boş`);
  }
  // Tüm dolu düğümler için skor tabanı.
  if (a.filled > 0 && a.score < SCORE_FLOOR)
    violations.push(`${n.id}: skor ${a.score} < taban ${SCORE_FLOOR}`);
  if (GOLDEN.has(n.id)) {
    if (a.filled < 14) violations.push(`golden ${n.id}: 14 boyut dolu değil (${a.filled}/14)`);
    if (a.score < GOLDEN_MIN) violations.push(`golden ${n.id}: skor ${a.score} < ${GOLDEN_MIN}`);
    else goldenOk++;
  } else if (a.provenance === "human" || a.provenance === "swarm" || a.provenance === "mixed") {
    claimChecked++;
    if (a.score < CLAIM_MIN)
      violations.push(
        `${n.id} (${a.provenance}): skor ${a.score} < ${CLAIM_MIN} — köken iddiası kalitesiz`,
      );
  }
}

console.log(
  `[quality-lint] golden ok: ${goldenOk}/${GOLDEN.size} · köken-iddialı denetlenen: ${claimChecked} · moduleUsage denetlenen: ${muChecked} · ihlal: ${violations.length}`,
);
if (violations.length) {
  for (const v of violations) console.error(`  ✗ ${v}`);
  process.exit(1);
}
console.log("[quality-lint] geçti.");
