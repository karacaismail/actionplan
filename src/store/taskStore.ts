import {
  type BulkPatch,
  type NodeIndex,
  type TreeNode,
  applyBulk,
  buildTree,
  computeCriticalPath,
  indexById,
  loadMeta,
  loadNodesAsync,
} from "@/engine";
import type { DatasetMeta, NavNode, TaskNode } from "@/schemas";
import { useSyncExternalStore } from "react";
import { applyOverrides, clearOverrides, loadOverrides, saveOverrides } from "./persist";

/**
 * Oturum-içi tek doğruluk kaynağı (hibrit: görüntüleme + düzenleme).
 * Meta/navigasyon eager; ağır düğüm gövdesi runtime'da lazy fetch (loading bayrağı).
 * Kalıcılık: moderatör düzenlemeleri browser-storage'da "override" olarak tutulur
 * (tek mod hep-düzenlenebilir); taban veri korunur. Export/import yedek yoludur.
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
  /** moderatörün yerel (browser-storage) düzenlemeleri */
  overrides: Record<string, TaskNode>;
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
    overrides: loadOverrides(),
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

/** Ağır veriyi runtime'da yükler (tarayıcı); yerel override'ları taban üzerine bindirir. */
function bootstrap() {
  loadNodesAsync()
    .then(({ nodes, errors }) => {
      if (errors.length) state = { ...state, errors: [...state.errors, ...errors] };
      const merged = applyOverrides(nodes, state.overrides);
      commit(merged, false);
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
    const next = state.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    const updated = next.find((n) => n.id === id);
    const overrides = updated ? { ...state.overrides, [id]: updated } : state.overrides;
    saveOverrides(overrides);
    state = { ...state, overrides };
    commit(next, true);
  },
  applyImport(incoming: TaskNode[], mode: "replace" | "merge") {
    let nodes: TaskNode[];
    if (mode === "replace") {
      nodes = incoming;
    } else {
      const map = new Map(state.nodes.map((n) => [n.id, n]));
      for (const n of incoming) map.set(n.id, n);
      nodes = [...map.values()];
    }
    const overrides = { ...state.overrides };
    for (const n of incoming) overrides[n.id] = n;
    saveOverrides(overrides);
    state = { ...state, overrides };
    commit(nodes, true);
  },
  /** Toplu düzenleme (Faz 2): seçili id'lere beyaz-liste yamasını uygular + persist. */
  applyBulkPatch(ids: string[], patch: BulkPatch) {
    const next = applyBulk(state.nodes, ids, patch);
    const idset = new Set(ids);
    const overrides = { ...state.overrides };
    for (const n of next) if (idset.has(n.id)) overrides[n.id] = n;
    saveOverrides(overrides);
    state = { ...state, overrides };
    commit(next, true);
  },
  /** Yerel (browser-storage) düzenlemeleri temizler ve tabandan yeniden yükler. */
  clearLocal() {
    clearOverrides();
    state = emptyState();
    emit();
    if (typeof fetch !== "undefined") bootstrap();
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
