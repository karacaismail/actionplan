import { z } from "zod";

/**
 * Storybook Registry Sözleşmeleri — kaynak: docs/storybook-root-integration-gap-report.md §5
 * (16 kanonik registry) + docs/storybook-governance-pack.md (alan semantiği).
 *
 * Her registry `src/data/storybook/<ad>.json` dosyasında şu sarmalayıcıyla yaşar:
 * `{ "$schema"?: string, "note": string, "records": [...] }`.
 *
 * BOŞ REGISTRY GEÇERLİDİR: kayıtlar implementation/migration dalgalarıyla dolar;
 * uydurma (fabricated) kayıt girilmez. Boş `records` "henüz kayıt yok" demektir,
 * "sözleşme yok" demek değildir. Bu dosya kendi başına import edilebilir; başka
 * şema dosyasına bağımlılığı yoktur.
 */

/** Ortak dosya sarmalayıcısı: opsiyonel $schema + insan-okur not + kayıt listesi. */
const registryFileSchema = <TItem extends z.ZodTypeAny>(item: TItem) =>
  z.object({
    /** Editor/tooling için opsiyonel JSON Schema işaretçisi. */
    $schema: z.string().optional(),
    /** Registry'nin ne tuttuğu ve boşluğun anlamı (Türkçe, insan-okur). */
    note: z.string().default(""),
    /** Kanonik kayıtlar; boş dizi geçerlidir. */
    records: z.array(item).default([]),
  });

// ---------------------------------------------------------------------------
// 1. master-components.json — sahte/duplicate master'ı önler (U5, U20, U24)
// ---------------------------------------------------------------------------

export const MasterComponentMaturitySchema = z.enum([
  "candidate",
  "local-proof",
  "master-proposal",
  "in-review",
  "stable",
  "deprecated",
  "retired",
]);
export type MasterComponentMaturity = z.infer<typeof MasterComponentMaturitySchema>;

export const MasterComponentRegistrySchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^mc\.[a-z0-9-]+$/),
  /** İnsan-okur ad; kimlik id'dir (gap-report §5 çekirdek: id/owner/package/source/version/maturity). */
  name: z.string().default(""),
  owner: z.string().min(1),
  package: z.string().min(1),
  exportName: z.string().default(""),
  /** Kaynak dosya/export yolu (gap-report §5 'source') — story bunun GERÇEK export'unu tüketir. */
  source: z.string().min(1),
  version: z.string().min(1),
  maturity: MasterComponentMaturitySchema,
  /** deprecated/retired ise yerine geçen master'ın referansı; boş = replacement yok. */
  replacementRef: z.string().default(""),
  consumerRefs: z.array(z.string()).default([]),
});
export type MasterComponentRegistry = z.infer<typeof MasterComponentRegistrySchema>;

export const MasterComponentsFileSchema = registryFileSchema(MasterComponentRegistrySchema);
export type MasterComponentsFile = z.infer<typeof MasterComponentsFileSchema>;

// ---------------------------------------------------------------------------
// 2. story-catalog.json — serbest/doğrulanmayan storyRef ve orphan story'yi önler (U15)
// ---------------------------------------------------------------------------

export const StoryCatalogSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^story\.[a-z0-9.-]+$/),
  componentRef: z.string().min(1),
  surfaceRef: z.string().default(""),
  states: z.array(z.string()),
  interactionTestRefs: z.array(z.string()).default([]),
  sourcePath: z.string().min(1),
});
export type StoryCatalog = z.infer<typeof StoryCatalogSchema>;

export const StoryCatalogFileSchema = registryFileSchema(StoryCatalogSchema);
export type StoryCatalogFile = z.infer<typeof StoryCatalogFileSchema>;

// ---------------------------------------------------------------------------
// 3. ui-artifact-roles.json — kelime temelli yanlış sınıflamayı önler (U16; gap §3)
// ---------------------------------------------------------------------------

export const UiArtifactRoleSchema = z.enum([
  "produces-ui",
  "changes-ui-contract",
  "governs-ui",
  "consumes-ui",
  "no-ui",
]);
export type UiArtifactRole = z.infer<typeof UiArtifactRoleSchema>;

export const UiArtifactRolesSchema = z.object({
  nodeId: z.string().trim().min(1),
  role: UiArtifactRoleSchema,
  reason: z.string().trim().min(1),
  decidedBy: z.string().trim().min(1),
  decidedAt: z.string().date(),
});
export type UiArtifactRoles = z.infer<typeof UiArtifactRolesSchema>;

