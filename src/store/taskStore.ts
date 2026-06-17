import {
  type NodeIndex,
  type TreeNode,
  buildTree,
  computeCriticalPath,
  indexById,
  loadMeta,
  loadNodesAsync,
} from "@/engine";
import type { DatasetMeta, NavNode, TaskNode } from "@/schemas";
import { useSyncExternalStore } from "react";

/**
 * Oturum-içi tek doğruluk kaynağı (hibrit: görüntüleme + düzenleme).
 * Meta/navigasyon eager; ağır düğüm gövdesi runtime'da lazy fetch (loading bayrağı).
 * Kalıcılık yok — değişiklikler export/import ile taşınır (frontend-only).
 */
interface State {
  nodes: TaskNode[];
  index: NodeIndex;
  tree: TreeNode[];
  navigation: NavNode[];
  meta: DatasetMeta;
  errors: string[];
  criticalPath: Set<string>;
  criticalLength: number;
  dirty: boolean;
  /** ağır veri henüz yüklenmediyse true */
  loading: boolean;
}

let state: State = emptyState();
const listeners = new Set<() => void>();

/** Kritik yolu hesaplar ve düğümlere criticalPath bayrağını işler. */
function applyCritical(nodes: TaskNode[]) {
  const cp = computeCriticalPath(nodes);
  for (const n of nodes) n.criticalPath = cp.ids.has(n.id);
  return cp;
}

function emptyState(): State {
  const m = loadMeta();
  return {
    nodes: [],
    index: new Map(),
    tree: [],
    navigation: m.navigation,
    meta: m.meta,
    errors: m.errors,
    criticalPath: new Set(),
    criticalLength: 0,
    dirty: false,
    loading: true,
  };
}

function emit() {
  for (const l of listeners) l();
}

function commit(nodes: TaskNode[], dirty: boolean) {
  const cp = applyCritical(nodes);
  state = {
    ...state,
    nodes,
    index: indexById(nodes),
    tree: buildTree(nodes),
    criticalPath: cp.ids,
    criticalLength: cp.length,
    dirty,
    loading: false,
  };
  emit();
}

/** Ağır veriyi runtime'da yükler (tarayıcı). jsdom/test'te fetch yoksa çağrılmaz. */
function bootstrap() {
  loadNodesAsync()
    .then(({ nodes, errors }) => {
      if (errors.length) state = { ...state, errors: [...state.errors, ...errors] };
      commit(nodes, false);
    })
    .catch((e) => {
      state = { ...state, loading: false, errors: [...state.errors, String(e)] };
      emit();
    });
}
if (typeof fetch !== "undefined") bootstrap();

export const taskStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): State {
    return state;
  },
  updateNode(id: string, patch: Partial<TaskNode>) {
    commit(
      state.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      true,
    );
  },
  applyImport(incoming: TaskNode[], mode: "replace" | "merge") {
    if (mode === "replace") {
      commit(incoming, true);
      return;
    }
    const map = new Map(state.nodes.map((n) => [n.id, n]));
    for (const n of incoming) map.set(n.id, n);
    commit([...map.values()], true);
  },
  reload() {
    state = emptyState();
    emit();
    if (typeof fetch !== "undefined") bootstrap();
  },
};

export function useTaskStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    taskStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
