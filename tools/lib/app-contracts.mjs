import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PHASES = [
  "requirements",
  "test-plan",
  "db-schema",
  "development",
  "test-qa",
  "verification",
  "release-maintenance",
];

const KINDS = new Set([
  "test-report",
  "ci-run",
  "security-scan",
  "performance-report",
  "a11y-report",
  "migration-log",
  "rollback-log",
  "deploy-log",
  "runbook",
  "approval",
  "other",
]);
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export function loadCatalog() {
  const registryPath = path.join(ROOT, "src/data/app-catalog-decisions.json");
  const nodeDir = path.join(ROOT, "src/data/generated/nodes");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const nodes = new Map();
  for (const file of fs
    .readdirSync(nodeDir)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const node = JSON.parse(fs.readFileSync(path.join(nodeDir, file), "utf8"));
    if (nodes.has(node.id)) throw new Error(`duplicate node id: ${node.id}`);
    nodes.set(node.id, node);
  }
  const decision = (id) => {
    const entry = registry.entries?.[id];
    const profile = entry && registry.decisionProfiles?.[entry.profile];
    return entry && profile
      ? { ...profile, ...entry, reason: entry.reason ?? profile.reason }
      : null;
  };
  return { registry, nodes, decision };
}

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const stringArray = (value, minimum = 0) =>
  Array.isArray(value) && value.length >= minimum && value.every(text);

function keys(value, allowed, at, errors) {
  if (!object(value)) {
    errors.push(`${at}: object zorunlu`);
    return false;
  }
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) errors.push(`${at}.${key}: bilinmeyen alan`);
  for (const key of allowed) if (!(key in value)) errors.push(`${at}.${key}: zorunlu alan eksik`);
  return true;
}

function texts(value, names, at, errors) {
  for (const name of names)
    if (!text(value?.[name])) errors.push(`${at}.${name}: boş olmayan metin zorunlu`);
}

function arrays(value, names, at, errors, minimum = 0) {
  for (const name of names)
    if (!stringArray(value?.[name], minimum))
      errors.push(`${at}.${name}: en az ${minimum} boş olmayan metin içeren dizi zorunlu`);
}

function literal(value, expected, at, errors) {
  if (value !== expected) errors.push(`${at}: ${JSON.stringify(expected)} olmalı`);
}

export function validateEvidenceShape(evidence, at, errors) {
  if (!keys(evidence, ["expected", "actual"], at, errors)) return;
  if (!Array.isArray(evidence.expected) || evidence.expected.length === 0)
    errors.push(`${at}.expected: boş olmayan dizi zorunlu`);
  else
    for (const [index, item] of evidence.expected.entries()) {
      const itemAt = `${at}.expected[${index}]`;
      if (
        !keys(
          item,
          ["id", "criterionId", "phase", "kind", "locatorPattern", "owner", "required"],
          itemAt,
          errors,
        )
      )
        continue;
      texts(item, ["id", "criterionId", "locatorPattern", "owner"], itemAt, errors);
      if (!PHASES.includes(item.phase)) errors.push(`${itemAt}.phase: geçersiz waterfall fazı`);
      if (!KINDS.has(item.kind)) errors.push(`${itemAt}.kind: geçersiz evidence türü`);
      if (typeof item.required !== "boolean") errors.push(`${itemAt}.required: boolean zorunlu`);
    }
  if (!Array.isArray(evidence.actual)) errors.push(`${at}.actual: dizi zorunlu`);
  else
    for (const [index, item] of evidence.actual.entries()) {
      const itemAt = `${at}.actual[${index}]`;
      const allowed = [
        "id",
        "expectationId",
        "kind",
        "uri",
        "producedAt",
        "verifiedBy",
        "verifiedAt",
      ];
      if (object(item) && "commitSha" in item) allowed.push("commitSha");
      if (!keys(item, allowed, itemAt, errors)) continue;
      texts(
        item,
        ["id", "expectationId", "uri", "producedAt", "verifiedBy", "verifiedAt"],
        itemAt,
        errors,
      );
      if (!KINDS.has(item.kind)) errors.push(`${itemAt}.kind: geçersiz evidence türü`);
      for (const field of ["producedAt", "verifiedAt"])
        if (text(item[field]) && !/(?:Z|[+-]\d\d:\d\d)$/.test(item[field]))
          errors.push(`${itemAt}.${field}: offset içeren ISO datetime zorunlu`);
      if (item.commitSha !== undefined && !/^[0-9a-f]{7,64}$/i.test(item.commitSha))
        errors.push(`${itemAt}.commitSha: 7-64 hex karakter olmalı`);
    }
}

