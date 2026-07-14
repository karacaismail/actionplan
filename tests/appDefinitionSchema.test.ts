import { AppDefinitionSchema } from "@/schemas/app-definition";
import { describe, expect, it } from "vitest";

function validAppDefinition() {
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
    requiredModuleIds: ["clinic-core", "clinic-scheduling"],
    optionalModuleIds: ["clinic-insurance"],
    jurisdictions: ["TR"],
    dataClasses: ["health-data", "pii"],
    manifest: {
      appVersion: "1.0.0",
      kernelRange: ">=2.0.0 <3.0.0",
      sdkRange: ">=2.0.0 <3.0.0",
      kernelPrimitiveIds: ["k-tenancy", "k-authz", "k-audit"],
      requiredCapabilityIds: ["clinic:core"],
      optionalCapabilityIds: ["clinic:insurance"],
      publishedEventTypes: ["clinic.appointment.created"],
      subscribedEventTypes: [],
      locales: ["tr-TR", "en-US"],
      residencyClass: "jurisdiction-bound",
      deploymentProfiles: ["standalone", "multi-region"],
    },
    sdkDelivery: {
      required: true,
      sdkContractRef: "sdk-public-contract",
      sdkRange: ">=2.0.0 <3.0.0",
      templateKind: "app-core-and-assembly",
      templateRef: "sdk-app-core-template",
      generatorContractRef: "sdk-generator-guardrails",
      deterministic: true,
      generatedHeaderRequired: true,
      manualEditAllowed: false,
      publicPortsOnly: true,
      kernelInternalsAllowed: false,
      directAppImportsAllowed: false,
      compatibilityTestRefs: ["tests/clinic/sdk-compatibility.test.ts"],
      negativeTestRefs: ["tests/clinic/sdk-boundary-negative.test.ts"],
    },
    enterpriseDelivery: {
      targetGrade: "enterprise",
      deliveryPolicy: "enterprise-only",
      mvpAllowed: false,
      baselineVersion: "1.0.0",
      baselineStatus: "approved",
      approvalRef: "decision:clinic-enterprise-baseline",
      riskTier: "critical",
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
        latency: "critical read p95 <=200ms",
        throughput: ">=500 requests/second",
        scalability: ">=10000 active tenants",
        rto: "<=30 minutes",
        rpo: "<=5 minutes",
        retention: "jurisdiction policy controlled",
        cost: "tenant COGS budget is measured per release",
      },
      controlRefs: ["enterprise-delivery", "sdk-development"],
      evidence: {
        expected: [
          {
            id: "clinic-enterprise-ci",
            criterionId: "clinic-ac-001",
            phase: "test-qa",
            kind: "ci-run",
            locatorPattern: "https://github.com/example/platform/actions/runs/*",
            owner: "qa-team",
            required: true,
          },
        ],
        actual: [
          {
            id: "clinic-enterprise-ci-run-42",
            expectationId: "clinic-enterprise-ci",
            kind: "ci-run",
            uri: "https://github.com/example/platform/actions/runs/42",
            producedAt: "2026-07-14T10:00:00Z",
            verifiedBy: "release-owner",
            verifiedAt: "2026-07-14T10:15:00Z",
          },
        ],
      },
    },
  };
}

describe("AppDefinitionSchema", () => {
  it("accepts an enterprise-only app assembled through the SDK", () => {
    expect(AppDefinitionSchema.parse(validAppDefinition())).toBeTruthy();
  });

  it("requires structured classification and commercial entitlement metadata", () => {
    const withoutClassification = validAppDefinition();
    // @ts-expect-error negative schema fixture
    withoutClassification.classification = undefined;
    expect(() => AppDefinitionSchema.parse(withoutClassification)).toThrow();

    const withoutCommercialModel = validAppDefinition();
    // @ts-expect-error negative schema fixture
    withoutCommercialModel.commercialModel = undefined;
    expect(() => AppDefinitionSchema.parse(withoutCommercialModel)).toThrow();
  });

  it("rejects MVP grade or an MVP-enabled delivery policy", () => {
    const grade = validAppDefinition();
    grade.enterpriseDelivery.targetGrade = "mvp";
    expect(() => AppDefinitionSchema.parse(grade)).toThrow();

    const allowed = validAppDefinition();
    allowed.enterpriseDelivery.mvpAllowed = true;
    expect(() => AppDefinitionSchema.parse(allowed)).toThrow();
  });

  it("requires the app-core module and keeps it first in required modules", () => {
    const missing = validAppDefinition();
    missing.appCoreModuleId = "";
    expect(() => AppDefinitionSchema.parse(missing)).toThrow();

    const notFirst = validAppDefinition();
    notFirst.requiredModuleIds = ["clinic-scheduling", "clinic-core"];
    expect(() => AppDefinitionSchema.parse(notFirst)).toThrow();
  });

  it("rejects optional/disabled SDK use and manual generated edits", () => {
    const optionalSdk = validAppDefinition();
    optionalSdk.sdkDelivery.required = false;
    expect(() => AppDefinitionSchema.parse(optionalSdk)).toThrow();

    const manualEdit = validAppDefinition();
    manualEdit.sdkDelivery.manualEditAllowed = true;
    expect(() => AppDefinitionSchema.parse(manualEdit)).toThrow();
  });

  it("rejects direct app imports and kernel-internal access", () => {
    const directImport = validAppDefinition();
    directImport.sdkDelivery.directAppImportsAllowed = true;
    expect(() => AppDefinitionSchema.parse(directImport)).toThrow();

    const kernelInternal = validAppDefinition();
    kernelInternal.sdkDelivery.kernelInternalsAllowed = true;
    expect(() => AppDefinitionSchema.parse(kernelInternal)).toThrow();
  });

  it("keeps expected evidence separate from actual verified artifacts", () => {
    const parsed = AppDefinitionSchema.parse(validAppDefinition());
    expect(parsed.enterpriseDelivery.evidence.expected[0]?.locatorPattern).toContain("runs/*");
    expect(parsed.enterpriseDelivery.evidence.actual[0]?.uri).toContain("runs/42");

    const unknownExpectation = validAppDefinition();
    unknownExpectation.enterpriseDelivery.evidence.actual[0].expectationId = "unknown-plan";
    expect(() => AppDefinitionSchema.parse(unknownExpectation)).toThrow();
  });
});
