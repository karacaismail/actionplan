import { z } from "zod";

const NonEmptyTextSchema = z.string().trim().min(1);
const SemverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "semantic version bekleniyor");

export const EnterpriseEvidenceKindSchema = z.enum([
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
export type EnterpriseEvidenceKind = z.infer<typeof EnterpriseEvidenceKindSchema>;

export const EnterpriseDeliveryPhaseSchema = z.enum([
  "requirements",
  "test-plan",
  "db-schema",
  "development",
  "test-qa",
  "verification",
  "release-maintenance",
]);
export type EnterpriseDeliveryPhase = z.infer<typeof EnterpriseDeliveryPhaseSchema>;

/** Planlanan kanıt. Bu kayıt gerçek bir çalıştırmanın sonucu değildir. */
export const EvidenceExpectationSchema = z
  .object({
    id: NonEmptyTextSchema,
    criterionId: NonEmptyTextSchema,
    phase: EnterpriseDeliveryPhaseSchema,
    kind: EnterpriseEvidenceKindSchema,
    locatorPattern: NonEmptyTextSchema,
    owner: NonEmptyTextSchema,
    required: z.boolean().default(true),
  })
  .strict();
export type EvidenceExpectation = z.infer<typeof EvidenceExpectationSchema>;

/** Gerçek ve bağımsız doğrulanmış kanıt artefaktı. */
export const EvidenceArtifactSchema = z
  .object({
    id: NonEmptyTextSchema,
    expectationId: NonEmptyTextSchema,
    kind: EnterpriseEvidenceKindSchema,
    uri: NonEmptyTextSchema,
    producedAt: z.string().datetime({ offset: true }),
    verifiedBy: NonEmptyTextSchema,
    verifiedAt: z.string().datetime({ offset: true }),
    commitSha: z
      .string()
      .regex(/^[0-9a-f]{7,64}$/i)
      .optional(),
  })
  .strict();
export type EvidenceArtifact = z.infer<typeof EvidenceArtifactSchema>;

/** Beklenen kanıt ile gerçek kanıtı aynı diziye karıştırmayı engeller. */
export const EnterpriseEvidenceContractSchema = z
  .object({
    expected: z.array(EvidenceExpectationSchema).min(1),
    actual: z.array(EvidenceArtifactSchema).default([]),
  })
  .strict()
  .superRefine((contract, ctx) => {
    const expectedById = new Map(contract.expected.map((item) => [item.id, item]));
    if (expectedById.size !== contract.expected.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected"],
        message: "evidence expectation id değerleri benzersiz olmalı",
      });

    const actualIds = new Set<string>();
    for (const [index, artifact] of contract.actual.entries()) {
      if (actualIds.has(artifact.id))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual", index, "id"],
          message: "evidence artifact id değerleri benzersiz olmalı",
        });
      actualIds.add(artifact.id);

      const expectation = expectedById.get(artifact.expectationId);
      if (!expectation)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual", index, "expectationId"],
          message: "gerçek kanıt planlanmış bir expectation kaydına bağlanmalı",
        });
      else if (expectation.kind !== artifact.kind)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual", index, "kind"],
          message: "gerçek kanıt türü expectation türüyle aynı olmalı",
        });
    }
  });
export type EnterpriseEvidenceContract = z.infer<typeof EnterpriseEvidenceContractSchema>;

export const EnterpriseOwnersSchema = z
  .object({
    product: NonEmptyTextSchema,
    architecture: NonEmptyTextSchema,
    security: NonEmptyTextSchema,
    data: NonEmptyTextSchema,
    ux: NonEmptyTextSchema,
    qa: NonEmptyTextSchema,
    operations: NonEmptyTextSchema,
    compliance: NonEmptyTextSchema,
    release: NonEmptyTextSchema,
  })
  .strict();

export const EnterpriseNfrBudgetsSchema = z
  .object({
    availability: NonEmptyTextSchema,
    latency: NonEmptyTextSchema,
    throughput: NonEmptyTextSchema,
    scalability: NonEmptyTextSchema,
    rto: NonEmptyTextSchema,
    rpo: NonEmptyTextSchema,
    retention: NonEmptyTextSchema,
    cost: NonEmptyTextSchema,
  })
  .strict();

export const EnterpriseDeliverySchema = z
  .object({
    targetGrade: z.literal("enterprise"),
    deliveryPolicy: z.literal("enterprise-only"),
    mvpAllowed: z.literal(false),
    baselineVersion: SemverSchema,
    baselineStatus: z.enum(["draft", "approved", "baselined"]),
    approvalRef: NonEmptyTextSchema,
    riskTier: z.enum(["low", "medium", "high", "critical"]),
    owners: EnterpriseOwnersSchema,
    nfrBudgets: EnterpriseNfrBudgetsSchema,
    controlRefs: z.array(NonEmptyTextSchema).min(1),
    evidence: EnterpriseEvidenceContractSchema,
  })
  .strict();
export type EnterpriseDelivery = z.infer<typeof EnterpriseDeliverySchema>;

/** App ve module SDK sözleşmelerinin ortak, fail-closed tabanı. */
export const BaseSdkDeliverySchema = z
  .object({
    required: z.literal(true),
    sdkContractRef: NonEmptyTextSchema,
    sdkRange: NonEmptyTextSchema,
    templateRef: NonEmptyTextSchema,
    generatorContractRef: NonEmptyTextSchema,
    deterministic: z.literal(true),
    generatedHeaderRequired: z.literal(true),
    manualEditAllowed: z.literal(false),
    publicPortsOnly: z.literal(true),
    kernelInternalsAllowed: z.literal(false),
    directAppImportsAllowed: z.literal(false),
    compatibilityTestRefs: z.array(NonEmptyTextSchema).min(1),
    negativeTestRefs: z.array(NonEmptyTextSchema).min(1),
  })
  .strict();
