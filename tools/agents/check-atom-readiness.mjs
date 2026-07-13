#!/usr/bin/env node
/**
 * check-atom-readiness — yürütmeye açılan micro_step düğümlerinde tam atom sözleşmesini zorlar.
 * Backlog+requirements kayıtları tarihsel plan/demonstrasyon olabilir; bunlar aday değildir.
 * 0 aday PASS değil NO_CANDIDATES olarak raporlanır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const REGISTRY_PATH = path.join(ROOT, "src/data/atom-definition-registry.json");

export function auditAtomReadiness(nodes, definitions = {}) {
  const microSteps = nodes.filter((node) => node.level === "micro_step");
  const candidates = microSteps.filter(
    (node) => node.status !== "backlog" || node.phase !== "requirements",
  );
  const violations = [];

  for (const node of microSteps) {
    if (!node.atomDefinition && !definitions[node.id]) {
      violations.push(`${node.id}: atom definition registry kaydi eksik`);
    }
  }

  for (const node of candidates) {
    const atom = node.atomDefinition ?? definitions[node.id];
    if (!atom) {
      violations.push(`${node.id}: atomDefinition eksik`);
      continue;
    }
    if (atom.kind !== "task-micro-step") {
      violations.push(`${node.id}: atomDefinition.kind task-micro-step olmali`);
      continue;
    }
    if (!atom.testVectors?.some((vector) => vector.kind === "positive"))
      violations.push(`${node.id}: pozitif test vektoru eksik`);
    if (!atom.testVectors?.some((vector) => vector.kind === "negative"))
      violations.push(`${node.id}: negatif test vektoru eksik`);
    if (!atom.allowedFiles?.length) violations.push(`${node.id}: allowedFiles eksik`);
    if (!atom.nonGoals?.length) violations.push(`${node.id}: nonGoals eksik`);
    if (!atom.evidenceRollup) violations.push(`${node.id}: evidenceRollup eksik`);
    if (!atom.reviewer) violations.push(`${node.id}: reviewer eksik`);
  }

  const definitionComplete = microSteps.every(
    (node) => Boolean(node.atomDefinition) || Boolean(definitions[node.id]),
  );
  return {
    state: violations.length ? "FAIL" : candidates.length ? "PASS" : "NO_CANDIDATES",
    definitionState: definitionComplete ? "PASS" : "FAIL",
    totalMicroSteps: microSteps.length,
    candidates: candidates.length,
    violations,
  };
}

const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, name), "utf8")));
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const result = auditAtomReadiness(nodes, registry.definitions);

console.log(
  `[atom-readiness] micro_step=${result.totalMicroSteps} definitions=${result.definitionState} candidate=${result.candidates} readiness=${result.state}`,
);
if (result.violations.length)
  console.log(result.violations.map((item) => `  - ${item}`).join("\n"));
if (result.state === "FAIL") process.exit(1);
