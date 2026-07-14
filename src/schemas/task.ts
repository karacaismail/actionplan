import uiStrings from "@/data/strings.json";
import { z } from "zod";
import { AppDefinitionSchema } from "./app-definition";
import { AtomDefinitionSchema } from "./atom";
import { DeliveryContextSchema } from "./delivery-context";
import { ModuleDefinitionSchema } from "./module-definition";
import { UiArtifactRoleSchema } from "./storybook-registry";
import { UiDeliverySchema } from "./ui-delivery";

/**
 * TaskNode — Eylem planının tek doğruluk kaynağı (JSON-as-DB).
 * Her düğüm hem bir doküman sayfası hem de WBS görevidir.
 * Şema, TS tiplerinin tek kaynağıdır (z.infer ile türetilir).
 */

export const SCHEMA_VERSION = "1.1.0"; // 1.1.0: 17 boyut (dataLifecycle, observability, reliability) + tenancyRef/privacyRef

/* ----------------------------------------------------------------------------
 * 7-seviye doğa-metaforu hiyerarşisi
 * -------------------------------------------------------------------------- */
export const WBS_LEVELS = [
  "app", // ada
  "module", // dağ
  "archetype", // kaya
  "feature", // taş
  "component", // kum
  "work_unit", // molekül
  "micro_step", // atom
] as const;
export const WbsLevelSchema = z.enum(WBS_LEVELS);
export type WbsLevel = z.infer<typeof WbsLevelSchema>;

/** WBS derinliğinden bağımsız ürün/plan artefakt kimliği. */
export const ARTIFACT_KINDS = [
  "sellable-app",
  "app-core-module",
  "app-module",
  "platform-foundation",
  "portfolio-facet",
  "governance",
  "delivery-task",
  "legacy-alias",
  "audit-pending",
] as const;
export const ArtifactKindSchema = z.enum(ARTIFACT_KINDS);
export type ArtifactKind = z.infer<typeof ArtifactKindSchema>;

// Etiketler tek kaynaktan: src/data/strings.json (içerik JSON'da, kodda değil)
export const LEVEL_META: Record<WbsLevel, { tr: string; metaphor: string; depth: number }> = {
  app: { ...uiStrings.levels.app, depth: 0 },
  module: { ...uiStrings.levels.module, depth: 1 },
  archetype: { ...uiStrings.levels.archetype, depth: 2 },
  feature: { ...uiStrings.levels.feature, depth: 3 },
  component: { ...uiStrings.levels.component, depth: 4 },
  work_unit: { ...uiStrings.levels.work_unit, depth: 5 },
  micro_step: { ...uiStrings.levels.micro_step, depth: 6 },
};

/* ----------------------------------------------------------------------------
 * Test-önce 7 aşamalı waterfall faz/gate seti
 * -------------------------------------------------------------------------- */
export const WATERFALL_PHASES = [
  "requirements", // Gereksinim
  "test-plan", // Test planı (test-önce!)
  "db-schema", // DB / şema tasarımı
  "development", // Geliştirme
  "test-qa", // Test / QA
  "verification", // Doğrulama
  "release-maintenance", // Yayın / Bakım
] as const;
export const WaterfallPhaseSchema = z.enum(WATERFALL_PHASES);
export type WaterfallPhase = z.infer<typeof WaterfallPhaseSchema>;

export const PHASE_META: Record<WaterfallPhase, { tr: string; order: number }> = {
  requirements: { tr: uiStrings.phases.requirements, order: 1 },
  "test-plan": { tr: uiStrings.phases["test-plan"], order: 2 },
  "db-schema": { tr: uiStrings.phases["db-schema"], order: 3 },
  development: { tr: uiStrings.phases.development, order: 4 },
  "test-qa": { tr: uiStrings.phases["test-qa"], order: 5 },
  verification: { tr: uiStrings.phases.verification, order: 6 },
  "release-maintenance": { tr: uiStrings.phases["release-maintenance"], order: 7 },
};

