import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-early-minimal-db-substrate-2026-08-02.json";
const HANDOFF = "reports/kernel-db-substrate-queue-handoff-2026-07-15.json";
const QUEUE = "reports/platform-implementation-execution-queue-2026-07-09.json";
const D10_RECORD = "reports/kernel-tenancy-physical-strategy-selection-2026-08-02.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const HANDOFF_SHA256 = "3653c0761de778321b1d1014f6742549f9c463118411b56791c70638b92d3c67";
const HANDOFF_BYTES = 4714;
const QUEUE_SHA256 = "1c29ffccee7555442e43cb3c0962672718a883b2c31171a012f66ef5ffcc4370";
const QUEUE_BYTES = 37336;
const QUEUE_ITEMS = 37;
const D10_SHA256 = "f87a361e3e0a97b6e7c8f57d8d533922cd72ff303be043dec0eb5ae558193868";
const D10_BYTES = 6693;
const SCOPE = "early-minimal-db-substrate-record";
const TOKEN = "D06=EARLY_MINIMAL_DB";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
type Affected = { dependencyClasses: string[] };
// biome-ignore format: the closed substrate record root key set stays compact for the shard budget
const ROOT_KEYS = ["affectedItems", "applicationSummary", "authorityBoundary", "decision", "decisionId", "dispositionState", "gapClosed", "generatedAt", "handoffBoundary", "id", "invariants", "nonGoals", "predecessorBoundary", "provenance", "queueBoundary", "rollback", "schemaVersion", "sourceRefs", "status", "substrateBoundary"];
// biome-ignore format: the closed affected-item row key set stays compact for the shard budget
const ITEM_KEYS = ["dependencyClasses", "queueItem", "substrateApplied", "unblockedByThisRecord"];
// biome-ignore format: the closed substrate boundary key set stays compact for the shard budget
const SUBSTRATE_KEYS = ["auditImplemented", "codeStartAllowed", "executor", "migrationsApplied", "outboxImplemented", "resolution", "rlsPolicyApplied", "runtimeStarted", "schemaCreated", "transactionsImplemented"];
// biome-ignore format: the closed queue boundary key set stays compact for the shard budget
const QUEUE_KEYS = ["amendmentCreated", "baseQueueChanged", "baseSequenceLength", "bytes", "dbSubstrateItem", "mutationAllowed", "nextActionable", "queuePatch", "ref", "sha256"];
// biome-ignore format: the closed D06 handoff boundary key set stays compact for the shard budget
const HANDOFF_KEYS = ["bytes", "optionCount", "ref", "rewrittenByThisRecord", "selectedInHandoff", "sha256"];
// biome-ignore format: the closed D10 predecessor boundary key set stays compact for the shard budget
const PREDECESSOR_KEYS = ["bytes", "decisionId", "mandatoryRlsWeakened", "physicalStrategy", "ref", "sha256", "tenancyEnforcementDischarged"];
// biome-ignore format: nothing is built here; every substrate capability stays unimplemented
const SUBSTRATE = { schemaCreated: false, rlsPolicyApplied: false, migrationsApplied: false, transactionsImplemented: false, outboxImplemented: false, auditImplemented: false, runtimeStarted: false, codeStartAllowed: false, resolution: "deferred-to-approved-queue-amendment-and-human-runtime-evidence", executor: "human-developer-only" };
// biome-ignore format: the planning-only, valid-but-blocked, no-go disposition state
const STATE = { mode: "PLANNING_ONLY", validity: "VALID_BLOCKED", gate: "NO_GO" };
// biome-ignore format: the promoted application summary for this substrate record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, dbSubstrateImplementation: "deferred-no-code-start", queueAmendment: "deferred-to-human-approved-amendment" };

