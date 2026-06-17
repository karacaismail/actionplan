import type { TaskNode } from "@/schemas";

export type NodeIndex = Map<string, TaskNode>;

export function indexById(nodes: TaskNode[]): NodeIndex {
  return new Map(nodes.map((n) => [n.id, n]));
}

export function getChildren(nodes: TaskNode[], parentId: string): TaskNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

/** Kökten düğüme breadcrumb zinciri (kendisi dahil, kök başta). */
export function getAncestors(index: NodeIndex, id: string): TaskNode[] {
  const chain: TaskNode[] = [];
  let cur = index.get(id);
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    chain.unshift(cur);
    guard.add(cur.id);
    cur = cur.parentId ? index.get(cur.parentId) : undefined;
  }
  return chain;
}

/** Bir düğümün tüm alt soyları (yaprağa kadar). */
export function getDescendants(nodes: TaskNode[], id: string): TaskNode[] {
  const childrenOf = new Map<string, TaskNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    (childrenOf.get(n.parentId) ?? childrenOf.set(n.parentId, []).get(n.parentId)!).push(n);
  }
  const out: TaskNode[] = [];
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    stack.push(...(childrenOf.get(n.id) ?? []));
  }
  return out;
}

/** depends-on'dan ters yönlü blocks ilişkisini türetir. */
export function deriveBlocks(nodes: TaskNode[]): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  for (const n of nodes) {
    for (const dep of n.dependsOn) {
      (blocks.get(dep) ?? blocks.set(dep, []).get(dep)!).push(n.id);
    }
  }
  return blocks;
}
