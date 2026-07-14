import { TaskNodeSchema } from "@/schemas/task";
import { describe, expect, it } from "vitest";

function enterpriseDelivery() {
  return {
    targetGrade: "enterprise",
    deliveryPolicy: "enterprise-only",
    mvpAllowed: false,
    baselineVersion: "1.0.0",
    baselineStatus: "approved",
    approvalRef: "decision:clinic-enterprise-baseline",
    riskTier: "high",
    owners: {
      product: "product-team",
      architecture: "architecture-team",
      security: "security-team",
      data: "data-team",
      ux: "ux-team",
      qa: "qa-team",
      operations: "operations-team",
      compliance: "compliance-team",
      release: "release-team",
    },
    nfrBudgets: {
      availability: ">=99.95%",
      latency: "critical path p95 <=200ms",
      throughput: ">=250 operations/second",
      scalability: ">=10000 active tenants",
      rto: "<=30 minutes",
      rpo: "<=5 minutes",
      retention: "jurisdiction policy controlled",
      cost: "COGS budget is measured per release",
    },
    controlRefs: ["enterprise-delivery", "sdk-development"],
    evidence: {
      expected: [
        {
          id: "clinic-contract-suite",
          criterionId: "clinic-ac-001",
          phase: "test-qa",
          kind: "test-report",
          locatorPattern: "reports/clinic/contract-suite.*",
          owner: "qa-team",
          required: true,
        },
      ],
      actual: [],
    },
  };
}

function sdkDelivery(templateKind: "app-core-and-assembly" | "module") {
  return {
    required: true,
    sdkContractRef: "sdk-public-contract",
    sdkRange: ">=2.0.0 <3.0.0",
    templateKind,
    templateRef: templateKind === "module" ? "sdk-module-template" : "sdk-app-core-template",
    generatorContractRef: "sdk-generator-guardrails",
    deterministic: true,
    generatedHeaderRequired: true,
    manualEditAllowed: false,
    publicPortsOnly: true,
    kernelInternalsAllowed: false,
    directAppImportsAllowed: false,
    compatibilityTestRefs: ["tests/clinic/sdk-compatibility.test.ts"],
    negativeTestRefs: ["tests/clinic/sdk-boundary-negative.test.ts"],
  };
}

function appDefinition() {
  return {
    artifactKind: "sellable-app",
    commercialUnit: "independent-app",
    productSlug: "clinic",
    canonicalName: "Clinic",
    classification: {
      primaryCategory: "sector-app",
      portfolioRefs: ["healthcare"],
      sectorProfiles: ["clinic"],
      distributionProfiles: [],
      stackProfiles: [],
      editionProfiles: [],
    },
    commercialModel: {
      licensingModel: "enterprise-subscription",
      entitlementModel: "capability-based",
      packagingModel: "independently-deployable-app",
      salesMotion: "enterprise-contract",
      supportModel: "enterprise-sla",
      entitlementIds: ["clinic:core"],
    },
    valueProposition: "Klinik operasyonlarını uçtan uca ve denetlenebilir biçimde yönetir.",
    targetOrganizations: ["Özel klinikler"],
    buyerRoles: ["Klinik sahibi"],
    userRoles: ["Hekim", "Klinik yöneticisi"],
    businessOutcomes: ["Randevudan tahsilata kadar tek doğruluk kaynağı"],
    coreJourneys: ["Hasta kabulünden hizmet ve faturalandırmaya kadar uçtan uca akış"],
    nonGoals: ["Başka bir app'in iç modülünü doğrudan tüketmek"],
    capabilityIds: ["clinic:core"],
    appCoreModuleId: "clinic-core",
    requiredModuleIds: ["clinic-core"],
    optionalModuleIds: [],
    jurisdictions: ["TR"],
    dataClasses: ["health-data", "pii"],
    manifest: {
      appVersion: "1.0.0",
      kernelRange: ">=2.0.0 <3.0.0",
      sdkRange: ">=2.0.0 <3.0.0",
      kernelPrimitiveIds: ["k-tenancy", "k-authz"],
      requiredCapabilityIds: ["clinic:core"],
      optionalCapabilityIds: [],
      publishedEventTypes: ["clinic.appointment.created"],
      subscribedEventTypes: [],
      locales: ["tr-TR"],
      residencyClass: "jurisdiction-bound",
      deploymentProfiles: ["standalone"],
    },
    sdkDelivery: sdkDelivery("app-core-and-assembly"),
    enterpriseDelivery: enterpriseDelivery(),
  };
}

