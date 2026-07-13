import { z } from "zod";

const NonEmptyText = z.string().trim().min(3);
const KebabId = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

export const AtomTestVectorSchema = z.object({
  kind: z.enum(["positive", "negative", "edge"]),
  name: NonEmptyText,
  testRef: NonEmptyText,
  expected: NonEmptyText,
});
export type AtomTestVector = z.infer<typeof AtomTestVectorSchema>;

/** WBS atomu: satır sayısıyla değil tek invariant + tek failure mode ile sınırlanır. */
export const TaskMicroStepDefinitionSchema = z
  .object({
    kind: z.literal("task-micro-step"),
    parentLevel: z.enum(["component", "work_unit"]),
    invariant: NonEmptyText,
    change: NonEmptyText,
    failureMode: NonEmptyText,
    allowedFiles: z.array(NonEmptyText).min(1),
    nonGoals: z.array(NonEmptyText).min(1),
    sideEffect: z.enum(["none", "local-write", "database", "external", "irreversible"]),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    rollback: NonEmptyText,
    testVectors: z.array(AtomTestVectorSchema).min(2),
    evidenceRollup: KebabId,
    reviewer: NonEmptyText,
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const requiredKind of ["positive", "negative"] as const) {
      if (!value.testVectors.some((vector) => vector.kind === requiredKind)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testVectors"],
          message: `${requiredKind} test vektörü zorunludur`,
        });
      }
    }
  });
export type TaskMicroStepDefinition = z.infer<typeof TaskMicroStepDefinitionSchema>;

/** Yalnız granülerlik öğretimi için tutulan, code-start yapılamayan atom örneği. */
export const TaskAtomDemonstrationSchema = z
  .object({
    kind: z.literal("task-demonstration"),
    parentLevel: z.enum(["component", "work_unit"]),
    purpose: NonEmptyText,
    nonExecutableReason: NonEmptyText,
    promotionCriteria: z.array(NonEmptyText).min(3),
  })
  .strict();
export type TaskAtomDemonstration = z.infer<typeof TaskAtomDemonstrationSchema>;

export const ValueAtomDimensionsSchema = z
  .object({
    storageMapping: NonEmptyText,
    validation: NonEmptyText,
    parameterization: NonEmptyText,
    canonicalization: NonEmptyText,
    comparison: NonEmptyText,
    equality: NonEmptyText,
    indexability: NonEmptyText,
    i18n: NonEmptyText,
    valueStates: NonEmptyText,
    serialization: NonEmptyText,
    surfaceProjection: NonEmptyText,
    /** FieldType → widget/story bağı (field-widget-map registry ile eşlenir; integration-directive §5.1). Opsiyonel; geriye uyumlu. */
    storybookProjection: z
      .object({
        widgetRef: z.string().default(""),
        masterComponentRef: z.string().default(""),
        storyRefs: z.array(z.string()).default([]),
      })
      .optional(),
    securityClass: NonEmptyText,
    versioning: NonEmptyText,
  })
  .strict();
export type ValueAtomDimensions = z.infer<typeof ValueAtomDimensionsSchema>;

const PrecisionSchema = z.object({
  precision: z.number().int().positive(),
  scale: z.number().int().nonnegative(),
  rounding: z.enum(["half-up", "half-even", "down", "up"]),
});