// biome-ignore format: the audited substrate-disposition validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any, affected: Map<string, Affected>, order: string[]): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D06") errors.push("decisionId drift");
  // biome-ignore format: the exact planning-only artifact identity stays compact
  if (report.id !== "kernel-early-minimal-db-substrate-2026-08-02" || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== "early-minimal-db") errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");
  // The record is planning-only, valid but blocked from application, and gated NO_GO.
  if (!same(report.dispositionState, STATE)) errors.push("disposition state drift");

  // Approving a substrate is not building one: nothing is created, applied, run or permitted.
  if (!same(report.substrateBoundary, SUBSTRATE)) errors.push("substrate boundary drift");
  // biome-ignore format: every build-or-run capability stays false whatever else the record says
  for (const key of ["schemaCreated", "rlsPolicyApplied", "migrationsApplied", "transactionsImplemented", "outboxImplemented", "auditImplemented", "runtimeStarted", "codeStartAllowed"]) if (report.substrateBoundary?.[key] !== false) errors.push(`substrate ${key} applied`);
  // When the substrate is eventually built, the executor is a human developer, never an agent.
  if (report.substrateBoundary?.executor !== "human-developer-only") errors.push("substrate executor drift");

  // The base execution queue is untouched and the approved amendment is not created here.
  const queue = report.queueBoundary ?? {};
  // biome-ignore format: the byte-pinned base queue identity stays compact for the shard budget
  if (queue.ref !== QUEUE || queue.sha256 !== QUEUE_SHA256 || queue.bytes !== QUEUE_BYTES || queue.baseSequenceLength !== 11) errors.push("queue byte identity drift");
  if (!same(queue.nextActionable, ["PR-01"]) || queue.dbSubstrateItem !== "PR-08") errors.push("queue shape drift");
  // biome-ignore format: no amendment, no patch and no reordering is produced by this record
  if (queue.queuePatch !== null || queue.amendmentCreated !== false || queue.baseQueueChanged !== false || queue.mutationAllowed !== false) errors.push("queue amendment drift");

  // The source D06 handoff stays read-only evidence with both options still unselected.
  const handoff = report.handoffBoundary ?? {};
  // biome-ignore format: the byte-pinned D06 handoff identity stays compact
  if (handoff.ref !== HANDOFF || handoff.sha256 !== HANDOFF_SHA256 || handoff.bytes !== HANDOFF_BYTES || handoff.optionCount !== 2) errors.push("handoff byte identity drift");
  if (handoff.selectedInHandoff !== false || handoff.rewrittenByThisRecord !== false) errors.push("handoff rewrite drift");

  // KGA-D10 evidence is preserved: its strategy holds, RLS is not weakened and its deferral to
  // the D06 substrate is NOT discharged by this planning-only record.
  const predecessor = report.predecessorBoundary ?? {};
  // biome-ignore format: the byte-pinned D10 predecessor evidence stays compact
  if (predecessor.decisionId !== "KGA-D10" || predecessor.ref !== D10_RECORD || predecessor.sha256 !== D10_SHA256 || predecessor.bytes !== D10_BYTES) errors.push("predecessor byte identity drift");
  if (predecessor.physicalStrategy !== "shared-schema") errors.push("predecessor strategy drift");
  if (predecessor.mandatoryRlsWeakened !== false) errors.push("mandatory rls weakened");
  if (predecessor.tenancyEnforcementDischarged !== false) errors.push("tenancy enforcement discharged");

  // Every affected queue item keeps its committed dependency classes and stays unbuilt.
  const rows = Array.isArray(report.affectedItems) ? report.affectedItems : [];
  if (!same(rows.map((row: { queueItem: string }) => row.queueItem), order)) errors.push("affected item set drift");
  for (const row of rows) {
    const source = affected.get(row.queueItem);
    if (!source) { errors.push(`affected item unknown ${row.queueItem}`); continue; }
    if (!same(row.dependencyClasses, source.dependencyClasses)) errors.push(`dependency class drift ${row.queueItem}`);
    if (row.substrateApplied !== false) errors.push(`substrate applied ${row.queueItem}`);
    if (row.unblockedByThisRecord !== false) errors.push(`item unblocked ${row.queueItem}`);
  }

  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D06 early minimal DB substrate disposition", () => {
  it("records the approved early-minimal-db selection as planning-only, valid-blocked and NO_GO", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `early-minimal-db-substrate-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const handoff = readJson(HANDOFF);
    const queue = readJson(QUEUE);
    // The affected-item expectation is derived from the committed handoff, never restated here.
    const order = handoff.affectedItems.map((entry: { id: string }) => entry.id);
    // biome-ignore format: the derived per-item dependency binding stays compact
    const affected = new Map<string, Affected>(handoff.affectedItems.map((entry: { id: string; dependencyClasses: string[] }) => [entry.id, { dependencyClasses: entry.dependencyClasses }]));

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-early-minimal-db-substrate-2026-08-02", generatedAt: "2026-08-02", decisionId: "KGA-D06", status: "approved-application-pending", gapClosed: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.substrateBoundary).sort()).toEqual(SUBSTRATE_KEYS);
    expect(Object.keys(report.queueBoundary).sort()).toEqual(QUEUE_KEYS);
    expect(Object.keys(report.handoffBoundary).sort()).toEqual(HANDOFF_KEYS);
    expect(Object.keys(report.predecessorBoundary).sort()).toEqual(PREDECESSOR_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "DB substrate before durable tenancy/outbox/audit evidence", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "early-minimal-db", approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN });
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
    expect(report.substrateBoundary).toEqual(SUBSTRATE);

    // Seven affected queue items, each still carrying its committed dependency classes.
    expect(report.affectedItems).toHaveLength(order.length);
    // biome-ignore format: every affected row stays key-closed so a silent applied field cannot appear
    for (const row of report.affectedItems) expect(Object.keys(row).sort()).toEqual(ITEM_KEYS);
    expect(validate(report, affected, order)).toEqual([]);
    // biome-ignore format: the record must say in prose that no schema, migration or policy is written
    expect(report.invariants.some((line: string) => line.includes("no schema"))).toBe(true);
    // biome-ignore format: and that the approved queue amendment is still a separate human decision
    expect(report.invariants.some((line: string) => line.includes("queue amendment"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([HANDOFF, QUEUE, D10_RECORD, ADDENDUM, CLOSURE, CHAIN, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelEarlyMinimalDbSubstrate.test.ts",
    );

    // The base execution queue is untouched: same bytes, 37 items, PR-01 still the only next item.
    const queueBytes = fs.readFileSync(path.join(ROOT, QUEUE));
    expect(queueBytes.byteLength).toBe(QUEUE_BYTES);
    expect(createHash("sha256").update(queueBytes).digest("hex")).toBe(QUEUE_SHA256);
    expect(queue.items).toHaveLength(QUEUE_ITEMS);
    expect(queue.nextActionable).toEqual(["PR-01"]);
    // biome-ignore format: PR-08 still owns the DB substrate in the base queue and stays blocked
    expect(queue.items.find((item: { id: string }) => item.id === "PR-08")).toMatchObject({ status: "blocked", blockedBy: ["PR-07"], wbsNodes: ["platform-db-schema"] });

    // The D06 handoff is untouched: same bytes, both options still candidate-unselected.
    const handoffBytes = fs.readFileSync(path.join(ROOT, HANDOFF));
    expect(handoffBytes.byteLength).toBe(HANDOFF_BYTES);
    expect(createHash("sha256").update(handoffBytes).digest("hex")).toBe(HANDOFF_SHA256);
    // biome-ignore format: the handoff itself selects nothing and patches no queue
    expect(handoff).toMatchObject({ decisionId: "KGA-D06", status: "pending-human-selection", gapClosed: false, queuePatch: null, decision: { selectedOption: null } });
    expect(handoff.options).toHaveLength(2);
    // biome-ignore format: neither handoff option was ever marked selected
    for (const option of handoff.options) { expect(option.selected).toBe(false); expect(option.status).toBe("candidate-unselected"); }
    expect(handoff.queueSnapshot).toMatchObject({ baseQueueChanged: false, currentNextActionable: "PR-01", dbSubstrateItem: "PR-08" });

    // The prior KGA-D10 evidence is preserved byte-for-byte and its deferral is still open.
    const d10Bytes = fs.readFileSync(path.join(ROOT, D10_RECORD));
    expect(d10Bytes.byteLength).toBe(D10_BYTES);
    expect(createHash("sha256").update(d10Bytes).digest("hex")).toBe(D10_SHA256);
    // biome-ignore format: D10 still selects shared-schema with FORCE RLS deferred to this substrate
    expect(readJson(D10_RECORD)).toMatchObject({ decisionId: "KGA-D10", selection: { physicalStrategy: "shared-schema", rowLevelSecurity: "FORCE RLS", denyByDefault: true }, enforcementBoundary: { runtimeEnforcement: false, resolution: "deferred-to-KGA-D06-substrate" } });

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D06.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D06")).toMatchObject({ disposition: "early-minimal-db", applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D06 with its handoff; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((entry: { id: string }) => entry.id === "KGA-D06")).toMatchObject({ topic: "DB substrate before durable tenancy/outbox/audit evidence", status: "pending", selectedOption: null, codeStartAllowed: false, handoffRef: HANDOFF });
    expect(read(PACK)).toContain("### KGA-D06");

    // Application state may promote D06 only inside this scope, and never past the global gate.
    // The ledger-wide summary is owned by tests/kernelGovernanceApplicationState.test.ts.
    const state = readJson(LEDGER);
    const row = state.rows.find((entry: { id: string }) => entry.id === "KGA-D06");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D06 row keeps its registry-derived refs plus this exact record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D06", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, HANDOFF, REPORT] });
    // biome-ignore format: otherwise D06 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: approving a substrate never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });

    // biome-ignore format: the negative substrate matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D08"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-early-minimal-db-substrate-2026-08-03"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "provisional-contract-only-then-replay-after-pr08"; }, "selectedOption drift"],
      [(candidate) => { candidate.decision.approvalToken = "D06=LATE_DB"; }, "approvalToken drift"],
      [(candidate) => { candidate.applicationSummary.dbSubstrateImplementation = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.queueAmendment = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "db-substrate-implementation-record"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.dispositionState.mode = "RUNTIME_READY"; }, "disposition state drift"],
      [(candidate) => { candidate.dispositionState.validity = "VALID_UNBLOCKED"; }, "disposition state drift"],
      [(candidate) => { candidate.dispositionState.gate = "GO"; }, "disposition state drift"],
      [(candidate) => { candidate.substrateBoundary.schemaCreated = true; }, "substrate schemaCreated applied"],
      [(candidate) => { candidate.substrateBoundary.rlsPolicyApplied = true; }, "substrate rlsPolicyApplied applied"],
      [(candidate) => { candidate.substrateBoundary.migrationsApplied = true; }, "substrate migrationsApplied applied"],
      [(candidate) => { candidate.substrateBoundary.transactionsImplemented = true; }, "substrate transactionsImplemented applied"],
      [(candidate) => { candidate.substrateBoundary.outboxImplemented = true; }, "substrate outboxImplemented applied"],
      [(candidate) => { candidate.substrateBoundary.auditImplemented = true; }, "substrate auditImplemented applied"],
      [(candidate) => { candidate.substrateBoundary.runtimeStarted = true; }, "substrate runtimeStarted applied"],
      [(candidate) => { candidate.substrateBoundary.codeStartAllowed = true; }, "substrate codeStartAllowed applied"],
      [(candidate) => { candidate.substrateBoundary.resolution = "applied-in-this-record"; }, "substrate boundary drift"],
      [(candidate) => { candidate.substrateBoundary.executor = "codex"; }, "substrate executor drift"],
      [(candidate) => { candidate.substrateBoundary.executor = "claude-worker"; }, "substrate executor drift"],
      [(candidate) => { candidate.queueBoundary.sha256 = "drift"; }, "queue byte identity drift"],
      [(candidate) => { candidate.queueBoundary.bytes = QUEUE_BYTES + 1; }, "queue byte identity drift"],
      [(candidate) => { candidate.queueBoundary.baseSequenceLength = 12; }, "queue byte identity drift"],
      [(candidate) => { candidate.queueBoundary.nextActionable = ["PR-08"]; }, "queue shape drift"],
      [(candidate) => { candidate.queueBoundary.dbSubstrateItem = "PR-01"; }, "queue shape drift"],
      [(candidate) => { candidate.queueBoundary.queuePatch = { insertAfter: "PR-01" }; }, "queue amendment drift"],
      [(candidate) => { candidate.queueBoundary.amendmentCreated = true; }, "queue amendment drift"],
      [(candidate) => { candidate.queueBoundary.baseQueueChanged = true; }, "queue amendment drift"],
      [(candidate) => { candidate.queueBoundary.mutationAllowed = true; }, "queue amendment drift"],
      [(candidate) => { candidate.handoffBoundary.sha256 = "drift"; }, "handoff byte identity drift"],
      [(candidate) => { candidate.handoffBoundary.optionCount = 1; }, "handoff byte identity drift"],
      [(candidate) => { candidate.handoffBoundary.selectedInHandoff = true; }, "handoff rewrite drift"],
      [(candidate) => { candidate.handoffBoundary.rewrittenByThisRecord = true; }, "handoff rewrite drift"],
      [(candidate) => { candidate.predecessorBoundary.sha256 = "drift"; }, "predecessor byte identity drift"],
      [(candidate) => { candidate.predecessorBoundary.bytes = D10_BYTES + 1; }, "predecessor byte identity drift"],
      [(candidate) => { candidate.predecessorBoundary.physicalStrategy = "hybrid"; }, "predecessor strategy drift"],
      [(candidate) => { candidate.predecessorBoundary.mandatoryRlsWeakened = true; }, "mandatory rls weakened"],
      [(candidate) => { candidate.predecessorBoundary.tenancyEnforcementDischarged = true; }, "tenancy enforcement discharged"],
      [(candidate) => { candidate.affectedItems.pop(); }, "affected item set drift"],
      [(candidate) => { candidate.affectedItems.reverse(); }, "affected item set drift"],
      [(candidate) => { candidate.affectedItems[3].dependencyClasses = ["none"]; }, "dependency class drift PR-05"],
      [(candidate) => { candidate.affectedItems[2].substrateApplied = true; }, "substrate applied PR-04"],
      [(candidate) => { candidate.affectedItems[6].unblockedByThisRecord = true; }, "item unblocked PR-08"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.kernelReady = true; }, "authorityBoundary kernelReady drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); mutate(candidate); expect(validate(candidate, affected, order)).toContain(error); }
  });
});