export function validateSdk(sdk, templateKind, at, errors) {
  const fields = [
    "required",
    "sdkContractRef",
    "sdkRange",
    "templateRef",
    "generatorContractRef",
    "deterministic",
    "generatedHeaderRequired",
    "manualEditAllowed",
    "publicPortsOnly",
    "kernelInternalsAllowed",
    "directAppImportsAllowed",
    "compatibilityTestRefs",
    "negativeTestRefs",
    "templateKind",
  ];
  if (!keys(sdk, fields, at, errors)) return;
  texts(sdk, ["sdkContractRef", "sdkRange", "templateRef", "generatorContractRef"], at, errors);
  arrays(sdk, ["compatibilityTestRefs", "negativeTestRefs"], at, errors, 1);
  for (const [name, expected] of Object.entries({
    required: true,
    sdkContractRef: "sdk-public-contract",
    templateRef: templateKind === "module" ? "sdk-module-template" : "sdk-app-core-template",
    generatorContractRef: "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
    deterministic: true,
    generatedHeaderRequired: true,
    manualEditAllowed: false,
    publicPortsOnly: true,
    kernelInternalsAllowed: false,
    directAppImportsAllowed: false,
    templateKind,
  }))
    literal(sdk[name], expected, `${at}.${name}`, errors);
}

export function validateEnterprise(delivery, at, errors) {
  const fields = [
    "targetGrade",
    "deliveryPolicy",
    "mvpAllowed",
    "baselineVersion",
    "baselineStatus",
    "approvalRef",
    "riskTier",
    "owners",
    "nfrBudgets",
    "controlRefs",
    "evidence",
  ];
  if (!keys(delivery, fields, at, errors)) return;
  literal(delivery.targetGrade, "enterprise", `${at}.targetGrade`, errors);
  literal(delivery.deliveryPolicy, "enterprise-only", `${at}.deliveryPolicy`, errors);
  literal(delivery.mvpAllowed, false, `${at}.mvpAllowed`, errors);
  if (!SEMVER.test(delivery.baselineVersion ?? ""))
    errors.push(`${at}.baselineVersion: semver zorunlu`);
  if (!["draft", "approved", "baselined"].includes(delivery.baselineStatus))
    errors.push(`${at}.baselineStatus: geçersiz`);
  if (!["low", "medium", "high", "critical"].includes(delivery.riskTier))
    errors.push(`${at}.riskTier: geçersiz`);
  texts(delivery, ["approvalRef"], at, errors);
  const ownerKeys = [
    "product",
    "architecture",
    "security",
    "data",
    "ux",
    "qa",
    "operations",
    "compliance",
    "release",
  ];
  if (keys(delivery.owners, ownerKeys, `${at}.owners`, errors))
    texts(delivery.owners, ownerKeys, `${at}.owners`, errors);
  const budgetKeys = [
    "availability",
    "latency",
    "throughput",
    "scalability",
    "rto",
    "rpo",
    "retention",
    "cost",
  ];
  if (keys(delivery.nfrBudgets, budgetKeys, `${at}.nfrBudgets`, errors))
    texts(delivery.nfrBudgets, budgetKeys, `${at}.nfrBudgets`, errors);
  if (!stringArray(delivery.controlRefs, 1))
    errors.push(`${at}.controlRefs: boş olmayan metin dizisi zorunlu`);
  validateEvidenceShape(delivery.evidence, `${at}.evidence`, errors);
}

