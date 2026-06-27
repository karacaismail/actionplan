import { STATUS_LIST, type TaskNode, type TaskStatus } from "@/schemas";
import { getDescendants } from "./resolve";

/**
 * Yürütme (dev-ekip) rollup'ı — bir düğümün alt ağacında adam-gün efor,
 * milestone, atama (assignee), durum dağılımı ve takvim aralığını toplar.
 * Efor yalnız unit "d" (adam-gün) olan düğümlerden toplanır (waterfall).
 */
export interface ExecutionRollup {
  effortDays: number;
  spentDays: number;
  milestones: string[];
  assignees: string[];
  statusCounts: Record<TaskStatus, number>;
  start: string | null;
  end: string | null;
  count: number;
}

function emptyStatusCounts(): Record<TaskStatus, number> {
  return Object.fromEntries(STATUS_LIST.map((s) => [s, 0])) as Record<TaskStatus, number>;
}

export function rollupExecution(nodes: TaskNode[], id: string): ExecutionRollup {
  const subtree = getDescendants(nodes, id);
  const statusCounts = emptyStatusCounts();
  const milestones = new Set<string>();
  const assignees = new Set<string>();
  let effortDays = 0;
  let spentDays = 0;
  let start: string | null = null;
  let end: string | null = null;
  for (const n of subtree) {
    if (n.effort.unit === "d") {
      effortDays += n.effort.estimate;
      spentDays += n.effort.spent;
    }
    if (n.milestone) milestones.add(n.milestone);
    if (n.owner) assignees.add(n.owner);
    statusCounts[n.status]++;
    const s = n.schedule.start;
    const e = n.schedule.end;
    if (s && (!start || s < start)) start = s;
    if (e && (!end || e > end)) end = e;
  }
  return {
    effortDays,
    spentDays,
    milestones: [...milestones],
    assignees: [...assignees],
    statusCounts,
    start,
    end,
    count: subtree.length,
  };
}

/** Milestone'a göre düğümleri gruplar (UI milestone/takvim görünümü için). */
export function groupByMilestone(nodes: TaskNode[]): Map<string, TaskNode[]> {
  const out = new Map<string, TaskNode[]>();
  for (const n of nodes) {
    const key = n.milestone ?? "—";
    (out.get(key) ?? out.set(key, []).get(key)!).push(n);
  }
  return out;
}