function moduleDefinition(artifactKind: "app-core-module" | "app-module" = "app-module") {
  const moduleId = artifactKind === "app-core-module" ? "clinic-core" : "clinic-scheduling";
  return {
    artifactKind,
    moduleId,
    moduleSlug: artifactKind === "app-core-module" ? "core" : "scheduling",
    appId: "clinic",
    appCoreModuleId: "clinic-core",
    boundedContext: artifactKind === "app-core-module" ? "Clinic Core" : "Clinic Scheduling",
    ownedData: [artifactKind === "app-core-module" ? "clinic-configuration" : "appointment"],
    lifecycleAuthority: [
      artifactKind === "app-core-module" ? "clinic-lifecycle" : "appointment-lifecycle",
    ],
    providedPorts: [artifactKind === "app-core-module" ? "clinic.core.v1" : "clinic.scheduling.v1"],
    consumedPorts: [],
    publishedEvents: [],
    subscribedEvents: [],
    capabilityIds: [artifactKind === "app-core-module" ? "clinic:core" : "clinic:scheduling"],
    permissionIds: [
      artifactKind === "app-core-module" ? "clinic:core:read" : "clinic:scheduling:read",
    ],
    routeContributions: [],
    directAppImportsAllowed: false,
    directModuleImportsAllowed: false,
    kernelInternalsAllowed: false,
    crossContextWritesAllowed: false,
    healthContract: {
      healthPath: "/healthz",
      readinessPath: "/ready",
      exposesTenantOrDomainData: false,
    },
    versioning: {
      moduleVersion: "1.0.0",
      contractVersion: "1.0.0",
      compatibilityPolicy: "backward-compatible-within-major",
    },
    migration: {
      authority: moduleId,
      mode: "expand-contract",
      downgradeRequired: true,
    },
    sdkDelivery: sdkDelivery("module"),
    enterpriseDelivery: enterpriseDelivery(),
  };
}

function task(level: "app" | "module" | "feature" = "app") {
  return {
    id: level === "module" ? "clinic-scheduling" : "clinic",
    level,
    title: level === "module" ? "Clinic Scheduling" : "Clinic",
    slug: level === "module" ? "clinic-scheduling" : "clinic",
  };
}

describe("TaskNode app/module definition integration", () => {
  it("keeps legacy nodes valid while the optional fields are rolled out", () => {
    expect(TaskNodeSchema.safeParse(task()).success).toBe(true);
  });

  it("accepts an app definition only on a sellable app-level task", () => {
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "sellable-app",
        appDefinition: appDefinition(),
      }).success,
    ).toBe(true);
  });

  it("rejects an app definition on a non-sellable artifact or non-app level", () => {
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "portfolio-facet",
        appDefinition: appDefinition(),
      }).success,
    ).toBe(false);
    expect(
      TaskNodeSchema.safeParse({
        ...task("module"),
        artifactKind: "sellable-app",
        appDefinition: appDefinition(),
      }).success,
    ).toBe(false);
  });

  it.each(["app-core-module", "app-module"] as const)(
    "accepts a %s definition only on a matching module-level task",
    (artifactKind) => {
      expect(
        TaskNodeSchema.safeParse({
          ...task("module"),
          artifactKind,
          moduleDefinition: moduleDefinition(artifactKind),
        }).success,
      ).toBe(true);
    },
  );

  it("rejects a module definition on the wrong level, outer kind, or mismatched module kind", () => {
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "app-module",
        moduleDefinition: moduleDefinition(),
      }).success,
    ).toBe(false);
    expect(
      TaskNodeSchema.safeParse({
        ...task("module"),
        artifactKind: "governance",
        moduleDefinition: moduleDefinition(),
      }).success,
    ).toBe(false);
    expect(
      TaskNodeSchema.safeParse({
        ...task("module"),
        artifactKind: "app-core-module",
        moduleDefinition: moduleDefinition("app-module"),
      }).success,
    ).toBe(false);
  });

  it("requires canonicalId for a legacy alias", () => {
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "legacy-alias",
        canonicalId: "app-clinic-management",
      }).success,
    ).toBe(true);
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "legacy-alias",
      }).success,
    ).toBe(false);
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "legacy-alias",
        canonicalId: "",
      }).success,
    ).toBe(false);
  });

  it("rejects canonicalId outside a legacy alias", () => {
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        artifactKind: "sellable-app",
        canonicalId: "app-clinic-management",
      }).success,
    ).toBe(false);
    expect(
      TaskNodeSchema.safeParse({
        ...task("app"),
        canonicalId: "app-clinic-management",
      }).success,
    ).toBe(false);
  });
});
