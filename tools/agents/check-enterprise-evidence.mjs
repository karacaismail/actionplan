#!/usr/bin/env node
import { PHASES, loadCatalog, report, validateEvidenceShape } from "../lib/app-contracts.mjs";

const errors = [];
let nodes;
try {
  ({ nodes } = loadCatalog());
} catch (error) {
  report("enterprise-evidence", "catalog okunamadı", [error.message]);
  process.exit(1);
}

const targets = [...nodes.values()].filter((node) => node.appDefinition || node.moduleDefinition);
for (const node of targets) {
  const definition = node.appDefinition ?? node.moduleDefinition;
  const evidence = definition.enterpriseDelivery?.evidence;
  const at = `${node.id}.${node.appDefinition ? "appDefinition" : "moduleDefinition"}.enterpriseDelivery.evidence`;
  validateEvidenceShape(evidence, at, errors);
  if (!evidence || !Array.isArray(evidence.expected) || !Array.isArray(evidence.actual)) continue;

  const expectationIds = new Set();
  for (const item of evidence.expected) {
    if (expectationIds.has(item.id)) errors.push(`${at}: duplicate expectation id ${item.id}`);
    expectationIds.add(item.id);
  }
  for (const phase of PHASES)
    if (!evidence.expected.some((item) => item.phase === phase && item.required === true))
      errors.push(`${at}: ${phase} için required expected evidence yok`);

  const actualIds = new Set();
  for (const item of evidence.actual) {
    if (actualIds.has(item.id)) errors.push(`${at}: duplicate actual id ${item.id}`);
    actualIds.add(item.id);
    const expectation = evidence.expected.find((candidate) => candidate.id === item.expectationId);
    if (!expectation) errors.push(`${at}: ${item.id} planlanmamış expectation'a bağlı`);
    else if (expectation.kind !== item.kind)
      errors.push(`${at}: ${item.id} evidence kind expectation ile farklı`);
  }

  if (evidence.actual.length === 0) {
    const claims = [
      ["status", node.status],
      ["state", node.state],
      ["implementationStatus", node.implementationStatus],
      ["traceability.implementationStatus", node.traceability?.implementationStatus],
      ["verificationStatus", node.verificationStatus],
    ];
    for (const [field, value] of claims)
      if (["done", "implemented", "verified", "dogrulanmis"].includes(value))
        errors.push(`${node.id}.${field}: actual evidence boşken ${value} yasak`);
    for (const [phase, gate] of Object.entries(node.phases ?? {}))
      if (gate?.passed === true || gate?.status === "passed")
        errors.push(`${node.id}.phases.${phase}: actual evidence boşken passed yasak`);
  }
}

const expectedTargets = [...nodes.values()].filter((node) =>
  ["sellable-app", "app-core-module", "app-module"].includes(node.artifactKind),
);
if (targets.length !== expectedTargets.length)
  errors.push(
    `enterprise definition/typed artifact sayısı farklı: ${targets.length}/${expectedTargets.length}`,
  );

report("enterprise-evidence", `definition=${targets.length} · faz=${PHASES.length}`, errors);
