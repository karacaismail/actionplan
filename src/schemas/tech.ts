import { z } from "zod";

/**
 * Tech Profilleri — frontend stack'in TEK makine-okunur doğruluk kaynağı (ADR-0026).
 * "stack" sözcüğü ürün-Stack/Edition taksonomisiyle çakıştığı için "tech-profile" denir.
 * Kilit: tüm ürün frontend'i HEADLESS (stillenmiş kit yok). Surface'lar buraya
 * `techProfileRef` ile bağlanır (Faz 2); CI bu manifesti zorlar (Faz 3, check-tech-profile).
 */

/** Yüzey sınıfı: ürün SaaS app / statik frontpage / viz / (planlama) araç. */
export const TechSurfaceSchema = z.enum(["saas-app", "static-frontpage", "data-viz", "tooling"]);
export type TechSurface = z.infer<typeof TechSurfaceSchema>;

export const CssStrategySchema = z.enum(["scss-tokens", "tailwind", "none"]);

export const TechProfileSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  surface: TechSurfaceSchema,
  /** Çalışma zemini (her zaman typescript dahil). */
  runtime: z.array(z.string()).min(1),
  /** Headless primitive kütüphanesi (radix / react-aria / none-alpine). */
  primitive: z.string().min(1),
  /** KİLİT: ürün frontend'i headless olmak ZORUNDA. */
  headless: z.boolean().default(true),
  css: CssStrategySchema,
  /** Veri-grid (headless): tanstack-table / "". */
  dataGrid: z.string().default(""),
  /** Form motoru: react-hook-form+zod / tanstack-form+zod / "". */
  form: z.string().default(""),
  /** Sunucu durumu + rota. */
  state: z.string().default(""),
  router: z.string().default(""),
  /** Görselleştirme (tembel-yüklü): echarts/deckgl/react-flow. */
  viz: z.array(z.string()).default([]),
  /** Bu profilde YASAK paketler (global yasaklara ek). */
  banned: z.array(z.string()).default([]),
  notes: z.string().default(""),
});
export type TechProfile = z.infer<typeof TechProfileSchema>;

export const TechProfilesManifestSchema = z.object({
  version: z.string(),
  /** Bu manifestin genişlettiği/temel aldığı ADR'ler. */
  basedOnAdr: z.array(z.string()).default([]),
  /** Tüm profillerde geçerli, repo genelinde yasak paketler. */
  bannedGlobal: z.array(z.string()).default([]),
  profiles: z.array(TechProfileSchema).min(1),
});
export type TechProfilesManifest = z.infer<typeof TechProfilesManifestSchema>;
