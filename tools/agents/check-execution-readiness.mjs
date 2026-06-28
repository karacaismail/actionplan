#!/usr/bin/env node
/**
 * check-execution-readiness — YÜRÜTME HAZIRLIĞI KAPISI (Faz P5+ — BLOKLAYICI).
 *
 * ChatGPT eksik-raporundaki "Execution Readiness / Done Evidence / Platform Traceability" kapılarını
 * makineye bağlar. Amaç: "içerik derin ama yürütülebilir değil" boşluğunu kapatmak — plan ile
 * gerçek yürütme/kanıt arasında zorunlu bağ kurmak.
 *
 * Zorlanan kurallar (ihlalde exit 1):
 *  1. Done Evidence: status="done" olan düğüm evidence[] (≥1) taşımalı VE verification fazı "passed" olmalı.
 *     (Kanıtsız "done" yasak — sahte tamamlanma engellenir.)
 *  2. Execution Readiness: development/test-qa/verification/release-maintenance fazındaki düğüm
 *     owner + refs(≥1) + schedule.start + acceptanceCriteria(≥1) + rollback taşımalı. (Sahipsiz/plansız yürütme yasak.)
 *  3. Platform Traceability: id "platform-" ile başlayan düğüm traceability (implementationStatus + deployTarget)
 *     taşımalı. (Plan ↔ uygulama hedefi bağı zorunlu.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const DEV_PHASES = new Set(["development", "test-qa", "verification", "release-maintenance"]);

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const fails = [];
let doneN = 0;
let devN = 0;
let platN = 0;

for (const n of nodes) {
  // 1. Done Evidence
  if (n.status === "done") {
    doneN++;
    if (!Array.isArray(n.evidence) || n.evidence.length === 0)
      fails.push(`done-evidence-yok: ${n.id}`);
    if (n.phases?.verification?.status !== "passed")
      fails.push(`done-verification-passed-degil: ${n.id}`);
  }
  // 2. Execution Readiness (dev+ fazları)
  if (DEV_PHASES.has(n.phase)) {
    devN++;
    if (!n.owner) fails.push(`exec-owner-yok: ${n.id} (${n.phase})`);
    if (!Array.isArray(n.refs) || n.refs.length === 0)
      fails.push(`exec-refs-yok: ${n.id} (${n.phase})`);
    if (!n.schedule?.start) fails.push(`exec-schedule-yok: ${n.id} (${n.phase})`);
    if (!Array.isArray(n.acceptanceCriteria) || n.acceptanceCriteria.length === 0)
      fails.push(`exec-AC-yok: ${n.id} (${n.phase})`);
    if (!n.rollback) fails.push(`exec-rollback-yok: ${n.id} (${n.phase})`);
  }
  // 3. Platform Traceability
  if (n.id.startsWith("platform-")) {
    platN++;
    if (!n.traceability) fails.push(`platform-traceability-yok: ${n.id}`);
    else {
      if (!n.traceability.implementationStatus) fails.push(`platform-implStatus-yok: ${n.id}`);
      if (!n.traceability.deployTarget) fails.push(`platform-deployTarget-yok: ${n.id}`);
    }
  }
}

console.log(
  `[execution-readiness] done: ${doneN} · dev+ faz: ${devN} · platform: ${platN} · ihlal: ${fails.length}`,
);
if (fails.length) {
  console.error("\nSONUÇ: KIRMIZI ✗");
  for (const f of fails.slice(0, 60)) console.error(`  - ${f}`);
  if (fails.length > 60) console.error(`  ... +${fails.length - 60}`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — done'lar kanıtlı, dev+ düğümler yürütülebilir, platform izlenebilir.",
);
