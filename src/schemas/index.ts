import { z } from "zod";
import { TaskNodeSchema, WbsLevelSchema } from "./task";

export * from "./task";

/** Navigasyon ağacı düğümü (generated/navigation.json) */
export const NavNodeSchema: z.ZodType<NavNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    level: WbsLevelSchema,
    icon: z.string().default("ph-cube"),
    wbsCode: z.string().default(""),
    children: z.array(NavNodeSchema).default([]),
  }),
);
export interface NavNode {
  id: string;
  title: string;
  level: z.infer<typeof WbsLevelSchema>;
  icon: string;
  wbsCode: string;
  children: NavNode[];
}

/** Üretilmiş veri seti meta bilgisi (generated/meta.json) */
export const DatasetMetaSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  counts: z.object({
    total: z.number(),
    byLevel: z.record(z.string(), z.number()),
    byStatus: z.record(z.string(), z.number()),
    byCluster: z.record(z.string(), z.number()),
    filledExample: z.number(),
  }),
  source: z.object({
    contentSource: z.number(),
    oldatas: z.number(),
    deduped: z.number(),
    synthesizedApps: z.number(),
  }),
});
export type DatasetMeta = z.infer<typeof DatasetMetaSchema>;

/** Tüm düğüm dizisini doğrulayan yardımcı. */
export const TaskNodeArraySchema = z.array(TaskNodeSchema);