export const PhaseStatusSchema = z.enum(["pending", "active", "passed", "failed"]);
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

export const PhaseGateSchema = z.object({
  status: PhaseStatusSchema.default("pending"),
  /** Definition of Done — kapı kriterleri */
  criteria: z.array(z.string()).default([]),
  /** Resmi kabul kapısı geçildi mi (enterprise gate) */
  passed: z.boolean().default(false),
  notes: z.string().default(""),
});
export type PhaseGate = z.infer<typeof PhaseGateSchema>;

/* ----------------------------------------------------------------------------
 * 17 üretim boyutu (14 miras + 3 day-2 operasyon — gap-2026-07-02-06)
 * Miras setin sırası KORUNUR (UI sıralaması + eski JSON'lar bozulmaz);
 * yeni üçlü sona eklenir. Legacy JSON'lar eksik day-2 boyutları lazy migration ile tamamlar.
 * -------------------------------------------------------------------------- */
export const LEGACY_DIMENSION_KEYS = [
  "featureDefs", // Özellik tanımları
  "security", // Güvenlik önlemleri
  "codeOptimization", // Kod optimizasyonu
  "securityOptimization", // Güvenlik optimizasyonu
  "performance", // Performans optimizasyonu
  "mobileApps", // Mobile APPS (iOS/Android/Chrome ext) uyumluluğu
  "wcag", // WCAG 2.2 AAA
  "deployment", // Swarm/Kubernetes + shared hosting uyumluluğu
  "eca", // Otomatik ECA kuralları
  "aiAgents", // Default AI agents davranışı
  "testing", // Testler (e2e/unit/journeys/playwright/loops/qa)
  "owasp", // OWASP & güvenlik standartları
  "integration", // Kernel/Core/modules/apps entegrasyonu
  "moduleUsage", // Module ise diğer app'lerin kullanımı
] as const;
export const DIMENSION_KEYS = [
  ...LEGACY_DIMENSION_KEYS,
  "dataLifecycle", // Veri yaşam döngüsü & uyum (saklama, silme, yedekleme, migration, KVKK/GDPR)
  "observability", // Gözlemlenebilirlik & operasyonel hazırlık (SLO, alarm, runbook)
  "reliability", // Dayanıklılık & süreklilik (hata modları, retry/idempotency, RTO/RPO)
] as const;
export const DimensionKeySchema = z.enum(DIMENSION_KEYS);
export type DimensionKey = z.infer<typeof DimensionKeySchema>;

export const DIMENSION_META: Record<DimensionKey, { tr: string; icon: string }> = {
  featureDefs: { tr: uiStrings.dimensions.featureDefs, icon: "ph-list-bullets" },
  security: { tr: uiStrings.dimensions.security, icon: "ph-shield-check" },
  codeOptimization: { tr: uiStrings.dimensions.codeOptimization, icon: "ph-code" },
  securityOptimization: { tr: uiStrings.dimensions.securityOptimization, icon: "ph-lock-key" },
  performance: { tr: uiStrings.dimensions.performance, icon: "ph-gauge" },
  mobileApps: { tr: uiStrings.dimensions.mobileApps, icon: "ph-device-mobile" },
  wcag: { tr: uiStrings.dimensions.wcag, icon: "ph-wheelchair" },
  deployment: { tr: uiStrings.dimensions.deployment, icon: "ph-stack" },
  eca: { tr: uiStrings.dimensions.eca, icon: "ph-flow-arrow" },
  aiAgents: { tr: uiStrings.dimensions.aiAgents, icon: "ph-robot" },
  testing: { tr: uiStrings.dimensions.testing, icon: "ph-test-tube" },
  owasp: { tr: uiStrings.dimensions.owasp, icon: "ph-bug-beetle" },
  integration: { tr: uiStrings.dimensions.integration, icon: "ph-plugs-connected" },
  moduleUsage: { tr: uiStrings.dimensions.moduleUsage, icon: "ph-share-network" },
  dataLifecycle: { tr: uiStrings.dimensions.dataLifecycle, icon: "ph-database" },
  observability: { tr: uiStrings.dimensions.observability, icon: "ph-chart-line-up" },
  reliability: { tr: uiStrings.dimensions.reliability, icon: "ph-shield-plus" },
};

