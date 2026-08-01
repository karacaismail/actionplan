import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json";
const QUEUE = "reports/platform-implementation-execution-queue-2026-07-09.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const PR10_PACK = "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md";
const PR11_PACK = "docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md";
const HANDOFF = "docs/platform-initial-11-pr-execution-handoff-2026-07-09.md";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const QUEUE_SHA256 = "1c29ffccee7555442e43cb3c0962672718a883b2c31171a012f66ef5ffcc4370";
const QUEUE_BYTES = 37336;
const QUEUE_ITEMS = 37;
const SCOPE = "scaffold-walking-skeleton-exit-semantics-record";
const TOKEN = "D05=SCAFFOLD_AND_WALKING_SKELETON_ONLY";
const PR10_CEILING = "scaffold-only";
const PR11_CEILING = "walking-skeleton-only";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
type Ceiling = {
  exitCeiling: string;
  blockedBy: string[];
  agentPackRef: string;
  queueGapFinding: string;
};
// biome-ignore format: the closed exit-semantics record root key set stays compact for the shard budget
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "decision", "decisionId", "exitSemantics", "gapBinding", "gapClosed", "generatedAt", "id", "invariants", "mutationBoundary", "nonGoals", "provenance", "queueBoundary", "rollback", "schemaVersion", "sourceEvidence", "sourceRefs", "status"];
// biome-ignore format: the closed exit row key set stays compact for the shard budget
const EXIT_KEYS = ["agentPackRef", "blocked", "blockedBy", "evidenceRequirement", "exitCeiling", "promotesReadiness", "queueGapFinding", "queueItem"];
// biome-ignore format: the closed source-evidence row key set stays compact for the shard budget
const SOURCE_KEYS = ["canonicalOwnership", "normativeDoD", "ref", "role"];
// biome-ignore format: the closed queue boundary key set stays compact for the shard budget
const QUEUE_KEYS = ["appliedByThisRecord", "baseSequence", "bytes", "itemCount", "mutationAllowed", "nextActionable", "pr10Status", "pr11Status", "ref", "sha256"];
// biome-ignore format: the closed mutation boundary key set stays compact for the shard budget
const BOUNDARY_KEYS = ["baseQueue", "closureAuthority", "edges", "effectiveAuthorityChain", "generatedNodes", "platformCode", "registryDecisions", "runtime", "scaffoldImplementation", "sdkImplementation"];
// biome-ignore format: the promoted application summary for this planning-only record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, exitCeilingsRecorded: 2, runtimeImplementation: "deferred-no-code-start" };
// biome-ignore format: the exact read-only source pack set stays compact for the shard budget
const SOURCE_PACKS = [HANDOFF, PR10_PACK, PR11_PACK];

