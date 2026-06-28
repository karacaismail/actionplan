import { z } from "zod";
import { AgentPolicySchema, EcaRuleSchema, MigrationModeSchema } from "./task";

/**
 * ArcheType sözleşme ailesi — TEK dosya/format DEĞİLDİR; çok-parçalı bir sözleşmedir.
 * Metafor+teknik: App=dağ (ürün ailesi), Module=kaya (sınırlı bağlam),
 * ArcheType=büyük taş (Frappe DocType'tan gelişmiş; bir module'ü oluşturan ana bileşen;
 * bir module'de birden çok ArcheType olabilir). Surface (projeksiyon) ve Workflow (davranış)
 * ArcheType'tan AYRI ama ilişkili ve AYRI versiyonlanır. Alan seviyesi adı = `field`.
 */

/* ----------------------------------------------------------------------------
 * Ruleset yetki katmanları (immutable sınır) + admin akışı + AI düzeltme döngüsü
 * -------------------------------------------------------------------------- */
/** system: kilitli, yalnız developer/code/PR ile değişir. platform: platform owner. tenant: tenant admin (yalnız güvenli parametreler). */
export const RulesetLayerSchema = z.enum(["system", "platform", "tenant"]);
export type RulesetLayer = z.infer<typeof RulesetLayerSchema>;

/** Admin akışı: serbest yazımdan uygulamaya kadar zorunlu sıra. */
export const ADMIN_FLOW = [
  "prompt",
  "draft",
  "validation",
  "diff",
  "data-impact",
  "migration-dry-run",
  "preview",
  "approval",
  "apply",
] as const;
export const AdminFlowStageSchema = z.enum(ADMIN_FLOW);
export type AdminFlowStage = z.infer<typeof AdminFlowStageSchema>;

/** AI üretim/düzenleme doğrulama döngüsü (CI kod düzeltme DEĞİL): 1-3 otomatik, 3 ve 6'da admin'e soru, 9'da tanı+dur. */
export const AI_FIX_LOOP = {
  autoFixUntil: 3,
  askAdminAt: [3, 6] as const,
  diagnoseAndStopAt: 9,
  ciAutoPush: false,
} as const;

/** ECA dışında zorunlu çelik duvarlar (deny-by-default kontrol katmanları). */
export const STEEL_WALLS = [
  "schema-validation",
  "semantic-validation",
  "migration-safety",
  "rebac-abac",
  "tenant-isolation",
  "action-allowlist",
  "prompt-injection-guard",
  "audit-forensic-log",
  "rate-cost-abuse-limits",
  "conformance-tests",
  "rollback-snapshot-gates",
  "protected-fields-rules-archetypes",
  "immutable-ruleset-boundary",
] as const;
export const SteelWallSchema = z.enum(STEEL_WALLS);
export type SteelWall = z.infer<typeof SteelWallSchema>;

/* ----------------------------------------------------------------------------
 * 1. identity / meta
 * -------------------------------------------------------------------------- */
export const ArchetypeIdentitySchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string(),
  module: z.string(), // ait olduğu module (kaya)
  app: z.string(), // ait olduğu app (dağ)
  description: z.string().default(""),
  /** Frappe DocType benzeri ama gelişmiş; tek dosya değil */
  family: z.literal("archetype-contract").default("archetype-contract"),
});

/* ----------------------------------------------------------------------------
 * 2. fields  + 3. fragments
 * -------------------------------------------------------------------------- */