export type BaseSdkDelivery = z.infer<typeof BaseSdkDeliverySchema>;

export const AppSdkDeliverySchema = BaseSdkDeliverySchema.extend({
  templateKind: z.literal("app-core-and-assembly"),
}).strict();
export type AppSdkDelivery = z.infer<typeof AppSdkDeliverySchema>;

export const AppManifestDefinitionSchema = z
  .object({
    appVersion: SemverSchema,
    kernelRange: NonEmptyTextSchema,
    sdkRange: NonEmptyTextSchema,
    kernelPrimitiveIds: z.array(NonEmptyTextSchema).min(1),
    requiredCapabilityIds: z.array(NonEmptyTextSchema).min(1),
    optionalCapabilityIds: z.array(NonEmptyTextSchema).default([]),
    publishedEventTypes: z.array(NonEmptyTextSchema).default([]),
    subscribedEventTypes: z.array(NonEmptyTextSchema).default([]),
    locales: z.array(NonEmptyTextSchema).min(1),
    residencyClass: z.enum(["none", "region-pinned", "jurisdiction-bound"]),
    deploymentProfiles: z.array(NonEmptyTextSchema).min(1),
  })
  .strict();

export const AppClassificationSchema = z
  .object({
    primaryCategory: z.enum([
      "distribution-app",
      "sector-app",
      "stack-app",
      "edition-app",
      "productized-solution",
      "standalone-product",
    ]),
    portfolioRefs: z.array(NonEmptyTextSchema).default([]),
    sectorProfiles: z.array(NonEmptyTextSchema).default([]),
    distributionProfiles: z.array(NonEmptyTextSchema).default([]),
    stackProfiles: z.array(NonEmptyTextSchema).default([]),
    editionProfiles: z.array(NonEmptyTextSchema).default([]),
  })
  .strict();

export const AppCommercialModelSchema = z
  .object({
    licensingModel: NonEmptyTextSchema,
    entitlementModel: NonEmptyTextSchema,
    packagingModel: NonEmptyTextSchema,
    salesMotion: NonEmptyTextSchema,
    supportModel: NonEmptyTextSchema,
    entitlementIds: z.array(NonEmptyTextSchema).min(1),
  })
  .strict();

export const ExternalAppContractSchema = z
  .object({
    providerAppId: z
      .string()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/, "providerAppId küçük-harf kebab-case olmalı"),
    contractRef: NonEmptyTextSchema,
    versionRange: NonEmptyTextSchema,
    transport: z.literal("event-and-api"),
    consumedCapabilityIds: z.array(NonEmptyTextSchema).min(1),
    subscribedEventTypes: z.array(NonEmptyTextSchema).min(1),
  })
  .strict();
export type ExternalAppContract = z.infer<typeof ExternalAppContractSchema>;

export const AppDefinitionSchema = z
  .object({
    artifactKind: z.literal("sellable-app"),
    commercialUnit: z.literal("independent-app"),
    productSlug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/, "productSlug küçük-harf kebab-case olmalı"),
    canonicalName: NonEmptyTextSchema,
    classification: AppClassificationSchema,
    commercialModel: AppCommercialModelSchema,
    valueProposition: NonEmptyTextSchema,
    targetOrganizations: z.array(NonEmptyTextSchema).min(1),
    buyerRoles: z.array(NonEmptyTextSchema).min(1),
    userRoles: z.array(NonEmptyTextSchema).min(1),
    businessOutcomes: z.array(NonEmptyTextSchema).min(1),
    coreJourneys: z.array(NonEmptyTextSchema).min(1),
    nonGoals: z.array(NonEmptyTextSchema).min(1),
    capabilityIds: z.array(NonEmptyTextSchema).min(1),
    appCoreModuleId: NonEmptyTextSchema,
    requiredModuleIds: z.array(NonEmptyTextSchema).min(1),
    optionalModuleIds: z.array(NonEmptyTextSchema).default([]),
    externalAppContracts: z.array(ExternalAppContractSchema).default([]),
    jurisdictions: z.array(NonEmptyTextSchema).min(1),
    dataClasses: z.array(NonEmptyTextSchema).min(1),
    manifest: AppManifestDefinitionSchema,
    sdkDelivery: AppSdkDeliverySchema,
    enterpriseDelivery: EnterpriseDeliverySchema,
  })
  .strict()
  .superRefine((app, ctx) => {
    if (app.requiredModuleIds[0] !== app.appCoreModuleId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredModuleIds", 0],
        message: "app-core ilk required module olmalı",
      });

    const required = new Set(app.requiredModuleIds);
    if (required.size !== app.requiredModuleIds.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiredModuleIds"],
        message: "requiredModuleIds benzersiz olmalı",
      });
    for (const [index, moduleId] of app.optionalModuleIds.entries())
      if (required.has(moduleId))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["optionalModuleIds", index],
          message: "bir module hem required hem optional olamaz",
        });

    const providerIds = app.externalAppContracts.map((contract) => contract.providerAppId);
    if (new Set(providerIds).size !== providerIds.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["externalAppContracts"],
        message: "external app provider sözleşmeleri benzersiz olmalı",
      });
    for (const [index, contract] of app.externalAppContracts.entries())
      if (contract.providerAppId === app.productSlug)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["externalAppContracts", index, "providerAppId"],
          message: "app kendisini external provider olarak tüketemez",
        });

    if (app.manifest.sdkRange !== app.sdkDelivery.sdkRange)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manifest", "sdkRange"],
        message: "manifest ve SDK delivery aynı sdkRange değerini taşımalı",
      });
  });
export type AppDefinition = z.infer<typeof AppDefinitionSchema>;
