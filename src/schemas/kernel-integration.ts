import { z } from "zod";

/**
 * Kernel WBS integration is orthogonal to the seven-level WBS hierarchy and to
 * app/module identity. It records how every task relates to the screenshot-backed
 * Kernel 12.1-12.14 contract without turning Kernel into a sellable app.
 */
export const KERNEL_AREA_IDS = [
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

export const KernelAreaIdSchema = z.enum(KERNEL_AREA_IDS);
export type KernelAreaId = z.infer<typeof KernelAreaIdSchema>;

export const KernelPublicBoundarySchema = z
  .object({
    directKernelInternalsAllowed: z.literal(false),
    directKernelDatabaseAccessAllowed: z.literal(false),
    crossContextWritesAllowed: z.literal(false),
  })
  .strict();
export type KernelPublicBoundary = z.infer<typeof KernelPublicBoundarySchema>;

const KernelIntegrationCommonShape = {
  kernelRef: z.literal("app-kernel"),
  contractRefs: z.array(z.string().min(1)).min(1),
  publicBoundary: KernelPublicBoundarySchema,
  /** Planned checks are expectations, never evidence that runtime code passed. */
  plannedTestRefs: z.array(z.string().min(1)).min(1),
};

export const KernelRootIntegrationSchema = z
  .object({
    role: z.literal("root"),
    ...KernelIntegrationCommonShape,
    areaIds: z.array(KernelAreaIdSchema).length(KERNEL_AREA_IDS.length),
  })
  .strict();

export const KernelProviderIntegrationSchema = z
  .object({
    role: z.literal("provider"),
    ...KernelIntegrationCommonShape,
    areaId: KernelAreaIdSchema,
    providerClass: z.enum(["schema", "control-plane", "primitive", "extension"]),
    scope: z.enum(["required-core", "optional", "extension"]),
    providedPrimitiveIds: z.array(z.string().min(1)).min(1),
    publicContractRefs: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const KernelSdkBridgeIntegrationSchema = z
  .object({
    role: z.literal("sdk-bridge"),
    ...KernelIntegrationCommonShape,
    areaId: KernelAreaIdSchema,
    sdkContractRef: z.string().min(1),
    sourceProviderIds: z.array(z.string().min(1)).min(1),
    deterministic: z.literal(true),
    generatedOutputManualEditAllowed: z.literal(false),
  })
  .strict();

export const KernelConsumerIntegrationSchema = z
  .object({
    role: z.literal("consumer"),
    ...KernelIntegrationCommonShape,
    areaIds: z.array(KernelAreaIdSchema).min(1),
    bindingSource: z.enum(["app-manifest", "owning-app-manifest", "delivery-context"]),
    accessPath: z.literal("public-sdk-only"),
    sdkContractRef: z.literal("sdk-public-contract"),
    /** Resolved projection; appDefinition.manifest remains the app-level authority. */
    requiredPrimitiveIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const KernelContributorIntegrationSchema = z
  .object({
    role: z.literal("contributor"),
    ...KernelIntegrationCommonShape,
    areaId: KernelAreaIdSchema,
    contributionKind: z.enum([
      "specification",
      "sibling-runtime",
      "governance",
      "example",
      "implementation-program",
      "control-plane-projection",
      "compatibility-alias",
      "provider-adapter",
    ]),
    targetProviderIds: z.array(z.string().min(1)).min(1),
    runtimeProviderClaimAllowed: z.literal(false),
  })
  .strict();

export const KernelNotApplicableIntegrationSchema = z
  .object({
    role: z.literal("not-applicable"),
    reason: z.string().trim().min(12),
  })
  .strict();

export const KernelIntegrationSchema = z.discriminatedUnion("role", [
  KernelRootIntegrationSchema,
  KernelProviderIntegrationSchema,
  KernelSdkBridgeIntegrationSchema,
  KernelConsumerIntegrationSchema,
  KernelContributorIntegrationSchema,
  KernelNotApplicableIntegrationSchema,
]);

export type KernelIntegration = z.infer<typeof KernelIntegrationSchema>;
