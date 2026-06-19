import { z } from "zod";

/**
 * Yürütme/görünüm şemaları (Faz 0): kişi (assignee) kaydı + kayıtlı görünüm.
 * Çok-kullanıcılı auth DEĞİL; atama-veri + görünüm kalıcılığı katmanı.
 */

export const PersonSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "id küçük-harf kebab-case olmalı"),
  name: z.string().min(1),
  role: z.string().default(""),
  /** Günlük kapasite (adam-gün/gün) — Faz 4 workload için. */
  capacityPerDay: z.number().nonnegative().default(1),
  active: z.boolean().default(true),
});
export type Person = z.infer<typeof PersonSchema>;
export const PeopleArraySchema = z.array(PersonSchema);

export const SavedViewSortSchema = z.object({
  col: z.string(),
  dir: z.enum(["asc", "desc"]).default("asc"),
});
export type SavedViewSort = z.infer<typeof SavedViewSortSchema>;

export const SavedViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Filtre DSL ifadesi (engine/query.ts parser'ı). */
  query: z.string().default(""),
  columns: z.array(z.string()).default([]),
  sort: z.array(SavedViewSortSchema).default([]),
  group: z.string().nullable().default(null),
  createdAt: z.string().default(""),
});
export type SavedView = z.infer<typeof SavedViewSchema>;
export const SavedViewArraySchema = z.array(SavedViewSchema);