export const UiArtifactRolesFileSchema = registryFileSchema(UiArtifactRolesSchema).superRefine(
  (file, ctx) => {
    const seenNodeIds = new Set<string>();
    for (const [index, record] of file.records.entries()) {
      if (seenNodeIds.has(record.nodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate nodeId: ${record.nodeId}`,
          path: ["records", index, "nodeId"],
        });
      }
      seenNodeIds.add(record.nodeId);
    }
  },
);
export type UiArtifactRolesFile = z.infer<typeof UiArtifactRolesFileSchema>;

// ---------------------------------------------------------------------------
// 4. surface-component-map.json — kökten uca kopukluğu önler (U6)
// ---------------------------------------------------------------------------

export const SurfaceComponentMapSchema = z.object({
  surfaceRef: z.string().min(1),
  archetypeRef: z.string().default(""),
  fragmentRefs: z.array(z.string()).default([]),
  atomRefs: z.array(z.string()).default([]),
  masterComponentRefs: z.array(z.string()),
});
export type SurfaceComponentMap = z.infer<typeof SurfaceComponentMapSchema>;

export const SurfaceComponentMapFileSchema = registryFileSchema(SurfaceComponentMapSchema);
export type SurfaceComponentMapFile = z.infer<typeof SurfaceComponentMapFileSchema>;

// ---------------------------------------------------------------------------
// 5. field-widget-map.json — atomların UI karşılığının kaybını önler (gap §3/G1)
// ---------------------------------------------------------------------------

export const FieldWidgetMapSchema = z.object({
  fieldTypeId: z.string().min(1),
  surfaceProjection: z.string().min(1),
  widgetRef: z.string().min(1),
  masterComponentRef: z.string().default(""),
  storyRefs: z.array(z.string()).default([]),
});
export type FieldWidgetMap = z.infer<typeof FieldWidgetMapSchema>;

export const FieldWidgetMapFileSchema = registryFileSchema(FieldWidgetMapSchema);
export type FieldWidgetMapFile = z.infer<typeof FieldWidgetMapFileSchema>;

// ---------------------------------------------------------------------------
// 6. component-consumers.json — sessiz breaking change'i önler (U7)
// ---------------------------------------------------------------------------

export const ComponentConsumerSchema = z.object({
  app: z.string().min(1),
  module: z.string().default(""),
  surfaceRef: z.string().default(""),
  lockfileFingerprint: z.string().default(""),
});
export type ComponentConsumer = z.infer<typeof ComponentConsumerSchema>;

export const ComponentConsumersSchema = z.object({
  masterComponentRef: z.string().min(1),
  version: z.string().min(1),
  consumers: z.array(ComponentConsumerSchema),
});
export type ComponentConsumers = z.infer<typeof ComponentConsumersSchema>;

export const ComponentConsumersFileSchema = registryFileSchema(ComponentConsumersSchema);
export type ComponentConsumersFile = z.infer<typeof ComponentConsumersFileSchema>;

// ---------------------------------------------------------------------------
// 7. story-coverage-policy.json — kontrolsüz Cartesian patlama / eksik kapsamı önler
//    (U0, U16, U18, U19, U23). Kayıtları NORMATİF konfigürasyondur, mock değildir
//    (docs/storybook-governance-pack.md §1 risk tablosu).
// ---------------------------------------------------------------------------

export const RiskClassSchema = z.enum(["critical", "high", "medium", "low"]);
export type RiskClass = z.infer<typeof RiskClassSchema>;

export const StoryCoveragePolicySchema = z.object({
  riskClass: RiskClassSchema,
  /** 7 çekirdek davranış state'i exhaustive KALIR; eksiltmek yasaktır (governance pack §1.1). */
  mandatoryStates: z.array(z.string()),
  /** Sunum eksenleri exhaustive üretilmez; pairwise/representative örneklenir (governance pack §1.2). */
  pairwiseAxes: z.array(z.string()).default([]),
  maxStoriesDefault: z.number().int().positive(),
  browserMatrix: z.array(z.string()).default([]),
  notes: z.string().default(""),
});
export type StoryCoveragePolicy = z.infer<typeof StoryCoveragePolicySchema>;

export const StoryCoveragePolicyFileSchema = registryFileSchema(StoryCoveragePolicySchema);
export type StoryCoveragePolicyFile = z.infer<typeof StoryCoveragePolicyFileSchema>;

// ---------------------------------------------------------------------------
// 8. fixture-contracts.json — sahte ve güvensiz fixture'ı önler (U1)
// ---------------------------------------------------------------------------

export const FixtureFamilySchema = z.enum([
  "malformed",
  "stale",
  "partial",
  "permission-filtered",
  "high-volume",
  "migration-old",
]);
export type FixtureFamily = z.infer<typeof FixtureFamilySchema>;

export const FixtureContractsSchema = z.object({
  id: z.string().min(1),
  factoryRef: z.string().min(1),
  schemaFingerprint: z.string().min(1),
  volumeProfiles: z.array(z.string()).default([]),
  families: z.array(FixtureFamilySchema).default([]),
  piiFlag: z.boolean().default(false),
  provenance: z.string().default(""),
});
export type FixtureContracts = z.infer<typeof FixtureContractsSchema>;

export const FixtureContractsFileSchema = registryFileSchema(FixtureContractsSchema);
export type FixtureContractsFile = z.infer<typeof FixtureContractsFileSchema>;

// ---------------------------------------------------------------------------
// 9. evidence-manifest.json — uydurma URL/evidence'ı önler (U26; append-only)
// ---------------------------------------------------------------------------

export const EvidenceManifestSchema = z.object({
  taskRef: z.string().min(1),
  prRef: z.string().default(""),
  commitSha: z.string().default(""),
  buildRef: z.string().default(""),
  interactionResultRef: z.string().default(""),
  a11yResultRef: z.string().default(""),
  visualResultRef: z.string().default(""),
  e2eResultRef: z.string().default(""),
  reviewerRef: z.string().default(""),
});
export type EvidenceManifest = z.infer<typeof EvidenceManifestSchema>;

export const EvidenceManifestFileSchema = registryFileSchema(EvidenceManifestSchema);
export type EvidenceManifestFile = z.infer<typeof EvidenceManifestFileSchema>;

// ---------------------------------------------------------------------------
// 10. visual-baseline-governance.json — accept-all ve baseline aklamayı önler (U2, U25)
// ---------------------------------------------------------------------------

export const DiffTaxonomySchema = z.enum([
  "bugfix",
  "intentional-design",
  "token-wide",
  "environment-noise",
  "content-only",
]);
export type DiffTaxonomy = z.infer<typeof DiffTaxonomySchema>;

export const VisualBaselineGovernanceSchema = z.object({
  baselineFingerprint: z.string().min(1),
  ownerRef: z.string().min(1),
  approvedBy: z.string().min(1),
  reason: z.string().min(1),
  diffTaxonomy: DiffTaxonomySchema,
  taskRef: z.string().min(1),
  expiresAt: z.string().default(""),
});
export type VisualBaselineGovernance = z.infer<typeof VisualBaselineGovernanceSchema>;

export const VisualBaselineGovernanceFileSchema = registryFileSchema(
  VisualBaselineGovernanceSchema,
);
export type VisualBaselineGovernanceFile = z.infer<typeof VisualBaselineGovernanceFileSchema>;

// ---------------------------------------------------------------------------
// 11. publish-security-policy.json — preview veri sızıntısını önler (U4, U29)
// ---------------------------------------------------------------------------

export const PreviewClassSchema = z.enum(["public", "organization-private", "vpn-only"]);
export type PreviewClass = z.infer<typeof PreviewClassSchema>;

export const PublishSecurityPolicySchema = z.object({
  previewClass: PreviewClassSchema,
  authRequired: z.boolean(),
  tenantIsolation: z.boolean().default(true),
  piiScanRequired: z.boolean().default(true),
  retentionDays: z.number().int().default(30),
  cspNotes: z.string().default(""),
});
export type PublishSecurityPolicy = z.infer<typeof PublishSecurityPolicySchema>;

export const PublishSecurityPolicyFileSchema = registryFileSchema(PublishSecurityPolicySchema);
export type PublishSecurityPolicyFile = z.infer<typeof PublishSecurityPolicyFileSchema>;

// ---------------------------------------------------------------------------
// 12. addon-allowlist.json — supply-chain riskini önler (U9, U28)
// ---------------------------------------------------------------------------

export const AddonEgressSchema = z.enum(["none", "restricted", "open"]);
export type AddonEgress = z.infer<typeof AddonEgressSchema>;

export const AddonAllowlistSchema = z.object({
  addonName: z.string().min(1),
  version: z.string().min(1),
  source: z.string().min(1),
  permissions: z.array(z.string()).default([]),
  egress: AddonEgressSchema.default("none"),
  approvedBy: z.string().min(1),
  approvedAt: z.string().min(1),
});
export type AddonAllowlist = z.infer<typeof AddonAllowlistSchema>;

export const AddonAllowlistFileSchema = registryFileSchema(AddonAllowlistSchema);
export type AddonAllowlistFile = z.infer<typeof AddonAllowlistFileSchema>;

// ---------------------------------------------------------------------------
// 13. version-compatibility.json — lokal-CI ve federation drift'ini önler (U7)
// ---------------------------------------------------------------------------

export const VersionCompatibilitySchema = z.object({
  storybookVersion: z.string().min(1),
  builderVersion: z.string().default(""),
  runtimeVersion: z.string().default(""),
  componentPackageVersion: z.string().default(""),
  consumerLockfileFingerprint: z.string().default(""),
  contractFingerprint: z.string().default(""),
});
export type VersionCompatibility = z.infer<typeof VersionCompatibilitySchema>;

export const VersionCompatibilityFileSchema = registryFileSchema(VersionCompatibilitySchema);
export type VersionCompatibilityFile = z.infer<typeof VersionCompatibilityFileSchema>;

// ---------------------------------------------------------------------------
// 14. deprecation-migrations.json — sonsuz deprecated component'i önler (gap §5)
// ---------------------------------------------------------------------------

export const DeprecationConsumerCompletionSchema = z.object({
  consumer: z.string().min(1),
  done: z.boolean().default(false),
});
export type DeprecationConsumerCompletion = z.infer<typeof DeprecationConsumerCompletionSchema>;

export const DeprecationMigrationsSchema = z.object({
  oldComponentRef: z.string().min(1),
  newComponentRef: z.string().min(1),
  codemodRef: z.string().default(""),
  migrationStoryRef: z.string().min(1),
  consumerCompletion: z.array(DeprecationConsumerCompletionSchema).default([]),
});
export type DeprecationMigrations = z.infer<typeof DeprecationMigrationsSchema>;

export const DeprecationMigrationsFileSchema = registryFileSchema(DeprecationMigrationsSchema);
export type DeprecationMigrationsFile = z.infer<typeof DeprecationMigrationsFileSchema>;

// ---------------------------------------------------------------------------
// 15. ownership.json — owner'sız kataloğu önler (U21, U24)
// ---------------------------------------------------------------------------

export const OwnershipSchema = z.object({
  scope: z.string().min(1),
  domainOwner: z.string().min(1),
  designReviewer: z.string().default(""),
  a11yReviewer: z.string().default(""),
  slaDays: z.number().int().default(5),
  fallbackOwner: z.string().default(""),
});
export type Ownership = z.infer<typeof OwnershipSchema>;

export const OwnershipFileSchema = registryFileSchema(OwnershipSchema);
export type OwnershipFile = z.infer<typeof OwnershipFileSchema>;

// ---------------------------------------------------------------------------
// 16. legacy-ratchet.json — baseline bypass ve çift kaynağı önler (gap §3).
//     Bu, tools/agents/ui-delivery-baseline.json'un HEDEF biçiminin şemasıdır;
//     canlı baseline o dosyada yaşar ve gate onu okur.
// ---------------------------------------------------------------------------

export const LegacyRatchetSchema = z.object({
  /** İlk baseline'ın immutable checksum'u; sonradan genişletme bu kilide çarpar. */
  originChecksum: z.string().min(1),
  /** İlk baseline'daki ID listesi (immutable origin); yalnız karşılaştırma için. */
  originAllowedWarnings: z.array(z.string()),
  /** Güncel izinli liste; origin'in alt kümesi olmalıdır (yalnız azalır). */
  allowedWarnings: z.array(z.string()),
  owner: z.string().min(1),
  deadline: z.string().min(1),
  wave: z.string().min(1),
});
export type LegacyRatchet = z.infer<typeof LegacyRatchetSchema>;

export const LegacyRatchetFileSchema = registryFileSchema(LegacyRatchetSchema);
export type LegacyRatchetFile = z.infer<typeof LegacyRatchetFileSchema>;
