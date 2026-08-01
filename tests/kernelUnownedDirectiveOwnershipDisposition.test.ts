import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json";
const D09_LEDGER = "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const NODES = "src/data/generated/nodes";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const D09_SHA256 = "ebf2396be40f685cb3f1b2c9a13361d418b2af90c700326d07081da70cfe2122";
const D09_BYTES = 3680;
const SCOPE = "unowned-directive-ownership-disposition-record";
const TOKEN = "D04_D09=REJECT_13_GHOSTS";
const DISPOSITION = "rejected-no-node-creation";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const sort = (values: string[]) => [...values].sort();
// biome-ignore format: the exact seven KGA-G05 candidate owner identities stay compact for the shard budget
const CANDIDATES = ["k-evidence-seal", "k-kms", "k-legal-hold", "k-migration-bridge", "k-obligation", "k-provider-adapter", "k-signature-trust"];
// biome-ignore format: the closed disposition-record root key set stays compact for the shard budget
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "decision", "decisionId", "dispositions", "gapBinding", "gapClosed", "generatedAt", "id", "invariants", "ledgerBoundary", "mutationBoundary", "nodeMutation", "nonGoals", "provenance", "rollback", "schemaVersion", "sourceRefs", "status"];
// biome-ignore format: the closed disposition row key set stays compact for the shard budget
const ROW_KEYS = ["candidateOwnerId", "directiveRef", "disposition", "ghostNodeId", "nodeCreated", "ownerAssignment"];
// biome-ignore format: the closed mutation boundary key set stays compact for the shard budget
const BOUNDARY_KEYS = ["baseQueue", "closureAuthority", "edges", "effectiveAuthorityChain", "generatedNodes", "ghostWbsBindingLedger", "platformCode", "registryDecisions", "runtime"];
// biome-ignore format: the promoted application summary for this record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, candidateOwnerIdentitiesRejected: 7, ghostLedgerDisposition: "deferred-to-KGA-D09" };
const ARTIFACT_ID = "kernel-unowned-directive-ownership-disposition-2026-08-01";
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
type Binding = { missingNodeId: string; directiveRef: string; proposedCanonicalId: string | null };
// biome-ignore format: the derived candidate-to-ghost binding stays compact for the shard budget
const ghostBindings = (ledger: { bindings: Binding[] }) => new Map<string, { ghostNodeId: string; directiveRef: string }>(ledger.bindings.filter((b) => b.proposedCanonicalId).map((b) => [b.proposedCanonicalId as string, { ghostNodeId: b.missingNodeId, directiveRef: b.directiveRef }]));
const nodeIds = () =>
  new Set(
    fs
      .readdirSync(path.join(ROOT, NODES))
      .filter((file) => file.endsWith(".json"))
      .map((file) => readJson(`${NODES}/${file}`).id),
  );