/** Tip-bağlı parametre aileleri; serbest record yerine yanlış/eksik parametreyi reddeder. */
export const ValueAtomParamsSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("primitive") }).strict(),
  z
    .object({
      kind: z.literal("string"),
      maxLength: z.number().int().positive().optional(),
      collation: NonEmptyText,
      normalization: z.enum(["NFC", "NFD", "NFKC", "NFKD", "none"]),
    })
    .strict(),
  z
    .object({ kind: z.literal("decimal") })
    .merge(PrecisionSchema)
    .strict(),
  z
    .object({ kind: z.literal("money"), currencySet: z.array(z.string().length(3)).min(1) })
    .merge(PrecisionSchema)
    .strict(),
  z
    .object({ kind: z.literal("measure"), dimension: NonEmptyText, unitSystem: NonEmptyText })
    .merge(PrecisionSchema)
    .strict(),
  z
    .object({ kind: z.literal("percentage"), basis: z.enum(["fraction", "percent"]) })
    .merge(PrecisionSchema)
    .strict(),
  z
    .object({
      kind: z.literal("range"),
      elementType: KebabId,
      bounds: z.enum(["[]", "[)", "(]", "()"]),
      allowUnbounded: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("enum"),
      valuesRef: NonEmptyText,
      aliasRef: NonEmptyText,
      ordered: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("identifier"),
      scheme: NonEmptyText,
      checksum: NonEmptyText,
      jurisdiction: z.string(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("reference"),
      targetKind: KebabId,
      onDelete: z.enum(["restrict", "set-null", "cascade-soft", "deny"]),
      scope: NonEmptyText,
    })
    .strict(),
  z
    .object({
      kind: z.literal("temporal"),
      timezoneMode: z.enum(["none", "utc", "iana-zone"]),
      precision: z.enum(["day", "second", "millisecond", "microsecond"]),
    })
    .strict(),
  z
    .object({ kind: z.literal("i18n-text"), localesRef: NonEmptyText, fallbackRef: NonEmptyText })
    .strict(),
  z
    .object({ kind: z.literal("contact"), formatRef: NonEmptyText, canonicalForm: NonEmptyText })
    .strict(),
  z
    .object({
      kind: z.literal("geo"),
      srid: z.number().int().positive(),
      dimensions: z.enum(["2d", "3d"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("recurrence"),
      ruleStandard: NonEmptyText,
      timezoneMode: z.enum(["utc", "iana-zone"]),
      terminationRequired: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("fragment-ref"),
      fragmentRef: KebabId,
      cardinality: z.enum(["one", "many"]),
    })
    .strict(),
]);
export type ValueAtomParams = z.infer<typeof ValueAtomParamsSchema>;

export const ValueAtomDefinitionSchema = z
  .object({
    kind: z.literal("value-type"),
    typeId: KebabId,
    atomicityReason: NonEmptyText,
    baseType: KebabId,
    params: ValueAtomParamsSchema,
    dimensions: ValueAtomDimensionsSchema,
    registryRefs: z
      .array(
        z.object({
          id: KebabId,
          version: NonEmptyText,
          effectiveFrom: NonEmptyText,
          effectiveTo: z.string().optional(),
        }),
      )
      .default([]),
    runtime: z.object({
      backendAdapter: NonEmptyText,
      frontendAdapter: NonEmptyText,
      contractFingerprint: NonEmptyText,
    }),
    migration: z.object({
      strategy: z.enum(["append-only", "expand-contract", "reversible-backfill"]),
      backwardReader: NonEmptyText,
      downgrade: NonEmptyText,
    }),
    testVectors: z.array(AtomTestVectorSchema).min(2),
    deprecation: z.object({
      status: z.enum(["active", "deprecated", "retired"]),
      replacement: z.string(),
      sunsetAt: z.string(),
    }),
    owner: NonEmptyText,
    reviewer: NonEmptyText,
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const requiredKind of ["positive", "negative"] as const) {
      if (!value.testVectors.some((vector) => vector.kind === requiredKind)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["testVectors"],
          message: `${requiredKind} test vektörü zorunludur`,
        });
      }
    }
    if (value.deprecation.status !== "active" && !value.deprecation.replacement.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deprecation", "replacement"],
        message: "deprecated/retired atom replacement taşımalıdır",
      });
    }
  });
export type ValueAtomDefinition = z.infer<typeof ValueAtomDefinitionSchema>;

export const AtomDefinitionSchema = z.union([
  TaskMicroStepDefinitionSchema,
  TaskAtomDemonstrationSchema,
  ValueAtomDefinitionSchema,
]);
export type AtomDefinition = z.infer<typeof AtomDefinitionSchema>;

export const AtomDefinitionRegistrySchema = z
  .object({
    schemaVersion: z.string().min(1),
    definitions: z.record(KebabId, AtomDefinitionSchema),
  })
  .strict();
export type AtomDefinitionRegistry = z.infer<typeof AtomDefinitionRegistrySchema>;
