import metaJson from "@/data/generated/meta.json";
import navigationJson from "@/data/generated/navigation.json";
import {
  type DatasetMeta,
  DatasetMetaSchema,
  type NavNode,
  NavNodeSchema,
  type TaskNode,
  TaskNodeSchema,
} from "@/schemas";

/**
 * Veri yükleme (lazy mimari):
 * - navigation + meta KÜÇÜK → derleme zamanında eager (uygulama kabuğu hemen render).
 * - 363 düğümün AĞIR gövdesi → statik asset (public/data/nodes.json), runtime'da fetch.
 *   Böylece başlangıç JS paketi küçük kalır (~enterprise perf).
 */

export interface MetaBundle {
  navigation: NavNode[];
  meta: DatasetMeta;
  errors: string[];
}

const FALLBACK_META: DatasetMeta = {
  schemaVersion: "1.0.0",
  generatedAt: "",
  counts: { total: 0, byLevel: {}, byStatus: {}, byCluster: {}, filledExample: 0 },
  source: { contentSource: 0, oldatas: 0, deduped: 0, synthesizedApps: 0 },
};

/** Küçük meta + navigasyonu senkron döndürür (eager). */
export function loadMeta(): MetaBundle {
  const errors: string[] = [];
  const nav = NavNodeSchema.array().safeParse(navigationJson);
  const meta = DatasetMetaSchema.safeParse(metaJson);
  if (!nav.success) errors.push("navigation.json doğrulanamadı");
  if (!meta.success) errors.push("meta.json doğrulanamadı");
  return {
    navigation: nav.success ? nav.data : [],
    meta: meta.success ? meta.data : FALLBACK_META,
    errors,
  };
}

/** Ağır düğüm setini statik asset'ten çeker ve Zod ile doğrular (lazy). */
export async function loadNodesAsync(): Promise<{ nodes: TaskNode[]; errors: string[] }> {
  const url = `${import.meta.env.BASE_URL}data/nodes.json`;
  let raw: unknown[];
  try {
    const res = await fetch(url);
    if (!res.ok) return { nodes: [], errors: [`nodes.json yüklenemedi: HTTP ${res.status}`] };
    raw = (await res.json()) as unknown[];
  } catch (e) {
    return { nodes: [], errors: [`nodes.json getirilemedi: ${(e as Error).message}`] };
  }
  const nodes: TaskNode[] = [];
  const errors: string[] = [];
  for (const item of raw) {
    const parsed = TaskNodeSchema.safeParse(item);
    if (parsed.success) nodes.push(parsed.data);
    else errors.push(parsed.error.issues[0]?.message ?? "geçersiz düğüm");
  }
  return { nodes, errors };
}