// biome-ignore format: the audited exit-semantics validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any, ceilings: Map<string, Ceiling>): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D05") errors.push("decisionId drift");
  // biome-ignore format: the exact planning-only artifact identity stays compact
  if (report.id !== "kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01" || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== "scaffold-only-and-walking-skeleton-only") errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");
  // The gap stays open: recording an exit ceiling is not exit evidence and closes nothing.
  if (report.gapBinding?.gapClosed !== false || report.gapBinding?.resolutionStatus !== "open") errors.push("gapBinding drift");

  // Exactly PR-10 and PR-11, each pinned to its committed queue row and inventory finding.
  const rows = Array.isArray(report.exitSemantics) ? report.exitSemantics : [];
  if (!same(rows.map((row: { queueItem: string }) => row.queueItem), ["PR-10", "PR-11"])) errors.push("exit item set drift");
  for (const row of rows) {
    const expected = ceilings.get(row.queueItem);
    if (!expected) { errors.push(`exit item unknown ${row.queueItem}`); continue; }
    if (row.exitCeiling !== expected.exitCeiling) errors.push(`exit ceiling drift ${row.queueItem}`);
    // A ceiling never promotes readiness, and the queue item stays blocked behind its predecessor.
    if (row.promotesReadiness !== false) errors.push(`exit readiness claim ${row.queueItem}`);
    if (row.blocked !== true || !same(row.blockedBy, expected.blockedBy)) errors.push(`exit blocked drift ${row.queueItem}`);
    if (row.agentPackRef !== expected.agentPackRef) errors.push(`exit pack drift ${row.queueItem}`);
    if (row.queueGapFinding !== expected.queueGapFinding) errors.push(`exit finding drift ${row.queueItem}`);
    // biome-ignore format: the exit evidence requirement must actually say something
    if (typeof row.evidenceRequirement !== "string" || row.evidenceRequirement.trim() === "") errors.push(`exit evidence requirement drift ${row.queueItem}`);
  }

  // The base execution queue is read-only evidence here; this record never reshapes or applies it.
  const queue = report.queueBoundary ?? {};
  // biome-ignore format: the byte-pinned base queue identity stays compact for the shard budget
  if (queue.ref !== QUEUE || queue.sha256 !== QUEUE_SHA256 || queue.bytes !== QUEUE_BYTES || queue.itemCount !== QUEUE_ITEMS) errors.push("queue byte identity drift");
  if (queue.pr10Status !== "blocked" || queue.pr11Status !== "blocked") errors.push("queue status drift");
  if (!same(queue.nextActionable, ["PR-01"])) errors.push("queue next-actionable drift");
  if (queue.mutationAllowed !== false || queue.appliedByThisRecord !== false) errors.push("queue application drift");

  // The PR agent packs are cited as evidence only; they never become a normative DoD.
  const sources = Array.isArray(report.sourceEvidence) ? report.sourceEvidence : [];
  if (!same(sources.map((entry: { ref: string }) => entry.ref), SOURCE_PACKS)) errors.push("source evidence set drift");
  // biome-ignore format: an evidence pack that gains normative or canonical standing is a named rejection
  for (const entry of sources) if (entry.role !== "source-evidence-only" || entry.normativeDoD !== false || entry.canonicalOwnership !== false) errors.push(`source evidence drift ${entry.ref}`);

  for (const key of BOUNDARY_KEYS) if (report.mutationBoundary?.[key] !== false) errors.push(`mutationBoundary ${key} drift`);
  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D05 scaffold and walking-skeleton exit semantics", () => {
  it("records PR-10 scaffold-only and PR-11 walking-skeleton-only ceilings without unblocking the queue", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `scaffold-walking-skeleton-exit-semantics-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const queue = readJson(QUEUE);
    const inventory = readJson(INVENTORY);
    // The expected ceilings are derived from committed evidence, never restated by hand.
    const item = (id: string) => queue.items.find((entry: { id: string }) => entry.id === id);
    // biome-ignore format: the inventory's own PR-10/PR-11 semantic findings are the binding text
    const finding = (id: string) => inventory.queueAudit.semanticFindings.find((entry: { queueItem: string }) => entry.queueItem === id);
    // biome-ignore format: the derived ceiling expectation stays compact for the shard budget
    const ceilings = new Map<string, Ceiling>([PR10_CEILING, PR11_CEILING].map((exitCeiling, index) => { const id = `PR-1${index}`; return [id, { exitCeiling, blockedBy: item(id).blockedBy, agentPackRef: item(id).agentPackRef, queueGapFinding: finding(id).gap }]; }));

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01", generatedAt: "2026-08-01", decisionId: "KGA-D05", status: "approved-application-pending", gapClosed: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.mutationBoundary).sort()).toEqual(BOUNDARY_KEYS);
    expect(Object.keys(report.queueBoundary).sort()).toEqual(QUEUE_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "PR-10 scaffold-only and PR-11 walking-skeleton exit semantics", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "scaffold-only-and-walking-skeleton-only", approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN });
    expect(report.provenance.approval.normalizedSelectionSha256).toBe(SELECTION_SHA256);
    // A record written under EPOCH-03 stamps the live head, never a superseded epoch.
    // biome-ignore format: the live EPOCH-03 stamp binding stays compact
    expect(report.provenance.effectiveAuthority).toMatchObject({ ref: CHAIN, seq: chain.chainHeadSeq, chainHeadSha256: chain.chainHeadEntrySha256, normalizedTextSha256: chain.entries.at(-1).normalizedTextSha256 });
    expect(report.applicationSummary).toEqual(APPLICATION_SUMMARY);

    // Two queue items, two ceilings: neither is exit evidence and neither unblocks anything.
    expect(report.exitSemantics).toHaveLength(2);
    // biome-ignore format: every exit row stays key-closed so a silent readiness field cannot appear
    for (const row of report.exitSemantics) expect(Object.keys(row).sort()).toEqual(EXIT_KEYS);
    // biome-ignore format: every source row stays key-closed so a pack cannot gain normative standing
    for (const entry of report.sourceEvidence) expect(Object.keys(entry).sort()).toEqual(SOURCE_KEYS);
    expect(validate(report, ceilings)).toEqual([]);
    // biome-ignore format: the record must say in prose that scaffold and skeleton are not readiness
    expect(report.invariants.some((line: string) => line.includes("not readiness"))).toBe(true);
    // biome-ignore format: and that the base execution queue is left byte-identical
    expect(report.invariants.some((line: string) => line.includes("base execution queue"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([INVENTORY, CLOSURE, CHAIN, QUEUE, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelScaffoldWalkingSkeletonExitSemantics.test.ts",
    );

    // The base execution queue is untouched: same bytes, same 37 items, PR-10/PR-11 still blocked.
    const queueBytes = fs.readFileSync(path.join(ROOT, QUEUE));
    expect(queueBytes.byteLength).toBe(QUEUE_BYTES);
    expect(createHash("sha256").update(queueBytes).digest("hex")).toBe(QUEUE_SHA256);
    expect(queue.items).toHaveLength(QUEUE_ITEMS);
    expect(queue.nextActionable).toEqual(["PR-01"]);
    // biome-ignore format: both foundation items stay blocked behind their committed predecessor
    for (const [id, blockedBy] of [["PR-10", "PR-09"], ["PR-11", "PR-10"]]) expect(item(id)).toMatchObject({ status: "blocked", blockedBy: [blockedBy] });
    // The inventory still reports both as human-decision-required, not as resolved exits.
    // biome-ignore format: the committed queue-audit findings stay the binding source text
    for (const id of ["PR-10", "PR-11"]) expect(finding(id)).toMatchObject({ resolution: "human-decision-required" });
    expect(inventory.queueAudit.baseQueueChanged).toBe(false);
    expect(inventory.finalDecision).toMatchObject({ sdkReady: false, appBuildable: false, verdict: "NO-GO" });
    // The cited packs really exist and stay evidence: none is promoted to a normative DoD.
    for (const pack of SOURCE_PACKS) expect(exists(pack)).toBe(true);

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D05.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D05")).toMatchObject({ disposition: "scaffold-only-and-walking-skeleton-only", applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D05; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((entry: { id: string }) => entry.id === "KGA-D05")).toMatchObject({ topic: "PR-10 scaffold-only and PR-11 walking-skeleton exit semantics", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D05");

    // Application state may promote D05 only inside this scope, and never past the global gate.
    const state = readJson(LEDGER);
    const row = state.rows.find((entry: { id: string }) => entry.id === "KGA-D05");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D05 row is legal only as this exact scoped, evidence-bound record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D05", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, REPORT] });
    // biome-ignore format: otherwise D05 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: partial application never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });

    // biome-ignore format: the negative exit-semantics matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D10"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-scaffold-walking-skeleton-exit-semantics-2026-08-02"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "sdk-ready-and-app-buildable"; }, "selectedOption drift"],
      [(candidate) => { candidate.decision.approvalToken = "D05=SDK_READY"; }, "approvalToken drift"],
      [(candidate) => { candidate.applicationSummary.exitCeilingsRecorded = 1; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.runtimeImplementation = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "sdk-implementation-record"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.gapBinding.gapClosed = true; }, "gapBinding drift"],
      [(candidate) => { candidate.gapBinding.resolutionStatus = "resolved"; }, "gapBinding drift"],
      [(candidate) => { candidate.exitSemantics.pop(); }, "exit item set drift"],
      [(candidate) => { candidate.exitSemantics[0].exitCeiling = "sdk-ready"; }, "exit ceiling drift PR-10"],
      [(candidate) => { candidate.exitSemantics[1].exitCeiling = "app-buildable"; }, "exit ceiling drift PR-11"],
      [(candidate) => { candidate.exitSemantics[0].promotesReadiness = true; }, "exit readiness claim PR-10"],
      [(candidate) => { candidate.exitSemantics[1].promotesReadiness = true; }, "exit readiness claim PR-11"],
      [(candidate) => { candidate.exitSemantics[0].blocked = false; }, "exit blocked drift PR-10"],
      [(candidate) => { candidate.exitSemantics[1].blockedBy = []; }, "exit blocked drift PR-11"],
      [(candidate) => { candidate.exitSemantics[0].agentPackRef = PR11_PACK; }, "exit pack drift PR-10"],
      [(candidate) => { candidate.exitSemantics[1].queueGapFinding = "walking skeleton proves the app builds."; }, "exit finding drift PR-11"],
      [(candidate) => { candidate.exitSemantics[0].evidenceRequirement = ""; }, "exit evidence requirement drift PR-10"],
      [(candidate) => { candidate.queueBoundary.sha256 = "drift"; }, "queue byte identity drift"],
      [(candidate) => { candidate.queueBoundary.bytes = QUEUE_BYTES + 1; }, "queue byte identity drift"],
      [(candidate) => { candidate.queueBoundary.itemCount = 11; }, "queue byte identity drift"],
      [(candidate) => { candidate.queueBoundary.pr10Status = "next-actionable"; }, "queue status drift"],
      [(candidate) => { candidate.queueBoundary.pr11Status = "verified"; }, "queue status drift"],
      [(candidate) => { candidate.queueBoundary.nextActionable = ["PR-10"]; }, "queue next-actionable drift"],
      [(candidate) => { candidate.queueBoundary.mutationAllowed = true; }, "queue application drift"],
      [(candidate) => { candidate.queueBoundary.appliedByThisRecord = true; }, "queue application drift"],
      [(candidate) => { candidate.sourceEvidence.pop(); }, "source evidence set drift"],
      [(candidate) => { candidate.sourceEvidence[0].normativeDoD = true; }, `source evidence drift ${SOURCE_PACKS[0]}`],
      [(candidate) => { candidate.sourceEvidence[0].canonicalOwnership = true; }, `source evidence drift ${SOURCE_PACKS[0]}`],
      [(candidate) => { candidate.sourceEvidence[0].role = "normative-dod"; }, `source evidence drift ${SOURCE_PACKS[0]}`],
      [(candidate) => { candidate.mutationBoundary.baseQueue = true; }, "mutationBoundary baseQueue drift"],
      [(candidate) => { candidate.mutationBoundary.sdkImplementation = true; }, "mutationBoundary sdkImplementation drift"],
      [(candidate) => { candidate.mutationBoundary.scaffoldImplementation = true; }, "mutationBoundary scaffoldImplementation drift"],
      [(candidate) => { candidate.mutationBoundary.runtime = true; }, "mutationBoundary runtime drift"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.sdkReady = true; }, "authorityBoundary sdkReady drift"],
      [(candidate) => { candidate.authorityBoundary.appBuildable = true; }, "authorityBoundary appBuildable drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); mutate(candidate); expect(validate(candidate, ceilings)).toContain(error); }
  });
});