export const FieldTypeSchema = z.enum([
  "string",
  "text",
  "number",
  "integer",
  "boolean",
  "date",
  "datetime",
  "enum",
  "json",
  "relation",
  "currency",
  "email",
  "phone",
  "file",
]);
export const FieldSchema = z.object({
  name: z.string(), // alan adı = field
  label: z.string(),
  type: FieldTypeSchema,
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  pii: z.boolean().default(false),
  /** rename yerine: eski ad alias olarak korunur */
  alias: z.array(z.string()).default([]),
  deprecated: z.boolean().default(false),
  /** field silme/rename/type-change DOĞRUDAN yapılamaz; bu bayrak süreç gerektiğini işaretler */
  protected: z.boolean().default(false),
  enumValues: z.array(z.string()).default([]),
  relationTo: z.string().optional(), // type=relation ise hedef archetype id
});
/** Yeniden kullanılabilir alan grubu (composable). */
export const FragmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  fields: z.array(FieldSchema).default([]),
});

/* ----------------------------------------------------------------------------
 * 4. relations
 * -------------------------------------------------------------------------- */
export const RelationSchema = z.object({
  name: z.string(),
  kind: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many"]),
  target: z.string(), // hedef archetype id
  onDelete: z.enum(["restrict", "set-null", "cascade-soft", "deny"]).default("restrict"),
});

/* ----------------------------------------------------------------------------
 * 5. validation rules + 6. semantic rules
 * -------------------------------------------------------------------------- */
export const ValidationRuleSchema = z.object({
  id: z.string(),
  field: z.string().optional(),
  expr: z.string(), // yapısal kural ifadesi (serbest kod DEĞİL)
  message: z.string(),
});
export const SemanticRuleSchema = z.object({
  id: z.string(),
  description: z.string(), // iş anlamı düzeyi kural (ör. "fatura toplamı kalemler toplamına eşit")
  invariant: z.string(),
});

/* ----------------------------------------------------------------------------
 * 7. permissions + 8. ReBAC/ABAC
 * -------------------------------------------------------------------------- */
export const PermissionSchema = z.object({
  role: z.string(),
  actions: z.array(z.enum(["read", "create", "update", "delete", "export", "approve"])).default([]),
  fieldLevel: z.record(z.string(), z.enum(["hidden", "read", "write"])).default({}),
});
export const AccessPolicySchema = z.object({
  model: z.enum(["RBAC", "ReBAC", "ABAC", "hybrid"]).default("hybrid"),
  /** ReBAC ilişki bazlı: ör. "owner", "team-member" */
  relations: z.array(z.string()).default([]),
  /** ABAC öznitelik koşulları (yapısal) */
  attributes: z
    .array(z.object({ attr: z.string(), op: z.string(), value: z.string() }))
    .default([]),
  tenantScoped: z.boolean().default(true),
});

/* ----------------------------------------------------------------------------
 * 9. lifecycle + 10. surfaces + 11. workflows + 12. typed actions
 * -------------------------------------------------------------------------- */
export const LifecycleSchema = z.object({
  states: z.array(z.string()).default(["draft", "active", "archived"]),
  initial: z.string().default("draft"),
  transitions: z
    .array(z.object({ from: z.string(), to: z.string(), guard: z.string().default("") }))
    .default([]),
});
/** Surface/Workflow ArcheType'tan AYRI versiyonlanır → yalnız referans + versiyon. */
export const LinkedRefSchema = z.object({ ref: z.string(), version: z.string().default("1.0.0") });
export const TypedActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  riskLevel: z.enum(["read", "low", "medium", "high", "critical"]).default("low"),
  requiresApproval: z.boolean().default(false),
  rollback: z.boolean().default(true),
});

/* ----------------------------------------------------------------------------
 * 13. search/index + 14. audit + 15. migration + 16. retention + 17. tenant isolation
 * -------------------------------------------------------------------------- */
