import {
  type NodeIndex,
  type TreeNode,
  buildTree,
  computeCriticalPath,
  indexById,
  loadDataset,
} from "@/engine";
import type { DatasetMeta, NavNode, TaskNode } from "@/schemas";
import { useSyncExternalStore } from "react";

/**
 * Oturum-içi tek doğruluk kaynağı (hibrit: görüntüleme + düzenleme).
 * Kalıcılık yok — değişiklikler export/import ile taşınır (frontend-only).
 */
interface State {
  nodes: TaskNode[];
  index: NodeIndex;
  tree: TreeNode[];
  navigation: NavNode[];
  meta: DatasetMeta;
  errors: string[];
  /** kritik yol üzerindeki düğüm id'leri + ağırlıklı uzunluk */
  criticalPath: Set<string>;
  criticalLength: number;
  /** düzenleme yapıldıysa true (export uyarısı için) */
  dirty: boolean;
}

let state: State = init();
const listeners = new Set<() => void>();

/** Kritik yolu hesaplar ve düğümlere criticalPath bayrağını işler. */
function applyCritical(nodes: TaskNode[]) {
  const cp = computeCriticalPath(nodes);
  for (const n of nodes) n.criticalPath = cp.ids.has(n.id);
  return cp;
}

function init(): State {
  const ds = loadDataset();
  const cp = applyCritical(ds.nodes);
  return { ...ds, dirty: false, criticalPath: cp.ids, criticalLength: cp.length };
}

function emit() {
  for (const l of listeners) l();
}

function setNodes(nodes: TaskNode[], dirty: boolean) {
  const cp = applyCritical(nodes);
  state = {
    ...state,
    nodes,
    index: indexById(nodes),
    tree: buildTree(nodes),
    criticalPath: cp.ids,
    criticalLength: cp.length,
    dirty,
  };
  emit();
}

export const taskStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): State {
    return state;
  },
  /** Bir görevi kısmî olarak günceller (oturum-içi). */
  updateNode(id: string, patch: Partial<TaskNode>) {
    setNodes(
      state.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      true,
    );
  },
  /** İçe aktarımı uygular: replace tüm seti değiştirir, merge id'ye göre birleştirir. */
  applyImport(incoming: TaskNode[], mode: "replace" | "merge") {
    if (mode === "replace") {
      setNodes(incoming, true);
      return;
    }
    const map = new Map(state.nodes.map((n) => [n.id, n]));
    for (const n of incoming) map.set(n.id, n);
    setNodes([...map.values()], true);
  },
  reset() {
    state = init();
    emit();
  },
};

export function useTaskStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    taskStore.subscribe,
    () => selector(taskStore.getSnapshot()),
    () => selector(taskStore.getSnapshot()),
  );
}
