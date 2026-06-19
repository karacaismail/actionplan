import type { TaskNode } from "@/schemas";

/**
 * Tablo görünümü saf yardımcıları (Faz 1): sıralama + gruplama. UI-bağımsız, test edilebilir.
 * `score` gibi türetilmiş alan için skor çözücü dışarıdan verilir (audit ile döngü olmasın).
 */
export type SortDir = "asc" | "desc";
export type ScoreOf = (n: TaskNode) => number;

export function valueForSort(n: TaskNode, field: string, scoreOf: ScoreOf): string | number {
  switch (field) {
    case "score":
      return scoreOf(n);
    case "progress":
      return n.progress;
    case "effort":
      return n.effort.estimate;
    case "title":
      return n.title;
    case "level":
      return n.level;
    case "status":
      return n.status;
    case "priority":
      return n.priority;
    case "owner":
      return n.owner ?? "";
    case "milestone":
      return n.milestone ?? "";
    case "cluster":
      return n.source?.cluster ?? "";
    default:
      return n.wbsCode;
  }
}

export function sortNodes(nodes: TaskNode[], field: string, dir: SortDir, scoreOf: ScoreOf): TaskNode[] {
  const sign = dir === "desc" ? -1 : 1;
  return [...nodes].sort((a, b) => {
    const va = valueForSort(a, field, scoreOf);
    const vb = valueForSort(b, field, scoreOf);
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
    return String(va).localeCompare(String(vb), "tr") * sign;
  });
}

export function groupValue(n: TaskNode, by: string): string {
  switch (by) {
    case "level":
      return n.level;
    case "status":
      return n.status;
    case "milestone":
      return n.milestone ?? "—";
    case "cluster":
      return n.source?.cluster ?? "—";
    case "owner":
      return n.owner ?? "—";
    case "priority":
      return n.priority;
    default:
      return "—";
  }
}

export function groupNodes(nodes: TaskNode[], by: string): { key: string; nodes: TaskNode[] }[] {
  const map = new Map<string, TaskNode[]>();
  for (const n of nodes) {
    const k = groupValue(n, by);
    (map.get(k) ?? map.set(k, []).get(k)!).push(n);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "tr")).map(([key, ns]) => ({ key, nodes: ns }));
}
