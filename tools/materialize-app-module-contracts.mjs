#!/usr/bin/env node
/**
 * Materialize the accepted app identity decisions into canonical TaskNode JSON.
 *
 * Default mode is a drift check. `--apply` writes deterministic node files and
 * extends the identity registry with the derived app-core decisions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appPortsFor, appPrimitiveIdsFor, readKernelCatalog } from "./lib/kernel-integration.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const REGISTRY_PATH = path.join(ROOT, "src/data/app-catalog-decisions.json");
const APPLY = process.argv.includes("--apply");
const APP_IDENTITY_BASELINE_DATE = "2026-07-14";
const kernelCatalog = readKernelCatalog(ROOT);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));
const jsonBytes = (value) => `${JSON.stringify(value, null, 2)}\n`;
const unique = (values) => {
  const seen = new Set();
  return values.filter((value) => {
    if (!value) return false;
    const key = typeof value === "object" ? JSON.stringify(value) : `${typeof value}:${value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const addOnce = (values, value) => unique([...(values ?? []), value]);

const migrateStaleTypedScheduleToBaseline = (node) => {
  const isTyped = Boolean(node.appDefinition || node.moduleDefinition);
  const schedule = node.schedule;
  const isExpiredZeroProgressBacklog =
    node.status === "backlog" &&
    node.progress === 0 &&
    typeof schedule?.end === "string" &&
    schedule.end < APP_IDENTITY_BASELINE_DATE;
  if (!isTyped || !isExpiredZeroProgressBacklog) return;

  // These dates describe the historical plan inherited by the identity migration,
  // not an active or actual delivery schedule. Preserve that baseline without
  // fabricating new execution dates or touching actualStart/actualEnd.
  if (schedule.baselineStart == null && schedule.start != null)
    schedule.baselineStart = schedule.start;
  if (schedule.baselineEnd == null) schedule.baselineEnd = schedule.end;
  schedule.start = null;
  schedule.end = null;
};

const registry = readJson(REGISTRY_PATH);
const profiles = registry.decisionProfiles;
const entries = registry.entries;
const nodes = new Map(
  fs
    .readdirSync(NODE_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const node = readJson(path.join(NODE_DIR, file));
      return [node.id, node];
    }),
);

// Final human decision: every productized s-* package is an independent app;
// portfolio/category roots remain non-commercial. Landx is a product app and
// platform-factory is the shared platform foundation.
profiles["productized-app"] = {
  decisionStatus: "accepted",
  disposition: "PROMOTE_APP",
  proposedArtifactKind: "app-definition",
  reason:
    "Kullanıcının bağlayıcı kararı uyarınca içerikle doldurulmuş s-* çözüm paketi bağımsız enterprise-grade app'tir.",
};
profiles.portfolio = {
  decisionStatus: "accepted",
  disposition: "RECLASSIFY_PORTFOLIO",
  proposedArtifactKind: "portfolio",
  reason:
    "Bu sentetik kök bağımsız ticari ürün değil; sellable app'leri sınıflandıran portfolio gezinme yüzeyidir.",
};
profiles["landx-app"] = {
  decisionStatus: "accepted",
  disposition: "PROMOTE_APP",
  proposedArtifactKind: "app-definition",
  reason:
    "Landx bağımsız ürün kimliği, app-core ve SDK module bileşimi taşıyan enterprise app'tir.",
};
profiles["platform-foundation"] = {
  decisionStatus: "accepted",
  disposition: "RECLASSIFY_FOUNDATION",
  proposedArtifactKind: "platform-foundation",
  reason:
    "Platform Factory app/module değil; bütün app'lerin kullandığı ortak üretim foundation'ıdır.",
};
for (const entry of Object.values(entries)) {
  if (entry.profile === "product-like-audit-pending") entry.profile = "productized-app";
  if (entry.profile === "synthetic-suite-audit-pending") entry.profile = "portfolio";
}
entries["app-landx"].profile = "landx-app";
entries["platform-factory"].profile = "platform-foundation";

profiles["governance-task"] = {
  decisionStatus: "accepted",
  disposition: "RECLASSIFY_GOVERNANCE",
  proposedArtifactKind: "governance",
  reason: "Karar, katalog veya yönetişim kaydı executable app/module değildir.",
};
profiles["delivery-task"] = {
  decisionStatus: "accepted",
  disposition: "RECLASSIFY_DELIVERY_TASK",
  proposedArtifactKind: "delivery-task",
  reason: "Bu kayıt WBS teslimat görevidir; app/module kimliği taşımaz.",
};
profiles["foundation-component"] = {
  decisionStatus: "accepted",
  disposition: "RECLASSIFY_FOUNDATION",
  proposedArtifactKind: "platform-foundation",
  reason: "Kernel, SDK veya platform primitive'i app/module değil ortak foundation bileşenidir.",
};
profiles["owned-app-module"] = {
  decisionStatus: "accepted",
  disposition: "MATERIALIZE_APP_MODULE",
  proposedArtifactKind: "module-definition",
  reason: "Tek bir app'e ait bounded context public SDK module sözleşmesiyle geliştirilir.",
};
profiles["synthetic-program"].decisionStatus = "accepted";

const ownedAppModules = new Map([
  ["landx-l0", "app-landx"],
  ["landx-l1", "app-landx"],
  ["landx-l2", "app-landx"],
  ["landx-l3", "app-landx"],
  ["landx-l4", "app-landx"],
  ["landx-l5", "app-landx"],
  ["m-crm-sales", "s-crm"],
]);

const ownedModuleContracts = {
  "landx-l0": {
    boundedContext: "landx.plugin-runtime",
    ownedData: ["plugin-manifest", "declarative-schema", "hook-registration", "service-binding"],
    lifecycleAuthority: [
      "plugin.install",
      "plugin.enable",
      "plugin.upgrade",
      "plugin.disable",
      "plugin.uninstall",
    ],
    providedPorts: ["landx.plugin-registry.v1", "landx.declarative-schema-runtime.v1"],
    publishedEvents: ["landx.plugin.lifecycle.changed.v1", "landx.schema.published.v1"],
    capabilityIds: ["landx-l0.plugin-lifecycle", "landx-l0.schema-runtime", "landx-l0.hook-bus"],
    permissionIds: ["landx.plugin.read", "landx.plugin.manage", "landx.schema.publish"],
  },
  "landx-l1": {
    boundedContext: "landx.identity-tenancy",
    ownedData: ["identity-principal", "tenant-membership", "role-binding", "mfa-policy"],
    lifecycleAuthority: [
      "identity.provision",
      "identity.verify",
      "membership.bind",
      "membership.revoke",
      "identity.suspend",
    ],
    providedPorts: ["landx.identity.v1", "landx.tenant-membership.v1"],
    publishedEvents: ["landx.identity.lifecycle.changed.v1", "landx.membership.changed.v1"],
    capabilityIds: ["landx-l1.identity", "landx-l1.tenancy", "landx-l1.permission-framework"],
    permissionIds: ["landx.identity.read", "landx.identity.manage", "landx.membership.manage"],
  },
  "landx-l2": {
    boundedContext: "landx.agent-runtime",
    ownedData: [
      "agent-definition",
      "tool-registration",
      "prompt-library-entry",
      "memory-index",
      "model-observation",
    ],
    lifecycleAuthority: [
      "agent.register",
      "agent.approve",
      "agent.run",
      "agent.suspend",
      "agent.retire",
    ],
    providedPorts: ["landx.agent-runtime.v1", "landx.tool-registry.v1", "landx.memory.v1"],
    publishedEvents: ["landx.agent.run.changed.v1", "landx.tool.registration.changed.v1"],
    capabilityIds: [
      "landx-l2.agent-orchestration",
      "landx-l2.tool-registry",
      "landx-l2.memory-observability",
    ],
    permissionIds: [
      "landx.agent.read",
      "landx.agent.run",
      "landx.agent.approve",
      "landx.tool.manage",
    ],
  },
  "landx-l3": {
    boundedContext: "landx.application-surface",
    ownedData: ["surface-definition", "form-schema", "workflow-binding", "navigation-contribution"],
    lifecycleAuthority: [
      "surface.draft",
      "surface.validate",
      "surface.publish",
      "surface.deprecate",
    ],
    providedPorts: [
      "landx.surface-registry.v1",
      "landx.form-runtime.v1",
      "landx.workflow-binding.v1",
    ],
    publishedEvents: ["landx.surface.published.v1", "landx.workflow.binding.changed.v1"],
    capabilityIds: [
      "landx-l3.surface-runtime",
      "landx-l3.form-validation",
      "landx-l3.workflow-notification",
    ],
    permissionIds: ["landx.surface.read", "landx.surface.design", "landx.surface.publish"],
  },
  "landx-l4": {
    boundedContext: "landx.data-compliance",
    ownedData: ["audit-envelope", "pii-classification", "retention-policy", "data-subject-request"],
    lifecycleAuthority: [
      "classification.assign",
      "retention.apply",
      "dsr.open",
      "dsr.fulfill",
      "legal-hold.release",
    ],
    providedPorts: ["landx.audit-evidence.v1", "landx.privacy-governance.v1"],
    publishedEvents: ["landx.audit.sealed.v1", "landx.dsr.lifecycle.changed.v1"],
    capabilityIds: [
      "landx-l4.audit-evidence",
      "landx-l4.pii-governance",
      "landx-l4.compliance-controls",
    ],
    permissionIds: ["landx.audit.read", "landx.privacy.manage", "landx.legal-hold.manage"],
  },
  "landx-l5": {
    boundedContext: "landx.operations-marketplace",
    ownedData: ["service-objective", "plugin-listing", "security-review", "sandbox-certification"],
    lifecycleAuthority: [
      "listing.submit",
      "review.approve",
      "certification.issue",
      "listing.suspend",
      "certification.revoke",
    ],
    providedPorts: ["landx.operations.v1", "landx.plugin-marketplace.v1", "landx.certification.v1"],
    publishedEvents: ["landx.plugin.listing.changed.v1", "landx.certification.changed.v1"],
    capabilityIds: [
      "landx-l5.service-operations",
      "landx-l5.plugin-marketplace",
      "landx-l5.sandbox-certification",
    ],
    permissionIds: [
      "landx.marketplace.read",
      "landx.marketplace.review",
      "landx.certification.issue",
    ],
  },
  "m-crm-sales": {
    boundedContext: "crm.sales-pipeline",
    ownedData: [
      "crm-lead",
      "crm-opportunity",
      "crm-account",
      "crm-contact",
      "lead-score-configuration",
    ],
    lifecycleAuthority: [
      "lead.capture",
      "lead.qualify",
      "lead.convert",
      "opportunity.advance",
      "opportunity.close",
    ],
    providedPorts: ["crm.sales-pipeline.v1", "crm.lead-scoring.v1"],
    publishedEvents: ["crm.lead.lifecycle.changed.v1", "crm.opportunity.stage.changed.v1"],
    capabilityIds: [
      "m-crm-sales.lead-management",
      "m-crm-sales.opportunity-pipeline",
      "m-crm-sales.lead-scoring",
    ],
    permissionIds: [
      "crm.lead.read",
      "crm.lead.manage",
      "crm.opportunity.manage",
      "crm.score.configure",
    ],
  },
};
const isFoundationNode = (id) =>
  /^(k-|l1-|platform-|sdk-|cc-)/.test(id) ||
  [
    "atomic-types",
    "be-sdk",
    "dx-cli",
    "dx-marketplace",
    "dx-workflow",
    "fe-eng-standards",
    "fe-theme",
    "services",
  ].includes(id);
const isGovernanceNode = (node) =>
  /^adr-/.test(node.id) ||
  /karar|decision|governance|katalog|catalog|matrix|matris/.test(
    `${node.id} ${node.title} ${node.source?.cluster ?? ""}`.toLowerCase(),
  );

for (const [id, entry] of Object.entries(entries)) {
  if (ownedAppModules.has(id)) {
    entry.profile = "owned-app-module";
    entry.appId = ownedAppModules.get(id);
    continue;
  }
  if (id === "landx-overview") {
    entry.profile = "governance-task";
    continue;
  }
  if (entry.profile !== "generic-audit-pending") continue;
  const node = nodes.get(id);
  if (!node) continue;
  entry.profile = isGovernanceNode(node)
    ? "governance-task"
    : isFoundationNode(id)
      ? "foundation-component"
      : "delivery-task";
}

const resolveDecision = (id) => {
  const entry = entries[id];
  if (!entry) throw new Error(`${id}: identity decision missing`);
  const profile = profiles[entry.profile];
  if (!profile) throw new Error(`${id}: identity profile missing (${entry.profile})`);
  return { ...profile, ...entry };
};

const phaseLabels = {
  requirements: "requirements baseline and approved scope",
  "test-plan": "test-first verification matrix",
  "db-schema": "data ownership and reversible schema contract",
  development: "SDK-generated implementation and compatibility checks",
  "test-qa": "functional, security, accessibility and performance QA",
  verification: "independent acceptance and evidence verification",
  "release-maintenance": "release, rollback, observability and day-2 operations",
};

const evidencePlan = (slug, ownerPrefix) => ({
  expected: Object.entries(phaseLabels).map(([phase, label]) => ({
    id: `${slug}-${phase}-evidence`,
    criterionId: `${slug}-${phase}-gate`,
    phase,
    kind:
      phase === "requirements" || phase === "verification"
        ? "approval"
        : phase === "release-maintenance"
          ? "deploy-log"
          : phase === "development" || phase === "test-qa"
            ? "ci-run"
            : "test-report",
    locatorPattern: `evidence/apps/${slug}/${phase}/**`,
    owner: `${ownerPrefix} ${label} owner`,
    required: true,
  })),
  actual: [],
});

const owners = (name) => ({
  product: `${name} Product Owner`,
  architecture: "Enterprise Application Architect",
  security: "Application Security Owner",
  data: `${name} Data Owner`,
  ux: `${name} UX Owner`,
  qa: `${name} QA Owner`,
  operations: `${name} Service Owner`,
  compliance: `${name} Compliance Owner`,
  release: `${name} Release Owner`,
});

const nfrBudgets = {
  availability: "Draft baseline: monthly SLO >= 99.9%; critical journeys >= 99.95%",
  latency: "Draft baseline: interactive API p95 <= 400 ms and p99 <= 1000 ms at approved load",
  throughput: "Draft baseline: sustain approved peak x2 without breaching latency or error budgets",
  scalability: "Draft baseline: horizontal scale verification at approved peak x2",
  rto: "Draft baseline: RTO <= 60 minutes",
  rpo: "Draft baseline: RPO <= 15 minutes",
  retention: "Retention and deletion are policy-configured per data class and jurisdiction",
  cost: "FinOps budget and per-tenant cost guardrail must be approved before development",
};

const enterpriseDelivery = (slug, name, kind, contextNode) => ({
  targetGrade: "enterprise",
  deliveryPolicy: "enterprise-only",
  mvpAllowed: false,
  baselineVersion: "1.0.0",
  baselineStatus: "draft",
  approvalRef: "docs/adr-0032-enterprise-sdk-app-identity.md",
  riskTier: enterpriseRiskTier(contextNode),
  owners: owners(name),
  nfrBudgets: enterpriseNfrBudgets(contextNode),
  controlRefs: enterpriseControlRefs(contextNode),
  evidence: evidencePlan(slug, kind),
});

const sdkDelivery = (templateKind, contractId) => ({
  required: true,
  sdkContractRef: "sdk-public-contract",
  sdkRange: ">=1.0.0 <2.0.0",
  templateRef: templateKind === "module" ? "sdk-module-template" : "sdk-app-core-template",
  generatorContractRef: "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
  deterministic: true,
  generatedHeaderRequired: true,
  manualEditAllowed: false,
  publicPortsOnly: true,
  kernelInternalsAllowed: false,
  directAppImportsAllowed: false,
  compatibilityTestRefs: [
    `planned-test:${contractId}:sdk-semver-compatibility`,
    `planned-test:${contractId}:deterministic-generation-diff`,
  ],
  negativeTestRefs: [
    `planned-test:${contractId}:forbidden-import-boundaries`,
    `planned-test:${contractId}:kernel-internals-deny`,
    `planned-test:${contractId}:cross-context-write-deny`,
  ],
  templateKind,
});

const bindEvidenceCriteria = (node, delivery) => {
  node.phases ??= {};
  for (const expected of delivery.evidence.expected) {
    node.phases[expected.phase] ??= {
      status: "pending",
      criteria: [],
      passed: false,
      notes: "Planned only; actual evidence is not produced in actionplan materialization.",
    };
    const criterion = `[CRITERION:${expected.criterionId}] ${phaseLabels[expected.phase]} gate must be independently verified by ${expected.owner}.`;
    const existing = (node.phases[expected.phase].criteria ?? []).filter(
      (item) => !String(item).includes(`[CRITERION:${expected.criterionId}]`),
    );
    const firstManaged = existing.findIndex((item) => String(item).startsWith("[DOC-APPLY:"));
    node.phases[expected.phase].criteria =
      firstManaged === -1
        ? [...existing, criterion]
        : [...existing.slice(0, firstManaged), criterion, ...existing.slice(firstManaged)];
  }
};

const failClosedAgentPolicy = {
  autonomy: "none",
  capabilities: ["read"],
  allowedTargets: [],
  forbiddenTargets: ["app", "module"],
  allowedActions: ["read"],
  forbiddenActions: [
    "generate-app",
    "generate-module",
    "update-app",
    "update-module",
    "publish-public",
    "disable-ruleset",
    "override-ruleset",
    "rewrite-history",
    "direct-prod-write",
  ],
  stepUp: [],
  rulesetBoundary: {
    enforced: true,
    canOverride: false,
    backendOnly: true,
    version: "ai-app-module-deny-v1",
  },
  prodDataPolicy: {
    preserveHistory: true,
    migrationModes: ["append-only", "expand-contract"],
    requireSnapshot: true,
    requireRollback: true,
    requireCompatibilityCheck: true,
  },
  subPromptUntrusted: true,
  killSwitch: true,
};

const failClosedEcaRules = (node) => [
  {
    id: `eca-${node.id}-ai-app-module-deny`,
    event: "ai.generation.requested",
    when: [
      { field: "actor", op: "eq", value: "ai" },
      { field: "targetLevel", op: "in", value: ["app", "module"] },
    ],
    then: {
      type: "deny",
      params: { reason: "ai-cannot-generate-app-or-module", node: node.id },
    },
    maxChainDepth: 6,
    requiresApproval: false,
  },
  {
    id: `eca-${node.id}-ai-app-module-update-deny`,
    event: "ai.update.requested",
    when: [
      { field: "actor", op: "eq", value: "ai" },
      { field: "targetLevel", op: "in", value: ["app", "module"] },
    ],
    then: {
      type: "deny",
      params: { reason: "ai-cannot-update-app-or-module", node: node.id },
    },
    maxChainDepth: 6,
    requiresApproval: false,
  },
  {
    id: `eca-${node.id}-ruleset-override-deny`,
    event: "ai.ruleset.override.requested",
    when: [{ field: "actor", op: "eq", value: "ai" }],
    then: {
      type: "deny",
      params: { reason: "ai-cannot-override-rulesets", node: node.id },
    },
    maxChainDepth: 6,
    requiresApproval: false,
  },
];

const enforceFailClosedAi = (node) => {
  node.agentPolicy = clone(failClosedAgentPolicy);
  const requiredEvents = new Set([
    "ai.generation.requested",
    "ai.update.requested",
    "ai.ruleset.override.requested",
  ]);
  node.ecaRules = unique([
    ...(node.ecaRules ?? []).filter((rule) => !requiredEvents.has(rule.event)),
    ...failClosedEcaRules(node),
  ]);
};

const facetStopPattern =
  /^(?:ai|tr|ab|stack|app|module|archetype|enterprise|sdk|aday|vertical|distribution|paket|uygulama|platform-horizontal|core-operations|customer-revenue|data-intelligence|content-collaboration)$/i;
const domainFacets = (node) => {
  const summaryParts = String(node.summary ?? "")
    .split(/[+;,—:\n]|\.(?:\s|$)/)
    .map((item) => item.trim().replace(/^ve\s+/i, ""))
    .filter(
      (item) =>
        item.length >= 4 &&
        item.length <= 96 &&
        !/\bmuadili\b/i.test(item) &&
        !/^(?:mevcut|aynı)\s+(?:modül|core)/i.test(item),
    );
  const tagParts = (node.tags ?? [])
    .map((item) => String(item).trim())
    .filter(
      (item) =>
        item.length >= 4 &&
        item.length <= 40 &&
        !facetStopPattern.test(item) &&
        item !== node.source?.cluster &&
        !["sellable-app", "sdk-only", "content-source", "kontrolü", "dağıtımı"].includes(item),
    );
  const ownedModuleParts = [...ownedAppModules.entries()]
    .filter(([, appId]) => appId === node.id)
    .map(([moduleId]) => nodes.get(moduleId)?.title)
    .filter(Boolean);
  return unique([
    ...ownedModuleParts,
    ...summaryParts,
    ...tagParts,
    `${node.title} ana operasyonu`,
  ]).slice(0, 6);
};

const inferredCapabilities = (node, decision) =>
  unique(
    decision.capabilityIds ?? [
      `${node.id}.operate`,
      `${node.id}.administer`,
      `${node.id}.report-audit`,
    ],
  );

const appBusinessOutcomes = (node) => {
  const facets = domainFacets(node).slice(0, 3);
  return unique([
    `${node.title}: ${String(node.summary ?? "").trim()}`,
    `${node.title} ana operasyonları tenant sınırı, yetki politikası ve denetlenebilir yaşam döngüsüyle yönetilir.`,
    `${node.title} hizmet sonuçları ölçülebilir KPI, NFR/SLO bütçesi ve açılabilir audit kanıtıyla izlenir.`,
    ...facets.map(
      (facet) =>
        `${facet} yeteneği doğrulama, yetkilendirme, hata/istisna ve geri alma akışlarıyla uçtan uca sunulur.`,
    ),
  ]).slice(0, 6);
};

const appCoreJourneys = (node) => {
  const [primaryFacet = `${node.title} ana operasyonu`] = domainFacets(node);
  return [
    `${node.title} tenant kurulumu → entitlement aktivasyonu → rol/yetki ataması → güvenli ilk kullanım`,
    `${primaryFacet} talebi → doğrulama/approval → domain işlemi → outbox/audit → kullanıcı geri bildirimi`,
    `${node.title} yönetimi → yapılandırma → raporlama/export → retention ve denetim`,
    `${node.title} service owner → SLO/alert → incident triage → rollback/recovery → post-incident evidence`,
  ];
};

const normalizeEnterpriseAppSummary = (value) =>
  String(value ?? "")
    .replace(/paketlenmesi/gi, "bağımsız app olarak ürünleştirilmesi")
    .replace(/paketinin/gi, "bağımsız app'in")
    .replace(/dikey paket/gi, "dikey bağımsız app")
    .replace(/tek paket(?:te)?/gi, "tek bağımsız app içinde")
    .replace(/\bpaketi\b/gi, "bağımsız app bileşimi")
    .replace(/ArcheType'ı/g, "enterprise app'i");

const inferredDataClasses = (node) => {
  const haystack =
    `${node.id} ${node.title} ${node.summary} ${(node.tags ?? []).join(" ")}`.toLowerCase();
  const domainClasses = [];
  const add = (pattern, value) => {
    if (pattern.test(haystack)) domainClasses.push(value);
  };
  add(/clinic|health|hasta|hekim|veteriner/, "regulated-health-data");
  add(/finance|account|billing|pay|tax|treasury|revenue/, "financial-records");
  add(/education|school|student|lms|eğitim/, "education-and-learner-data");
  add(/hr|people|workforce|payroll|ats/, "workforce-and-candidate-data");
  add(/legal|clm|contract|esign/, "legal-contract-and-signature-data");
  add(/property|realestate|site|construction/, "property-and-asset-data");
  add(/commerce|sales|crm|market|store|pos|product/, "customer-commerce-data");
  add(/iot|fleet|wms|tms|supply|inventory|mrp/, "operational-telemetry-and-asset-data");
  add(/mail|comms|social|content|cms|dms|wiki/, "communications-and-content-data");
  return unique([...domainClasses, "tenant-business-data", "audit-metadata", "configuration-data"]);
};

const domainCorpus = (node) =>
  `${node.id} ${node.title} ${node.summary} ${(node.tags ?? []).join(" ")}`.toLocaleLowerCase("tr");

const personaProfileFor = (node) => {
  const corpus = domainCorpus(node);
  const profile = (targetOrganizations, buyerRoles, userRoles) => ({
    targetOrganizations,
    buyerRoles,
    userRoles,
  });
  if (/clinic|health|hasta|hekim|veteriner|sağlık/.test(corpus))
    return profile(
      ["Klinikler, sağlık ağları ve düzenlenmiş bakım kuruluşları"],
      ["Medical Director", "Clinical Operations Director", "Healthcare IT and Security Owner"],
      [
        "Clinician",
        "Reception and Scheduling Specialist",
        "Patient or Caregiver",
        "Clinical Auditor",
      ],
    );
  if (
    /account|billing|finance|fpa|payroll|tax|treasury|revenue|expense|ödeme|muhasebe/.test(corpus)
  )
    return profile(
      ["Kurumsal finans, muhasebe ve düzenlenmiş ödeme operasyonları"],
      ["CFO", "Financial Controller", "Finance Transformation and Compliance Lead"],
      ["Accountant", "Finance Operations Specialist", "Approver", "Internal or External Auditor"],
    );
  if (/hrms|\bhr\b|ats|workforce|performance|onboarding|employee|people|aday/.test(corpus))
    return profile(
      ["İnsan kaynakları ve işgücü operasyonu yürüten kuruluşlar"],
      ["CHRO", "People Operations Director", "HRIS and Data Protection Owner"],
      ["HR Specialist", "Hiring or Workforce Manager", "Employee or Candidate", "HR Auditor"],
    );
  if (/legal|clm|contract|esign|duruşma|sözleşme/.test(corpus))
    return profile(
      ["Hukuk, sözleşme ve düzenlenmiş belge süreçleri yürüten kuruluşlar"],
      ["General Counsel", "Legal Operations Director", "Compliance and Records Owner"],
      ["Lawyer", "Contract Manager", "Signer or Counterparty", "Legal Auditor"],
    );
  if (
    /inventory|wms|tms|mrp|procurement|purchase|fleet|fsm|supply|stok|tedarik|üretim/.test(corpus)
  )
    return profile(
      ["Tedarik zinciri, üretim, saha ve lojistik operasyonları"],
      ["COO", "Supply Chain Director", "Operations Technology Owner"],
      ["Planner", "Warehouse or Field Operator", "Supplier Coordinator", "Operations Auditor"],
    );
  if (
    /commerce|sales|crm|marketing|marketplace|retail|store|pos|loyalty|classified|channel/.test(
      corpus,
    )
  )
    return profile(
      ["Gelir, satış, ticaret ve müşteri operasyonu yürüten kuruluşlar"],
      ["Chief Revenue Officer", "Commerce or Sales Director", "Customer Data and Security Owner"],
      [
        "Sales or Commerce Specialist",
        "Merchant or Seller",
        "Customer Service Agent",
        "Revenue Auditor",
      ],
    );
  if (/education|lms|student|öğrenci|eğitim|creator/.test(corpus))
    return profile(
      ["Eğitim kurumları, kurumsal öğrenme ekipleri ve içerik üreticileri"],
      ["Academic or Learning Director", "Program Owner", "Education IT and Privacy Owner"],
      ["Educator", "Learner or Student", "Parent or Sponsor", "Program Auditor"],
    );
  if (/property|realestate|construction|arsa|parsel|site/.test(corpus))
    return profile(
      ["Gayrimenkul, inşaat, tesis ve varlık operasyonları"],
      [
        "Property or Construction Director",
        "Asset Portfolio Owner",
        "Real-estate Compliance Owner",
      ],
      [
        "Property Specialist",
        "Contractor or Facility Operator",
        "Resident or Customer",
        "Asset Auditor",
      ],
    );
  if (/\bai\b|data|bi|etl|catalog|predict|rag|analytics|iot|observability/.test(corpus))
    return profile(
      ["Veri, analitik, AI ve dijital operasyon ekipleri"],
      ["CDO or CIO", "Data and AI Product Director", "Model Risk and Security Owner"],
      ["Data Engineer", "Analyst or Data Scientist", "Business Consumer", "Model or Data Auditor"],
    );
  if (/iam|cyber|audit|kvkk|isg|compliance|governance/.test(corpus))
    return profile(
      ["Güvenlik, risk, uyum ve denetim fonksiyonları"],
      ["CISO", "Chief Risk or Compliance Officer", "Identity and Privacy Owner"],
      [
        "Security Administrator",
        "Risk or Compliance Specialist",
        "Control Owner",
        "Independent Auditor",
      ],
    );
  return profile(
    [`${node.title} operasyonunu kurumsal ölçekte yürüten kuruluşlar`],
    [`${node.title} Business Owner`, "Enterprise IT and Security Owner", "Compliance Owner"],
    [`${node.title} Specialist`, "Tenant Administrator", "Operator", "Auditor"],
  );
};

const enterpriseRiskTier = (node) => {
  const corpus = domainCorpus(node);
  if (
    /health|clinic|hasta|finance|account|billing|payment|payroll|tax|treasury|iam|cyber|kyc|aml|legal|clm|esign|kvkk/.test(
      corpus,
    )
  )
    return "critical";
  if (
    /commerce|sales|crm|workforce|hrms|inventory|iot|property|education|observability|ai/.test(
      corpus,
    )
  )
    return "high";
  return "medium";
};

const enterpriseNfrBudgets = (node) => {
  const tier = enterpriseRiskTier(node);
  const corpus = domainCorpus(node);
  const realTime = /voice|comms|social|iot|pos|scheduling|event|fraud|observability/.test(corpus);
  const regulated = tier === "critical";
  return {
    ...nfrBudgets,
    availability: regulated
      ? "Draft regulated baseline: monthly SLO >= 99.95%; critical journeys >= 99.99%"
      : tier === "high"
        ? "Draft high-impact baseline: monthly SLO >= 99.9%; critical journeys >= 99.95%"
        : "Draft enterprise baseline: monthly SLO >= 99.9%",
    latency: realTime
      ? "Draft real-time baseline: interactive/event p95 <= 250 ms and p99 <= 750 ms at approved load"
      : "Draft transactional baseline: interactive API p95 <= 400 ms and p99 <= 1000 ms at approved load",
    rto: regulated
      ? "Draft regulated baseline: RTO <= 30 minutes"
      : "Draft baseline: RTO <= 60 minutes",
    rpo: regulated
      ? "Draft regulated baseline: RPO <= 5 minutes"
      : "Draft baseline: RPO <= 15 minutes",
    retention: `${inferredDataClasses(node).join(", ")} sınıfları için jurisdiction policy, legal hold, deletion ve restore kanıtı zorunludur`,
  };
};

const enterpriseControlRefs = (node) => {
  const corpus = domainCorpus(node);
  const refs = [
    "enterprise-delivery",
    "sdk-development",
    "quality-gates",
    "testing-strategy",
    "release-versioning",
    "tenant-isolation",
    "authorization-pdp",
    "audit-evidence",
  ];
  if (/health|clinic|hasta|hr|payroll|kvkk|identity|iam|legal|education/.test(corpus))
    refs.push("privacy-retention");
  if (/finance|account|billing|payment|tax|treasury|revenue/.test(corpus))
    refs.push("financial-state-model", "decision-grade-data");
  if (/\bai\b|predict|rag|voice/.test(corpus)) refs.push("ai-governance");
  if (/commerce|market|social|cms|studio|property|education|clinic/.test(corpus))
    refs.push("wcag-2.2-aaa");
  return unique(refs);
};

const classificationFor = (node) => {
  const id = node.id;
  const cluster =
    node.source?.cluster && node.source.cluster !== "meta" ? node.source.cluster : null;
  const sector =
    id.startsWith("s-") && ((node.tags ?? []).includes("vertical") || cluster === "vertical");
  const primaryCategory = id.startsWith("dist-")
    ? "distribution-app"
    : id.startsWith("edition-")
      ? "edition-app"
      : id.startsWith("stack-")
        ? "stack-app"
        : sector
          ? "sector-app"
          : id.startsWith("s-")
            ? "productized-solution"
            : "standalone-product";
  return {
    primaryCategory,
    portfolioRefs: cluster ? [cluster] : [],
    sectorProfiles: primaryCategory === "sector-app" ? [id] : [],
    distributionProfiles: primaryCategory === "distribution-app" ? [id] : [],
    stackProfiles: primaryCategory === "stack-app" ? [id] : [],
    editionProfiles: primaryCategory === "edition-app" ? [id] : [],
  };
};

const externalAppContractsFor = (node) =>
  unique(node.dependsOn ?? [])
    .map((id) => nodes.get(id))
    .filter((dependency) => dependency?.artifactKind === "sellable-app")
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((provider) => ({
      providerAppId: provider.id,
      contractRef: `app-contract:${provider.id}:public-api:v1`,
      versionRange: ">=1.0.0 <2.0.0",
      transport: "event-and-api",
      consumedCapabilityIds: [`${provider.id}.operate`],
      subscribedEventTypes: [`${provider.id}.lifecycle.changed.v1`],
    }));

const makeAppDefinition = (node, decision) => {
  const appId = node.id;
  const coreId = `${appId}-core`;
  const capabilities = inferredCapabilities(node, decision);
  const outcomes = appBusinessOutcomes(node);
  const externalAppContracts = externalAppContractsFor(node);
  const personas = personaProfileFor(node);
  const kernelPrimitiveIds = appPrimitiveIdsFor(kernelCatalog, appId);
  return {
    artifactKind: "sellable-app",
    commercialUnit: "independent-app",
    productSlug: decision.canonicalSlug,
    canonicalName: node.title,
    classification: classificationFor(node),
    commercialModel: {
      licensingModel: "enterprise-subscription",
      entitlementModel: "capability-based-entitlements",
      packagingModel: "independently-deployable-versioned-app",
      salesMotion: "enterprise-contract-and-tenant-provisioning",
      supportModel: "enterprise-sla-with-release-maintenance",
      entitlementIds: capabilities,
    },
    valueProposition:
      node.summary?.trim() || `${node.title} kapsamını bağımsız kurumsal uygulama olarak sunar.`,
    targetOrganizations: personas.targetOrganizations,
    buyerRoles: personas.buyerRoles,
    userRoles: personas.userRoles,
    businessOutcomes: outcomes,
    coreJourneys: appCoreJourneys(node),
    nonGoals: [
      `${node.title} kapsamı dışında kalan uygulamaların iş verisini doğrudan sahiplenmek`,
      "SDK sözleşmesini atlayarak kernel internallerine veya başka app koduna bağlanmak",
      "MVP, demo veya doğrulanmamış release'i enterprise-ready olarak sunmak",
    ],
    capabilityIds: capabilities,
    appCoreModuleId: coreId,
    requiredModuleIds: [coreId],
    optionalModuleIds: [],
    externalAppContracts,
    jurisdictions: ["tenant-configured", "jurisdiction-policy-enforced"],
    dataClasses: inferredDataClasses(node),
    manifest: {
      appVersion: "1.0.0",
      kernelRange: ">=1.0.0 <2.0.0",
      sdkRange: ">=1.0.0 <2.0.0",
      kernelPrimitiveIds,
      requiredCapabilityIds: capabilities,
      optionalCapabilityIds: [],
      publishedEventTypes: [`${decision.canonicalSlug}.lifecycle.changed.v1`],
      subscribedEventTypes: unique([
        "tenant.lifecycle.changed.v1",
        ...externalAppContracts.flatMap((contract) => contract.subscribedEventTypes),
      ]),
      locales: ["tr-TR", "en-US"],
      residencyClass: "jurisdiction-bound",
      deploymentProfiles: ["single-tenant", "multi-tenant"],
    },
    sdkDelivery: sdkDelivery("app-core-and-assembly", appId),
    enterpriseDelivery: enterpriseDelivery(decision.canonicalSlug, node.title, "app", node),
  };
};

const makeModuleDefinition = (appNode, coreId) => {
  const slug = appNode.appDefinition.productSlug;
  const capabilities = appNode.appDefinition.capabilityIds;
  return {
    artifactKind: "app-core-module",
    moduleId: coreId,
    moduleSlug: coreId,
    appId: appNode.id,
    appCoreModuleId: coreId,
    boundedContext: `${slug}.core`,
    ownedData: [`${slug}.tenant-configuration`, `${slug}.application-state`],
    lifecycleAuthority: [`${slug}.installation`, `${slug}.configuration`, `${slug}.decommission`],
    providedPorts: [`${slug}.core.public-api.v1`],
    consumedPorts: appPortsFor(kernelCatalog, appNode.appDefinition.manifest.kernelPrimitiveIds),
    publishedEvents: [`${slug}.lifecycle.changed.v1`],
    subscribedEvents: ["tenant.lifecycle.changed.v1"],
    capabilityIds: capabilities,
    permissionIds: [`${slug}.admin`, `${slug}.operate`, `${slug}.audit`],
    routeContributions: [`/${slug}`],
    directAppImportsAllowed: false,
    directModuleImportsAllowed: false,
    kernelInternalsAllowed: false,
    crossContextWritesAllowed: false,
    healthContract: {
      healthPath: "/health",
      readinessPath: "/ready",
      exposesTenantOrDomainData: false,
    },
    versioning: {
      moduleVersion: "1.0.0",
      contractVersion: "1.0.0",
      compatibilityPolicy: "backward-compatible-within-major",
    },
    migration: {
      authority: `${coreId} migration owner`,
      mode: "expand-contract",
      downgradeRequired: true,
    },
    sdkDelivery: sdkDelivery("module", coreId),
    enterpriseDelivery: enterpriseDelivery(coreId, `${appNode.title} App Core`, "module", appNode),
  };
};

const makeOwnedModuleDefinition = (node, appNode) => {
  const appId = appNode.id;
  const coreId = appNode.appDefinition.appCoreModuleId;
  const slug = node.id;
  const contract = ownedModuleContracts[node.id];
  if (!contract) throw new Error(`${node.id}: owned module domain contract missing`);
  return {
    artifactKind: "app-module",
    moduleId: node.id,
    moduleSlug: slug,
    appId,
    appCoreModuleId: coreId,
    boundedContext: contract.boundedContext,
    ownedData: contract.ownedData,
    lifecycleAuthority: contract.lifecycleAuthority,
    providedPorts: contract.providedPorts,
    consumedPorts: unique([
      `${appNode.appDefinition.productSlug}.core.public-api.v1`,
      ...appPortsFor(kernelCatalog, appNode.appDefinition.manifest.kernelPrimitiveIds),
    ]),
    publishedEvents: contract.publishedEvents,
    subscribedEvents: [`${appNode.appDefinition.productSlug}.lifecycle.changed.v1`],
    capabilityIds: contract.capabilityIds,
    permissionIds: contract.permissionIds,
    routeContributions: [`/${appNode.appDefinition.productSlug}/${slug}`],
    directAppImportsAllowed: false,
    directModuleImportsAllowed: false,
    kernelInternalsAllowed: false,
    crossContextWritesAllowed: false,
    healthContract: {
      healthPath: "/health",
      readinessPath: "/ready",
      exposesTenantOrDomainData: false,
    },
    versioning: {
      moduleVersion: "1.0.0",
      contractVersion: "1.0.0",
      compatibilityPolicy: "backward-compatible-within-major",
    },
    migration: {
      authority: `${node.id} migration owner`,
      mode: "expand-contract",
      downgradeRequired: true,
    },
    sdkDelivery: sdkDelivery("module", node.id),
    enterpriseDelivery: enterpriseDelivery(node.id, node.title, "module", node),
  };
};

const artifactKindFor = (decision) => {
  if (decision.disposition === "PROMOTE_APP") return "sellable-app";
  if (decision.disposition === "MATERIALIZE_APP_CORE") return "app-core-module";
  if (decision.disposition === "MATERIALIZE_APP_MODULE") return "app-module";
  if (decision.disposition === "MERGE_APP_ALIAS") return "legacy-alias";
  if (decision.disposition === "RECLASSIFY_GOVERNANCE") return "governance";
  if (
    decision.disposition === "RECLASSIFY_PROGRAM" ||
    decision.disposition === "RECLASSIFY_PORTFOLIO"
  )
    return "portfolio-facet";
  if (decision.disposition === "RECLASSIFY_FOUNDATION") return "platform-foundation";
  if (decision.disposition === "RECLASSIFY_DELIVERY_TASK") return "delivery-task";
  return "audit-pending";
};

const CORE_MATERIALIZER_VERSION = "app-core-contract-v2";
const managedDocItems = (values) =>
  (values ?? []).filter((value) => String(value).startsWith("[DOC-APPLY:"));
const managedDocRefs = (values) =>
  (values ?? []).filter((value) =>
    ["doc-apply:", "doc-ui-contract:", "doc-ui-delivery:"].some((prefix) =>
      String(value).startsWith(prefix),
    ),
  );
const managedDocPromptSuffix = (value) => {
  const prompt = String(value ?? "");
  const markerIndex = prompt.indexOf("\n\n[DOC-APPLY:");
  return markerIndex === -1 ? "" : prompt.slice(markerIndex);
};

const coreDimensionContexts = (app, coreId) => {
  const definition = app.appDefinition;
  const delivery = definition.enterpriseDelivery;
  const slug = definition.productSlug;
  const boundedContext = `${slug}.core`;
  const publicPort = `${slug}.core.public-api.v1`;
  const primaryCapability = definition.capabilityIds[0];
  const dataClasses = definition.dataClasses.slice(0, 3).join(", ");
  const targetOrganization = definition.targetOrganizations[0];
  const buyerRole = definition.buyerRoles[0];
  const userRole = definition.userRoles[0];
  const deploymentProfiles = definition.manifest.deploymentProfiles.join("/");
  const locales = definition.manifest.locales.join("/");
  const providerLane =
    definition.externalAppContracts
      .map((contract) => `${contract.providerAppId}@${contract.versionRange}`)
      .join(", ") || "kernel public ports only";
  const scope = `${coreId}/${boundedContext}`;

  return {
    featureDefs: [
      `Bağlam: ${scope}, hedef kuruluş ${targetOrganization}.`,
      `Bağlam: ${scope}, manifest capability ${primaryCapability}; domain lifecycle app/modül sahibinde kalır.`,
      `Bağlam: ${scope}, product owner ${delivery.owners.product} ve architecture owner ${delivery.owners.architecture}.`,
    ],
    security: [
      `Bağlam: ${scope}, risk tier ${delivery.riskTier}, veri sınıfları ${dataClasses}.`,
      `Bağlam: ${scope}, security owner ${delivery.owners.security}; PII/KVKK erişimi app-core'da sahiplenilmez.`,
      `Bağlam: ${scope}, ${primaryCapability} entitlement ve ${slug}.admin permission sınırı.`,
    ],
    codeOptimization: [
      `Bağlam: ${scope}, ${publicPort} için modüler type boundary ve CI gate ${delivery.owners.architecture} sorumluluğundadır.`,
      `Bağlam: ${scope}, adapter ayrımı ${primaryCapability} public capability yüzeyine göre lint kapısında doğrulanır.`,
      `Bağlam: ${scope}, contract bütçesi ${definition.sdkDelivery.templateRef} çıktısında ölçülür.`,
    ],
    securityOptimization: [
      `Bağlam: ${scope}, ${delivery.riskTier} risk tier için SBOM ve provenance sahibi ${delivery.owners.security}.`,
      `Bağlam: ${scope}, ${primaryCapability} token ve ${dataClasses} tenant sınırında tutulur.`,
      `Bağlam: ${scope}, imzalı template ${definition.sdkDelivery.templateRef} ve SDK ${definition.sdkDelivery.sdkRange}.`,
    ],
    performance: [
      `Bağlam: ${scope}, latency bütçesi "${delivery.nfrBudgets.latency}".`,
      `Bağlam: ${scope}, cache invalidation ${definition.manifest.appVersion}/${primaryCapability} ile versionlanır.`,
      `Bağlam: ${scope}, availability bütçesi "${delivery.nfrBudgets.availability}".`,
    ],
    mobileApps: [
      `Bağlam: ${scope}, mobil/PWA route /${slug}, locale seti ${locales}.`,
      `Bağlam: ${scope}, cihaz kullanıcısı ${userRole}; ${dataClasses} cihaz loguna yazılmaz.`,
      `Bağlam: ${scope}, offline policy ${primaryCapability} mutation yetkisine göre fail-closed çözülür.`,
    ],
    wcag: [
      `Bağlam: ${scope}, /${slug} yüzeyi ${userRole} ve ${delivery.owners.ux} kabulündedir.`,
      `Bağlam: ${scope}, entitlement ${primaryCapability}; deny metni ${locales} locale setinde erişilebilirdir.`,
      `Bağlam: ${scope}, hedef kuruluş ${targetOrganization}; WCAG kanıt sahibi ${delivery.owners.ux}.`,
    ],
    deployment: [
      `Bağlam: ${scope}, container dağıtım profilleri ${deploymentProfiles}; release owner ${delivery.owners.release}.`,
      `Bağlam: ${scope}, readiness/rollback kapısı ${definition.manifest.appVersion} app manifestine bağlıdır.`,
      `Bağlam: ${scope}, tenant provisioning ${targetOrganization} ve ${delivery.riskTier} risk profiline göre doğrulanır.`,
    ],
    eca: [
      `Bağlam: ${scope}, event ${slug}.lifecycle.changed.v1 ve capability ${primaryCapability}.`,
      `Bağlam: ${scope}, AI deny ruleset sahibi ${delivery.owners.compliance}.`,
      `Bağlam: ${scope}, step-up karar sahibi ${buyerRole}; audit owner ${delivery.owners.compliance}.`,
    ],
    aiAgents: [
      `Bağlam: ${scope}, AI changeset alıcısı ${delivery.owners.product}; target grade ${delivery.targetGrade}.`,
      `Bağlam: ${scope}, güvenilmez prompt ${primaryCapability} entitlement'ını değiştiremez.`,
      `Bağlam: ${scope}, evidence approval sahibi ${delivery.owners.qa}; risk tier ${delivery.riskTier}.`,
    ],
    testing: [
      `Bağlam: ${scope}, test owner ${delivery.owners.qa}; SDK template ${definition.sdkDelivery.templateRef}.`,
      `Bağlam: ${scope}, negatif test sınırı ${primaryCapability}, ${publicPort} ve ${dataClasses}.`,
      `Bağlam: ${scope}, waterfall evidence dizini evidence/apps/${slug}; approval owner ${delivery.owners.product}.`,
    ],
    owasp: [
      `Bağlam: ${scope}, OWASP risk tier ${delivery.riskTier}, security owner ${delivery.owners.security}.`,
      `Bağlam: ${scope}, doğrulanan girdiler ${publicPort}, ${primaryCapability} ve ${dataClasses}.`,
      `Bağlam: ${scope}, correlation ve audit owner ${delivery.owners.compliance}; tenant veri sızıntısı deny edilir.`,
    ],
    integration: [
      `Bağlam: ${scope}, provided port ${publicPort}; provider lane ${providerLane}.`,
      `Bağlam: ${scope}, ${primaryCapability} cross-context iletişimi event-and-api contract kullanır.`,
      `Bağlam: ${scope}, compatibility range kernel ${definition.manifest.kernelRange}, SDK ${definition.manifest.sdkRange}.`,
    ],
    moduleUsage: [
      `Bağlam: ${scope}, required module ${definition.appCoreModuleId}, app ${app.id}.`,
      `Bağlam: ${scope}, owned-module tüketim portu ${publicPort}; app capability ${primaryCapability}.`,
      `Bağlam: ${scope}, module entitlement sahibi ${delivery.owners.product}; deployment ${deploymentProfiles}.`,
    ],
    dataLifecycle: [
      `Bağlam: ${scope}, PII/KVKK veri sınıfı envanteri ${dataClasses}; data owner ${delivery.owners.data}.`,
      `Bağlam: ${scope}, retention bütçesi "${delivery.nfrBudgets.retention}".`,
      `Bağlam: ${scope}, jurisdiction ${definition.jurisdictions.join("/")}; compliance owner ${delivery.owners.compliance}.`,
    ],
    observability: [
      `Bağlam: ${scope}, SLO "${delivery.nfrBudgets.availability}"; operations owner ${delivery.owners.operations}.`,
      `Bağlam: ${scope}, trace contract ${publicPort}/${primaryCapability}; ${dataClasses} payload loglanmaz.`,
      `Bağlam: ${scope}, alarm runbook sahibi ${delivery.owners.operations}; rollback sahibi ${delivery.owners.release}.`,
    ],
    reliability: [
      `Bağlam: ${scope}, ${delivery.riskTier} failure mode bütçesi RTO "${delivery.nfrBudgets.rto}".`,
      `Bağlam: ${scope}, idempotent retry/DLQ sahibi ${delivery.owners.operations}; capability ${primaryCapability}.`,
      `Bağlam: ${scope}, RPO "${delivery.nfrBudgets.rpo}" ve rollback sahibi ${delivery.owners.release}.`,
    ],
  };
};

const coreDimensionClauses = (key, app, coreId) => {
  const appId = app.id;
  const name = app.title;
  const common = {
    featureDefs: [
      `${coreId} yalnız ${name} assembly, installation/configuration lifecycle ve public port wiring sorumluluğunu taşır.`,
      `${appId} domain yetenekleri app manifestindeki capability/module bileşimiyle açılır; app-core domain verisinin sahibi olmaz.`,
      "Install, configure, upgrade, suspend ve decommission geçişleri versioned state machine ve idempotent command sözleşmesi taşır.",
    ],
    security: [
      `${coreId} her istekte tenant, actor, capability ve PDP kararını public SDK context envelope üzerinden doğrular.`,
      "App-core secret, PII veya domain payload kopyası tutmaz; yalnız şifreli configuration reference ve audit metadata işler.",
      "Cross-tenant erişim, kernel-internal çağrı ve doğrudan app/module importu fail-closed negatif testle reddedilir.",
    ],
    codeOptimization: [
      `${coreId} çıktısı aynı manifest+SDK sürümü için byte-stable üretilir; generated-header dışındaki manuel edit reddedilir.`,
      `Assembly adapter'ları public port başına ayrılır; circular import, reflection bypass ve gizli service locator kullanımı yasaktır.`,
      "Build graph, tree-shaking ve contract surface boyutu CI bütçeleriyle ölçülür; optimizasyon public API davranışını değiştirmez.",
    ],
    securityOptimization: [
      `${coreId} dependency/SBOM, secret, SAST ve forbidden-import taramalarını release öncesi fail-closed çalıştırır.`,
      `Capability token'ları least-privilege, kısa ömür ve tenant-bound olur; cache anahtarları tenant sınırını içerir.`,
      "Generator/template/SDK provenance imzası doğrulanmadan app-core artefaktı paketlenmez veya dağıtılmaz.",
    ],
    performance: [
      `${coreId} assembly overhead p95 bütçesi app NFR bütçesinden ayrı ölçülür ve cold-start/steady-state sonuçları raporlanır.`,
      "Manifest, entitlement ve route contribution çözümü bounded cache kullanır; invalidation app sürümüyle atomiktir.",
      "Health/readiness kontrolleri domain sorgusu çalıştırmaz ve dependency timeout bütçelerini aşmaz.",
    ],
    mobileApps: [
      `${coreId} mobil/PWA istemcilerine yalnız versioned public route, capability ve offline-policy metadata sağlar.`,
      "Mobil assembly tenant/locale/permission değişimini güvenli biçimde yeniden çözer; hassas configuration cihaz loguna yazılmaz.",
      "Offline veya zayıf bağlantıda unsupported domain mutation yerine explicit unavailable/degraded state döner.",
    ],
    wcag: [
      `${coreId} tarafından kaydedilen route ve navigation contribution'ları klavye, focus order ve accessible-name sözleşmesi taşır.`,
      "Permission/entitlement nedeniyle gizlenen yüzeyler boş veya odaksız tuzak üretmez; deny nedeni erişilebilir metinle gösterilir.",
      `App shell loading, error, degraded ve maintenance state'leri WCAG 2.2 AAA hedefiyle test edilir.`,
    ],
    deployment: [
      `${coreId} semver-pinned SDK/template çıktısı olarak paketlenir; app manifest, SBOM ve provenance aynı release artefaktında bulunur.`,
      "Expand-contract migration, canary, readiness ve rollback adımları development öncesi planlanır ve deploy kanıtına bağlanır.",
      "Tenant provisioning/deprovisioning işlemleri idempotenttir; yarım kurulum retry veya compensating rollback ile kapanır.",
    ],
    eca: [
      `${coreId} install/configure/upgrade/suspend/decommission olaylarını allowlist action ve max-chain-depth=6 ile işler.`,
      "AI app/module generation, update veya ruleset override isteği backend ECA katmanında koşulsuz deny edilir.",
      `ECA side effect'leri idempotency key, tenant context, audit envelope ve insan step-up gereksinimini korur.`,
    ],
    aiAgents: [
      `${coreId} için AI otonomisi none'dır; yalnız read ve insan tarafından değerlendirilecek changeset önerisi güvenli sınırda ele alınır.`,
      "Prompt/sub-prompt güvenilmez girdidir; generated SDK contract, permission veya evidence değerini override edemez.",
      "Gerçek repo/test/deploy çıktısı yokken AI implemented, verified, done veya actual evidence üretemez.",
    ],
    testing: [
      `${coreId} deterministic generation, semver compatibility, forbidden imports ve kernel-internals deny testlerini kırmızı-önce taşır.`,
      "Tenant isolation, entitlement, lifecycle, migration/downgrade, health ve rollback senaryoları davranışsal assertion içerir.",
      `Her waterfall gate sonucu kendi criterionId ve açılabilir CI/test/report locator'ına bağlanır; plan actual evidence sayılmaz.`,
    ],
    owasp: [
      `${coreId} OWASP access-control, injection, supply-chain, misconfiguration ve logging risklerini assembly sınırında ele alır.`,
      `Manifest/configuration girdileri şema, uzunluk, enum ve signature doğrulamasından geçmeden generator/runtime'a aktarılmaz.`,
      "Error response secret, tenant data veya kernel internal ayrıntısı sızdırmaz; güvenli correlation-id üretir.",
    ],
    integration: [
      `${coreId} kernel primitive'lerini yalnız sdk-public-contract portlarıyla tüketir; doğrudan kernel internal importu yoktur.`,
      "Başka app/modül iletişimi versioned public API veya event contract üzerinden yürür; cross-context write yasaktır.",
      "Consumer/provider yönü, timeout, retry, idempotency ve compatibility range app manifestinde açıkça pinlenir.",
    ],
    moduleUsage: [
      `${appId}, ${coreId} modülünü ilk required module olarak manifestinde pinler; başka app bu core'u doğrudan import edemez.`,
      "Owned modüller core public portunu tüketir ve kendi bounded-context/data authority sınırını korur.",
      "Optional veya required module değişimi entitlement, migration, compatibility ve rollback etkisiyle birlikte versionlanır.",
    ],
    dataLifecycle: [
      `${coreId} yalnız tenant configuration, installation state ve audit metadata sahibidir; domain record kopyalamaz.`,
      `Configuration değişiklikleri versioned, append-only audit'li ve export/import round-trip doğrulamalıdır.`,
      "Decommission retention/crypto-shred/backup politikalarını jurisdiction kararıyla uygular ve silme kanıtını ayrı tutar.",
    ],
    observability: [
      `${coreId} install/upgrade/configure latency, error, saturation ve entitlement-deny metriklerini tenant verisi sızdırmadan üretir.`,
      `Trace'ler appId, moduleId, contractVersion ve correlation-id taşır; PII/domain payload loglanmaz.`,
      `SLO breach alarmı runbook, owner ve rollback decision tree'ye bağlanır; dashboard planı actual evidence değildir.`,
    ],
    reliability: [
      `${coreId} dependency timeout, partial provisioning, stale manifest ve incompatible SDK failure mode'larını fail-closed ele alır.`,
      "Retry/backoff yalnız idempotent işlemlerde uygulanır; kalıcı hata DLQ/compensation ve insan incelemesine yönlenir.",
      `RTO/RPO, canary rollback ve downgrade migration app enterprise baseline'ındaki bütçelerle birlikte doğrulanır.`,
    ],
  };
  const clauses = common[key] ?? [
    `${coreId} ${key} sözleşmesini ${appId} app manifesti, public SDK ve enterprise evidence sınırında uygular.`,
    `${coreId} ${key} değişikliğinde compatibility, tenant isolation ve rollback etkisini açıkça doğrular.`,
    `${coreId} ${key} çıktısı gerçek test/CI kanıtı olmadan tamamlandı veya verified sayılmaz.`,
  ];
  const contexts = coreDimensionContexts(app, coreId)[key] ?? [];
  return clauses.map((clause, index) => `${clause} ${contexts[index] ?? contexts[0]}`.trim());
};

const buildCoreDimensions = (app, coreId, previousDimensions = {}) =>
  Object.fromEntries(
    Object.entries(app.dimensions ?? {}).map(([key, dimension]) => {
      const previous = previousDimensions[key];
      const basePrompt = [
        `[APP-CORE-CONTRACT] ${coreId} — ${dimension.title}`,
        `Kapsam: ${app.id}/${app.title} için yalnız app assembly, installation/configuration lifecycle, entitlement wiring ve public SDK port sınırını üret.`,
        `Güvenlik sınırı: Domain verisini veya business lifecycle'ı app-core'a kopyalama; direct app/module import, kernel internals ve cross-context write kullanma.`,
        `Çıktı: Test-first acceptance, compatibility/negative test, evidence criterion ve rollback sözleşmesine bağlanan ${dimension.title} kararı.`,
      ].join("\n");
      const docPromptSuffix = managedDocPromptSuffix(previous?.prompt);
      return [
        key,
        {
          key,
          title: dimension.title,
          status: "filled",
          items: unique([
            ...coreDimensionClauses(key, app, coreId),
            ...managedDocItems(previous?.items),
          ]),
          notes: `[APP-CORE-CONTRACT] ${app.title} assembly/lifecycle/public-port sınırı; domain data ownership app-core'a taşınmaz.`,
          prompt: `${basePrompt}${docPromptSuffix}`,
          provenance: docPromptSuffix ? (previous?.provenance ?? "swarm") : "template",
          promptVersion: docPromptSuffix
            ? (previous?.promptVersion ?? "doc-task-content-v2")
            : CORE_MATERIALIZER_VERSION,
        },
      ];
    }),
  );

// First apply the orthogonal identity classification to the complete source snapshot.
for (const id of Object.keys(entries).sort()) {
  const node = nodes.get(id);
  if (!node) continue;
  const decision = resolveDecision(id);
  node.artifactKind = artifactKindFor(decision);
  if (node.artifactKind !== "legacy-alias") node.canonicalId = undefined;
  if (node.artifactKind !== "sellable-app") node.appDefinition = undefined;
  if (node.artifactKind !== "app-core-module" && node.artifactKind !== "app-module")
    node.moduleDefinition = undefined;
}

const canonicalAppIds = Object.keys(entries)
  .filter((id) => {
    const decision = resolveDecision(id);
    return decision.disposition === "PROMOTE_APP" && decision.canonicalId === id;
  })
  .sort();

for (const appId of canonicalAppIds)
  entries[appId].capabilityIds ??= [
    `${appId}.operate`,
    `${appId}.administer`,
    `${appId}.report-audit`,
  ];

// Stable-union the legacy distribution content into its canonical app before
// the legacy record becomes an alias tombstone.
for (const { canonicalId, legacyId } of registry.exactMergePairs) {
  const canonical = nodes.get(canonicalId);
  const legacy = nodes.get(legacyId);
  if (!canonical || !legacy) throw new Error(`${canonicalId}/${legacyId}: merge pair missing`);
  for (const field of [
    "tags",
    "dependsOn",
    "blocks",
    "related",
    "refs",
    "deliverables",
    "acceptanceCriteria",
    "evidence",
    "risks",
    "metrics",
  ]) {
    canonical[field] = unique([...(canonical[field] ?? []), ...(legacy[field] ?? [])]);
  }
  if (legacy.summary?.trim() && !String(canonical.summary ?? "").includes(legacy.summary.trim())) {
    canonical.summary =
      `${canonical.summary?.trim() ?? ""}\n\nLegacy distribution context: ${legacy.summary.trim()}`.trim();
  }
}

// Rewrite structured edges so graph semantics never depend on a legacy ID.
const aliasToCanonical = new Map(
  registry.exactMergePairs.map(({ canonicalId, legacyId }) => [legacyId, canonicalId]),
);
for (const node of nodes.values()) {
  for (const field of ["dependsOn", "blocks", "related"]) {
    node[field] = unique(
      (node[field] ?? [])
        .map((id) => aliasToCanonical.get(id) ?? id)
        .filter((id) => id !== node.id),
    );
  }
}

for (const appId of canonicalAppIds) {
  const app = nodes.get(appId);
  const decision = resolveDecision(appId);
  if (!app) throw new Error(`${appId}: source node missing`);

  app.level = "app";
  if (app.id === "app-landx")
    app.summary =
      "Plugin yaşam döngüsü, çok kiracılı kimlik, agent runtime, uygulama yüzeyi, veri uyumu, operasyon ve marketplace yeteneklerini tek enterprise ürününde birleştirir.";
  app.summary = normalizeEnterpriseAppSummary(app.summary);
  app.risks = (app.risks ?? []).map((risk) => ({
    ...risk,
    mitigation: String(risk.mitigation ?? "").replace(
      /MVP paritesi net tanımlanır/gi,
      "enterprise baseline, tam kapsam acceptance ve release kanıtı net tanımlanır",
    ),
  }));
  app.parentId = null;
  app.artifactKind = "sellable-app";
  app.aliases = [...decision.aliases];
  app.tags = unique([...(app.tags ?? []), "app", "sellable-app", "enterprise", "sdk-only"]);
  app.refs = unique([
    ...(app.refs ?? []),
    "identity-contract: src/data/app-catalog-decisions.json",
    "app-contract: docs/app-enterprise-definition-contract.md",
    "decision: docs/adr-0032-enterprise-sdk-app-identity.md",
    "standard: enterprise-delivery",
    "standard: sdk-development",
  ]);
  app.standardRefs = {
    ...(app.standardRefs ?? {}),
    enterpriseDeliveryRef: "enterprise-delivery",
    sdkDevelopmentRef: "sdk-development",
  };
  // App/module composition is expressed by parentId + appDefinition.requiredModuleIds.
  // Keeping it in dependsOn would introduce artificial graph cycles because the
  // pre-existing planning DAG already contains product-to-foundation dependencies.
  app.dependsOn = unique((app.dependsOn ?? []).filter((id) => id !== `${appId}-core`));
  app.deliverables = unique([
    ...(app.deliverables ?? []),
    `[APP-CONTRACT] ${app.title} bağımsız enterprise app baseline ve manifesti`,
    `[APP-CONTRACT] ${appId}-core SDK-generated zorunlu app-core module`,
    "[APP-CONTRACT] Yedi waterfall fazı için beklenen kanıt, owner, rollback ve day-2 işletim paketi",
  ]);
  app.acceptanceCriteria = unique([
    ...(app.acceptanceCriteria ?? []),
    `[APP-CONTRACT] ${app.title} MVP olarak kapanamaz; yedi enterprise waterfall kapısının her biri kendi doğrulanmış kanıtıyla geçer.`,
    `[APP-CONTRACT] App assembly ve tüm app module'leri yalnız public SDK sözleşmesiyle, deterministik generator ve compatibility/negative testleriyle üretilir.`,
    "[APP-CONTRACT] Planlanan evidence actual evidence sayılmaz; verified/done durumu yalnız açılabilir bağımsız kanıtla mümkündür.",
  ]);
  app.rollback =
    app.rollback ||
    `${app.title} release'i önceki uyumlu app manifestine döner; expand-contract migration ve SDK compatibility sözleşmesi downgrade yolunu korur.`;
  app.appDefinition = makeAppDefinition(app, decision);
  bindEvidenceCriteria(app, app.appDefinition.enterpriseDelivery);

  const coreId = `${appId}-core`;
  let core = nodes.get(coreId);
  const previousCore = core ? clone(core) : null;
  const preserveCoreMaterialization =
    previousCore?.source?.granularity === CORE_MATERIALIZER_VERSION;
  const previousManagedRefs = preserveCoreMaterialization ? managedDocRefs(previousCore.refs) : [];
  const previousManagedDeliverables = preserveCoreMaterialization
    ? managedDocItems(previousCore.deliverables)
    : [];
  const previousManagedAcceptance = preserveCoreMaterialization
    ? managedDocItems(previousCore.acceptanceCriteria)
    : [];
  const previousManagedRisks = preserveCoreMaterialization
    ? (previousCore.risks ?? []).filter((risk) => String(risk.desc).startsWith("[DOC-APPLY:"))
    : [];
  const isNewCore = !core;
  if (isNewCore) core = clone(app);
  core.id = coreId;
  if (isNewCore) core.wbsCode = "";
  core.level = "module";
  core.title = `${app.title} App Core`;
  core.slug = coreId;
  core.aliases = [];
  core.summary = `${app.title} uygulamasının SDK ile üretilen zorunlu app-core assembly, lifecycle ve public port sözleşmesi.`;
  core.parentId = appId;
  core.order = 0;
  core.icon = "ph-cube";
  core.tags = unique(["module", "app-core", "enterprise", "sdk-only", appId]);
  core.dependsOn = unique(["sdk-public-contract", "sdk-app-core-template", "k-tenancy", "k-authz"]);
  core.blocks = [];
  core.related = unique([appId, ...(app.related ?? [])]);
  core.refs = unique([
    `parent-app: ${appId}`,
    "identity-contract: src/data/app-catalog-decisions.json",
    "module-contract: docs/app-enterprise-definition-contract.md",
    "decision: docs/adr-0032-enterprise-sdk-app-identity.md",
    "standard: enterprise-delivery",
    "standard: sdk-development",
    `delivery-app: ${appId}`,
    `delivery-module: ${coreId}`,
    "delivery-contract: docs/app-enterprise-definition-contract.md",
    ...previousManagedRefs,
  ]);
  core.status = "backlog";
  core.progress = 0;
  core.phase = "requirements";
  core.deliverables = unique([
    `${app.title} app-core manifest assembly ve public portları`,
    "SDK generator girdisi, deterministic output ve generated-header doğrulaması",
    "Tenant lifecycle, configuration, health/readiness ve reversible migration sözleşmeleri",
    "Yedi waterfall fazı için planlanan enterprise evidence paketi",
    `[DELIVERY-CONTEXT] ${appId}/${coreId} SDK-only enterprise task handoff`,
    ...previousManagedDeliverables,
  ]);
  core.acceptanceCriteria = unique([
    `${coreId} yalnız sdk-app-core-template ve public SDK contract üzerinden üretilebilir; elle generated dosya değişikliği reddedilir.`,
    "Doğrudan app/module importu, kernel internals erişimi ve cross-context write statik negatif testlerle reddedilir.",
    "Compatibility, tenancy isolation, authorization, health/readiness, migration ve rollback test planları development öncesi baselined olur.",
    "MVP veya kısmi demo kapanışı kabul edilmez; actual evidence boşken implemented/verified/done iddiası üretilemez.",
    `[DELIVERY-CONTEXT] ${coreId} yalnız ${appId}/${coreId} public SDK contract sınırında gerçekleştirilir; MVP veya kernel-internal kısa yol kabul edilmez.`,
    "Planlanan kanıt actual evidence değildir; gerçek test/CI/deploy doğrulaması olmadan implemented, verified veya done sonucu yazılamaz.",
    ...previousManagedAcceptance,
  ]);
  core.rollback = `${coreId} önceki uyumlu SDK output'una ve app manifestine döndürülür; expand-contract downgrade migration zorunludur.`;
  core.evidence = [];
  core.risks = [
    {
      id: `${coreId}-sdk-drift`,
      desc: "SDK generator output'u app manifesti veya public contract ile drift edebilir.",
      severity: "high",
      mitigation:
        "Deterministic render, generated-header, compatibility ve negative tests kapıyı bloklar.",
    },
    {
      id: `${coreId}-migration-rollback`,
      desc: "Schema veya contract migration geri dönüş yolunu bozabilir.",
      severity: "high",
      mitigation: "Expand-contract ve doğrulanmış downgrade migration release ön koşuludur.",
    },
    ...previousManagedRisks,
  ];
  core.metrics = [
    { key: "sdk-generated-output-drift", target: "0 byte for identical input" },
    { key: "forbidden-import-violations", target: "0" },
    { key: "required-waterfall-evidence-coverage", target: "7/7 phases" },
  ];
  core.ecaRules = [];
  enforceFailClosedAi(core);
  core.phases = Object.fromEntries(
    Object.keys(phaseLabels).map((phase) => [
      phase,
      {
        status: "pending",
        criteria: unique([
          `${coreId} ${phaseLabels[phase]} gate evidence is independently verifiable`,
          ...(preserveCoreMaterialization
            ? managedDocItems(previousCore.phases?.[phase]?.criteria)
            : []),
        ]),
        passed: false,
        notes: "Planned only; actual evidence is not produced in actionplan materialization.",
      },
    ]),
  );
  core.traceability = {
    repoPath: [],
    testCommand: [],
    deployTarget: null,
    implementationStatus: "not-started",
    tenantStrategy: null,
    auditLogRef: null,
  };
  core.standardRefs = {
    ...(core.standardRefs ?? {}),
    ...(app.standardRefs ?? {}),
    enterpriseDeliveryRef: "enterprise-delivery",
    sdkDevelopmentRef: "sdk-development",
  };
  core.source = {
    corpus: "synthetic",
    originalId: appId,
    granularity: CORE_MATERIALIZER_VERSION,
    cluster: `app-core:${appId}`,
  };
  core.state = "taslak";
  core.uiArtifactRole = "no-ui";
  core.uiDelivery = undefined;
  core.dimensions = buildCoreDimensions(
    app,
    coreId,
    preserveCoreMaterialization ? previousCore.dimensions : undefined,
  );
  core.artifactKind = "app-core-module";
  core.canonicalId = undefined;
  core.appDefinition = undefined;
  core.atomDefinition = undefined;
  core.moduleDefinition = makeModuleDefinition(app, coreId);
  bindEvidenceCriteria(core, core.moduleDefinition.enterpriseDelivery);
  nodes.set(coreId, core);

  // A promoted source node may already have direct descendants. They now sit below app-core.
  for (const child of nodes.values()) {
    if (child.id !== coreId && child.parentId === appId) child.parentId = coreId;
  }
}

for (const [moduleId, appId] of ownedAppModules) {
  const node = nodes.get(moduleId);
  const app = nodes.get(appId);
  if (!node || !app?.appDefinition)
    throw new Error(`${moduleId}: owning app could not be resolved (${appId})`);
  const coreId = app.appDefinition.appCoreModuleId;
  if (moduleId === "landx-l0") {
    node.title = "LandX L0 — App-owned Plugin Runtime Core";
    node.summary =
      "Landx app'ine ait plugin yaşam döngüsü, declarative schema, hook bus ve service binding runtime'ı; shared kernel değildir ve yalnız public SDK portlarını tüketir.";
  }
  node.level = "module";
  node.parentId = coreId;
  node.artifactKind = "app-module";
  node.appDefinition = undefined;
  node.canonicalId = undefined;
  node.moduleDefinition = makeOwnedModuleDefinition(node, app);
  bindEvidenceCriteria(node, node.moduleDefinition.enterpriseDelivery);
  node.tags = unique([
    ...(node.tags ?? []).filter((tag) => !canonicalAppIds.includes(tag) || tag === appId),
    "app-module",
    "enterprise",
    "sdk-only",
    appId,
  ]);
  node.dependsOn = unique([
    coreId,
    "sdk-public-contract",
    "sdk-module-template",
    ...(node.dependsOn ?? []),
  ]);
  node.refs = unique([
    ...(node.refs ?? []),
    `parent-app: ${appId}`,
    `app-core: ${coreId}`,
    "module-contract: docs/app-enterprise-definition-contract.md",
    "standard: enterprise-delivery",
    "standard: sdk-development",
  ]);
  node.standardRefs = {
    ...(node.standardRefs ?? {}),
    enterpriseDeliveryRef: "enterprise-delivery",
    sdkDevelopmentRef: "sdk-development",
  };
  node.deliverables = unique([
    ...(node.deliverables ?? []),
    `[MODULE-CONTRACT] ${node.title} bounded-context, owned-data ve public port sözleşmesi`,
    "[MODULE-CONTRACT] SDK-generated deterministic module output ve compatibility/negative tests",
  ]);
  node.acceptanceCriteria = unique([
    ...(node.acceptanceCriteria ?? []),
    `[MODULE-CONTRACT] ${moduleId} yalnız ${appId}/${coreId} altında SDK ile üretilir; direct app/module import, kernel internals ve cross-context write reddedilir.`,
    "MVP kapanışı yoktur; yedi waterfall evidence expectation gerçek actual evidence ile karşılanmadan verified/done yazılamaz.",
  ]);
  node.rollback =
    node.rollback ||
    `${moduleId} önceki uyumlu SDK output'una döner; expand-contract downgrade migration app-core ile birlikte doğrulanır.`;

  app.appDefinition.requiredModuleIds = addOnce(app.appDefinition.requiredModuleIds, moduleId);
  for (const moduleCapability of node.moduleDefinition.capabilityIds) {
    app.appDefinition.capabilityIds = addOnce(app.appDefinition.capabilityIds, moduleCapability);
    app.appDefinition.commercialModel.entitlementIds = addOnce(
      app.appDefinition.commercialModel.entitlementIds,
      moduleCapability,
    );
    app.appDefinition.manifest.requiredCapabilityIds = addOnce(
      app.appDefinition.manifest.requiredCapabilityIds,
      moduleCapability,
    );
  }
  app.dependsOn = unique((app.dependsOn ?? []).filter((id) => id !== moduleId));
}

for (const { canonicalId, legacyId } of registry.exactMergePairs) {
  const legacy = nodes.get(legacyId);
  if (!legacy) throw new Error(`${legacyId}: legacy merge node missing`);
  legacy.artifactKind = "legacy-alias";
  legacy.canonicalId = canonicalId;
  legacy.aliases = [];
  legacy.refs = unique([
    ...(legacy.refs ?? []),
    `canonical-app: ${canonicalId}`,
    "identity-contract: src/data/app-catalog-decisions.json",
  ]);
  legacy.appDefinition = undefined;
  legacy.moduleDefinition = undefined;
}

const owningAppOf = (node) => {
  let current = node;
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.artifactKind === "sellable-app") return current;
    current = current.parentId ? nodes.get(current.parentId) : null;
  }
  return null;
};
const owningModuleOf = (node, app) => {
  let current = node;
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.artifactKind === "app-core-module" || current.artifactKind === "app-module")
      return current;
    current = current.parentId ? nodes.get(current.parentId) : null;
  }
  return nodes.get(app.appDefinition.appCoreModuleId);
};

for (const node of nodes.values()) {
  const app = owningAppOf(node);
  const runtimeEligible =
    app &&
    !["legacy-alias", "portfolio-facet", "governance", "platform-foundation"].includes(
      node.artifactKind,
    );
  if (runtimeEligible) {
    const module = owningModuleOf(node, app);
    if (!module) throw new Error(`${node.id}: runtime module context missing`);
    node.deliveryContext = {
      applicability: "runtime",
      appRef: app.id,
      moduleRef: module.id,
      sdkRequired: true,
      sdkContractRef: "sdk-public-contract",
      contractRefs: [
        "docs/app-enterprise-definition-contract.md",
        "enterprise-delivery",
        "sdk-development",
      ],
    };
    node.standardRefs = {
      ...(node.standardRefs ?? {}),
      enterpriseDeliveryRef: "enterprise-delivery",
      sdkDevelopmentRef: "sdk-development",
    };
    node.refs = unique([
      ...(node.refs ?? []),
      `delivery-app: ${app.id}`,
      `delivery-module: ${module.id}`,
      "delivery-contract: docs/app-enterprise-definition-contract.md",
    ]);
    node.deliverables = unique([
      ...(node.deliverables ?? []),
      `[DELIVERY-CONTEXT] ${app.id}/${module.id} SDK-only enterprise task handoff`,
    ]);
    node.acceptanceCriteria = unique([
      ...(node.acceptanceCriteria ?? []),
      `[DELIVERY-CONTEXT] ${node.id} yalnız ${app.id}/${module.id} public SDK contract sınırında gerçekleştirilir; MVP veya kernel-internal kısa yol kabul edilmez.`,
      "Planlanan kanıt actual evidence değildir; gerçek test/CI/deploy doğrulaması olmadan implemented, verified veya done sonucu yazılamaz.",
    ]);
  } else {
    const reasonByKind = {
      "legacy-alias": `Legacy alias; canonical app ${node.canonicalId ?? "registry"} üzerinden çözülür.`,
      "portfolio-facet":
        "Portfolio/program navigation record; executable runtime teslimatı değildir.",
      governance: "Governance/decision record; app/module runtime kapsamı uygulanmaz.",
      "platform-foundation":
        "Kernel/SDK/platform foundation; app-owned runtime delivery context uygulanmaz.",
      "delivery-task": "Bu teslimat görevi bağımsız bir sellable app ağacına bağlı değildir.",
    };
    node.deliveryContext = {
      applicability: "not-applicable",
      reason:
        reasonByKind[node.artifactKind] ??
        "App/module kimliği olmayan planlama kaydı için runtime delivery context uygulanmaz.",
    };
  }

  if (node.level === "app" || node.level === "module") enforceFailClosedAi(node);

  migrateStaleTypedScheduleToBaseline(node);
}

// The app-core decisions are derived but still explicit and machine-auditable.
registry.decisionProfiles["materialized-app-core"] = {
  decisionStatus: "accepted",
  disposition: "MATERIALIZE_APP_CORE",
  proposedArtifactKind: "module-definition",
  reason:
    "Her canonical enterprise app için ilk required module olan SDK-generated app-core zorunludur.",
};
for (const appId of canonicalAppIds) {
  const coreId = `${appId}-core`;
  registry.entries[coreId] = {
    profile: "materialized-app-core",
    canonicalId: coreId,
    canonicalSlug: coreId,
    aliases: [],
    appId,
  };
}
registry.sourceSnapshot.expectedNodeCount = 496;
registry.materializedSnapshot = {
  nodeDirectory: "src/data/generated/nodes",
  expectedNodeCount: nodes.size,
  canonicalApps: canonicalAppIds.length,
  appCores: canonicalAppIds.length,
  legacyAliases: registry.exactMergePairs.length,
};

let drift = 0;
for (const [id, node] of [...nodes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const file = path.join(NODE_DIR, `${id}.json`);
  const next = jsonBytes(node);
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (previous !== next) {
    drift += 1;
    if (APPLY) fs.writeFileSync(file, next);
  }
}
const registryNext = jsonBytes(registry);
if (fs.readFileSync(REGISTRY_PATH, "utf8") !== registryNext) {
  drift += 1;
  if (APPLY) fs.writeFileSync(REGISTRY_PATH, registryNext);
}

console.log(
  `[app-contracts] ${canonicalAppIds.length} canonical app, ${canonicalAppIds.length} app-core, ${nodes.size} total node; ${drift} ${APPLY ? "written" : "drift"}.`,
);
if (!APPLY && drift > 0) process.exitCode = 1;
