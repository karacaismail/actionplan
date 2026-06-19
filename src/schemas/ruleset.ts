import { z } from "zod";
import { RulesetLayerSchema } from "./archetype";
import { EcaRuleSchema } from "./task";

/* ----------------------------------------------------------------------------
 * ECA Ruleset Paket Kataloğu (Küme C) — yeniden kullanılabilir otomasyon reçeteleri.
 *
 * Bu nedir? Düğüm-başı inline ecaRules'tan AYRI, ADLANDIRILMIŞ ve yeniden kullanılabilir
 *   ECA (Event-Condition-Action) kural PAKETLERİ kataloğu.
 * Ne işe yarar? Aynı otomasyon desenini (onay akışı, SLA tırmandırma, audit) tek yerde tanımlayıp
 *   birçok ArcheType/düğüme uygulamayı sağlar (tek doğruluk kaynağı).
 * Ne yapar? Her paket; katman (system/platform/tenant), kategori, parametre ve kural şablonları taşır.
 * Ne yapmaz? Paket TEK BAŞINA çalışmaz; ECA motoru (src/engine/eca.ts) tarafından bağlandığında işler.
 *   Güvenlik: system-katman paketleri AI tarafından değiştirilemez (aiCanModify=false zorunlu).
 * -------------------------------------------------------------------------- */

/** Paket kategorisi — otomasyonun amacı. */
export const RulesetCategorySchema = z.enum([
  "notification", // bildirim/hatırlatma
  "escalation", // tırmandırma (SLA/gecikme)
  "approval", // onay akışı (insan onayı)
  "audit", // denetim izi yazımı
  "lifecycle", // yaşam döngüsü (onboarding/offboarding/kapanış)
  "security-gate", // güvenlik kapısı (deny/step-up)
  "integration", // dış servis/webhook
  "migration", // göç koruması
  "ai-boundary", // AI yetki sınırı (system)
]);
export type RulesetCategory = z.infer<typeof RulesetCategorySchema>;

/** Paketin tenant tarafından güvenli ayarlanabilir parametresi (RulesetLayer "tenant" güvenli-param). */
export const RulesetParamSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["number", "string", "boolean", "duration"]),
  default: z.union([z.string(), z.number(), z.boolean()]),
  /** Yalnız tenant katmanı bu parametreyi değiştirebilir; system/platform sabittir. */
  tenantEditable: z.boolean().default(false),
});
export type RulesetParam = z.infer<typeof RulesetParamSchema>;

/** Paketin güvenlik/etki profili. */
export const RulesetSafetySchema = z.object({
  /** Veri yazar mı yoksa yalnız okur/bildirir mi? */
  mutates: z.boolean().default(true),
  /** Uygulanmadan önce insan onayı gerekir mi? */
  requiresApproval: z.boolean().default(false),
  /** AI bu paketi değiştirebilir mi? system katmanında ZORUNLU false. */
  aiCanModify: z.boolean().default(false),
  /** Sonsuz tetik zincirini kıran üst sınır (kullanıcı kuralı: maks 6). */
  maxChainDepth: z.number().int().min(1).max(6).default(6),
});
export type RulesetSafety = z.infer<typeof RulesetSafetySchema>;

/** Paketin nereye uygulanabileceği (boş = tümü). */
export const RulesetScopeSchema = z.object({
  clusters: z.array(z.string()).default([]),
  levels: z.array(z.string()).default([]),
});

/** Yeniden kullanılabilir ECA kural paketi. */
export const EcaRulesetPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  /** system (kilitli) / platform (çekirdek ekip) / tenant (güvenli-param). */
  layer: RulesetLayerSchema,
  category: RulesetCategorySchema,
  version: z.string().default("1.0.0"),
  params: z.array(RulesetParamSchema).default([]),
  /** Paketin taşıdığı çalıştırılabilir ECA kural şablonları (en az 1). */
  rules: z.array(EcaRuleSchema).min(1),
  safety: RulesetSafetySchema.default({}),
  appliesTo: RulesetScopeSchema.default({}),
});
export type EcaRulesetPackage = z.infer<typeof EcaRulesetPackageSchema>;

/** Katalog = paket dizisi (src/data/eca/ruleset-catalog.json). */
export const EcaRulesetCatalogSchema = z.array(EcaRulesetPackageSchema);
export type EcaRulesetCatalog = z.infer<typeof EcaRulesetCatalogSchema>;
