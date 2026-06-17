import type { TaskNode, TaskStatus } from "@/schemas";

export interface TreeNode extends TaskNode {
  children: TreeNode[];
  depth: number;
  rollup: Rollup;
}

export interface Rollup {
  /** Yaprak dahil toplam alt görev sayısı (kendisi hariç) */
  total: number;
  done: number;
  /** Ağırlıklı/ortalama ilerleme (0-100) */
  progress: number;
  /** Alt görevlerden türetilen birleşik durum */
  status: TaskStatus;
}

const STATUS_RANK: Record<TaskStatus, number> = {
  blocked: 5,
  "in-progress": 4,
  review: 3,
  todo: 2,
  backlog: 1,
  done: 0,
};

/**
 * Düz düğüm listesinden parentId'ye göre ağaç kurar ve rollup hesaplar.
 * Ebeveynlerin ilerlemesi/durumu çocuklardan türetilir (saf fonksiyon).
 */
export function buildTree(nodes: TaskNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const n of nodes) {
    byId.set(n.id, { ...n, children: [], depth: 0, rollup: emptyRollup(n) });
  }

  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortFn = (a: TreeNode, b: TreeNode) =>
    (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }) ||
    a.order - b.order ||
    a.title.localeCompare(b.title, "tr");

  const walk = (node: TreeNode, depth: number) => {
    node.depth = depth;
    node.children.sort(sortFn);
    for (const c of node.children) walk(c, depth + 1);
    node.rollup = computeRollup(node);
  };
  roots.sort(sortFn);
  for (const r of roots) walk(r, 0);
  return roots;
}

function emptyRollup(n: TaskNode): Rollup {
  return { total: 0, done: n.status === "done" ? 1 : 0, progress: n.progress, status: n.status };
}

function computeRollup(node: TreeNode): Rollup {
  if (node.children.length === 0) {
    return {
      total: 0,
      done: node.status === "done" ? 1 : 0,
      progress: node.progress,
      status: node.status,
    };
  }
  let total = 0;
  let done = 0;
  let progressSum = 0;
  let weightSum = 0;
  let maxStatusRank = -1;
  let allDone = true;
  for (const c of node.children) {
    const leaves = c.children.length === 0 ? 1 : c.rollup.total;
    total += leaves;
    done += c.rollup.done;
    const weight = Math.max(1, c.effort.estimate || 1);
    progressSum += c.rollup.progress * weight;
    weightSum += weight;
    maxStatusRank = Math.max(maxStatusRank, STATUS_RANK[c.rollup.status]);
    if (c.rollup.status !== "done") allDone = false;
  }
  const progress = weightSum > 0 ? Math.round(progressSum / weightSum) : 0;
  const status: TaskStatus = allDone
    ? "done"
    : (Object.entries(STATUS_RANK).find(([, r]) => r === maxStatusRank)?.[0] as TaskStatus) ??
      "backlog";
  return { total, done, progress, status };
}

/** Ağacı düz listeye indirger (görünür/açık düğümler için sıralı gezinme). */
export function flattenTree(roots: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    out.push(n);
    for (const c of n.children) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}
