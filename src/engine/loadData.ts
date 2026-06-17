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
import { type TreeNode, buildTree } from "./buildTree";
import { type NodeIndex, indexById } from "./resolve";

export interface Dataset {
  nodes: TaskNode[];
  index: NodeIndex;
  tree: TreeNode[];
  navigation: NavNode[];
  meta: DatasetMeta;
  errors: string[];
}

// Tüm görev JSON'ları derleme zamanında statik olarak toplanır (JSON-as-DB).
const nodeModules = import.meta.glob<{ default: unknown }>("../data/generated/nodes/*.json", {
  eager: true,
});

let cache: Dataset | null = null;

/** Veri setini yükler, Zod ile doğrular, ağaç + rollup kurar. Sonuç önbelleğe alınır. */
export function loadDataset(): Dataset {
  if (cache) return cache;
  const errors: string[] = [];
  const nodes: TaskNode[] = [];

  for (const [path, mod] of Object.entries(nodeModules)) {
    const parsed = TaskNodeSchema.safeParse(mod.default);
    if (parsed.success) nodes.push(parsed.data);
    else errors.push(`${path}: ${parsed.error.issues.map((x) => x.message).join("; ")}`);
  }

  const navParsed = NavNodeSchema.array().safeParse(navigationJson);
  const metaParsed = DatasetMetaSchema.safeParse(metaJson);
  if (!navParsed.success) errors.push("navigation.json doğrulanamadı");
  if (!metaParsed.success) errors.push("meta.json doğrulanamadı");

  cache = {
    nodes,
    index: indexById(nodes),
    tree: buildTree(nodes),
    navigation: navParsed.success ? navParsed.data : [],
    meta: metaParsed.success
      ? metaParsed.data
      : {
          schemaVersion: "1.0.0",
          generatedAt: "",
          counts: { total: nodes.length, byLevel: {}, byStatus: {}, byCluster: {}, filledExample: 0 },
          source: { contentSource: 0, oldatas: 0, deduped: 0, synthesizedApps: 0 },
        },
    errors,
  };
  return cache;
}

/** Test/HMR için önbelleği temizler. */
export function resetDatasetCache(): void {
  cache = null;
}
