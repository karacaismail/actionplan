import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEVELS = ["archetype", "feature", "component", "work_unit", "micro_step"];
const MUTATION_KEYS = ["generatedNodes", "generator", "parentLinks", "queue", "runtime"];
const SOURCES = [
  "src/data/generated/nodes/",
  "docs/task-to-code-contract.md",
  "docs/kernel-sdk-app-delivery-sequence.md",
  INVENTORY,
];
const NON_GOALS = [
  "propose or select descendant IDs",
  "create or mutate WBS nodes or parent links",
  "reorder the implementation queue",
  "write platform runtime code",
];
const ROLLBACK = {
  trigger:
    "the live 38/6/5/33 measurement, D01 identity, parent rows, authority or fail-closed boundary drifts",
  action:
    "revert registry and decision-pack links, then revert this report, its test and package gate wiring",
  runtimeDataImpact: "none",
};

type NodeRecord = { id: string; level: string; parentId?: string };
type Defaults = {
  directChildIds: string[];
  observedCodeBearingBoundaryIds: string[];
  candidateDescendantIds: string[];
  selectedDescendantId: string | null;
  selectionStatus: string;
  rationale: string | null;
  approvalRef: string | null;
};
type ParentRow = {
  parentId: string;
  directChildIds?: string[];
  observedCodeBearingBoundaryIds?: string[];
};
type Handoff = {
  decisionId: string;
  gapId: string;
  status: string;
  gapClosed: boolean;
  decision: Record<string, unknown>;
  sourceRefs: string[];
  measurement: Record<string, unknown>;
  rowDefaults: Defaults;
  parents: ParentRow[];
  authorityBoundary: {
    mutationAllowed: Record<string, boolean>;
    runtimeExecutor: string;
    codeStartAllowed: boolean;
    kernelReady: boolean;
    sdkReady: boolean;
    appBuildable: boolean;
    verdict: string;
  };
  nonGoals: string[];
  rollback: typeof ROLLBACK;
};

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(read(relative)) as T;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (values: string[]) => [...values].sort();
const nodes = fs
  .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => readJson<NodeRecord>(`src/data/generated/nodes/${file}`));

const derive = (records: NodeRecord[]) => {
  const children = new Map<string, NodeRecord[]>();
  for (const node of records) {
    if (!node.parentId) continue;
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  }
  for (const items of children.values()) items.sort((a, b) => a.id.localeCompare(b.id));
  const boundaries = (parentId: string) => {
    const result: string[] = [];
    const queue = [...(children.get(parentId) ?? [])];
    const visited = new Set([parentId]);
    while (queue.length) {
      const node = queue.shift();
      if (!node || visited.has(node.id)) continue;
      visited.add(node.id);
      if (LEVELS.includes(node.level)) result.push(node.id);
      else queue.push(...(children.get(node.id) ?? []));
    }
    return sorted(result);
  };
  const rows = records
    .filter((node) => node.id.startsWith("k-") && node.level === "module")
    .map((node) => ({
      parentId: node.id,
      directChildIds: sorted((children.get(node.id) ?? []).map((child) => child.id)),
      observedCodeBearingBoundaryIds: boundaries(node.id),
    }))
    .sort((a, b) => a.parentId.localeCompare(b.parentId));
  return {
    rows,
    covered: rows.filter((row) => row.observedCodeBearingBoundaryIds.length),
    pending: rows.filter((row) => !row.observedCodeBearingBoundaryIds.length),
  };
};