export const SearchIndexSchema = z.object({
  indexedFields: z.array(z.string()).default([]),
  fullText: z.array(z.string()).default([]),
  vector: z.boolean().default(false),
});
export const AuditPolicySchema = z.object({
  enabled: z.boolean().default(true),
  immutable: z.boolean().default(true),
  /** forensic: actor/agent/model/prompt-version/before-after-hash */
  forensicFields: z
    .array(z.string())
    .default(["actor", "agent", "model", "promptVersion", "beforeHash", "afterHash"]),
});
export const MigrationPolicySchema = z.object({
  defaultMode: MigrationModeSchema.default("expand-contract"),
  allowedModes: z
    .array(MigrationModeSchema)
    .default(["append-only", "expand-contract", "reversible-backfill"]),
  /** field için doğrudan yasak işlemler — önce deprecated/alias/backfill */
  forbidDirect: z
    .array(z.enum(["delete", "rename", "type-change"]))
    .default(["delete", "rename", "type-change"]),
  requireSnapshot: z.boolean().default(true),
  requireRollback: z.boolean().default(true),
  requireCompatibilityCheck: z.boolean().default(true),
  requireDataImpact: z.boolean().default(true),
  requireDryRun: z.boolean().default(true),
  requireAudit: z.boolean().default(true),
  dataLossNeedsOwnerApproval: z.boolean().default(true),
});
export const RetentionPolicySchema = z.object({
  retainDays: z.number().int().nonnegative().default(0), // 0 = süresiz
  softDelete: z.boolean().default(true),
  piiAnonymizeAfterDays: z.number().int().nonnegative().optional(),
});
export const TenantIsolationSchema = z.object({
  strategy: z.enum(["rls", "schema-per-tenant", "db-per-tenant"]).default("rls"),
  tenantField: z.string().default("tenant_id"),
  enforced: z.boolean().default(true),
});

/* ----------------------------------------------------------------------------
 * 18. ECA bindings + 19. external ruleset bindings + 20. AI policy
 * -------------------------------------------------------------------------- */
export const RulesetBindingSchema = z.object({
  id: z.string(),
  layer: RulesetLayerSchema,
  /** tenant katmanında yalnız güvenli parametreler düzenlenebilir */
  tenantEditableParams: z.array(z.string()).default([]),
  immutable: z.boolean().default(false),
});

/* ----------------------------------------------------------------------------
 * 21. test fixtures + 22. conformance + 23. versioning
 * -------------------------------------------------------------------------- */
export const VersioningSchema = z.object({
  version: z.string().default("1.0.0"),
  compatibleWith: z.array(z.string()).default([]),
  supersedes: z.string().optional(),
});

/* ----------------------------------------------------------------------------
 * ArcheType sözleşmesi — tüm parçalar bir arada
 * -------------------------------------------------------------------------- */
export const ArchetypeContractSchema = z
  .object({
    identity: ArchetypeIdentitySchema,
    fields: z.array(FieldSchema).min(1),
    fragments: z.array(FragmentSchema).default([]),
    relations: z.array(RelationSchema).default([]),
    validationRules: z.array(ValidationRuleSchema).default([]),
    semanticRules: z.array(SemanticRuleSchema).default([]),
    permissions: z.array(PermissionSchema).default([]),
    accessPolicy: AccessPolicySchema,
    lifecycle: LifecycleSchema,
    linkedSurfaces: z.array(LinkedRefSchema).default([]),
    linkedWorkflows: z.array(LinkedRefSchema).default([]),
    typedActions: z.array(TypedActionSchema).default([]),
    searchIndex: SearchIndexSchema,
    auditPolicy: AuditPolicySchema,
    migrationPolicy: MigrationPolicySchema,
    retentionPolicy: RetentionPolicySchema,
    tenantIsolation: TenantIsolationSchema,
    ecaBindings: z.array(EcaRuleSchema).default([]),
    rulesetBindings: z.array(RulesetBindingSchema).default([]),
    aiPolicy: AgentPolicySchema,
    steelWalls: z.array(SteelWallSchema).default([...STEEL_WALLS]),
    testFixtures: z.array(z.record(z.string(), z.unknown())).default([]),
    conformanceTests: z.array(z.object({ id: z.string(), assert: z.string() })).default([]),
    versioning: VersioningSchema,
  })
  .strict();

export type ArchetypeContract = z.infer<typeof ArchetypeContractSchema>;
