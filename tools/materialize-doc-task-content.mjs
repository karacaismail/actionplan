#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanManagedDimensionProjection,
  projectRuleIntoDimension,
} from "./lib/doc-task-dimension-projection.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_DIR = path.resolve(
  process.env.DOC_TASK_CONTENT_NODE_DIR ?? path.join(ROOT, "src/data/generated/nodes"),
);
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");
const CLASSIFICATION = path.join(ROOT, "src/data/doc-task-content-classification.json");
const UI_ROLE_REGISTRY = path.join(ROOT, "src/data/storybook/ui-artifact-roles.json");
const UI_DELIVERY_REGISTRY = path.join(ROOT, "src/data/doc-task-ui-deliveries.json");
const REPORT = path.resolve(
  process.env.DOC_TASK_CONTENT_REPORT ?? path.join(ROOT, "reports/doc-task-content-matrix.csv"),
);
const INLINE_LEVELS = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const TYPED_DIRECT_KINDS = new Set(["sellable-app", "app-core-module", "app-module"]);
const ROLLUP_KINDS = new Set([
  "legacy-alias",
  "portfolio-facet",
  "governance",
  "platform-foundation",
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
const APPLY = process.argv.includes("--apply");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const nodeFiles = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();
const nodes = nodeFiles.map((file) => readJson(path.join(NODE_DIR, file)));
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const rules = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .flatMap((file) => readJson(path.join(RULE_DIR, file)).rules ?? []);
const humanDecisionRules = rules.filter((rule) => rule.content?.humanDecisionBlocker === true);
for (const rule of humanDecisionRules) {
  if (!Array.isArray(rule.selector?.nodeIds) || rule.selector.nodeIds.length === 0)
    throw new Error(`${rule.id}: humanDecisionBlocker explicit selector.nodeIds zorunlu`);
}
const humanDecisionRuleSources = new Set(humanDecisionRules.flatMap((rule) => rule.sources ?? []));
const humanDecisionDirectOwnerIds = new Set(
  humanDecisionRules.flatMap((rule) => rule.selector.nodeIds),
);
const classifications = readJson(CLASSIFICATION);
const classificationByDoc = new Map(classifications.map((entry) => [entry.docPath, entry]));
const uiRoleRecords = readJson(UI_ROLE_REGISTRY).records ?? [];
const uiDeliveryRecords = readJson(UI_DELIVERY_REGISTRY).records ?? [];
const uiRoleByNodeId = new Map(uiRoleRecords.map((record) => [record.nodeId, record.role]));
const uiDeliveryByNodeId = new Map(uiDeliveryRecords.map((record) => [record.nodeId, record]));
const UI_ROLES = new Set([
  "produces-ui",
  "changes-ui-contract",
  "governs-ui",
  "consumes-ui",
  "no-ui",
]);
const UI_DELIVERY_ROLES = new Set(["produces-ui", "changes-ui-contract"]);

const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const marker = (id) => `[DOC-APPLY:${id}]`;
const knownRuleIds = new Set(rules.map((rule) => rule.id));
const duplicateRuleIds = duplicates(rules.map((rule) => rule.id));
if (duplicateRuleIds.length)
  throw new Error(`Duplicate rule ids: ${[...new Set(duplicateRuleIds)].join(", ")}`);

const isExecutableDirectiveOwner = (node) =>
  INLINE_LEVELS.has(node.level) && node.source?.cluster === "platform-directive-owner";
const isExplicitHumanDecisionOwner = (node) => humanDecisionDirectOwnerIds.has(node.id);
const isExplicitDirectMaterializationTarget = (node) =>
  isExecutableDirectiveOwner(node) || isExplicitHumanDecisionOwner(node);
const isDirectMaterializationTarget = (node) =>
  isExplicitDirectMaterializationTarget(node) ||
  (!ROLLUP_KINDS.has(node.artifactKind) &&
    (TYPED_DIRECT_KINDS.has(node.artifactKind) || INLINE_LEVELS.has(node.level)));
const isRollupTarget = (node) =>
  ROLLUP_KINDS.has(node.artifactKind) && !isExplicitDirectMaterializationTarget(node);

function validateSelector(selector, ruleId, location = "selector") {
  if (!selector || typeof selector !== "object")
    throw new Error(`${ruleId}.${location}: selector nesnesi zorunlu`);
  const signals = [
    selector.all === true,
    Boolean(selector.nodeIds?.length),
    Boolean(selector.anyTerms?.length),
    selector.hasUiDelivery !== undefined,
    Boolean(selector.uiArtifactRoles?.length),
    Boolean(selector.riskSeverities?.length),
    Boolean(selector.anyOf?.length),
  ];
  if (!signals.some(Boolean)) throw new Error(`${ruleId}.${location}: seçim sinyali yok`);
  if (selector.anyOf && selector.anyOf.length === 0)
    throw new Error(`${ruleId}.${location}.anyOf: boş olamaz`);
  for (const level of selector.levels ?? []) {
    if (!INLINE_LEVELS.has(level)) throw new Error(`${ruleId}: korunan selector level ${level}`);
  }
  for (const role of selector.uiArtifactRoles ?? []) {
    if (!UI_ROLES.has(role)) throw new Error(`${ruleId}: geçersiz uiArtifactRole ${role}`);
  }
  for (const nodeId of selector.nodeIds ?? []) {
    const node = nodeById.get(nodeId);
    if (!node) throw new Error(`${ruleId}: selector node yok: ${nodeId}`);
    if (!isDirectMaterializationTarget(node) && !isRollupTarget(node))
      throw new Error(
        `${ruleId}: selector doğrudan veya roll-up owner seçmiyor: ${nodeId}:${node.level}:${node.artifactKind}`,
      );
  }
  for (const [index, branch] of (selector.anyOf ?? []).entries())
    validateSelector(branch, ruleId, `${location}.anyOf[${index}]`);
}

const riskOwnerById = new Map();
for (const rule of rules) {
  validateSelector(rule.selector, rule.id);
  if (!rule.sources?.length) throw new Error(`${rule.id}: source zorunlu`);
  const duplicateSources = duplicates(rule.sources);
  if (duplicateSources.length)
    throw new Error(`${rule.id}: duplicate source ${duplicateSources[0]}`);
  for (const source of rule.sources) {
    if (!/^docs\/.+\.md$/.test(source) || !fs.existsSync(path.join(ROOT, source)))
      throw new Error(`${rule.id}: source yok veya geçersiz: ${source}`);
  }

  const contentArrays = [
    ["deliverables", rule.content?.deliverables ?? []],
    ["acceptanceCriteria", rule.content?.acceptanceCriteria ?? []],
    ...Object.entries(rule.content?.phaseCriteria ?? {}).map(([phase, items]) => [
      `phaseCriteria.${phase}`,
      items,
    ]),
  ];
  for (const [field, items] of contentArrays) {
    if (!Array.isArray(items)) throw new Error(`${rule.id}.${field}: array zorunlu`);
    if (new Set(items).size !== items.length)
      throw new Error(`${rule.id}.${field}: duplicate clause`);
  }
  for (const phase of Object.keys(rule.content?.phaseCriteria ?? {})) {
    if (!PHASES.includes(phase)) throw new Error(`${rule.id}: geçersiz phase ${phase}`);
  }
  for (const risk of rule.content?.risks ?? []) {
    const owner = riskOwnerById.get(risk.id);
    if (owner) throw new Error(`Duplicate managed risk id ${risk.id}: ${owner}, ${rule.id}`);
    riskOwnerById.set(risk.id, rule.id);
  }
}

if (new Set(uiRoleRecords.map((record) => record.nodeId)).size !== uiRoleRecords.length)
  throw new Error("ui-artifact-roles duplicate nodeId");
if (new Set(uiDeliveryRecords.map((record) => record.nodeId)).size !== uiDeliveryRecords.length)
  throw new Error("doc-task-ui-deliveries duplicate nodeId");
for (const record of uiRoleRecords) {
  const node = nodeById.get(record.nodeId);
  if (!node) throw new Error(`ui-artifact-role node yok: ${record.nodeId}`);
  if (!isDirectMaterializationTarget(node) && !isRollupTarget(node))
    throw new Error(
      `ui-artifact-role doğrudan veya roll-up owner seçmiyor: ${record.nodeId}:${node.level}:${node.artifactKind}`,
    );
  if (!UI_ROLES.has(record.role))
    throw new Error(`ui-artifact-role geçersiz: ${record.nodeId}:${record.role}`);
  if (String(record.reason ?? "").trim().length < 40)
    throw new Error(`ui-artifact-role gerekçesi kısa: ${record.nodeId}`);
  const delivery = uiDeliveryByNodeId.get(record.nodeId);
  if (UI_DELIVERY_ROLES.has(record.role) !== Boolean(delivery))
    throw new Error(`${record.nodeId}: ui role / planned uiDelivery parity bozuk`);

  const hasManagedUiRef = (node.refs ?? []).some(
    (ref) =>
      String(ref).startsWith("doc-ui-contract:") || String(ref).startsWith("doc-ui-delivery:"),
  );
  if (!hasManagedUiRef && node.uiArtifactRole && node.uiArtifactRole !== record.role)
    throw new Error(
      `${record.nodeId}: unmanaged uiArtifactRole registry ile çelişiyor: ${node.uiArtifactRole} != ${record.role}`,
    );
  if (
    !hasManagedUiRef &&
    node.uiDelivery != null &&
    JSON.stringify(node.uiDelivery) !== JSON.stringify(delivery?.uiDelivery)
  )
    throw new Error(`${record.nodeId}: unmanaged uiDelivery registry projeksiyonuyla çelişiyor`);
}
for (const record of uiDeliveryRecords) {
  if (!uiRoleByNodeId.has(record.nodeId))
    throw new Error(`${record.nodeId}: uiDelivery için role kararı yok`);
  if (record.storyTargetStatus !== "planned-not-created")
    throw new Error(`${record.nodeId}: story target mevcut/evidence gibi gösterilemez`);
  if (!record.sourceRules?.length)
    throw new Error(`${record.nodeId}: uiDelivery sourceRules zorunlu`);
  for (const ruleId of record.sourceRules) {
    if (!knownRuleIds.has(ruleId))
      throw new Error(`${record.nodeId}: uiDelivery rule yok: ${ruleId}`);
  }
  const delivery = record.uiDelivery;
  if (delivery?.applies !== true || delivery.impact === "none")
    throw new Error(`${record.nodeId}: planlı uiDelivery applies=true ve impact!=none olmalı`);
  if (delivery.reviewStatus !== "planned" || delivery.storybookUrl !== null)
    throw new Error(`${record.nodeId}: uiDelivery gerçek preview/evidence iddiası kuramaz`);
  if ((delivery.visualEvidenceRefs ?? []).length > 0)
    throw new Error(`${record.nodeId}: planlı uiDelivery visual evidence uyduramaz`);
  if (!(delivery.storyRefs ?? []).length)
    throw new Error(`${record.nodeId}: planlı story target zorunlu`);
  for (const ref of delivery.storyRefs) {
    if (!String(ref).includes(".stories."))
      throw new Error(`${record.nodeId}: story target *.stories.* olmalı: ${ref}`);
  }
}

const render = (text, node) =>
  text
    .replaceAll("{{title}}", node.title)
    .replaceAll("{{id}}", node.id)
    .replaceAll("{{level}}", node.level);
const marked = (rule, text, node) => `${marker(rule.id)} ${render(text, node)}`;
const normalizeRef = (ref) => {
  const match = String(ref).match(/\bdocs\/[^#\s]+\.md/);
  return match?.[0] ?? null;
};
const normalizeSearch = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const textCorpus = (node) =>
  normalizeSearch([node.id, node.title, node.summary, ...(node.tags ?? [])].join(" "));
const hasTerm = (corpus, term) => {
  const normalizedTerm = normalizeSearch(term);
  return normalizedTerm.length > 0 && ` ${corpus} `.includes(` ${normalizedTerm} `);
};

function matchesSelector(selector, node) {
  if (selector.levels && !selector.levels.includes(node.level)) return false;
  if (selector.nodeIds && !selector.nodeIds.includes(node.id)) return false;
  if (selector.anyOf && !selector.anyOf.some((branch) => matchesSelector(branch, node)))
    return false;
  if (selector.anyTerms) {
    const corpus = textCorpus(node);
    if (!selector.anyTerms.some((term) => hasTerm(corpus, term))) return false;
  }
  if (
    selector.hasUiDelivery !== undefined &&
    (node.uiDelivery?.applies === true) !== selector.hasUiDelivery
  )
    return false;
  if (selector.uiArtifactRoles) {
    const effectiveRole = uiRoleByNodeId.get(node.id) ?? node.uiArtifactRole;
    if (!selector.uiArtifactRoles.includes(effectiveRole)) return false;
  }
  if (
    selector.riskSeverities &&
    !(node.risks ?? []).some((risk) => selector.riskSeverities.includes(risk.severity))
  )
    return false;
  return true;
}

function matches(rule, node) {
  return isDirectMaterializationTarget(node) && matchesSelector(rule.selector, node);
}

const managedMarkerPattern = /^\[DOC-APPLY:[^\]]+\]/;
const managedRefPattern = /^doc-apply:([^:]+): docs\/.+\.md$/;
const managedUiRefPattern =
  /^doc-ui-contract:([^:]+): src\/data\/storybook\/ui-artifact-roles\.json$/;
const managedUiDeliveryRefPattern =
  /^doc-ui-delivery:([^:]+): src\/data\/doc-task-ui-deliveries\.json$/;

function assertManagedStructure(node, { allowRollupCleanup = false } = {}) {
  const serialized = JSON.stringify(node);
  if (TYPED_DIRECT_KINDS.has(node.artifactKind)) {
    const typedContract = JSON.stringify({
      appDefinition: node.appDefinition,
      moduleDefinition: node.moduleDefinition,
      deliveryContext: node.deliveryContext,
    });
    if (typedContract.includes("[DOC-APPLY:") || typedContract.includes("doc-apply:"))
      throw new Error(`${node.id}: generic DOC-APPLY typed enterprise contract alanına sızdı`);
  }
  for (const ref of node.refs ?? []) {
    if (String(ref).startsWith("doc-apply:") && !String(ref).match(managedRefPattern))
      throw new Error(`${node.id}: malformed managed ref ${ref}`);
    if (String(ref).startsWith("doc-ui-contract:") && !String(ref).match(managedUiRefPattern))
      throw new Error(`${node.id}: malformed managed UI ref ${ref}`);
    if (
      String(ref).startsWith("doc-ui-delivery:") &&
      !String(ref).match(managedUiDeliveryRefPattern)
    )
      throw new Error(`${node.id}: malformed managed UI delivery ref ${ref}`);
  }
  if (!isDirectMaterializationTarget(node)) {
    if (
      serialized.includes("[DOC-APPLY:") ||
      (node.refs ?? []).some((ref) => ref.startsWith("doc-apply:"))
    )
      if (!allowRollupCleanup)
        throw new Error(`Roll-up/N/A node generic DOC-APPLY içerik taşıyor: ${node.id}`);
    return;
  }
  const forbiddenMarkerFields = [
    ...(node.evidence ?? []),
    node.rollback ?? "",
    ...Object.values(node.phases ?? {}).map((phase) => phase.notes ?? ""),
    ...(node.risks ?? []).map((risk) => risk.mitigation ?? ""),
  ];
  if (forbiddenMarkerFields.some((value) => String(value).includes("[DOC-APPLY:")))
    throw new Error(`${node.id}: managed marker izin verilmeyen alanda`);
  for (const risk of node.risks ?? []) {
    const owner = riskOwnerById.get(risk.id);
    if (owner && !managedMarkerPattern.test(String(risk.desc)))
      throw new Error(`${node.id}: canonical risk id managed id ile çakışıyor: ${risk.id}`);
  }
}

for (const node of nodes) assertManagedStructure(node, { allowRollupCleanup: true });

function cleanAllManaged(node) {
  cleanManagedDimensionProjection(node);
  const hadManagedUi = (node.refs ?? []).some((ref) =>
    ["doc-ui-contract:", "doc-ui-delivery:"].some((prefix) => String(ref).startsWith(prefix)),
  );
  node.refs = (node.refs ?? []).filter((ref) => !String(ref).startsWith("doc-apply:"));
  node.refs = node.refs.filter((ref) => !String(ref).startsWith("doc-ui-contract:"));
  node.refs = node.refs.filter((ref) => !String(ref).startsWith("doc-ui-delivery:"));
  if (hadManagedUi) {
    node.uiArtifactRole = undefined;
    node.uiDelivery = undefined;
  }
  node.deliverables = (node.deliverables ?? []).filter(
    (item) => !managedMarkerPattern.test(String(item)),
  );
  node.acceptanceCriteria = (node.acceptanceCriteria ?? []).filter(
    (item) => !managedMarkerPattern.test(String(item)),
  );
  for (const phase of PHASES) {
    const gate = node.phases?.[phase];
    if (gate)
      gate.criteria = (gate.criteria ?? []).filter(
        (item) => !managedMarkerPattern.test(String(item)),
      );
  }
  node.risks = (node.risks ?? []).filter((risk) => !managedMarkerPattern.test(String(risk.desc)));
}

function reserveTypedDirectiveDimensionCapacity(node) {
  if (!TYPED_DIRECT_KINDS.has(node.artifactKind)) return;
  for (const dimension of Object.values(node.dimensions ?? {})) {
    const items = dimension.items ?? [];
    if (items.length < 5) continue;
    // Typed app/module definitions may arrive with five or six source items per card. Preserve
    // every clause byte-for-byte while reserving one deterministic slot for the source-owned
    // DOC-APPLY projection; subsequent rules coalesce into that single managed item.
    dimension.items = [...items.slice(0, 3), items.slice(3).join("\n")];
  }
}

for (const node of nodes) {
  cleanAllManaged(node);
  reserveTypedDirectiveDimensionCapacity(node);
}

function applyRule(rule, node, { projectDimension = true } = {}) {
  const content = rule.content ?? {};
  for (const source of rule.sources) {
    const managedRef = `doc-apply:${rule.id}: ${source}`;
    if (!node.refs.includes(managedRef)) node.refs.push(managedRef);
  }
  for (const field of ["deliverables", "acceptanceCriteria"]) {
    for (const item of content[field] ?? []) node[field].push(marked(rule, item, node));
  }
  for (const [phase, items] of Object.entries(content.phaseCriteria ?? {})) {
    if (!node.phases?.[phase]) throw new Error(`${rule.id}: eksik phase ${phase} (${node.id})`);
    for (const item of items) node.phases[phase].criteria.push(marked(rule, item, node));
  }
  for (const risk of content.risks ?? []) {
    node.risks.push({
      ...risk,
      desc: marked(rule, risk.desc, node),
      mitigation: render(risk.mitigation, node),
    });
  }
  if (projectDimension) projectRuleIntoDimension(rule, node, render);
}

// Selector'lar yalnız canonical alanları değil, başka source-specific kuralların eklediği riskleri
// de okuyabilir. Hedef kümesini önce monoton bir fixed-point üzerinde kapat; ardından içeriği
// registry sırasıyla tek kez uygula. Böylece high-risk gibi türetilmiş seçimler dosya/kural
// sırasına bağlı kalmaz ve üretilen byte sırası deterministik olur.
const selectionNodes = nodes.map((node) => structuredClone(node));
const selectedPairs = new Set();
let selectionProgress = true;
while (selectionProgress) {
  selectionProgress = false;
  for (const rule of rules) {
    for (const node of selectionNodes) {
      const pair = `${rule.id}\u0000${node.id}`;
      if (selectedPairs.has(pair) || !matches(rule, node)) continue;
      applyRule(rule, node, { projectDimension: false });
      selectedPairs.add(pair);
      selectionProgress = true;
    }
  }
}

const applications = [];
const rollupApplications = [];
const rollupPairs = new Set();
for (const rule of rules) {
  const targets = nodes.filter((node) => selectedPairs.has(`${rule.id}\u0000${node.id}`));
  const rollups = nodes.filter(
    (node) => isRollupTarget(node) && matchesSelector(rule.selector, node),
  );
  if (!targets.length && !rollups.length) throw new Error(`${rule.id}: owner seçilmedi`);
  for (const node of targets) {
    applyRule(rule, node);
    applications.push({
      ruleId: rule.id,
      nodeId: node.id,
      level: node.level,
      sources: rule.sources,
    });
  }
  for (const node of rollups) {
    rollupPairs.add(`${rule.id}\u0000${node.id}`);
    rollupApplications.push({
      ruleId: rule.id,
      nodeId: node.id,
      level: node.level,
      sources: rule.sources,
    });
  }
}

for (const record of uiRoleRecords) {
  const node = nodeById.get(record.nodeId);
  node.uiArtifactRole = record.role;
  const deliveryRecord = uiDeliveryByNodeId.get(record.nodeId);
  if (deliveryRecord) {
    for (const ruleId of deliveryRecord.sourceRules) {
      const pair = `${ruleId}\u0000${node.id}`;
      if (!selectedPairs.has(pair) && !rollupPairs.has(pair))
        throw new Error(`${node.id}: uiDelivery source rule owner parity bozuk: ${ruleId}`);
    }
    node.uiDelivery = structuredClone(deliveryRecord.uiDelivery);
    node.refs.push(`doc-ui-delivery:${node.id}: src/data/doc-task-ui-deliveries.json`);
  } else {
    node.uiDelivery = undefined;
  }
  node.refs.push(`doc-ui-contract:${node.id}: src/data/storybook/ui-artifact-roles.json`);
}

function assertManagedPostflight(node) {
  assertManagedStructure(node);
  for (const match of JSON.stringify(node).matchAll(/\[DOC-APPLY:([^\]]+)\]/g)) {
    if (!knownRuleIds.has(match[1])) throw new Error(`${node.id}: orphan marker ${match[1]}`);
  }
  for (const ref of node.refs ?? []) {
    if (String(ref).startsWith("doc-apply:")) {
      const owner = String(ref).match(managedRefPattern)?.[1];
      if (!owner || !knownRuleIds.has(owner))
        throw new Error(`${node.id}: orphan managed ref ${ref}`);
    }
    if (String(ref).startsWith("doc-ui-contract:")) {
      const owner = String(ref).match(managedUiRefPattern)?.[1];
      if (!owner || !uiRoleByNodeId.has(owner) || owner !== node.id)
        throw new Error(`${node.id}: orphan managed UI ref ${ref}`);
    }
    if (String(ref).startsWith("doc-ui-delivery:")) {
      const owner = String(ref).match(managedUiDeliveryRefPattern)?.[1];
      if (!owner || !uiDeliveryByNodeId.has(owner) || owner !== node.id)
        throw new Error(`${node.id}: orphan managed UI delivery ref ${ref}`);
    }
  }
}

for (const node of nodes) assertManagedPostflight(node);

const changed = nodes.filter((node) => {
  const before = fs.readFileSync(path.join(NODE_DIR, `${node.id}.json`), "utf8");
  return before !== `${JSON.stringify(node, null, 2)}\n`;
});

const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function trackedDocs() {
  const output = execFileSync("git", ["ls-files", "docs/*.md", "docs/**/*.md"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return [...new Set(output.trim().split("\n").filter(Boolean))].sort();
}

function standardOwners() {
  const owners = new Map();
  const dir = path.join(ROOT, "src/data/standards");
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    const standard = readJson(path.join(dir, file));
    for (const ref of standard.references ?? []) {
      const doc = normalizeRef(ref);
      if (!doc) continue;
      const list = owners.get(doc) ?? [];
      list.push(standard.id);
      owners.set(doc, list);
    }
  }
  return owners;
}

function validateClassifications() {
  const tracked = trackedDocs();
  const classified = classifications.map((entry) => entry.docPath);
  if (new Set(classified).size !== classified.length)
    throw new Error("Doc classification duplicate path içeriyor");
  if (JSON.stringify(classified) !== JSON.stringify(tracked))
    throw new Error("Doc classification tracked corpus ile birebir ve sıralı değil");
  const sourceDocs = new Set(rules.flatMap((rule) => rule.sources));
  const classNames = new Set([
    "directive-contract",
    "handoff-agent-pack",
    "gap-audit",
    "catalog-reference",
    "engineering-standard",
    "human-decision",
  ]);
  const decisions = new Set(["task-materialize", "reference-only", "human-decision"]);
  for (const entry of classifications) {
    if (!classNames.has(entry.documentClass))
      throw new Error(`${entry.docPath}: geçersiz documentClass ${entry.documentClass}`);
    if (!decisions.has(entry.decision))
      throw new Error(`${entry.docPath}: geçersiz decision ${entry.decision}`);
    if (String(entry.rationale ?? "").length < 30)
      throw new Error(`${entry.docPath}: classification rationale kısa`);
    const hasRule = sourceDocs.has(entry.docPath);
    if (entry.decision === "reference-only" && hasRule)
      throw new Error(`${entry.docPath}: reference-only kaynak task rule taşıyamaz`);
    if (entry.decision === "task-materialize" && !hasRule)
      throw new Error(`${entry.docPath}: task-materialize rule kaynağı eksik`);
    if (entry.decision === "human-decision") {
      if (!hasRule || !humanDecisionRuleSources.has(entry.docPath))
        throw new Error(`${entry.docPath}: human-decision blocker rule eksik`);
    } else if (humanDecisionRuleSources.has(entry.docPath)) {
      throw new Error(`${entry.docPath}: human-decision blocker yanlış classification altında`);
    }
  }
}

validateClassifications();

function buildMatrix() {
  const standards = standardOwners();
  const materializedTargets = new Map();
  const materializedRules = new Map();
  const rollupTargets = new Map();
  const rollupRules = new Map();
  for (const app of applications) {
    for (const source of app.sources) {
      materializedTargets.set(source, [...(materializedTargets.get(source) ?? []), app.nodeId]);
      materializedRules.set(source, [...(materializedRules.get(source) ?? []), app.ruleId]);
    }
  }
  for (const app of rollupApplications) {
    for (const source of app.sources) {
      rollupTargets.set(source, [...(rollupTargets.get(source) ?? []), app.nodeId]);
      rollupRules.set(source, [...(rollupRules.get(source) ?? []), app.ruleId]);
    }
  }
  const rows = [
    [
      "doc_path",
      "document_class",
      "materialization_decision",
      "decision_rationale",
      "disposition",
      "standard_ids",
      "semantic_owner_node_ids",
      "materialized_target_node_ids",
      "rollup_not_applicable_node_ids",
      "materialized_rule_ids",
      "rollup_not_applicable_rule_ids",
      "human_decision",
    ],
  ];
  for (const doc of trackedDocs()) {
    const classification = classificationByDoc.get(doc);
    if (!classification) throw new Error(`${doc}: classification yok`);
    const semantic = [];
    let decisionRef = false;
    let catalog = false;
    for (const node of nodes) {
      for (const ref of node.refs ?? []) {
        if (normalizeRef(ref) !== doc) continue;
        const value = String(ref);
        if (value.startsWith("doc-apply:")) continue;
        if (value.startsWith("decision:")) decisionRef = true;
        else if (value.startsWith("catalog:")) catalog = true;
        else semantic.push(node.id);
      }
    }
    const std = [...new Set(standards.get(doc) ?? [])].sort();
    const targets = [...new Set(materializedTargets.get(doc) ?? [])].sort();
    const rollups = [...new Set(rollupTargets.get(doc) ?? [])].sort();
    const ruleIds = [...new Set(materializedRules.get(doc) ?? [])].sort();
    const rollupRuleIds = [...new Set(rollupRules.get(doc) ?? [])].sort();
    const semanticOwners = [...new Set(semantic)].sort();
    const humanDecision = classification.decision === "human-decision";
    if (
      ["task-materialize", "human-decision"].includes(classification.decision) !==
      targets.length + rollups.length > 0
    )
      throw new Error(`${doc}: materialized target/classification parity bozuk`);
    const lanes = [];
    if (std.length) lanes.push("standard-ref");
    if (targets.length) lanes.push("task-materialized");
    if (rollups.length) lanes.push("task-rollup-n-a");
    if (semanticOwners.length) lanes.push("task-ref");
    if (catalog) lanes.push("catalog");
    if (decisionRef) lanes.push("decision-ref");
    if (humanDecision) lanes.push("human-decision");
    if (!lanes.length) lanes.push("docs-only");
    rows.push([
      doc,
      classification.documentClass,
      classification.decision,
      classification.rationale,
      lanes.join("+"),
      std.join("|"),
      semanticOwners.join("|"),
      targets.join("|"),
      rollups.join("|"),
      ruleIds.join("|"),
      rollupRuleIds.join("|"),
      humanDecision ? "yes" : "no",
    ]);
  }
  return `${rows.map((row) => row.map(csv).join(",")).join("\n")}\n`;
}

const expectedMatrix = buildMatrix();
const currentMatrix = fs.existsSync(REPORT) ? fs.readFileSync(REPORT, "utf8") : "";
const matrixChanged = currentMatrix !== expectedMatrix;

console.log(
  `[doc-task-content] ${rules.length} rule · ${applications.length} direct application · ${rollupApplications.length} roll-up/N/A · ${changed.length} changed node · matrix ${matrixChanged ? "DRIFT" : "OK"}`,
);
if (!APPLY) {
  if (changed.length || matrixChanged) {
    console.error(
      `DRIFT: node tools/materialize-doc-task-content.mjs --apply (${changed.length} node, matrix=${matrixChanged ? "stale" : "ok"})`,
    );
    process.exit(1);
  }
  console.log("SONUÇ: YEŞİL — canonical task content registry ve matrix eşleşiyor.");
  process.exit(0);
}

for (const node of changed)
  fs.writeFileSync(path.join(NODE_DIR, `${node.id}.json`), `${JSON.stringify(node, null, 2)}\n`);
fs.writeFileSync(REPORT, expectedMatrix);
console.log(`APPLY: ${changed.length} node yazıldı; ${path.relative(ROOT, REPORT)} güncellendi.`);
