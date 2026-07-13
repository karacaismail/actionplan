#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const program = readJson("src/data/url-policy/implementation-program.json");
const workspaceManifest = readJson("src/data/workspace-manifest.json");
const directive = fs.readFileSync(
  path.join(root, "docs/url-policy-implementation-directive.md"),
  "utf8",
);
const errors = [];
const expectedIds = Array.from(
  { length: 17 },
  (_, index) => `URLP-${String(index).padStart(2, "0")}`,
);
const requiredArrays = [
  "allowedFiles",
  "nonGoals",
  "requiredRegistryRefs",
  "acceptanceCriteria",
  "redTests",
  "testCommands",
  "evidenceRequirements",
  "securityNegativeTests",
  "outputArtifacts",
  "wbsRefs",
];

if (program.id !== "url-policy-implementation-program") errors.push("program id geçersiz");
if (program.targetRepo !== "platform") errors.push("targetRepo platform olmalı");
if (program.phases?.length !== 17) errors.push("tam 17 faz zorunlu");
const platformWorkspace = workspaceManifest.workspaces?.find((item) => item.id === "platform");
if (platformWorkspace?.roots?.urlPolicy !== "packages/url-policy")
  errors.push("workspace roots.urlPolicy packages/url-policy olmalı");
if (platformWorkspace?.roots?.sdk !== "packages/sdk")
  errors.push("workspace genel SDK kökü packages/sdk olarak ayrı kalmalı");

const wbsRefs = new Set();
for (let index = 0; index < (program.phases ?? []).length; index++) {
  const phase = program.phases[index];
  const expectedId = expectedIds[index];
  const expectedDependency = index === 0 ? [] : [expectedIds[index - 1]];
  if (phase.phaseId !== expectedId || phase.order !== index)
    errors.push(`${expectedId}: phaseId/order zinciri bozuk`);
  if (JSON.stringify(phase.dependsOn) !== JSON.stringify(expectedDependency))
    errors.push(`${expectedId}: dependsOn doğrudan predecessor olmalı`);
  if (phase.targetRepo !== "platform" || !phase.branch?.startsWith(`task/${expectedId}-`))
    errors.push(`${expectedId}: targetRepo/branch geçersiz`);
  for (const key of requiredArrays)
    if (!Array.isArray(phase[key]) || phase[key].length === 0)
      errors.push(`${expectedId}: ${key} boş`);
  if (!phase.rollback?.trigger || !phase.rollback?.procedure || !phase.rollback?.verification)
    errors.push(`${expectedId}: rollback eksik`);
  if (!phase.agentPrompt?.objective || phase.agentPrompt?.stopConditions?.length === 0)
    errors.push(`${expectedId}: agentPrompt/stopConditions eksik`);
  const heading = new RegExp(`^## \\d+\\. ${expectedId}\\b`, "m").exec(directive);
  if (!heading) errors.push(`${expectedId}: directive bölümü yok`);
  else {
    const sectionEnd = directive.indexOf("\n---", heading.index);
    const section = directive.slice(heading.index, sectionEnd < 0 ? undefined : sectionEnd);
    for (const file of phase.allowedFiles ?? [])
      if (!section.includes(file))
        errors.push(`${expectedId}: directive allowedFile eksik (${file})`);
    for (const command of phase.testCommands ?? [])
      if (!section.includes(command))
        errors.push(`${expectedId}: directive testCommand eksik (${command})`);
  }

  const nodeId = phase.wbsRefs?.[0];
  if (wbsRefs.has(nodeId)) errors.push(`${expectedId}: duplicate WBS ref ${nodeId}`);
  wbsRefs.add(nodeId);
  const nodePath = path.join(root, "src/data/generated/nodes", `${nodeId}.json`);
  if (!fs.existsSync(nodePath)) {
    errors.push(`${expectedId}: WBS node yok (${nodeId})`);
    continue;
  }
  const node = JSON.parse(fs.readFileSync(nodePath, "utf8"));
  const expectedNodeDependency = index === 0 ? [] : [program.phases[index - 1].wbsRefs[0]];
  if (node.level !== "micro_step") errors.push(`${nodeId}: level micro_step değil`);
  if (JSON.stringify(node.dependsOn ?? []) !== JSON.stringify(expectedNodeDependency))
    errors.push(`${nodeId}: WBS predecessor zinciri bozuk`);
  if (node.standardRefs?.urlPolicyRef !== "url-policy") errors.push(`${nodeId}: urlPolicyRef yok`);
  if (JSON.stringify(node.atomDefinition?.allowedFiles) !== JSON.stringify(phase.allowedFiles))
    errors.push(`${nodeId}: atom allowedFiles program ile aynı değil`);
  if (JSON.stringify(node.atomDefinition?.nonGoals) !== JSON.stringify(phase.nonGoals))
    errors.push(`${nodeId}: atom nonGoals program ile aynı değil`);
  if (JSON.stringify(node.traceability?.repoPath) !== JSON.stringify(phase.allowedFiles))
    errors.push(`${nodeId}: traceability repoPath program ile aynı değil`);
  if (JSON.stringify(node.traceability?.testCommand) !== JSON.stringify(phase.testCommands))
    errors.push(`${nodeId}: traceability testCommand program ile aynı değil`);
  const ecaEvents = new Set((node.ecaRules ?? []).map((rule) => rule.event));
  for (const event of [
    "ai.generation.requested",
    "ai.update.requested",
    "ai.ruleset.override.requested",
  ])
    if (!ecaEvents.has(event)) errors.push(`${nodeId}: backend AI deny event eksik (${event})`);
  for (const vector of node.atomDefinition?.testVectors ?? [])
    if (!phase.testCommands.includes(vector.testRef))
      errors.push(`${nodeId}: testVector program dışı komut kullanıyor (${vector.testRef})`);
  if (["planned", "blocked"].includes(phase.status)) {
    if ((node.evidence ?? []).length > 0 || node.status === "done")
      errors.push(`${nodeId}: başlamamış/bloke faz evidence veya done taşıyamaz`);
    if (node.traceability?.implementationStatus !== "not-started")
      errors.push(`${nodeId}: başlamamış/bloke faz implementationStatus=not-started olmalı`);
  } else if ((node.evidence ?? []).length === 0) {
    errors.push(`${nodeId}: ${phase.status} faz gerçek evidence taşımıyor`);
  }
  if (["verified", "completed"].includes(phase.status)) {
    if (node.status !== "done" || node.traceability?.implementationStatus !== "verified")
      errors.push(`${nodeId}: verified/completed faz WBS done + implementation verified olmalı`);
  }
  if (
    !(node.refs ?? []).some((ref) =>
      ref.startsWith("src/data/url-policy/implementation-program.json"),
    )
  )
    errors.push(`${nodeId}: implementation-program ref yok`);
}

if (/packages\/sdk|@platform\/sdk|@metaframer\/url-policy/.test(directive))
  errors.push("directive eski SDK/paket adını içeriyor");

console.log(
  `URL implementation kapısı — ${program.phases?.length ?? 0}/17 faz, ${wbsRefs.size}/17 WBS atomu, directive=${directive.length} karakter.`,
);
if (errors.length === 0) {
  console.log("\nSONUÇ: YEŞİL — execution-ready handoff tam; runtime completion iddiası yok.");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${errors.length} ihlal`);
for (const error of errors.slice(0, 60)) console.log(`  - ${error}`);
process.exit(1);
