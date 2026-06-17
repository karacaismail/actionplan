import type { TaskNode } from "@/schemas";

export interface CriticalPath {
  /** Kritik yol üzerindeki düğüm id'leri */
  ids: Set<string>;
  /** Kökten uca sıralı yol */
  path: string[];
  /** Ağırlıklı uzunluk (efor toplamı) */
  length: number;
}

/**
 * Bağımlılık DAG'ında en uzun (efor-ağırlıklı) zinciri bulur — kritik yol.
 * dependsOn kenarı "önce bitmeli" demektir. Döngüler (tipli relations'tan
 * gelebilir) güvenle kırılır (geri kenar 0 katkı).
 */
export function computeCriticalPath(nodes: TaskNode[]): CriticalPath {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const weight = (n: TaskNode) => Math.max(1, n.effort?.estimate || 1);

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const onStack = new Set<string>();

  const longest = (id: string): number => {
    const cached = dist.get(id);
    if (cached !== undefined) return cached;
    if (onStack.has(id)) return 0; // döngü kır
    const n = byId.get(id);
    if (!n) return 0;
    onStack.add(id);
    let best = 0;
    let from: string | null = null;
    for (const dep of n.dependsOn) {
      if (!byId.has(dep)) continue;
      const l = longest(dep);
      if (l > best) {
        best = l;
        from = dep;
      }
    }
    onStack.delete(id);
    const total = best + weight(n);
    dist.set(id, total);
    prev.set(id, from);
    return total;
  };

  let endId: string | null = null;
  let max = -1;
  for (const n of nodes) {
    const d = longest(n.id);
    if (d > max) {
      max = d;
      endId = n.id;
    }
  }

  const path: string[] = [];
  const guard = new Set<string>();
  let cur = endId;
  while (cur && !guard.has(cur)) {
    path.unshift(cur);
    guard.add(cur);
    cur = prev.get(cur) ?? null;
  }
  return { ids: new Set(path), path, length: Math.max(0, max) };
}
