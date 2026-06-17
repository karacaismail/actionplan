import { z } from "zod";

/**
 * TaskNode — Eylem planının tek doğruluk kaynağı (JSON-as-DB).
 * Her düğüm hem bir doküman sayfası hem de WBS görevidir.
 * Şema, TS tiplerinin tek kaynağıdır (z.infer ile türetilir).
 */

export const SCHEMA_VERSION = "1.0.0";

/* ----------------------------------------------------------------------------
 * 7-seviye doğa-metaforu hiyerarşisi
 * -------------------------------------------------------------------------- */
export const WBS_LEVELS = [
  "app", // dağ
  "module", // kaya
  "archetype", // büyük taş
  "stone", // orta taş
  "molecule", // küçük taş
  "element", // toz tanesi
  "atom", // atom
] as const;
export const WbsLevelSchema = z.enum(WBS_LEVELS);
export type WbsLevel = z.infer<typeof WbsLevelSchema>;

export const LEVEL_META: Record<WbsLevel, { tr: string; metaphor: string; depth: number }> = {
  app: { tr: "Uygulama", metaphor: "dağ", depth: 0 },
  module: { tr: "Modül", metaphor: "kaya", depth: 1 },
  archetype: { tr: "ArcheType", metaphor: "büyük taş", depth: 2 },
  stone: { tr: "Taş", metaphor: "orta taş", depth: 3 },
  molecule: { tr: "Molekül", metaphor: "küçük taş", depth: 4 },
  element: { tr: "Element", metaphor: "toz tanesi", depth: 5 },
  atom: { tr: "Atom", metaphor: "atom", depth: 6 },
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
  requirements: { tr: "Gereksinim", order: 1 },
  "test-plan": { tr: "Test Planı", order: 2 },
  "db-schema": { tr: "DB / Şema", order: 3 },
  development: { tr: "Geliştirme", order: 4 },
  "test-qa": { tr: "Test / QA", order: 5 },
  verification: { tr: "Doğrulama", order: 6 },
  "release-maintenance": { tr: "Yayın / Bakım", order: 7 },
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
 * 14 üretim boyutu (kullanıcı prompt-block seti)
 * -------------------------------------------------------------------------- */
export const DIMENSION_KEYS = [
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
export const DimensionKeySchema = z.enum(DIMENSION_KEYS);
export type DimensionKey = z.infer<typeof DimensionKeySchema>;

export const DIMENSION_META: Record<DimensionKey, { tr: string; icon: string }> = {
  featureDefs: { tr: "Özellik Tanımları", icon: "ph-list-bullets" },
  security: { tr: "Güvenlik Önlemleri", icon: "ph-shield-check" },
  codeOptimization: { tr: "Kod Optimizasyonu", icon: "ph-code" },
  securityOptimization: { tr: "Güvenlik Optimizasyonu", icon: "ph-lock-key" },
  performance: { tr: "Performans Optimizasyonu", icon: "ph-gauge" },
  mobileApps: { tr: "Mobil Uygulama Uyumu", icon: "ph-device-mobile" },
  wcag: { tr: "WCAG 2.2 AAA", icon: "ph-wheelchair" },
  deployment: { tr: "Dağıtım (Swarm/K8s/Shared)", icon: "ph-stack" },
  eca: { tr: "ECA Kuralları", icon: "ph-flow-arrow" },
  aiAgents: { tr: "AI Ajan Davranışı", icon: "ph-robot" },
  testing: { tr: "Testler & QA", icon: "ph-test-tube" },
  owasp: { tr: "OWASP & Standartlar", icon: "ph-bug-beetle" },
  integration: { tr: "Kernel/Core Entegrasyonu", icon: "ph-plugs-connected" },
  moduleUsage: { tr: "Modül Kullanımı", icon: "ph-share-network" },
};

export const DimensionStatusSchema = z.enum(["skeleton", "draft", "filled"]);
export type DimensionStatus = z.infer<typeof DimensionStatusSchema>;

export const DimensionSchema = z.object({
  key: DimensionKeySchema,
  title: z.string(),
  status: DimensionStatusSchema.default("skeleton"),
  /** Madde listesi — iskelet düğümlerde boş */
  items: z.array(z.string()).default([]),
  notes: z.string().default(""),
  /** Bu boyutu üretmek için bağlama-özgü AI prompt'u (vibecoding) */
  prompt: z.string().default(""),
});
export type Dimension = z.infer<typeof DimensionSchema>;

/* ----------------------------------------------------------------------------
 * Planlama / izleme yardımcı şemaları
 * -------------------------------------------------------------------------- */
export const STATUS_LIST = [
  "backlog",
  "todo",
  "in-progress",
  "blocked",
  "review",
  "done",
] as const;
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
 * TaskNode — ana şema
 * -------------------------------------------------------------------------- */
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
    title: z.string().min(1),
    slug: z.string().min(1),
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
    effort: EffortSchema.default({}),
    /** 0-100; ebeveynlerde rollup ile türetilebilir */
    progress: z.number().min(0).max(100).default(0),
    phase: WaterfallPhaseSchema.default("requirements"),
    phases: z.record(WaterfallPhaseSchema, PhaseGateSchema).default({}),

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

    // 14 üretim boyutu (iskelet)
    dimensions: z.record(DimensionKeySchema, DimensionSchema).default({}),

    // Köken & governance
    source: SourceSchema.optional(),
    state: MaturitySchema.default("taslak"),
    lastUpdated: z.string().default(""),
  })
  .strict();

export type TaskNode = z.infer<typeof TaskNodeSchema>;

/* ----------------------------------------------------------------------------
 * Yardımcılar
 * -------------------------------------------------------------------------- */

/** 14 boyutun iskeletini (boş) üretir. */
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
