import * as Schemas from "@/schemas";
import { describe, expect, it } from "vitest";

const EXPECTED_KERNEL_AREA_IDS = [
  "k-agent-runtime",
  "k-archetype-bayraklari",
  "k-control-planes",
  "k-granulerlik",
  "k-sozlesme",
  "k-surface",
  "k-terminoloji",
  "k-archetype-mode-profile",
  "k-archetype-computation",
  "k-archetype-fieldtypes",
  "k-surface-consumer",
  "k-edge-gateway",
  "k-kpi-registry",
  "k-calendar-capacity",
] as const;

type ParseableSchema = {
  safeParse(value: unknown): { success: boolean };
};

const KernelIntegrationSchema = (
  Schemas as unknown as { KernelIntegrationSchema?: ParseableSchema }
).KernelIntegrationSchema;
const KERNEL_AREA_IDS = (Schemas as unknown as { KERNEL_AREA_IDS?: readonly string[] })
  .KERNEL_AREA_IDS;

const publicBoundary = {
  directKernelInternalsAllowed: false,
  directKernelDatabaseAccessAllowed: false,
  crossContextWritesAllowed: false,
} as const;

const common = {
  kernelRef: "app-kernel",
  contractRefs: ["docs/adr-K1-kernel-kimlik.md", "docs/kernel-sdk-app-delivery-sequence.md"],
  publicBoundary,
  plannedTestRefs: ["planned-test:kernel:public-boundary-contract"],
} as const;

const validContracts = {
  root: {
    role: "root",
    ...common,
    areaIds: EXPECTED_KERNEL_AREA_IDS,
  },
  provider: {
    role: "provider",
    ...common,
    areaId: "k-archetype-mode-profile",
    providerClass: "primitive",
    scope: "optional",
    providedPrimitiveIds: ["k-mode"],
    publicContractRefs: ["kernel.mode-profile.v1"],
  },
  "sdk-bridge": {
    role: "sdk-bridge",
    ...common,
    areaId: "k-sozlesme",
    sdkContractRef: "sdk-public-contract",
    sourceProviderIds: ["k-tenancy", "k-authz", "k-capability", "k-bus", "k-policy-pdp"],
    deterministic: true,
    generatedOutputManualEditAllowed: false,
  },
  consumer: {
    role: "consumer",
    ...common,
    areaIds: ["k-sozlesme", "k-surface"],
    bindingSource: "app-manifest",
    accessPath: "public-sdk-only",
    sdkContractRef: "sdk-public-contract",
    requiredPrimitiveIds: ["k-tenancy", "k-authz", "k-capability", "k-bus", "k-policy-pdp"],
  },
  contributor: {
    role: "contributor",
    ...common,
    areaId: "k-archetype-mode-profile",
    contributionKind: "specification",
    targetProviderIds: ["k-mode"],
    runtimeProviderClaimAllowed: false,
  },
  "not-applicable": {
    role: "not-applicable",
    reason: "Bu governance kaydı kernel runtime artefaktı üretmez veya tüketmez.",
  },
} as const;

function minimalNode(kernelIntegration?: unknown) {
  return {
    id: "kernel-integration-fixture",
    level: "feature",
    title: "Kernel Integration Fixture",
    slug: "kernel-integration-fixture",
    ...(kernelIntegration === undefined ? {} : { kernelIntegration }),
  };
}

describe("KernelIntegrationSchema", () => {
  it("exports the fixed fourteen-area kernel WBS contract", () => {
    expect(KERNEL_AREA_IDS, "KERNEL_AREA_IDS schema export'u eksik").toBeDefined();
    expect(KERNEL_AREA_IDS).toEqual(EXPECTED_KERNEL_AREA_IDS);
    expect(new Set(KERNEL_AREA_IDS)).toHaveLength(14);
  });

  it("keeps TaskNode.kernelIntegration optional for legacy fixtures", () => {
    const parsed = Schemas.TaskNodeSchema.parse(minimalNode()) as unknown as {
      kernelIntegration?: unknown;
    };

    expect(parsed.kernelIntegration).toBeUndefined();
  });

  it.each(Object.entries(validContracts))(
    "accepts the %s discriminated-union branch",
    (_, value) => {
      expect(KernelIntegrationSchema, "KernelIntegrationSchema export'u eksik").toBeDefined();
      if (!KernelIntegrationSchema) return;

      expect(KernelIntegrationSchema.safeParse(value).success).toBe(true);
      expect(Schemas.TaskNodeSchema.safeParse(minimalNode(value)).success).toBe(true);
    },
  );

  it("rejects unknown roles and cross-branch provider fields", () => {
    expect(KernelIntegrationSchema, "KernelIntegrationSchema export'u eksik").toBeDefined();
    if (!KernelIntegrationSchema) return;

    expect(KernelIntegrationSchema.safeParse({ role: "implicit" }).success).toBe(false);
    expect(
      KernelIntegrationSchema.safeParse({
        ...validContracts.consumer,
        providedPrimitiveIds: ["k-shadow-provider"],
      }).success,
    ).toBe(false);
  });

  it("rejects area identifiers outside the fixed screenshot-backed set", () => {
    expect(KernelIntegrationSchema, "KernelIntegrationSchema export'u eksik").toBeDefined();
    if (!KernelIntegrationSchema) return;

    expect(
      KernelIntegrationSchema.safeParse({
        ...validContracts.provider,
        areaId: "k-unreviewed-area",
      }).success,
    ).toBe(false);
  });

  it.each([
    "directKernelInternalsAllowed",
    "directKernelDatabaseAccessAllowed",
    "crossContextWritesAllowed",
  ] as const)("fails closed when publicBoundary.%s is true", (flag) => {
    expect(KernelIntegrationSchema, "KernelIntegrationSchema export'u eksik").toBeDefined();
    if (!KernelIntegrationSchema) return;

    expect(
      KernelIntegrationSchema.safeParse({
        ...validContracts.consumer,
        publicBoundary: { ...publicBoundary, [flag]: true },
      }).success,
    ).toBe(false);
  });

  it("requires a concrete reason for the not-applicable branch", () => {
    expect(KernelIntegrationSchema, "KernelIntegrationSchema export'u eksik").toBeDefined();
    if (!KernelIntegrationSchema) return;

    expect(
      KernelIntegrationSchema.safeParse({ role: "not-applicable", reason: "  " }).success,
    ).toBe(false);
  });
});