/* ---- Boyut aileleri (ADR-0027/0028) — 17 boyutu anlamlı kümeleyip "ontoloji yok" boşluğunu kapatır. ---- */
export const DIMENSION_FAMILIES = [
  "functional",
  "runtime-quality",
  "engineering",
  "operations",
  "automation",
  "verification",
] as const;
export const DimensionFamilySchema = z.enum(DIMENSION_FAMILIES);
export type DimensionFamily = z.infer<typeof DimensionFamilySchema>;
export const DIMENSION_FAMILY: Record<DimensionKey, DimensionFamily> = {
  featureDefs: "functional",
  moduleUsage: "functional",
  integration: "functional",
  security: "runtime-quality",
  securityOptimization: "runtime-quality",
  performance: "runtime-quality",
  mobileApps: "runtime-quality",
  wcag: "runtime-quality",
  owasp: "runtime-quality",
  codeOptimization: "engineering",
  deployment: "operations",
  eca: "automation",
  aiAgents: "automation",
  testing: "verification",
  // Day-2 operasyon ekseni (gap-2026-07-02-06): operations ailesi 1→3 üyeye çıkar.
  dataLifecycle: "operations",
  observability: "operations",
  reliability: "runtime-quality",
};

export const DimensionStatusSchema = z.enum(["skeleton", "draft", "filled"]);
export type DimensionStatus = z.infer<typeof DimensionStatusSchema>;

/** İçerik kökeni (Faz A3): template=kalıp, swarm=AI ürünü, human=insan yazdı/onayladı. */
export const DimensionProvenanceSchema = z.enum(["template", "swarm", "human"]);
export type DimensionProvenance = z.infer<typeof DimensionProvenanceSchema>;

export const DimensionSchema = z.object({
  key: DimensionKeySchema,
  title: z.string(),
  status: DimensionStatusSchema.default("skeleton"),
  /** Madde listesi — iskelet düğümlerde boş */
  items: z.array(z.string()).default([]),
  notes: z.string().default(""),
  /** Bu boyutu üretmek için bağlama-özgü AI prompt'u (vibecoding) */
  prompt: z.string().default(""),
  /** İçerik kökeni — eski JSON'larda yoksa "template" varsayılır (geriye uyumlu). */
  provenance: DimensionProvenanceSchema.default("template"),
  /** Üreten prompt sürümü (swarm tekrarlanabilirliği için); opsiyonel. */
  promptVersion: z.string().optional(),
  /** Son insan denetimi tarihi (ISO); opsiyonel. */
  lastReviewed: z.string().optional(),
});
export type Dimension = z.infer<typeof DimensionSchema>;

/* ----------------------------------------------------------------------------
 * Planlama / izleme yardımcı şemaları
 * -------------------------------------------------------------------------- */
export const STATUS_LIST = ["backlog", "todo", "in-progress", "blocked", "review", "done"] as const;
export const TaskStatusSchema = z.enum(STATUS_LIST);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const PRIORITY_LIST = ["low", "medium", "high", "critical"] as const;
export const PrioritySchema = z.enum(PRIORITY_LIST);
export type Priority = z.infer<typeof PrioritySchema>;

/** Olgunluk — eski korpusla hizalı governance ekseni */
export const MaturitySchema = z.enum(["taslak", "aday", "incelemede", "dogrulanmis"]);
export type Maturity = z.infer<typeof MaturitySchema>;

export const EffortSchema = z.object({
  estimate: z.number().nonnegative().default(0),
  unit: z.enum(["sp", "h", "d"]).default("sp"),
  spent: z.number().nonnegative().default(0),
});

