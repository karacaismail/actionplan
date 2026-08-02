import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-relation-direction-conflict-disposition-2026-08-02.json";
const D02_RECORD = "reports/kernel-surface-dependency-order-handoff-2026-08-01.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const NODES = "src/data/generated/nodes";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const D02_SHA256 = "7845cbcd1a69944311bd6dc284a999db07ebe66821dde06ed74558fc860c6405";
const D02_BYTES = 5788;
const NODE_COUNT = 650;
const TOTAL_CONFLICTS = 46;
const KERNEL_EDGES = 8;
const NON_KERNEL_EDGES = 38;
const AFFECTED_NODES = 35;
const KERNEL_NODES = 5;
const SCOPE = "relation-direction-conflict-disposition-record";
const TOKEN = "D07=FIX_KERNEL8_SPLIT_NONKERNEL38";
const OPTION = "repair-8-kernel-move-38-non-kernel-to-separate-gap";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
// biome-ignore format: the closed disposition record root key set stays compact for the shard budget
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "conflictSplit", "decision", "decisionId", "dispositionState", "gapBinding", "gapClosed", "generatedAt", "id", "invariants", "nodeUniverseBoundary", "nonGoals", "predecessorBoundary", "provenance", "repairBoundary", "rollback", "schemaVersion", "separateGapBoundary", "sourceRefs", "status"];
// biome-ignore format: the closed conflict split key set stays compact for the shard budget
const SPLIT_KEYS = ["affectedNodeCount", "kernelEdgesToRepair", "kernelNodeCount", "kernelNodeIds", "nonKernelEdgesMoved", "totalConflicts"];
// biome-ignore format: the closed repair boundary key set stays compact for the shard budget
const REPAIR_KEYS = ["blocksDirectionChanged", "dependsOnDirectionChanged", "edgesRepaired", "edgesRewritten", "executor", "generatedNodesMutated", "resolution"];
// biome-ignore format: the closed separate-gap boundary key set stays compact for the shard budget
const GAP_KEYS = ["gapCreated", "gapId", "movedEdgeCount", "resolution"];
// biome-ignore format: the closed D02 predecessor boundary key set stays compact for the shard budget
const PREDECESSOR_KEYS = ["bytes", "canonicalEdgeApplicationDischarged", "decisionId", "edgeRepairAllowedInPredecessor", "ref", "repairOwner", "sha256"];
// biome-ignore format: the closed node universe boundary key set stays compact for the shard budget
const UNIVERSE_KEYS = ["mutationAllowed", "nodeCount", "ref"];
// biome-ignore format: recording a split repairs nothing; every edge stays exactly as generated
const REPAIR = { edgesRepaired: 0, edgesRewritten: false, generatedNodesMutated: false, dependsOnDirectionChanged: false, blocksDirectionChanged: false, resolution: "deferred-to-approved-edge-repair-shard", executor: "human-developer-only" };
// biome-ignore format: the thirty-eight non-kernel edges are deferred, not registered as a gap here
const SEPARATE_GAP = { gapCreated: false, gapId: null, movedEdgeCount: NON_KERNEL_EDGES, resolution: "deferred-to-human-gap-registration" };
// biome-ignore format: the planning-only, valid-but-blocked, no-go disposition state
const STATE = { mode: "PLANNING_ONLY", validity: "VALID_BLOCKED", gate: "NO_GO" };
// biome-ignore format: the promoted application summary for this disposition record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, kernelEdgesScheduledForRepair: KERNEL_EDGES, nonKernelEdgeDisposition: "deferred-to-separate-gap" };
const KERNEL_PREFIX = "k-";
type Relation = { id: string; dependsOn: string[]; blocks: string[] };
// biome-ignore format: the live conflict measurement shape stays compact for the shard budget
type Measurement = { affectedNodeCount: number; totalConflicts: number; kernelNodeIds: string[]; kernelNodeCount: number; kernelEdges: number };
// One pass over the live node universe yields both the id set and the relation pairs.
// biome-ignore format: the single-pass live node scan stays compact for the shard budget
const scanNodes = (): { ids: Set<string>; relations: Relation[] } => { const ids = new Set<string>(); const relations: Relation[] = []; for (const file of fs.readdirSync(path.join(ROOT, NODES)).filter((name) => name.endsWith(".json"))) { const node = readJson(`${NODES}/${file}`); ids.add(node.id); relations.push({ id: node.id, dependsOn: Array.isArray(node.dependsOn) ? node.dependsOn : [], blocks: Array.isArray(node.blocks) ? node.blocks : [] }); } return { ids, relations }; };
// A conflict is a target a node both dependsOn and blocks: the dependsOn n blocks intersection
// inside one node, which is exactly the measurement KGA-D02 recorded and KGA-D07 splits.
// biome-ignore format: the live relation-direction conflict measurement stays compact
const measure = (relations: Relation[]): Measurement => { const affected: Array<[string, number]> = []; for (const node of relations) { const dependsOn = new Set(node.dependsOn); const conflicts = new Set(node.blocks.filter((target) => dependsOn.has(target))); if (conflicts.size > 0) affected.push([node.id, conflicts.size]); } const kernel = affected.filter(([id]) => id.startsWith(KERNEL_PREFIX)); const total = (rows: Array<[string, number]>) => rows.reduce((sum, [, count]) => sum + count, 0); return { affectedNodeCount: affected.length, totalConflicts: total(affected), kernelNodeIds: kernel.map(([id]) => id).sort(), kernelNodeCount: kernel.length, kernelEdges: total(kernel) }; };
// biome-ignore format: a cloned relation set with one node's conflicting blocks entries removed
const repair = (relations: Relation[], nodeIds: string[]): Relation[] => relations.map((node) => (nodeIds.includes(node.id) ? { ...node, blocks: node.blocks.filter((target) => !node.dependsOn.includes(target)) } : node));