export function validateAppDefinition(node, errors) {
  const app = node.appDefinition;
  const at = `${node.id}.appDefinition`;
  const fields = [
    "artifactKind",
    "commercialUnit",
    "productSlug",
    "canonicalName",
    "classification",
    "commercialModel",
    "valueProposition",
    "targetOrganizations",
    "buyerRoles",
    "userRoles",
    "businessOutcomes",
    "coreJourneys",
    "nonGoals",
    "capabilityIds",
    "appCoreModuleId",
    "requiredModuleIds",
    "optionalModuleIds",
    "externalAppContracts",
    "jurisdictions",
    "dataClasses",
    "manifest",
    "sdkDelivery",
    "enterpriseDelivery",
  ];
  if (!keys(app, fields, at, errors)) return;
  literal(app.artifactKind, "sellable-app", `${at}.artifactKind`, errors);
  literal(app.commercialUnit, "independent-app", `${at}.commercialUnit`, errors);
  texts(app, ["productSlug", "canonicalName", "valueProposition", "appCoreModuleId"], at, errors);
  if (!SLUG.test(app.productSlug ?? "")) errors.push(`${at}.productSlug: kebab-case zorunlu`);
  const classificationFields = [
    "primaryCategory",
    "portfolioRefs",
    "sectorProfiles",
    "distributionProfiles",
    "stackProfiles",
    "editionProfiles",
  ];
  if (keys(app.classification, classificationFields, `${at}.classification`, errors)) {
    if (
      ![
        "distribution-app",
        "sector-app",
        "stack-app",
        "edition-app",
        "productized-solution",
        "standalone-product",
      ].includes(app.classification.primaryCategory)
    )
      errors.push(`${at}.classification.primaryCategory: geçersiz`);
    arrays(
      app.classification,
      [
        "portfolioRefs",
        "sectorProfiles",
        "distributionProfiles",
        "stackProfiles",
        "editionProfiles",
      ],
      `${at}.classification`,
      errors,
    );
  }
  const commercialFields = [
    "licensingModel",
    "entitlementModel",
    "packagingModel",
    "salesMotion",
    "supportModel",
    "entitlementIds",
  ];
  if (keys(app.commercialModel, commercialFields, `${at}.commercialModel`, errors)) {
    texts(
      app.commercialModel,
      ["licensingModel", "entitlementModel", "packagingModel", "salesMotion", "supportModel"],
      `${at}.commercialModel`,
      errors,
    );
    arrays(app.commercialModel, ["entitlementIds"], `${at}.commercialModel`, errors, 1);
  }
  arrays(
    app,
    [
      "targetOrganizations",
      "buyerRoles",
      "userRoles",
      "businessOutcomes",
      "coreJourneys",
      "nonGoals",
      "capabilityIds",
      "requiredModuleIds",
      "jurisdictions",
      "dataClasses",
    ],
    at,
    errors,
    1,
  );
  arrays(app, ["optionalModuleIds"], at, errors);
  if (!Array.isArray(app.externalAppContracts))
    errors.push(`${at}.externalAppContracts: dizi zorunlu`);
  else {
    const providers = new Set();
    for (const [index, contract] of app.externalAppContracts.entries()) {
      const contractAt = `${at}.externalAppContracts[${index}]`;
      if (
        keys(
          contract,
          [
            "providerAppId",
            "contractRef",
            "versionRange",
            "transport",
            "consumedCapabilityIds",
            "subscribedEventTypes",
          ],
          contractAt,
          errors,
        )
      ) {
        texts(contract, ["providerAppId", "contractRef", "versionRange"], contractAt, errors);
        literal(contract.transport, "event-and-api", `${contractAt}.transport`, errors);
        arrays(contract, ["consumedCapabilityIds", "subscribedEventTypes"], contractAt, errors, 1);
      }
      if (providers.has(contract.providerAppId))
        errors.push(`${contractAt}.providerAppId: duplicate provider`);
      providers.add(contract.providerAppId);
      if (contract.providerAppId === app.productSlug)
        errors.push(`${contractAt}.providerAppId: self dependency yasak`);
    }
  }
  const manifestFields = [
    "appVersion",
    "kernelRange",
    "sdkRange",
    "kernelPrimitiveIds",
    "requiredCapabilityIds",
    "optionalCapabilityIds",
    "publishedEventTypes",
    "subscribedEventTypes",
    "locales",
    "residencyClass",
    "deploymentProfiles",
  ];
  if (keys(app.manifest, manifestFields, `${at}.manifest`, errors)) {
    texts(app.manifest, ["appVersion", "kernelRange", "sdkRange"], `${at}.manifest`, errors);
    if (!SEMVER.test(app.manifest.appVersion ?? ""))
      errors.push(`${at}.manifest.appVersion: semver zorunlu`);
    arrays(
      app.manifest,
      ["kernelPrimitiveIds", "requiredCapabilityIds", "locales", "deploymentProfiles"],
      `${at}.manifest`,
      errors,
      1,
    );
    arrays(
      app.manifest,
      ["optionalCapabilityIds", "publishedEventTypes", "subscribedEventTypes"],
      `${at}.manifest`,
      errors,
    );
    if (!["none", "region-pinned", "jurisdiction-bound"].includes(app.manifest.residencyClass))
      errors.push(`${at}.manifest.residencyClass: geçersiz`);
  }
  validateSdk(app.sdkDelivery, "app-core-and-assembly", `${at}.sdkDelivery`, errors);
  validateEnterprise(app.enterpriseDelivery, `${at}.enterpriseDelivery`, errors);
  if (app.manifest?.sdkRange !== app.sdkDelivery?.sdkRange)
    errors.push(`${at}: manifest/sdk sdkRange farklı`);
}

