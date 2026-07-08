#!/usr/bin/env node
/**
 * check-waterfall-handoff — PLAN/HANDOFF KAPISI.
 *
 * actionplan ürün kodu değildir; başka projenin enterprise waterfall yol haritası
 * ve geliştiriciye verilecek iş tanımı deposudur. Bu kapı bu ayrımı korur:
 * evidence[], repoPath ve testCommand gerektirmez; onlar gerçek uygulama
 * yürütüldükten sonra yazılır. Burada aranan şey, her düğümün geliştiricinin
 * waterfall sürecine başlayabileceği kadar tanımlı olmasıdır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const LEVELS = new Set([
  "app",
  "module",
  "archetype",
  "feature",
  "component",
  "work_unit",
  "micro_step",
]);
const PHASES = [
  "requirements",
  "test-plan",
  "db-schema",
  "development",
  "test-qa",
  "verification",
  "release-maintenance",
];
const DIMENSIONS = [
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
  "dataLifecycle",
  "observability",
  "reliability",
];
const REQUIRED_STANDARD_REFS = [
  "codingStandardRef",
  "testingStandardRef",
  "releasePolicyRef",
  "aiGovernanceRef",
  "observabilityRef",
];

const files = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .sort();
const nodes = files.map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));
const ids = new Set(nodes.map((n) => n.id));

const fails = [];
const stats = {
  nodes: nodes.length,
  evidenceEmpty: 0,
  repoPathEmpty: 0,
  testCommandEmpty: 0,
};

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasList(value) {
  return Array.isArray(value) && value.some((item) => hasText(item) || typeof item === "object");
}

for (const n of nodes) {
  if (!LEVELS.has(n.level)) fails.push(`level-gecersiz: ${n.id} (${n.level})`);
  if (!PHASES.includes(n.phase)) fails.push(`phase-gecersiz: ${n.id} (${n.phase})`);
  if (!hasText(n.title)) fails.push(`title-yok: ${n.id}`);
  if (!hasText(n.summary)) fails.push(`summary-yok: ${n.id}`);
  if (!hasText(n.owner)) fails.push(`owner-yok: ${n.id}`);
  if (!hasList(n.refs)) fails.push(`refs-yok: ${n.id}`);
  if (!hasList(n.deliverables)) fails.push(`deliverables-yok: ${n.id}`);
  if (!hasList(n.acceptanceCriteria)) fails.push(`acceptanceCriteria-yok: ${n.id}`);
  if (!hasList(n.risks)) fails.push(`risks-yok: ${n.id}`);
  if (!hasText(n.rollback)) fails.push(`rollback-yok: ${n.id}`);

  if (!n.schedule?.start || !n.schedule?.end) fails.push(`schedule-start-end-yok: ${n.id}`);
  if (!n.schedule?.baselineStart || !n.schedule?.baselineEnd)
    fails.push(`schedule-baseline-yok: ${n.id}`);

  for (const dep of n.dependsOn ?? []) {
    if (!ids.has(dep)) fails.push(`dependsOn-dangling: ${n.id} -> ${dep}`);
  }
  for (const block of n.blocks ?? []) {
    if (!ids.has(block)) fails.push(`blocks-dangling: ${n.id} -> ${block}`);
  }

  for (const phase of PHASES) {
    const gate = n.phases?.[phase];
    if (!gate) {
      fails.push(`phase-gate-yok: ${n.id}.${phase}`);
      continue;
    }
    if (!Array.isArray(gate.criteria) || gate.criteria.length === 0)
      fails.push(`phase-criteria-yok: ${n.id}.${phase}`);
    if (!["pending", "active", "passed", "failed"].includes(gate.status))
      fails.push(`phase-status-gecersiz: ${n.id}.${phase} (${gate.status})`);
  }

  for (const key of DIMENSIONS) {
    const dim = n.dimensions?.[key];
    if (!dim) {
      fails.push(`dimension-yok: ${n.id}.${key}`);
      continue;
    }
    const app = n.applicability?.[key];
    if (app?.applies === false) {
      if (!hasText(app.reason)) fails.push(`dimension-na-reason-yok: ${n.id}.${key}`);
      continue;
    }
    if (dim.status === "skeleton") fails.push(`dimension-skeleton: ${n.id}.${key}`);
    if (!Array.isArray(dim.items) || dim.items.length === 0)
      fails.push(`dimension-items-yok: ${n.id}.${key}`);
  }

  for (const ref of REQUIRED_STANDARD_REFS) {
    if (!hasText(n.standardRefs?.[ref])) fails.push(`standardRef-yok: ${n.id}.${ref}`);
  }

  if (!Array.isArray(n.evidence) || n.evidence.length === 0) stats.evidenceEmpty++;
  if (!Array.isArray(n.traceability?.repoPath) || n.traceability.repoPath.length === 0)
    stats.repoPathEmpty++;
  if (!Array.isArray(n.traceability?.testCommand) || n.traceability.testCommand.length === 0)
    stats.testCommandEmpty++;
}

console.log(
  `[waterfall-handoff] ${stats.nodes} düğüm · evidence boş: ${stats.evidenceEmpty} · repoPath boş: ${stats.repoPathEmpty} · testCommand boş: ${stats.testCommandEmpty} · ihlal: ${fails.length}`,
);
console.log(
  "Not: evidence/repoPath/testCommand boşluğu requirements/backlog aşamasında blocker değildir; development/done için ayrı kapılar zorlar.",
);

if (fails.length) {
  console.error("\nSONUÇ: KIRMIZI ✗ — waterfall tanımı geliştirici handoff için eksik:");
  for (const f of fails.slice(0, 80)) console.error(`  - ${f}`);
  if (fails.length > 80) console.error(`  ... +${fails.length - 80}`);
  process.exit(1);
}

console.log("SONUÇ: YEŞİL ✓ — waterfall proje tanımı geliştirici başlangıcı için tamam.");