const validate = (handoff: Handoff, records = nodes) => {
  const errors: string[] = [];
  const live = derive(records);
  const inventory = readJson<{
    structuralGaps: Array<{ id: string; kind: string; count: number; nodeIds: string[] }>;
  }>(INVENTORY);
  const registry = readJson<{
    decisions: Array<Record<string, unknown>>;
  }>(REGISTRY);
  const gap = inventory.structuralGaps.find((item) => item.id === "KGA-G01");
  const decision = registry.decisions.find((item) => item.id === "KGA-D01");
  const pendingIds = live.pending.map((row) => row.parentId);
  const rowIds = handoff.parents.map((row) => row.parentId);
  const defaults: Defaults = {
    directChildIds: [],
    observedCodeBearingBoundaryIds: [],
    candidateDescendantIds: [],
    selectedDescendantId: null,
    selectionStatus: "candidate-not-provided",
    rationale: null,
    approvalRef: null,
  };
  const measurement = {
    moduleParentCount: 38,
    directChildPresentCount: 6,
    parentsWithCodeBearingDescendantCount: 5,
    parentsMissingCodeBearingDescendantCount: 33,
    codeBearingLevels: LEVELS,
    traversal: "recursive-nearest-code-bearing-boundary-per-branch",
    coveredParentIds: live.covered.map((row) => row.parentId),
  };

  if (!same(handoff.sourceRefs, SOURCES)) errors.push("sources");
  if (!same(handoff.measurement, measurement)) errors.push("measurement");
  if (!same(handoff.rowDefaults, defaults)) errors.push("defaults");
  if (!same(handoff.nonGoals, NON_GOALS)) errors.push("non-goals");
  if (!same(handoff.rollback, ROLLBACK)) errors.push("rollback");
  if (
    handoff.decisionId !== "KGA-D01" ||
    handoff.gapId !== "KGA-G01" ||
    handoff.status !== "pending-human-candidate-and-selection" ||
    handoff.gapClosed
  )
    errors.push("identity-status");
  if (
    !same(rowIds, pendingIds) ||
    new Set(rowIds).size !== rowIds.length ||
    !same(gap, {
      ...gap,
      kind: "missing-code-bearing-descendant",
      count: 33,
      nodeIds: pendingIds,
    })
  )
    errors.push("parent-set");

  for (const row of handoff.parents) {
    const keys = sorted(Object.keys(row));
    if (
      !keys.every((key) =>
        ["directChildIds", "observedCodeBearingBoundaryIds", "parentId"].includes(key),
      )
    )
      errors.push(`row-key:${row.parentId}`);
    const effective = { ...handoff.rowDefaults, ...row };
    const observed = live.pending.find((item) => item.parentId === row.parentId);
    if (
      !observed ||
      !same(effective.directChildIds, observed.directChildIds) ||
      !same(effective.observedCodeBearingBoundaryIds, observed.observedCodeBearingBoundaryIds)
    )
      errors.push(`observation:${row.parentId}`);
    if (
      effective.candidateDescendantIds.length ||
      effective.selectedDescendantId !== null ||
      effective.selectionStatus !== "candidate-not-provided" ||
      effective.rationale !== null ||
      effective.approvalRef !== null
    )
      errors.push(`selection:${row.parentId}`);
  }

  const boundary = handoff.authorityBoundary;
  if (
    !same(boundary.mutationAllowed, Object.fromEntries(MUTATION_KEYS.map((key) => [key, false]))) ||
    boundary.runtimeExecutor !== "human-developer-only" ||
    boundary.codeStartAllowed ||
    boundary.kernelReady ||
    boundary.sdkReady ||
    boundary.appBuildable ||
    boundary.verdict !== "NO-GO"
  )
    errors.push("boundary");
  if (
    !same(handoff.decision, {
      topic: "code-bearing descendants for 33 module parents",
      status: "pending",
      decisionOwner: "user-admin",
      coordinator: "project_manager",
      finalAuthority: "codex",
      selectedOption: null,
    }) ||
    decision?.status !== "pending" ||
    decision?.selectedOption !== null ||
    decision?.codeStartAllowed !== false
  )
    errors.push("decision");
  return errors;
};

describe("KGA-D01 code-bearing descendant handoff", () => {
  it("binds the live 38/6/5/33 graph to a pending, fail-closed handoff", () => {
    const handoff = readJson<Handoff>(HANDOFF);
    expect(validate(handoff)).toEqual([]);
  });

  it("rejects stale graph data, invented defaults and boundary relaxation", () => {
    const handoff = readJson<Handoff>(HANDOFF);
    const mutations: Array<(clone: Handoff) => void> = [
      (clone) => void clone.parents.pop(),
      (clone) => void clone.rowDefaults.candidateDescendantIds.push("invented"),
      (clone) => void Object.assign(clone.rowDefaults, { selectedDescendantId: "invented" }),
      (clone) => void Object.assign(clone.rowDefaults, { approvalRef: "invented" }),
      (clone) => void clone.nonGoals.pop(),
      (clone) => void Object.assign(clone.rollback, { runtimeDataImpact: "destructive" }),
      (clone) =>
        void Object.assign(clone.measurement, { parentsMissingCodeBearingDescendantCount: 32 }),
      (clone) => void Reflect.deleteProperty(clone.authorityBoundary.mutationAllowed, "queue"),
      (clone) => void Object.assign(clone.authorityBoundary, { codeStartAllowed: true }),
    ];
    for (const mutate of mutations) {
      const clone = structuredClone(handoff);
      mutate(clone);
      expect(validate(clone).length).toBeGreaterThan(0);
    }
    expect(
      validate(handoff, [
        ...nodes,
        { id: "test-authz-archetype", level: "archetype", parentId: "k-authz" },
      ]).length,
    ).toBeGreaterThan(0);
  });

  it("links D01 from registry and pack through the named governance gate", () => {
    const registry = readJson<{ decisions: Array<Record<string, unknown>> }>(REGISTRY);
    const d01 = registry.decisions.find((item) => item.id === "KGA-D01");
    const gate = readJson<{ scripts: Record<string, string> }>("package.json").scripts[
      "qa:kernel-governance"
    ];
    expect(d01?.handoffRef).toBe(HANDOFF);
    expect(read("docs/kernel-governance-decision-pack-2026-07-15.md")).toContain(HANDOFF);
    expect(gate).toContain("tests/kernelCodeBearingDescendantHandoff.test.ts");
  });
});
