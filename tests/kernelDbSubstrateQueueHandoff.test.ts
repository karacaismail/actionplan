import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
const ROOT = process.cwd();
const HANDOFF = "reports/kernel-db-substrate-queue-handoff-2026-07-15.json";
const QUEUE = "reports/platform-implementation-execution-queue-2026-07-09.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const PR07 = "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md";
const IDS = Array.from({ length: 11 }, (_, index) => `PR-${String(index + 1).padStart(2, "0")}`);
const SOURCES = [
  QUEUE,
  ADDENDUM,
  "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
  "docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md",
  "docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md",
  PR07,
  "docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md",
  "docs/platform-tenancy-readiness-gap-2026-07-09.md",
  "docs/l1-workflow-eca-readiness-gap-2026-07-09.md",
  "docs/task-to-code-contract.md",
];
const AFFECTED = [
  { id: "PR-02", dependencyClasses: ["split-contract-vs-durable-proof"] },
  { id: "PR-03", dependencyClasses: ["indirect-via-pr02"] },
  { id: "PR-04", dependencyClasses: ["direct-hard-db"] },
  { id: "PR-05", dependencyClasses: ["indirect-via-outbox", "audit-order-cycle"] },
  { id: "PR-06", dependencyClasses: ["direct-hard-db"] },
  { id: "PR-07", dependencyClasses: ["indirect-via-durable-predecessors"] },
  { id: "PR-08", dependencyClasses: ["db-substrate-owner-in-current-queue"] },
];
const OPTIONS = [
  {
    id: "early-minimal-db-substrate",
    status: "candidate-unselected",
    selected: false,
    queueEffectIfSelected:
      "requires a separate User/Admin-approved queue amendment after PR-01; this handoff does not create it",
    evidenceRule:
      "PR-02 durable isolation, PR-04 outbox and PR-06 audit claims execute on an explicitly approved early DB/Alembic/transaction/RLS substrate; PR-07 inherits verified durable predecessors",
    rationale: null,
    approvalRef: null,
  },
  {
    id: "provisional-contract-only-then-replay-after-pr08",
    status: "candidate-unselected",
    selected: false,
    queueEffectIfSelected: "retains the base order; this handoff does not change any queue item",
    evidenceRule:
      "PR-02/04/06 persistence-dependent claims remain provisional until replay after verified PR-08; PR-07 cannot inherit durable evidence before that replay",
    rationale: null,
    approvalRef: null,
  },
];
const INVARIANTS = [
  "The base queue and PR identities remain unchanged.",
  "PR-01 remains the only next-actionable item.",
  "No provisional result is durable runtime evidence.",
  "PR-07 DB dependency remains indirect through durable predecessors.",
  "KGA-D10 physicalStrategy remains pending and mandatory RLS is not weakened.",
];
const NON_GOALS = [
  "select or recommend either D06 option",
  "mutate PR identities, order, status or blockedBy fields",
  "split, renumber or redefine PR-08",
  "resolve KGA-D10 tenancy physical strategy",
  "write platform DB, migration or runtime tests",
  "claim durable runtime evidence or readiness",
];
const ROLLBACK = {
  trigger:
    "D06 identity, options, live queue snapshot, authority, linkage or NO-GO boundary drifts",
  action:
    "revert registry and decision-pack links, then revert this report, its test and package gate wiring; leave the base queue unchanged",
  runtimeDataImpact: "none",
};
const BOUNDARY = {
  mutationAllowed: { baseQueue: false, generatedNodes: false, platformCode: false, runtime: false },
  runtimeExecutor: "human-developer-only",
  codeStartAllowed: false,
  kernelReady: false,
  sdkReady: false,
  appBuildable: false,
  verdict: "NO-GO",
};
type Queue = { items: Array<{ id: string; status: string; blockedBy: string[] }> };
type Handoff = {
  schemaVersion: string;
  id: string;
  generatedAt: string;
  decisionId: string;
  status: string;
  gapClosed: boolean;
  decision: Record<string, unknown>;
  sourceRefs: string[];
  queueSnapshot: Record<string, unknown>;
  affectedItems: typeof AFFECTED;
  options: typeof OPTIONS;
  relatedDecisionIds: string[];
  queuePatch: unknown;
  invariants: string[];
  authorityBoundary: typeof BOUNDARY;
  nonGoals: string[];
  rollback: typeof ROLLBACK;
};
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(read(relative)) as T;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const load = () => (fs.existsSync(path.join(ROOT, HANDOFF)) ? readJson<Handoff>(HANDOFF) : null);
const validate = (handoff: Handoff | null, queue = readJson<Queue>(QUEUE)) => {
  if (!handoff) return ["missing-handoff"];
  const errors: string[] = [];
  const addendum = readJson<{
    structuralFindings: { queuePersistenceOrder: { conflict: string; options: string[] } };
  }>(ADDENDUM).structuralFindings.queuePersistenceOrder;
  const foundation = queue.items.filter((item) => IDS.includes(item.id));
  const liveIds = foundation.map((item) => item.id);
  const actionable = queue.items
    .filter((item) => item.status === "next-actionable")
    .map((item) => item.id);
  const expectedSnapshot = {
    baseSequence: IDS,
    currentNextActionable: "PR-01",
    dbSubstrateItem: "PR-08",
    baseQueueChanged: false,
    overlayHasOrderingAuthority: false,
    sourceConflict: addendum.conflict,
    reconciledFinding:
      "PR-02 durable isolation proof, PR-04 transactional outbox and PR-06 durable audit require DB before PR-08; PR-07 is indirectly blocked by those durable predecessors",
  };
  const expectedDecision = {
    topic: "DB substrate before durable tenancy/outbox/audit evidence",
    status: "pending",
    decisionOwner: "user-admin",
    coordinator: "project_manager",
    finalAuthority: "codex",
    selectedOption: null,
    rationale: null,
    approvalRef: null,
  };
  if (!same(liveIds, IDS) || !same(actionable, ["PR-01"])) errors.push("live-queue");
  for (let index = 1; index < foundation.length; index += 1) {
    const item = foundation[index];
    if (item.status !== "blocked" || !item.blockedBy.includes(foundation[index - 1].id))
      errors.push(`predecessor:${item.id}`);
  }
  if (!same(handoff.sourceRefs, SOURCES)) errors.push("sources");
  if (!same(handoff.queueSnapshot, expectedSnapshot)) errors.push("snapshot");
  if (!same(handoff.affectedItems, AFFECTED)) errors.push("affected");
  if (
    !same(handoff.options, OPTIONS) ||
    !same(
      addendum.options,
      OPTIONS.map((item) => item.id),
    )
  )
    errors.push("options");
  if (!same(handoff.decision, expectedDecision)) errors.push("decision");
  if (
    handoff.schemaVersion !== "1.0.0" ||
    handoff.id !== "kernel-db-substrate-queue-handoff-2026-07-15" ||
    handoff.generatedAt !== "2026-07-15" ||
    handoff.decisionId !== "KGA-D06" ||
    handoff.status !== "pending-human-selection" ||
    handoff.gapClosed ||
    handoff.queuePatch !== null
  )
    errors.push("identity-status");
  if (!same(handoff.relatedDecisionIds, ["KGA-D01", "KGA-D03", "KGA-D07", "KGA-D10"]))
    errors.push("related-decisions");
  if (!same(handoff.invariants, INVARIANTS)) errors.push("invariants");
  if (!same(handoff.authorityBoundary, BOUNDARY)) errors.push("boundary");
  if (!same(handoff.nonGoals, NON_GOALS)) errors.push("non-goals");
  if (!same(handoff.rollback, ROLLBACK)) errors.push("rollback");
  if (
    !["PR-04 event/outbox durability verified evidence", "PR-06 append-only audit"].every(
      (anchor) => read(PR07).includes(anchor),
    )
  )
    errors.push("pr07-durable-prerequisites");
  if (/"(?:recommended|recommendation|preferred|default)"\s*:/.test(JSON.stringify(handoff)))
    errors.push("implicit-selection");
  return errors;
};
describe("KGA-D06 DB substrate queue handoff", () => {
  it("binds the live queue conflict to two neutral, unselected options", () => {
    expect(validate(load())).toEqual([]);
  });
  it("rejects selection, queue drift and authority relaxation", () => {
    const handoff = load();
    expect(handoff).not.toBeNull();
    if (!handoff) return;
    const mutations: Array<(clone: Handoff) => void> = [
      (clone) => void Object.assign(clone.options[0], { selected: true }),
      (clone) => void Object.assign(clone.options[0], { approvalRef: "ADR-D06" }),
      (clone) => void clone.options.pop(),
      (clone) => void clone.options.reverse(),
      (clone) => void Object.assign(clone.options[1], { id: "provisional-contract-only" }),
      (clone) => void Object.assign(clone, { queuePatch: { move: "PR-08" } }),
      (clone) => void Object.assign(clone.queueSnapshot, { baseSequence: [...IDS].reverse() }),
      (clone) => void Object.assign(clone.authorityBoundary.mutationAllowed, { baseQueue: true }),
      (clone) => void Reflect.deleteProperty(clone.authorityBoundary.mutationAllowed, "runtime"),
      (clone) => void Object.assign(clone.authorityBoundary.mutationAllowed, { unknown: false }),
      (clone) => void Object.assign(clone.authorityBoundary, { codeStartAllowed: true }),
      (clone) => void Object.assign(clone.authorityBoundary, { kernelReady: true, verdict: "GO" }),
      (clone) => void clone.invariants.pop(),
      (clone) => void clone.nonGoals.pop(),
      (clone) => void Object.assign(clone.rollback, { runtimeDataImpact: "destructive" }),
    ];
    for (const mutate of mutations) {
      const clone = structuredClone(handoff);
      mutate(clone);
      expect(validate(clone).length).toBeGreaterThan(0);
    }
    const queue = readJson<Queue>(QUEUE);
    queue.items[1].status = "next-actionable";
    expect(validate(handoff, queue).length).toBeGreaterThan(0);
  });
  it("links D06 from registry and pack through the named governance gate", () => {
    const registry = readJson<{ decisions: Array<Record<string, unknown>> }>(REGISTRY);
    const d06 = registry.decisions.find((item) => item.id === "KGA-D06");
    const pack = read(PACK);
    const gate = readJson<{ scripts: Record<string, string> }>("package.json").scripts[
      "qa:kernel-governance"
    ];
    expect(d06?.handoffRef).toBe(HANDOFF);
    expect(pack).toContain(HANDOFF);
    expect(pack).toContain("early-minimal-db-substrate");
    expect(pack).toContain("provisional-contract-only-then-replay-after-pr08");
    expect(pack).toContain("Aşağıdaki beş P0 ledger");
    expect(pack).not.toContain("Birinci seçenek teknik olarak daha doğrudan");
    expect(gate).toContain("tests/kernelDbSubstrateQueueHandoff.test.ts");
  });
});