// biome-ignore format: the audited relation-direction validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any, kernelNodeIds: string[]): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D07") errors.push("decisionId drift");
  // biome-ignore format: the exact planning-only artifact identity stays compact
  if (report.id !== "kernel-relation-direction-conflict-disposition-2026-08-02" || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== OPTION) errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");
  if (!same(report.dispositionState, STATE)) errors.push("disposition state drift");
  // The KGA-G04 delivery-order gap stays open: a recorded split is not a repaired graph.
  // biome-ignore format: the gap binding stays open under its human relation-semantics decision
  if (report.gapBinding?.gapId !== "KGA-G04" || report.gapBinding?.gapClosed !== false || report.gapBinding?.resolutionStatus !== "open") errors.push("gapBinding drift");

  // The split is exactly the approved arithmetic over the committed conflict measurement.
  const split = report.conflictSplit ?? {};
  // biome-ignore format: the committed 46-edge measurement stays pinned for the shard budget
  if (split.totalConflicts !== TOTAL_CONFLICTS || split.kernelEdgesToRepair !== KERNEL_EDGES || split.nonKernelEdgesMoved !== NON_KERNEL_EDGES) errors.push("conflict split drift");
  // The split must account for every conflicting edge; a partition that loses an edge is a defect.
  if (split.kernelEdgesToRepair + split.nonKernelEdgesMoved !== TOTAL_CONFLICTS) errors.push("conflict split arithmetic drift");
  // biome-ignore format: the affected node and kernel node measurement stays pinned
  if (split.affectedNodeCount !== AFFECTED_NODES || split.kernelNodeCount !== KERNEL_NODES || !same(split.kernelNodeIds, kernelNodeIds)) errors.push("conflict node drift");

  // Scheduling a repair is not performing one: no edge is rewritten and no node is mutated.
  if (!same(report.repairBoundary, REPAIR)) errors.push("repair boundary drift");
  // biome-ignore format: every mutation-shaped repair flag stays false whatever else the record says
  for (const key of ["edgesRewritten", "generatedNodesMutated", "dependsOnDirectionChanged", "blocksDirectionChanged"]) if (report.repairBoundary?.[key] !== false) errors.push(`repair ${key} applied`);
  if (report.repairBoundary?.edgesRepaired !== 0) errors.push("repair edge count applied");
  if (report.repairBoundary?.executor !== "human-developer-only") errors.push("repair executor drift");

  // The thirty-eight non-kernel edges are deferred to a gap that this record does not register.
  if (!same(report.separateGapBoundary, SEPARATE_GAP)) errors.push("separate gap drift");
  if (report.separateGapBoundary?.gapCreated !== false || report.separateGapBoundary?.gapId !== null) errors.push("separate gap created");

  // KGA-D02 deferred its canonical edge application to KGA-D07; a planning-only disposition
  // record does not discharge that deferral, and D02 still forbids edge repair in its own scope.
  const predecessor = report.predecessorBoundary ?? {};
  // biome-ignore format: the byte-pinned D02 predecessor evidence stays compact
  if (predecessor.decisionId !== "KGA-D02" || predecessor.ref !== D02_RECORD || predecessor.sha256 !== D02_SHA256 || predecessor.bytes !== D02_BYTES) errors.push("predecessor byte identity drift");
  if (predecessor.repairOwner !== "KGA-D07") errors.push("repair owner drift");
  if (predecessor.edgeRepairAllowedInPredecessor !== false) errors.push("predecessor repair authorized");
  if (predecessor.canonicalEdgeApplicationDischarged !== false) errors.push("canonical edge application discharged");

  // The live generated node universe is untouched.
  const universe = report.nodeUniverseBoundary ?? {};
  // biome-ignore format: the pinned live node universe stays compact for the shard budget
  if (universe.ref !== NODES || universe.nodeCount !== NODE_COUNT || universe.mutationAllowed !== false) errors.push("node universe drift");

  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D07 relation direction conflict disposition", () => {
  it("records the approved 8-kernel-repair / 38-non-kernel-split as planning-only and NO_GO", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `relation-direction-conflict-disposition-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const addendum = readJson(ADDENDUM);
    const { ids, relations } = scanNodes();
    // The kernel node set is derived from the committed addendum finding, never restated here.
    const kernelNodeIds = addendum.structuralFindings.relationDirectionConflicts.kernelNodeIds;
    // The split is measured live from the 650 generated nodes, not taken on the record's word.
    const live = measure(relations);

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-relation-direction-conflict-disposition-2026-08-02", generatedAt: "2026-08-02", decisionId: "KGA-D07", status: "approved-application-pending", gapClosed: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.conflictSplit).sort()).toEqual(SPLIT_KEYS);
    expect(Object.keys(report.repairBoundary).sort()).toEqual(REPAIR_KEYS);
    expect(Object.keys(report.separateGapBoundary).sort()).toEqual(GAP_KEYS);
    expect(Object.keys(report.predecessorBoundary).sort()).toEqual(PREDECESSOR_KEYS);
    expect(Object.keys(report.nodeUniverseBoundary).sort()).toEqual(UNIVERSE_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "dependsOn/blocks direction and 46 conflicting edges", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: OPTION, approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN });
    expect(report.provenance.approval.normalizedSelectionSha256).toBe(SELECTION_SHA256);
    // The record preserves the authority that was effective when it was generated; it does not
    // track the live head. Historical-at-write status is governed by the sealed entry digest
    // and bounded by the head, so appending an epoch leaves the stamp resolvable, unchanged.
    // biome-ignore format: the sealed-entry stamp resolution stays compact for the shard budget
    const stamp = chain.entries.find((entry: { entrySha256: string }) => entry.entrySha256 === report.provenance.effectiveAuthority.chainHeadSha256);
    expect(stamp, "consumer-stamp-unresolvable").toBeDefined();
    expect(stamp.seq).toBeLessThanOrEqual(chain.chainHeadSeq);
    // biome-ignore format: the stamp mirrors the sealed entry it named, never the live head
    expect(report.provenance.effectiveAuthority).toMatchObject({ ref: CHAIN, seq: stamp.seq, chainHeadSha256: stamp.entrySha256, normalizedTextSha256: stamp.normalizedTextSha256 });
    expect(report.applicationSummary).toEqual(APPLICATION_SUMMARY);
    expect(report.dispositionState).toEqual(STATE);
    expect(report.repairBoundary).toEqual(REPAIR);
    expect(report.separateGapBoundary).toEqual(SEPARATE_GAP);
    expect(validate(report, kernelNodeIds)).toEqual([]);
    // biome-ignore format: the record must say in prose that no edge is repaired or rewritten
    expect(report.invariants.some((line: string) => line.includes("no edge"))).toBe(true);
    // biome-ignore format: and that KGA-D02 canonical edge application stays undischarged
    expect(report.invariants.some((line: string) => line.includes("KGA-D02"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([ADDENDUM, INVENTORY, D02_RECORD, CLOSURE, CHAIN, REGISTRY, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelRelationDirectionConflictDisposition.test.ts",
    );

    // The committed conflict measurement is the split's only source and it still reads 46/8/38.
    // biome-ignore format: the addendum finding stays the binding measurement for this disposition
    expect(addendum.structuralFindings.relationDirectionConflicts).toMatchObject({ edgeCount: TOTAL_CONFLICTS, kernelEdgeCount: KERNEL_EDGES, affectedNodeCount: AFFECTED_NODES, kernelNodeCount: KERNEL_NODES, resolution: "human-relation-semantics-decision" });
    expect(kernelNodeIds).toHaveLength(KERNEL_NODES);
    // Every kernel conflict node is a real live node; none of them is invented by this record.
    for (const nodeId of kernelNodeIds) expect(ids.has(nodeId)).toBe(true);
    expect(ids.size).toBe(NODE_COUNT);

    // The 46/8/38 split is re-derived from the live graph, so a record that merely restates the
    // addendum cannot pass while the generated nodes say something else.
    // biome-ignore format: the live dependsOn-blocks measurement must match the recorded split exactly
    expect(live).toEqual({ affectedNodeCount: AFFECTED_NODES, totalConflicts: TOTAL_CONFLICTS, kernelNodeIds: [...kernelNodeIds].sort(), kernelNodeCount: KERNEL_NODES, kernelEdges: KERNEL_EDGES });
    // The 38 moved edges are the live remainder, never an independently asserted literal.
    expect(live.totalConflicts - live.kernelEdges).toBe(NON_KERNEL_EDGES);
    expect(report.conflictSplit.nonKernelEdgesMoved).toBe(live.totalConflicts - live.kernelEdges);
    // The kernel classifier is grounded: the live k- prefixed conflict set is the committed set.
    expect(live.kernelNodeIds).toEqual([...kernelNodeIds].sort());

    // Repairing or removing kernel conflict edges must be detected, proving the measurement is
    // live rather than a constant. These clones are in memory only; no generated file is written.
    // biome-ignore format: the in-memory edge-repair detection matrix stays compact
    const EDGE_CASES: Array<[string, Relation[], Partial<Measurement>]> = [
      ["repair all eight kernel edges", repair(relations, kernelNodeIds), { kernelEdges: 0, kernelNodeCount: 0, kernelNodeIds: [], totalConflicts: NON_KERNEL_EDGES, affectedNodeCount: AFFECTED_NODES - KERNEL_NODES }],
      ["repair k-surface only", repair(relations, ["k-surface"]), { kernelEdges: KERNEL_EDGES - 2, totalConflicts: TOTAL_CONFLICTS - 2, kernelNodeCount: KERNEL_NODES - 1, affectedNodeCount: AFFECTED_NODES - 1 }],
      ["repair k-authz only", repair(relations, ["k-authz"]), { kernelEdges: KERNEL_EDGES - 1, totalConflicts: TOTAL_CONFLICTS - 1, kernelNodeCount: KERNEL_NODES - 1, affectedNodeCount: AFFECTED_NODES - 1 }],
      ["repair k-archetype-storage only", repair(relations, ["k-archetype-storage"]), { kernelEdges: KERNEL_EDGES - 3, totalConflicts: TOTAL_CONFLICTS - 3, kernelNodeCount: KERNEL_NODES - 1, affectedNodeCount: AFFECTED_NODES - 1 }],
      ["repair every conflicting node", repair(relations, relations.map((node) => node.id)), { kernelEdges: 0, totalConflicts: 0, affectedNodeCount: 0, kernelNodeCount: 0, kernelNodeIds: [] }],
    ];
    // biome-ignore format: each repair must move the measurement away from the recorded split
    for (const [label, mutated, expected] of EDGE_CASES) { const result = measure(mutated); expect(result, `edge-repair-undetected: ${label}`).toMatchObject(expected); expect(result, `edge-repair-undetected: ${label}`).not.toEqual(live); }
    // A newly introduced kernel conflict is detected just as an removed one is.
    // biome-ignore format: adding a conflicting blocks entry to a kernel node raises both counts
    const widened = measure(relations.map((node) => (node.id === "k-authz" ? { ...node, dependsOn: [...node.dependsOn, "k-schema"], blocks: [...node.blocks, "k-schema"] } : node)));
    expect(widened.kernelEdges).toBe(KERNEL_EDGES + 1);
    expect(widened.totalConflicts).toBe(TOTAL_CONFLICTS + 1);
    // The KGA-G04 delivery-order gap is still the open, human-decided one this record binds.
    // biome-ignore format: the live G04 gap stays open with code start denied
    expect(readJson(INVENTORY).structuralGaps.find((gap: { id: string }) => gap.id === "KGA-G04")).toMatchObject({ kind: "delivery-order-cycle", nodeId: "k-surface", codeStartAllowed: false, resolution: "human-dependency-semantics-decision" });

    // KGA-D02 is untouched and still defers canonical edge application to KGA-D07.
    const d02Bytes = fs.readFileSync(path.join(ROOT, D02_RECORD));
    expect(d02Bytes.byteLength).toBe(D02_BYTES);
    expect(createHash("sha256").update(d02Bytes).digest("hex")).toBe(D02_SHA256);
    // biome-ignore format: D02 keeps its deferral, forbids edge repair in its own scope and names D07
    expect(readJson(D02_RECORD)).toMatchObject({ decisionId: "KGA-D02", gapId: "KGA-G04", edgeMutation: false, applicationSummary: { canonicalEdgeApplication: "deferred-to-KGA-D07" }, repairAuthority: { owner: "KGA-D07", edgeRepairAllowedHere: false, kernelEdgeCount: KERNEL_EDGES, nonKernelEdgeCount: NON_KERNEL_EDGES } });

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D07.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D07")).toMatchObject({ disposition: OPTION, repairKernelConflicts: KERNEL_EDGES, moveNonKernelConflicts: NON_KERNEL_EDGES, totalConflicts: TOTAL_CONFLICTS, applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D07; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((entry: { id: string }) => entry.id === "KGA-D07")).toMatchObject({ topic: "dependsOn/blocks direction and 46 conflicting edges", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D07");

    // KGA-D07 is currently the last pending decision and stays pending until this record lands.
    // The ledger-wide summary is owned by tests/kernelGovernanceApplicationState.test.ts.
    const state = readJson(LEDGER);
    const row = state.rows.find((entry: { id: string }) => entry.id === "KGA-D07");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D07 row is legal only as this exact scoped, evidence-bound record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D07", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, REPORT] });
    // biome-ignore format: otherwise D07 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: even the last applied row never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });
    // Ten applied rows are still not gap closure: the unlock condition needs human runtime evidence.
    // biome-ignore format: the unlock condition stays evidence-bound whatever the row counts say
    expect(state.gate.unlockCondition).toBe("all-ten-rows-applied-canonical-with-human-runtime-evidence");

    // biome-ignore format: the negative relation-direction matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D02"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-relation-direction-conflict-disposition-2026-08-03"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "repair-all-46-edges"; }, "selectedOption drift"],
      [(candidate) => { candidate.decision.approvalToken = "D07=REPAIR_ALL"; }, "approvalToken drift"],
      [(candidate) => { candidate.applicationSummary.kernelEdgesScheduledForRepair = 46; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.nonKernelEdgeDisposition = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "edge-repair-application-record"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.dispositionState.mode = "RUNTIME_READY"; }, "disposition state drift"],
      [(candidate) => { candidate.dispositionState.validity = "VALID_UNBLOCKED"; }, "disposition state drift"],
      [(candidate) => { candidate.dispositionState.gate = "GO"; }, "disposition state drift"],
      [(candidate) => { candidate.gapBinding.gapClosed = true; }, "gapBinding drift"],
      [(candidate) => { candidate.gapBinding.resolutionStatus = "resolved"; }, "gapBinding drift"],
      [(candidate) => { candidate.conflictSplit.kernelEdgesToRepair = 9; }, "conflict split drift"],
      [(candidate) => { candidate.conflictSplit.nonKernelEdgesMoved = 37; }, "conflict split drift"],
      [(candidate) => { candidate.conflictSplit.totalConflicts = 45; }, "conflict split drift"],
      [(candidate) => { candidate.conflictSplit.kernelEdgesToRepair = 10; candidate.conflictSplit.nonKernelEdgesMoved = 30; candidate.conflictSplit.totalConflicts = 46; }, "conflict split arithmetic drift"],
      [(candidate) => { candidate.conflictSplit.affectedNodeCount = 34; }, "conflict node drift"],
      [(candidate) => { candidate.conflictSplit.kernelNodeCount = 4; }, "conflict node drift"],
      [(candidate) => { candidate.conflictSplit.kernelNodeIds = ["k-surface"]; }, "conflict node drift"],
      [(candidate) => { candidate.repairBoundary.edgesRepaired = 8; }, "repair edge count applied"],
      [(candidate) => { candidate.repairBoundary.edgesRewritten = true; }, "repair edgesRewritten applied"],
      [(candidate) => { candidate.repairBoundary.generatedNodesMutated = true; }, "repair generatedNodesMutated applied"],
      [(candidate) => { candidate.repairBoundary.dependsOnDirectionChanged = true; }, "repair dependsOnDirectionChanged applied"],
      [(candidate) => { candidate.repairBoundary.blocksDirectionChanged = true; }, "repair blocksDirectionChanged applied"],
      [(candidate) => { candidate.repairBoundary.resolution = "applied-in-this-record"; }, "repair boundary drift"],
      [(candidate) => { candidate.repairBoundary.executor = "codex"; }, "repair executor drift"],
      [(candidate) => { candidate.separateGapBoundary.gapCreated = true; }, "separate gap created"],
      [(candidate) => { candidate.separateGapBoundary.gapId = "KGA-G07"; }, "separate gap created"],
      [(candidate) => { candidate.separateGapBoundary.movedEdgeCount = 0; }, "separate gap drift"],
      [(candidate) => { candidate.separateGapBoundary.resolution = "registered"; }, "separate gap drift"],
      [(candidate) => { candidate.predecessorBoundary.sha256 = "drift"; }, "predecessor byte identity drift"],
      [(candidate) => { candidate.predecessorBoundary.bytes = D02_BYTES + 1; }, "predecessor byte identity drift"],
      [(candidate) => { candidate.predecessorBoundary.decisionId = "KGA-D07"; }, "predecessor byte identity drift"],
      [(candidate) => { candidate.predecessorBoundary.repairOwner = "KGA-D02"; }, "repair owner drift"],
      [(candidate) => { candidate.predecessorBoundary.edgeRepairAllowedInPredecessor = true; }, "predecessor repair authorized"],
      [(candidate) => { candidate.predecessorBoundary.canonicalEdgeApplicationDischarged = true; }, "canonical edge application discharged"],
      [(candidate) => { candidate.nodeUniverseBoundary.nodeCount = NODE_COUNT + 1; }, "node universe drift"],
      [(candidate) => { candidate.nodeUniverseBoundary.mutationAllowed = true; }, "node universe drift"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.kernelReady = true; }, "authorityBoundary kernelReady drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); mutate(candidate); expect(validate(candidate, kernelNodeIds)).toContain(error); }
  });
});
