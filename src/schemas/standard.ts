import { z } from "zod";

/**
 * Mühendislik Standardı Sözleşmesi (ADR-0027) — TEK paylaşılan şema; her standart
 * (coding/design/test/devops/ai…) `src/data/standards/<id>.json` olarak bu şemaya uyar.
 * Düğüm bunlara `standardRefs` ile REFERANS verir; içeriği yeniden yazmaz (drift yok).
 * "Kart ekle" değil, makine-okunur + CI-zorlamalı sözleşme.
 */
export const StandardSeveritySchema = z.enum(["must", "should", "may"]);
export type StandardSeverity = z.infer<typeof StandardSeveritySchema>;

export const StandardFamilySchema = z.enum([
  "engineering",
  "design",
  "testing",
  "devops",
  "ai",
  "data",
  "governance",
]);
export type StandardFamily = z.infer<typeof StandardFamilySchema>;

export const StandardRuleSchema = z.object({
  id: z.string().min(1),
  /** Kuralın kendisi — somut, ölçülebilir, uygulanabilir. */
  rule: z.string().min(1),
  rationale: z.string().default(""),
  severity: StandardSeveritySchema.default("must"),
  /** Nasıl zorlanır: CI kapısı / lint kuralı / review / test. Boş = henüz otomatik değil. */
  check: z.string().default(""),
});
export type StandardRule = z.infer<typeof StandardRuleSchema>;

export const StandardContractSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  version: z.string().default("1.0.0"),
  family: StandardFamilySchema,
  basedOnAdr: z.array(z.string()).default([]),
  summary: z.string().default(""),
  /** Hangi yüzey sınıfı/seviyeye uygulanır (boş = hepsi). */
  appliesTo: z.array(z.string()).default([]),
  rules: z.array(StandardRuleSchema).min(3),
  banned: z.array(z.string()).default([]),
  allowed: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
});
export type StandardContract = z.infer<typeof StandardContractSchema>;

export const StandardCatalogSchema = z.array(StandardContractSchema);
export type StandardCatalog = z.infer<typeof StandardCatalogSchema>;