// biome-ignore format: the audited disposition validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any, ids: Set<string>, bound: Map<string, { ghostNodeId: string; directiveRef: string }>): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D04") errors.push("decisionId drift");
  if (report.id !== ARTIFACT_ID || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false || report.nodeMutation !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== "reject-13-ghosts") errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  // The shared D04_D09 token is consumed only for the candidate-owner identity rejection.
  if (report.decision?.tokenScopeShare !== "candidate-owner-identity-rejection-only") errors.push("token scope drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");
  // biome-ignore format: KGA-G05 ownership resolution stays open; rejection is not closure
  if (report.gapBinding?.gapId !== "KGA-G05" || report.gapBinding?.gapClosed !== false || report.gapBinding?.resolutionStatus !== "open") errors.push("gapBinding drift");
  if (sort(report.dispositions?.map((row: { candidateOwnerId: string }) => row.candidateOwnerId) ?? []).join() !== CANDIDATES.join()) errors.push("candidate set drift");
  for (const row of report.dispositions ?? []) {
    if (row.disposition !== DISPOSITION || row.nodeCreated !== false || row.ownerAssignment !== null) errors.push(`disposition drift ${row.candidateOwnerId}`);
    if (ids.has(row.candidateOwnerId)) errors.push(`candidate node ${row.candidateOwnerId} exists`);
    // Each rejection names the real D09 ghost id and the directive that raised the claim.
    const source = bound.get(row.candidateOwnerId);
    if (row.ghostNodeId !== source?.ghostNodeId || row.directiveRef !== source?.directiveRef) errors.push(`ghost binding drift ${row.candidateOwnerId}`);
  }
  // The 13-row D09 ledger is read-only evidence here; this record never applies or reshapes it.
  if (report.ledgerBoundary?.ref !== D09_LEDGER || report.ledgerBoundary?.ownerDecisionId !== "KGA-D09") errors.push("ledger owner drift");
  if (report.ledgerBoundary?.rowCount !== 13 || report.ledgerBoundary?.sha256 !== D09_SHA256 || report.ledgerBoundary?.bytes !== D09_BYTES) errors.push("ledger byte identity drift");
  if (report.ledgerBoundary?.bindingsStatus !== "candidate-unselected" || report.ledgerBoundary?.decisionStatus !== "pending") errors.push("ledger status drift");
  if (report.ledgerBoundary?.appliedByThisRecord !== false || report.ledgerBoundary?.mutationAllowed !== false) errors.push("ledger application drift");
  for (const key of BOUNDARY_KEYS) if (report.mutationBoundary?.[key] !== false) errors.push(`mutationBoundary ${key} drift`);
  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D04 unowned directive ownership disposition", () => {
  it("rejects the seven KGA-G05 candidates without creating a node or applying the D09 ledger", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `unowned-directive-disposition-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const ids = nodeIds();
    // The candidate-to-ghost binding is derived from the live D09 ledger, never restated here.
    const bound = ghostBindings(readJson(D09_LEDGER));

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-unowned-directive-ownership-disposition-2026-08-01", generatedAt: "2026-08-01", decisionId: "KGA-D04", status: "approved-application-pending", gapClosed: false, nodeMutation: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.mutationBoundary).sort()).toEqual(BOUNDARY_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "unowned kernel directive module identities", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "reject-13-ghosts", approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN });
    expect(report.provenance.approval.normalizedSelectionSha256).toBe(SELECTION_SHA256);
    // A record written under EPOCH-03 stamps the live head, never a superseded epoch.
    // biome-ignore format: the live EPOCH-03 stamp binding stays compact
    expect(report.provenance.effectiveAuthority).toMatchObject({ ref: CHAIN, seq: chain.chainHeadSeq, chainHeadSha256: chain.chainHeadEntrySha256, normalizedTextSha256: chain.entries.at(-1).normalizedTextSha256 });
    expect(report.applicationSummary).toEqual(APPLICATION_SUMMARY);

    // Seven candidates, seven rejections: no owner is assigned and no identity is materialized.
    expect(report.dispositions).toHaveLength(7);
    // biome-ignore format: every disposition row stays key-closed so a silent owner field cannot appear
    for (const row of report.dispositions) expect(Object.keys(row).sort()).toEqual(ROW_KEYS);
    expect(sort(report.dispositions.map((row: { candidateOwnerId: string }) => row.candidateOwnerId))).toEqual(CANDIDATES);
    expect(validate(report, ids, bound)).toEqual([]);
    // biome-ignore format: the record must say in prose that the rejection creates nothing
    expect(report.invariants.some((line: string) => line.includes("no node is created"))).toBe(true);
    // biome-ignore format: and that the 13-row ghost ledger stays under KGA-D09 ownership
    expect(report.invariants.some((line: string) => line.includes("KGA-D09"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([INVENTORY, CLOSURE, CHAIN, D09_LEDGER, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelUnownedDirectiveOwnershipDisposition.test.ts",
    );

    // The live gap really is the P0 unowned-directive gap, and it stays open.
    const g05 = readJson(INVENTORY).structuralGaps.find((gap: { id: string }) => gap.id === "KGA-G05");
    expect(g05).toMatchObject({ kind: "unowned-kernel-directive", severity: "P0", nodeCreationAllowed: false });
    expect(sort(g05.candidateOwnerIds)).toEqual(CANDIDATES);
    for (const candidate of CANDIDATES) expect(ids.has(candidate)).toBe(false);
    // biome-ignore format: each rejected row still points at a real directive naming its ghost claim
    for (const row of report.dispositions) { expect(exists(row.directiveRef)).toBe(true); expect(ids.has(row.ghostNodeId)).toBe(false); }

    // The D09 ledger is untouched: same 13 candidate-unselected rows, same bytes, still pending.
    const d09Bytes = fs.readFileSync(path.join(ROOT, D09_LEDGER));
    const d09 = readJson(D09_LEDGER);
    expect(d09Bytes.byteLength).toBe(D09_BYTES);
    expect(createHash("sha256").update(d09Bytes).digest("hex")).toBe(D09_SHA256);
    // biome-ignore format: the D09 ledger stays pending, unselected and node-creation-free
    expect(d09).toMatchObject({ decisionId: "KGA-D09", nodeCreationAllowed: false, bindingsStatus: "candidate-unselected", decision: { status: "pending" } });
    expect(d09.bindings).toHaveLength(13);
    // biome-ignore format: the seven proposals inside the 13-row ledger are exactly this record's candidates
    expect(sort(d09.bindings.flatMap((b: { proposedCanonicalId: string | null }) => (b.proposedCanonicalId ? [b.proposedCanonicalId] : [])))).toEqual(CANDIDATES);
    // biome-ignore format: the ghost claims themselves stay unmaterialized under D09
    for (const binding of d09.bindings) { expect(binding.selected).toBe(false); expect(ids.has(binding.missingNodeId)).toBe(false); }

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D04.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D04")).toMatchObject({ disposition: "reject-13-ghosts", ghostCount: 13, applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D04; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((item: { id: string }) => item.id === "KGA-D04")).toMatchObject({ topic: "unowned kernel directive module identities", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D04");

    // Application state may promote D04 only inside this scope, and never past the global gate.
    const state = readJson(LEDGER);
    const row = state.rows.find((item: { id: string }) => item.id === "KGA-D04");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D04 row is legal only as this exact scoped, evidence-bound record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D04", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, REPORT] });
    // biome-ignore format: otherwise D04 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: partial application never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });

    // biome-ignore format: the negative disposition matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any, ids: Set<string>) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D09"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-unowned-directive-ownership-disposition-2026-08-02"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.applicationSummary.candidateOwnerIdentitiesRejected = 6; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.ghostLedgerDisposition = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "ghost-wbs-ledger-application"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.decision.tokenScopeShare = "reject-13-ghosts-including-d09-ledger"; }, "token scope drift"],
      [(candidate) => { candidate.gapBinding.resolutionStatus = "resolved"; }, "gapBinding drift"],
      [(candidate) => { candidate.dispositions[1].ghostNodeId = "k-evidence"; }, "ghost binding drift k-kms"],
      [(candidate) => { candidate.dispositions[0].directiveRef = "docs/k-kms-directive.md"; }, `ghost binding drift ${CANDIDATES[0]}`],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.nodeMutation = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "create-seven-owner-nodes"; }, "selectedOption drift"],
      [(candidate) => { candidate.gapBinding.gapClosed = true; }, "gapBinding drift"],
      [(candidate) => { candidate.dispositions.pop(); }, "candidate set drift"],
      [(candidate) => { candidate.dispositions[0].disposition = "bound-to-existing-owner"; }, `disposition drift ${CANDIDATES[0]}`],
      [(candidate) => { candidate.dispositions[0].nodeCreated = true; }, `disposition drift ${CANDIDATES[0]}`],
      [(candidate) => { candidate.dispositions[0].ownerAssignment = "k-evidence"; }, `disposition drift ${CANDIDATES[0]}`],
      [(_, candidateIds) => candidateIds.add("k-kms"), "candidate node k-kms exists"],
      [(candidate) => { candidate.ledgerBoundary.appliedByThisRecord = true; }, "ledger application drift"],
      [(candidate) => { candidate.ledgerBoundary.mutationAllowed = true; }, "ledger application drift"],
      [(candidate) => { candidate.ledgerBoundary.sha256 = "drift"; }, "ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.rowCount = 7; }, "ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.bindingsStatus = "candidate-selected"; }, "ledger status drift"],
      [(candidate) => { candidate.ledgerBoundary.ownerDecisionId = "KGA-D04"; }, "ledger owner drift"],
      [(candidate) => { candidate.ledgerBoundary.decisionStatus = "applied"; }, "ledger status drift"],
      [(candidate) => { candidate.ledgerBoundary.bytes = 3681; }, "ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.rowCount = 14; }, "ledger byte identity drift"],
      [(candidate) => { candidate.mutationBoundary.generatedNodes = true; }, "mutationBoundary generatedNodes drift"],
      [(candidate) => { candidate.mutationBoundary.ghostWbsBindingLedger = true; }, "mutationBoundary ghostWbsBindingLedger drift"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); const candidateIds = new Set(ids); mutate(candidate, candidateIds); expect(validate(candidate, candidateIds, bound)).toContain(error); }
  });
});
