import type { TaskNode } from "@/schemas";

/**
 * Toplu düzenleme (Faz 2) — saf. Yalnız beyaz-listedeki planlama/yürütme alanları
 * toptan yamalanır; audit/dimensions/ecaRules/agentPolicy gibi alanlar KORUNUR
 * (kalite ve güvenlik kapıları toplu işlemle bozulamaz).
 */
export const BULK_FIELDS = [
  "status",
  "priority",
  "owner",
  "assignees",
  "milestone",
  "phase",
] as const;
export type BulkPatch = Partial<Pick<TaskNode, (typeof BULK_FIELDS)[number]>>;

export function sanitizeBulkPatch(patch: BulkPatch): BulkPatch {
  const safe: BulkPatch = {};
  if (patch.status !== undefined) safe.status = patch.status;
  if (patch.priority !== undefined) safe.priority = patch.priority;
  if (patch.owner !== undefined) safe.owner = patch.owner;
  if (patch.assignees !== undefined) safe.assignees = patch.assignees;
  if (patch.milestone !== undefined) safe.milestone = patch.milestone;
  if (patch.phase !== undefined) safe.phase = patch.phase;
  return safe;
}

export function applyBulk(nodes: TaskNode[], ids: Iterable<string>, patch: BulkPatch): TaskNode[] {
  const idset = new Set(ids);
  const safe = sanitizeBulkPatch(patch);
  if (Object.keys(safe).length === 0) return nodes;
  return nodes.map((n) => (idset.has(n.id) ? { ...n, ...safe } : n));
}