export function validateModuleDefinition(node, errors) {
  const module = node.moduleDefinition;
  const at = `${node.id}.moduleDefinition`;
  const fields = [
    "artifactKind",
    "moduleId",
    "moduleSlug",
    "appId",
    "appCoreModuleId",
    "boundedContext",
    "ownedData",
    "lifecycleAuthority",
    "providedPorts",
    "consumedPorts",
    "publishedEvents",
    "subscribedEvents",
    "capabilityIds",
    "permissionIds",
    "routeContributions",
    "directAppImportsAllowed",
    "directModuleImportsAllowed",
    "kernelInternalsAllowed",
    "crossContextWritesAllowed",
    "healthContract",
    "versioning",
    "migration",
    "sdkDelivery",
    "enterpriseDelivery",
  ];
  if (!keys(module, fields, at, errors)) return;
  if (!["app-core-module", "app-module"].includes(module.artifactKind))
    errors.push(`${at}.artifactKind: geçersiz`);
  texts(
    module,
    ["moduleId", "moduleSlug", "appId", "appCoreModuleId", "boundedContext"],
    at,
    errors,
  );
  if (!SLUG.test(module.moduleSlug ?? "")) errors.push(`${at}.moduleSlug: kebab-case zorunlu`);
  arrays(
    module,
    ["ownedData", "lifecycleAuthority", "providedPorts", "capabilityIds", "permissionIds"],
    at,
    errors,
    1,
  );
  arrays(
    module,
    ["consumedPorts", "publishedEvents", "subscribedEvents", "routeContributions"],
    at,
    errors,
  );
  for (const name of [
    "directAppImportsAllowed",
    "directModuleImportsAllowed",
    "kernelInternalsAllowed",
    "crossContextWritesAllowed",
  ])
    literal(module[name], false, `${at}.${name}`, errors);
  if (
    keys(
      module.healthContract,
      ["healthPath", "readinessPath", "exposesTenantOrDomainData"],
      `${at}.healthContract`,
      errors,
    )
  ) {
    for (const name of ["healthPath", "readinessPath"])
      if (!/^\//.test(module.healthContract[name] ?? ""))
        errors.push(`${at}.healthContract.${name}: / ile başlamalı`);
    literal(
      module.healthContract.exposesTenantOrDomainData,
      false,
      `${at}.healthContract.exposesTenantOrDomainData`,
      errors,
    );
  }
  if (
    keys(
      module.versioning,
      ["moduleVersion", "contractVersion", "compatibilityPolicy"],
      `${at}.versioning`,
      errors,
    )
  ) {
    for (const name of ["moduleVersion", "contractVersion"])
      if (!SEMVER.test(module.versioning[name] ?? ""))
        errors.push(`${at}.versioning.${name}: semver zorunlu`);
    literal(
      module.versioning.compatibilityPolicy,
      "backward-compatible-within-major",
      `${at}.versioning.compatibilityPolicy`,
      errors,
    );
  }
  if (
    keys(module.migration, ["authority", "mode", "downgradeRequired"], `${at}.migration`, errors)
  ) {
    texts(module.migration, ["authority"], `${at}.migration`, errors);
    if (!["append-only", "expand-contract", "reversible-backfill"].includes(module.migration.mode))
      errors.push(`${at}.migration.mode: geçersiz`);
    literal(module.migration.downgradeRequired, true, `${at}.migration.downgradeRequired`, errors);
  }
  validateSdk(module.sdkDelivery, "module", `${at}.sdkDelivery`, errors);
  validateEnterprise(module.enterpriseDelivery, `${at}.enterpriseDelivery`, errors);
}

export function report(label, summary, errors) {
  console.log(`[${label}] ${summary} · ihlal=${errors.length}`);
  if (!errors.length) {
    console.log(`SONUÇ: YEŞİL — ${label} sözleşmesi tutarlı.`);
    return;
  }
  console.error(`\nSONUÇ: KIRMIZI — ${errors.length} ihlal:`);
  for (const error of errors.slice(0, 100)) console.error(`  - ${error}`);
  if (errors.length > 100) console.error(`  ... +${errors.length - 100}`);
  process.exitCode = 1;
}
