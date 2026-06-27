import { z } from "zod";

/* ----------------------------------------------------------------------------
 * Surface & Workflow Sözleşme Kataloğu (Küme D) — ArcheType'tan AYRI versiyonlanan,
 * yeniden kullanılabilir yüzey (ekran) ve iş akışı (davranış) sözleşmeleri.
 *
 * Bu nedir? Surface = bir ArcheType'ın kullanıcıya gösterilen projeksiyonu (liste/detay/form/board).
 *   Workflow = bir ArcheType'ın çok-adımlı davranışı (durum makinesi + geçişler).
 * Ne işe yarar? Aynı ekran/akış desenini birçok ArcheType'a uygulamayı ve ayrı versiyonlamayı sağlar.
 * Ne yapar? Sözleşme; tip, alanlar, aksiyonlar, erişilebilirlik, izinler (Surface) ve durum/geçiş/SLA (Workflow) taşır.
 * Ne yapmaz? Sözleşme UI kodu DEĞİLDİR; panel (Küme E) bu sözleşmeyi okuyup render eder. Workflow geçişleri
 *   ECA ruleset paketlerine (Küme C) referansla otomasyona bağlanır; insan onayı gereken geçiş açıkça işaretlenir.
 * -------------------------------------------------------------------------- */

/* ---- Surface (yüzey/ekran) ---- */
export const SurfaceTypeSchema = z.enum([
  "list",
  "detail",
  "form",
  "board",
  "dashboard",
  "wizard",
  "report",
  "timeline",
]);
export type SurfaceType = z.infer<typeof SurfaceTypeSchema>;

export const SurfaceResponsiveSchema = z.object({
  /** Dar ekranda davranış: tek sütuna yığ / yatay kaydır / gizle. */
  mobile: z.enum(["stack", "scroll", "hidden"]).default("stack"),
});

export const SurfaceA11ySchema = z.object({
  wcag: z.string().default("2.2-AAA"),
  keyboardNav: z.boolean().default(true),
  /** Durum yalnız renkle değil metinle de bildirilir. */
  textStatus: z.boolean().default(true),
});

export const SurfaceContractSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: SurfaceTypeSchema,
  version: z.string().default("1.0.0"),
  /** Hangi ArcheType'ı projekte eder ("" = jenerik şablon). */
  archetypeRef: z.string().default(""),
  /** Gösterilen alan/kolon anahtarları. */
  elements: z.array(z.string()).default([]),
  /** Tipli aksiyon id'leri (ArcheType typed-actions ile hizalı). */
  actions: z.array(z.string()).default([]),
  /** Facet/filtre alanları. */
  filters: z.array(z.string()).default([]),
  layout: z.enum(["table", "cards", "split", "grid", "stepper", "chart"]).default("table"),
  responsive: SurfaceResponsiveSchema.default({}),
  a11y: SurfaceA11ySchema.default({}),
  /** Erişebilecek roller (boş = ArcheType izinlerine devre). */
  permissions: z.array(z.string()).default([]),
});
export type SurfaceContract = z.infer<typeof SurfaceContractSchema>;

/* ---- Workflow (iş akışı/davranış) ---- */
export const WorkflowTransitionSchema = z.object({
  from: z.string(),
  to: z.string(),
  /** Geçişi tetikleyen olay (ör. "submitted", "approved"). */
  on: z.string(),
  /** Geçiş koşulu (boş = koşulsuz). */
  guard: z.string().default(""),
  /** Geçişte tetiklenecek aksiyon tipi (ör. "notify", "create-task"). */
  action: z.string().default(""),
  /** Bu geçiş insan onayı gerektirir mi? */
  requiresApproval: z.boolean().default(false),
});

export const WorkflowApprovalSchema = z.object({
  state: z.string(),
  approverRole: z.string(),
});

export const WorkflowContractSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default("1.0.0"),
  archetypeRef: z.string().default(""),
  states: z.array(z.string()).min(2),
  initial: z.string(),
  terminalStates: z.array(z.string()).default([]),
  transitions: z.array(WorkflowTransitionSchema).min(1),
  /** Bağlı ECA ruleset paketleri (Küme C: ruleset-catalog.json id'leri). */
  rulesetRefs: z.array(z.string()).default([]),
  approvals: z.array(WorkflowApprovalSchema).default([]),
  slaHours: z.number().int().positive().optional(),
});
export type WorkflowContract = z.infer<typeof WorkflowContractSchema>;

/* ---- Katalog ---- */
export const SurfaceCatalogSchema = z.array(SurfaceContractSchema);
export const WorkflowCatalogSchema = z.array(WorkflowContractSchema);
export type SurfaceCatalog = z.infer<typeof SurfaceCatalogSchema>;
export type WorkflowCatalog = z.infer<typeof WorkflowCatalogSchema>;
