import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

function validModuleDefinition() {
  return {
    artifactKind: "app-module",
    moduleId: "clinic-scheduling",
    moduleSlug: "scheduling",
    appId: "clinic",
    appCoreModuleId: "clinic-core",
    boundedContext: "Clinic Scheduling",
    ownedData: ["appointment"],
    lifecycleAuthority: ["appointment-lifecycle"],
    providedPorts: ["clinic.scheduling.v1"],
    consumedPorts: ["platform.clock.v1"],
    publishedEvents: ["clinic.appointment.created"],
    subscribedEvents: [],
    capabilityIds: ["clinic:scheduling"],
    permissionIds: ["clinic:scheduling:read", "clinic:scheduling:write"],
    routeContributions: ["clinic-appointments"],
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
      authority: "clinic-scheduling",
      mode: "expand-contract",
      downgradeRequired: true,
    },
    sdkDelivery: {
      required: true,
      sdkContractRef: "sdk-public-contract",
      sdkRange: ">=2.0.0 <3.0.0",
      templateKind: "module",
      templateRef: "sdk-module-template",
      generatorContractRef: "sdk-generator-guardrails",
      deterministic: true,
      generatedHeaderRequired: true,
      manualEditAllowed: false,
      publicPortsOnly: true,
      kernelInternalsAllowed: false,
      directAppImportsAllowed: false,
      compatibilityTestRefs: ["tests/clinic/scheduling/sdk-compatibility.test.ts"],
      negativeTestRefs: ["tests/clinic/scheduling/module-boundary-negative.test.ts"],
    },
    enterpriseDelivery: {
      targetGrade: "enterprise",
      deliveryPolicy: "enterprise-only",
      mvpAllowed: false,
      baselineVersion: "1.0.0",
      baselineStatus: "approved",
      approvalRef: "decision:clinic-scheduling-enterprise-baseline",
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
        latency: "critical command p95 <=200ms",
        throughput: ">=250 commands/second",
        scalability: ">=100000 appointments/day",
        rto: "<=30 minutes",
        rpo: "<=5 minutes",
        retention: "jurisdiction policy controlled",
        cost: "module COGS budget is measured per release",
      },
      controlRefs: ["enterprise-delivery", "sdk-development"],
      evidence: {
        expected: [
          {
            id: "scheduling-contract-suite",
            criterionId: "scheduling-ac-001",
            phase: "test-qa",
            kind: "test-report",
            locatorPattern: "reports/clinic/scheduling/contract-suite.*",
            owner: "qa-team",
            required: true,
          },
        ],
        actual: [] as Array<Record<string, string>>,
      },
    },
  };
}

describe("ModuleDefinitionSchema", () => {
  it("accepts an enterprise-only module generated through the SDK", () => {
    expect(ModuleDefinitionSchema.parse(validModuleDefinition())).toBeTruthy();
  });

  it("rejects MVP delivery", () => {
    const module = validModuleDefinition();
    module.enterpriseDelivery.targetGrade = "mvp";
    expect(() => ModuleDefinitionSchema.parse(module)).toThrow();
  });

  it("requires an app-core predecessor", () => {
    const module = validModuleDefinition();
    module.appCoreModuleId = "";
    expect(() => ModuleDefinitionSchema.parse(module)).toThrow();
  });

  it("rejects disabled SDK use or manual generated edits", () => {
    const disabled = validModuleDefinition();
    disabled.sdkDelivery.required = false;
    expect(() => ModuleDefinitionSchema.parse(disabled)).toThrow();

    const manual = validModuleDefinition();
    manual.sdkDelivery.manualEditAllowed = true;
    expect(() => ModuleDefinitionSchema.parse(manual)).toThrow();
  });

  it("rejects direct imports, kernel internals, and cross-context writes", () => {
    for (const field of [
      "directAppImportsAllowed",
      "directModuleImportsAllowed",
      "kernelInternalsAllowed",
      "crossContextWritesAllowed",
    ] as const) {
      const module = validModuleDefinition();
      module[field] = true;
      expect(() => ModuleDefinitionSchema.parse(module), field).toThrow();
    }
  });

  it("rejects module SDK boundary bypasses", () => {
    const kernelInternal = validModuleDefinition();
    kernelInternal.sdkDelivery.kernelInternalsAllowed = true;
    expect(() => ModuleDefinitionSchema.parse(kernelInternal)).toThrow();

    const directApp = validModuleDefinition();
    directApp.sdkDelivery.directAppImportsAllowed = true;
    expect(() => ModuleDefinitionSchema.parse(directApp)).toThrow();
  });

  it("keeps expected evidence separate and rejects unplanned actual evidence", () => {
    const module = validModuleDefinition();
    module.enterpriseDelivery.evidence.actual = [
      {
        id: "scheduling-report-42",
        expectationId: "unknown-expectation",
        kind: "test-report",
        uri: "reports/clinic/scheduling/contract-suite-42.xml",
        producedAt: "2026-07-14T10:00:00Z",
        verifiedBy: "release-owner",
        verifiedAt: "2026-07-14T10:15:00Z",
      },
    ];
    expect(() => ModuleDefinitionSchema.parse(module)).toThrow();
  });
});