/** Takvim (waterfall) — planlanan ve gerçekleşen başlangıç/bitiş (ISO tarih). */
export const ScheduleSchema = z
  .object({
    start: z.string().nullable().default(null),
    end: z.string().nullable().default(null),
    actualStart: z.string().nullable().default(null),
    actualEnd: z.string().nullable().default(null),
    /** Baseline (dondurulmuş plan) — Faz 3 Gantt plan-vs-gerçek kıyası için. */
    baselineStart: z.string().nullable().default(null),
    baselineEnd: z.string().nullable().default(null),
  })
  .default({});
export type Schedule = z.infer<typeof ScheduleSchema>;

export const RiskSchema = z.object({
  id: z.string(),
  desc: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  mitigation: z.string().default(""),
});

export const SourceSchema = z.object({
  corpus: z.enum(["content-source", "oldatas", "merged", "synthetic"]),
  originalId: z.string().default(""),
  granularity: z.string().default(""),
  cluster: z.string().default(""),
});

/* ----------------------------------------------------------------------------
 * ECA — YAPISAL, motorun çalıştırabildiği kural (düz metin değil)
 * -------------------------------------------------------------------------- */
export const EcaConditionSchema = z.object({
  field: z.string(),
  op: z.enum(["eq", "neq", "gt", "lt", "gte", "lte", "in", "contains"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});
export type EcaCondition = z.infer<typeof EcaConditionSchema>;

export const EcaActionSchema = z.object({
  type: z.string(), // ör. "notify" | "create-task" | "webhook" | "set-field"
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});
export type EcaAction = z.infer<typeof EcaActionSchema>;

export const EcaRuleSchema = z.object({
  id: z.string(),
  event: z.string(), // ör. "task.status.changed"
  when: z.array(EcaConditionSchema).default([]),
  then: EcaActionSchema,
  /** Sonsuz tetik zincirini kıran üst sınır (kullanıcı kuralı: maks 6) */
  maxChainDepth: z.number().int().min(1).max(6).default(6),
  requiresApproval: z.boolean().default(false),
});
export type EcaRule = z.infer<typeof EcaRuleSchema>;

export const MigrationModeSchema = z.enum([
  "append-only",
  "expand-contract",
  "reversible-backfill",
]);
export type MigrationMode = z.infer<typeof MigrationModeSchema>;

export const RulesetBoundarySchema = z.object({
  /** ECA/ruleset motoru UI isteğiyle veya AI çıktısıyla devre dışı bırakılamaz. */
  enforced: z.boolean().default(true),
  /** AI kendi yetki setini veya ECA kurallarını override edemez. */
  canOverride: z.boolean().default(false),
  /** ECA senaryoları ürün UI'i değil, backend/engine koruma katmanıdır. */
  backendOnly: z.boolean().default(true),
  version: z.string().default("ai-archetype-eca-v1"),
});
export type RulesetBoundary = z.infer<typeof RulesetBoundarySchema>;

export const ProdDataPolicySchema = z.object({
  /** Prod ArcheType güncellemesi geçmiş veriyi rewrite edemez. */
  preserveHistory: z.boolean().default(true),
  migrationModes: z.array(MigrationModeSchema).default(["append-only", "expand-contract"]),
  requireSnapshot: z.boolean().default(true),
  requireRollback: z.boolean().default(true),
  requireCompatibilityCheck: z.boolean().default(true),
});
export type ProdDataPolicy = z.infer<typeof ProdDataPolicySchema>;

/** AI ajan davranış politikası — makine-okunur (düz metin değil) */
export const AgentPolicySchema = z.object({
  autonomy: z.enum(["suggest", "draft", "apply-gated", "none"]).default("suggest"),
  capabilities: z.array(z.string()).default([]),
  /** AI'nin üretim/güncelleme hedefi olarak kullanabileceği WBS seviyeleri. */
  allowedTargets: z.array(WbsLevelSchema).default([]),
  /** AI için mutasyon hedefi olamayacak WBS seviyeleri. */
  forbiddenTargets: z.array(WbsLevelSchema).default(["app", "module"]),
  allowedActions: z.array(z.string()).default(["read", "suggest-changeset"]),
  forbiddenActions: z
    .array(z.string())
    .default([
      "generate-app",
      "generate-module",
      "update-app",
      "update-module",
      "publish-public",
      "disable-ruleset",
      "override-ruleset",
      "rewrite-history",
      "direct-prod-write",
    ]),
  /** step-up (insan onayı) gerektiren aksiyonlar */
  stepUp: z.array(z.string()).default([]),
  rulesetBoundary: RulesetBoundarySchema.default({}),
  prodDataPolicy: ProdDataPolicySchema.default({}),
  subPromptUntrusted: z.boolean().default(true),
  killSwitch: z.boolean().default(true),
});
export type AgentPolicy = z.infer<typeof AgentPolicySchema>;

/* ----------------------------------------------------------------------------
 * TaskNode — ana şema
 * -------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------
 * İzlenebilirlik (Faz P5) — plan düğümü ↔ gerçek implementation artefaktı bağı.
 * Bu nedir? Bir TaskNode'un hangi repo yolu, test komutu, deploy hedefi ve kanıtla
 *   gerçeklendiğini taşıyan opsiyonel alan kümesi.
 * Ne yapar? Plan ↔ kod izlenebilirliği (traceability) kurar; UI "implementation evidence" gösterir.
 * Ne yapmaz? Kod ÇALIŞTIRMAZ/DEĞİŞTİRMEZ; yalnızca referans/kanıt taşır. Tümüyle opsiyonel: eski JSON kırılmaz.
 * -------------------------------------------------------------------------- */
export const ImplementationStatusSchema = z.enum([
  "not-started",
  "scaffolded",
  "in-progress",
  "implemented",
  "verified",
]);
export type ImplementationStatus = z.infer<typeof ImplementationStatusSchema>;

export const TraceabilitySchema = z.object({
  /** Gerçek kod deposu yolu/yolları (repo veya monorepo path). */
  repoPath: z.array(z.string()).default([]),
  /** Bu düğümü doğrulayan test komutu/komutları. */
  testCommand: z.array(z.string()).default([]),
  /** Dağıtım hedefi (ör. Hetzner/Debian servisi, GitHub Pages, container imgesi). */
  deployTarget: z.string().nullable().default(null),
  /** Uygulama durumu — "plan var" ile "kod hazır" ayrımını açık tutar. */
  implementationStatus: ImplementationStatusSchema.default("not-started"),
  /** Çok-kiracılık stratejisi (platform düğümleri: schema-per-tenant | rls | hybrid). */
  tenantStrategy: z.string().nullable().default(null),
  /** Denetim günlüğü (audit log) kaynak referansı. */
  auditLogRef: z.string().nullable().default(null),
});
export type Traceability = z.infer<typeof TraceabilitySchema>;

/* ----------------------------------------------------------------------------
 * Mühendislik Standardı Bağı (ADR-0027) — düğüm, tek-kaynak standart sözleşmelere
 * REFERANS verir (yeniden yazmaz). Böylece standart drift'i imkânsızlaşır; CI
 * (check-standards-coverage) referans bütünlüğünü zorlar. tech-profiles deseninin kardeşi.
 * -------------------------------------------------------------------------- */
export const StandardRefsSchema = z.object({
  techProfileRef: z.string().default(""),
  architectureRef: z.string().default(""),
  codingStandardRef: z.string().default(""),
  shortCodeRef: z.string().default(""),
  designSystemRef: z.string().default(""),
  uiComponentRef: z.string().default(""),
  uxStandardRef: z.string().default(""),
  dataApiContractRef: z.string().default(""),
  stateContractRef: z.string().default(""),
  testingStandardRef: z.string().default(""),
  qualityGateRef: z.string().default(""),
  observabilityRef: z.string().default(""),
  releasePolicyRef: z.string().default(""),
  aiGovernanceRef: z.string().default(""),
  i18nRef: z.string().default(""),
  /** Tüm WBS/content düğümlerinin ortak URL/route kimlik sözleşmesi; ilgisiz düğüm yeni route icat etmez. */
  urlPolicyRef: z.literal("url-policy").default("url-policy"),
  // Yeni standart bağları (opsiyonel, geriye uyumlu): eski JSON'da yoksa parse kırılmaz.
  // Değer set edilirse check-standards-coverage bunu bir standarda çözmeyi zorlar.
  g11nRef: z.string().optional(),
  a11yRef: z.string().optional(),
  ssoRef: z.string().optional(),
  oidcRef: z.string().optional(),
  mfaRef: z.string().optional(),
  authzRef: z.string().optional(),
  c13nRef: z.string().optional(),
  dataNormalizationRef: z.string().optional(),
  i14yRef: z.string().optional(),
  c12nRef: z.string().optional(),
  p13nRef: z.string().optional(),
  edgeSecurityRef: z.string().optional(),
  iacRef: z.string().optional(),
  /** Çok-kiracılık izolasyon standardı (gap-2026-07-02-06 karar #3) — boyut değil, referans. */
  tenancyRef: z.string().optional(),
  /** Kişisel veri/KVKK-GDPR standardı — dataLifecycle boyutunun tek-kaynak sözleşme bağı. */
  privacyRef: z.string().optional(),
  /** Pazar/ülke açılımı, residency ve locale readiness sözleşmesi. */
  globalMarketReadinessRef: z.string().optional(),
  /** Para/kur/vergi/yuvarlama modeli sözleşmesi. */
  financeModelRef: z.string().optional(),
  /** Kişi, kuruluş ve kimlik verisi modelleme sözleşmesi. */
  identityDataRef: z.string().optional(),
  /** Arama, sıralama ve sonuç-kalitesi sözleşmesi. */
  searchQualityRef: z.string().optional(),
  /** Karar, KPI ve rapor verisinin doğruluk/provenance sözleşmesi. */
  decisionGradeRef: z.string().optional(),
  /** App/module için enterprise-only waterfall ve day-2 teslim standardı. */
  enterpriseDeliveryRef: z.string().optional(),
  /** App assembly, app-core ve app module için SDK-only geliştirme standardı. */
  sdkDevelopmentRef: z.string().optional(),
});
export type StandardRefs = z.infer<typeof StandardRefsSchema>;

/** Boyut uygulanabilirliği: bir boyut bu düğüme uygulanmıyorsa applies=false + gerekçe. */
export const ApplicabilitySchema = z.object({
  applies: z.boolean().default(true),
  reason: z.string().default(""),
});
export type Applicability = z.infer<typeof ApplicabilitySchema>;

/** Standarttan bilinçli sapma — gerekçeli, onaylı, süreli (waiver yaşam döngüsü). */
export const WaiverSchema = z.object({
  id: z.string().min(1),
  /** Feragat kapsamı: bir standardRef anahtarı, bir boyut anahtarı veya serbest kapsam. */
  scope: z.string().min(1),
  reason: z.string().min(1),
  approvedBy: z.string().default(""),
  date: z.string().default(""),
  /** Son geçerlilik tarihi (boş = süresiz; gate süreli ister). */
  expires: z.string().default(""),
});
export type Waiver = z.infer<typeof WaiverSchema>;

export const TaskNodeSchema = z
  .object({
    schemaVersion: z.string().default(SCHEMA_VERSION),

    // Kimlik & hiyerarşi
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/, "id küçük-harf kebab-case olmalı"),
    wbsCode: z.string().default(""),
    level: WbsLevelSchema,
    /** Ticari/teknik artefakt kimliği WBS seviyesinden bağımsızdır; rollout boyunca opsiyoneldir. */
    artifactKind: ArtifactKindSchema.optional(),
    title: z.string().min(1),
    slug: z.string().min(1),
    /** Eski task URL/ID değerleri; canonical id değişse bile eski linkler çözülür. */
    aliases: z.array(z.string()).default([]),
    /** Legacy alias düğümünün yöneldiği kanonik task kimliği. */
    canonicalId: z.string().optional(),
    summary: z.string().default(""),
    parentId: z.string().nullable().default(null),
    order: z.number().default(0),
    icon: z.string().default("ph-cube"),
    tags: z.array(z.string()).default([]),

    // Bağımlılık & ilişki
    dependsOn: z.array(z.string()).default([]),
    blocks: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    refs: z.array(z.string()).default([]),
    criticalPath: z.boolean().default(false),

    // Planlama & izleme
    status: TaskStatusSchema.default("backlog"),
    priority: PrioritySchema.default("medium"),
    owner: z.string().nullable().default(null),
    /** Çoklu atama (Faz 0) — owner tekil sahip; assignees ek atananlar. */
    assignees: z.array(z.string()).default([]),
    effort: EffortSchema.default({}),
    /** 0-100; ebeveynlerde rollup ile türetilebilir */
    progress: z.number().min(0).max(100).default(0),
    phase: WaterfallPhaseSchema.default("requirements"),
    phases: z.record(WaterfallPhaseSchema, PhaseGateSchema).default({}),

    // Yürütme (dev-ekip): milestone + takvim. effort.unit "d" = adam-gün (waterfall).
    milestone: z.string().nullable().default(null),
    schedule: ScheduleSchema,

    // Kalite & kabul
    deliverables: z.array(z.string()).default([]),
    acceptanceCriteria: z.array(z.string()).default([]),
    risks: z.array(RiskSchema).default([]),
    rollback: z.string().nullable().default(null),
    evidence: z.array(z.string()).default([]),

    // Maliyet / kaynak / metrik ("ve daha fazlası")
    cost: z
      .object({
        budget: z.number().nonnegative().optional(),
        currency: z.string().default("TRY"),
        resources: z.array(z.string()).default([]),
      })
      .optional(),
    metrics: z.array(z.object({ key: z.string(), target: z.string() })).default([]),

    // Otomasyon — YAPISAL (motorun çalıştırabildiği), düz metin değil
    ecaRules: z.array(EcaRuleSchema).default([]),
    agentPolicy: AgentPolicySchema.optional(),

    // 14 üretim boyutu (iskelet)
    dimensions: z.record(DimensionKeySchema, DimensionSchema).default({}),

    // İzlenebilirlik (Faz P5) — plan ↔ gerçek kod artefaktı bağı (opsiyonel; geriye uyumlu)
    traceability: TraceabilitySchema.optional(),

    /** WBS micro-step veya atomik değer tipi için tam, makine-okunur atom sözleşmesi. */
    atomDefinition: AtomDefinitionSchema.optional(),

    /** Bağımsız, satılabilir app'in enterprise + SDK-only sözleşmesi. */
    appDefinition: AppDefinitionSchema.optional(),
    /** App-core veya app module'ünün enterprise + SDK-only sözleşmesi. */
    moduleDefinition: ModuleDefinitionSchema.optional(),
    /** Runtime teslimatını app/module/SDK zincirine bağlar; rollout boyunca opsiyoneldir. */
    deliveryContext: DeliveryContextSchema.optional(),

    // Mühendislik standardı bağı (ADR-0027) — düğüm tek-kaynak sözleşmelere REFERANS verir.
    standardRefs: StandardRefsSchema.default({}),
    /** Boyut uygulanabilirliği (dimKey → {applies, reason}). Boş = tüm boyutlar uygulanır. */
    applicability: z.record(DimensionKeySchema, ApplicabilitySchema).default({}),
    /** Standarttan bilinçli sapma kayıtları (gerekçeli, onaylı, süreli). */
    waivers: z.array(WaiverSchema).default([]),

    /**
     * UI artifact rolü (produces-ui/changes-ui-contract/governs-ui/consumes-ui/no-ui) —
     * docs/storybook-root-integration-gap-report.md §3: "UI hakkında konuşan" (governs)
     * düğüm "UI üreten" sayılmaz; kapı adaylığı yalnız produces-ui/changes-ui-contract.
     * Opsiyonel (lazy); açık karar migration'ı registry/generator ile yapılır.
     */
    uiArtifactRole: UiArtifactRoleSchema.optional(),

    /**
     * Makine-okunur UI teslimat sözleşmesi (Storybook + Master Component entegrasyonu).
     * Opsiyonel (lazy migration); UI-impact adayları için check-ui-delivery kapısı zorlar.
     * Kaynak: docs/storybook-master-component-integration-directive.md §3.
     */
    uiDelivery: UiDeliverySchema.optional(),

    // Köken & governance
    source: SourceSchema.optional(),
    state: MaturitySchema.default("taslak"),
    lastUpdated: z.string().default(""),
  })
  .strict()
  .superRefine((node, ctx) => {
    if (node.artifactKind === "legacy-alias" && !node.canonicalId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canonicalId"],
        message: "artifactKind=legacy-alias düğümü boş olmayan canonicalId taşımalı",
      });
    }
    if (node.artifactKind !== "legacy-alias" && node.canonicalId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["canonicalId"],
        message: "canonicalId yalnız artifactKind=legacy-alias düğümünde kullanılabilir",
      });
    }
    if (node.appDefinition && (node.level !== "app" || node.artifactKind !== "sellable-app")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appDefinition"],
        message:
          "appDefinition yalnız artifactKind=sellable-app ve level=app düğümünde kullanılabilir",
      });
    }
    if (
      node.moduleDefinition &&
      (node.level !== "module" ||
        (node.artifactKind !== "app-core-module" && node.artifactKind !== "app-module"))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["moduleDefinition"],
        message:
          "moduleDefinition yalnız artifactKind=app-core-module/app-module ve level=module düğümünde kullanılabilir",
      });
    }
    if (node.moduleDefinition && node.artifactKind !== node.moduleDefinition.artifactKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["moduleDefinition", "artifactKind"],
        message: "TaskNode artifactKind ile moduleDefinition artifactKind aynı olmalı",
      });
    }
    if (node.atomDefinition?.kind === "task-micro-step" && node.level !== "micro_step") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["atomDefinition"],
        message: "task-micro-step atom tanımı yalnız level=micro_step düğümünde kullanılabilir",
      });
    }
    if (node.atomDefinition?.kind === "task-demonstration" && node.level !== "micro_step") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["atomDefinition"],
        message: "task-demonstration atom tanımı yalnız level=micro_step düğümünde kullanılabilir",
      });
    }
    if (node.level === "micro_step" && node.atomDefinition?.kind === "value-type") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["atomDefinition"],
        message: "micro_step WBS düğümü task-micro-step atom tanımı taşımalıdır",
      });
    }
  });

export type TaskNode = z.infer<typeof TaskNodeSchema>;

/* ----------------------------------------------------------------------------
 * Yardımcılar
 * -------------------------------------------------------------------------- */

/** 17 üretim boyutunun iskeletini (boş) üretir. */
export function makeSkeletonDimensions(): Record<DimensionKey, Dimension> {
  const out = {} as Record<DimensionKey, Dimension>;
  for (const key of DIMENSION_KEYS) {
    out[key] = {
      key,
      title: DIMENSION_META[key].tr,
      status: "skeleton",
      items: [],
      notes: "",
      prompt: "",
      provenance: "template",
    };
  }
  return out;
}

/** 7 fazın iskeletini (pending) üretir. */
export function makeSkeletonPhases(): Record<WaterfallPhase, PhaseGate> {
  const out = {} as Record<WaterfallPhase, PhaseGate>;
  for (const phase of WATERFALL_PHASES) {
    out[phase] = { status: "pending", criteria: [], passed: false, notes: "" };
  }
  return out;
}

/** Bir düğümün dolu boyut sayısı (iskelet olmayan). */
export function filledDimensionCount(node: TaskNode): number {
  return Object.values(node.dimensions).filter((d) => d.status !== "skeleton").length;
}
