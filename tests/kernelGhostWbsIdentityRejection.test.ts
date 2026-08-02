import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-ghost-wbs-identity-rejection-2026-08-02.json";
const GHOST_LEDGER = "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json";
const D04_RECORD = "reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const NODES = "src/data/generated/nodes";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const GHOST_SHA256 = "ebf2396be40f685cb3f1b2c9a13361d418b2af90c700326d07081da70cfe2122";
const GHOST_BYTES = 3680;
const NODE_COUNT = 650;
const SCOPE = "ghost-wbs-identity-rejection-record";
const TOKEN = "D04_D09=REJECT_13_GHOSTS";
const DISPOSITION = "rejected-no-create-no-alias-no-fold";
const RESIDUAL = "deferred-to-human-directive-text-decision";
const D09_SHARE = "ghost-wbs-identity-rejection-only";
const D04_SHARE = "candidate-owner-identity-rejection-only";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
type Ghost = { directiveRef: string; proposedCanonicalId: string | null };
// biome-ignore format: the closed rejection record root key set stays compact for the shard budget
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "decision", "decisionId", "gapClosed", "generatedAt", "id", "invariants", "ledgerBoundary", "mutationBoundary", "nodeUniverseBoundary", "nonGoals", "predecessorBoundary", "provenance", "rejections", "residualEvidence", "rollback", "schemaVersion", "sourceRefs", "status"];
// biome-ignore format: the closed rejection row key set stays compact for the shard budget
const ROW_KEYS = ["alias", "create", "directiveRef", "disposition", "fold", "ghostNodeId", "nodeCreated", "ownerIdentityDecidedHere", "proposedCanonicalId", "residualDirectiveText"];
// biome-ignore format: the closed ghost ledger boundary key set stays compact for the shard budget
const GHOST_KEYS = ["bindingsStatus", "bytes", "mutationAllowed", "ownerDecisionId", "proposalCount", "ref", "rewrittenByThisRecord", "rowCount", "sha256"];
// biome-ignore format: the closed node universe boundary key set stays compact for the shard budget
const UNIVERSE_KEYS = ["ghostIdsPresent", "mutationAllowed", "nodeCount", "ref"];
// biome-ignore format: the closed D04 predecessor boundary key set stays compact for the shard budget
const PREDECESSOR_KEYS = ["candidateOwnerIdentitiesRejected", "decisionId", "ownerIdentityDecidedHere", "ref", "rewrittenByThisRecord", "scopeShare"];
// biome-ignore format: the closed residual evidence key set stays compact for the shard budget
const RESIDUAL_KEYS = ["directiveRefCount", "mutationAllowed", "resolution", "status"];
// biome-ignore format: the closed mutation boundary key set stays compact for the shard budget
const BOUNDARY_KEYS = ["baseQueue", "closureAuthority", "dodClaims", "edges", "effectiveAuthorityChain", "generatedNodes", "ghostWbsBindingLedger", "moduleParents", "nodeOwners", "platformCode", "registryDecisions", "runtime"];
// biome-ignore format: the promoted application summary for this rejection record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, ghostIdentitiesRejected: 13, residualDirectiveReferenceDisposition: RESIDUAL };
const nodeIds = () =>
  new Set(
    fs
      .readdirSync(path.join(ROOT, NODES))
      .filter((file) => file.endsWith(".json"))
      .map((file) => readJson(`${NODES}/${file}`).id),
  );

// biome-ignore format: the audited ghost-rejection validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any, ghosts: Map<string, Ghost>, order: string[], ids: Set<string>): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D09") errors.push("decisionId drift");
  // biome-ignore format: the exact planning-only artifact identity stays compact
  if (report.id !== "kernel-ghost-wbs-identity-rejection-2026-08-02" || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== "reject-13-ghosts") errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  // The shared D04_D09 token is consumed here only for the ghost-identity rejection share.
  if (report.decision?.tokenScopeShare !== D09_SHARE) errors.push("token scope drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");

  // All thirteen committed ghost ids, in ledger order, each individually rejected.
  const rows = Array.isArray(report.rejections) ? report.rejections : [];
  if (!same(rows.map((row: { ghostNodeId: string }) => row.ghostNodeId), order)) errors.push("ghost set drift");
  for (const row of rows) {
    const source = ghosts.get(row.ghostNodeId);
    if (!source) { errors.push(`ghost id unknown ${row.ghostNodeId}`); continue; }
    if (row.disposition !== DISPOSITION) errors.push(`disposition drift ${row.ghostNodeId}`);
    // Rejection means none of the three ledger options is taken, and nothing is materialized.
    if (row.create !== false || row.alias !== false || row.fold !== false) errors.push(`option drift ${row.ghostNodeId}`);
    if (row.nodeCreated !== false) errors.push(`node created ${row.ghostNodeId}`);
    if (ids.has(row.ghostNodeId)) errors.push(`ghost node ${row.ghostNodeId} exists`);
    // Owner identity is KGA-D04 work; this record never re-decides a candidate owner.
    if (row.ownerIdentityDecidedHere !== false) errors.push(`owner identity decided ${row.ghostNodeId}`);
    if (row.residualDirectiveText !== RESIDUAL) errors.push(`residual drift ${row.ghostNodeId}`);
    // biome-ignore format: each row keeps the committed directive ref and proposal exactly
    if (row.directiveRef !== source.directiveRef || row.proposedCanonicalId !== source.proposedCanonicalId) errors.push(`binding drift ${row.ghostNodeId}`);
  }

  // The source ghost ledger stays byte-identical and is never rewritten in place.
  const ledger = report.ledgerBoundary ?? {};
  // biome-ignore format: the byte-pinned ghost ledger identity stays compact
  if (ledger.ref !== GHOST_LEDGER || ledger.sha256 !== GHOST_SHA256 || ledger.bytes !== GHOST_BYTES || ledger.rowCount !== 13 || ledger.proposalCount !== 7) errors.push("ghost ledger byte identity drift");
  // biome-ignore format: the ledger text stays candidate-unselected under this decision owner
  if (ledger.ownerDecisionId !== "KGA-D09" || ledger.bindingsStatus !== "candidate-unselected") errors.push("ghost ledger status drift");
  if (ledger.mutationAllowed !== false || ledger.rewrittenByThisRecord !== false) errors.push("ghost ledger rewrite drift");

  // The live node universe is untouched and holds none of the thirteen ghost ids.
  const universe = report.nodeUniverseBoundary ?? {};
  // biome-ignore format: the pinned live node universe stays compact for the shard budget
  if (universe.ref !== NODES || universe.nodeCount !== NODE_COUNT || universe.ghostIdsPresent !== 0 || universe.mutationAllowed !== false) errors.push("node universe drift");

  // KGA-D04 keeps its own seven-candidate share; this record neither widens into it nor rewrites it.
  const predecessor = report.predecessorBoundary ?? {};
  // biome-ignore format: the disjoint D04 predecessor share stays compact for the shard budget
  if (predecessor.decisionId !== "KGA-D04" || predecessor.ref !== D04_RECORD || predecessor.scopeShare !== D04_SHARE || predecessor.candidateOwnerIdentitiesRejected !== 7) errors.push("predecessor binding drift");
  // biome-ignore format: the two token shares stay disjoint and the D04 record stays untouched
  if (predecessor.ownerIdentityDecidedHere !== false || predecessor.rewrittenByThisRecord !== false) errors.push("predecessor disjointness drift");

  // The thirteen directive texts stay open residual evidence, deferred to a human decision.
  const residual = report.residualEvidence ?? {};
  // biome-ignore format: the retained residual directive-text evidence stays compact
  if (residual.directiveRefCount !== 13 || residual.status !== "open" || residual.resolution !== RESIDUAL || residual.mutationAllowed !== false) errors.push("residual evidence drift");

  for (const key of BOUNDARY_KEYS) if (report.mutationBoundary?.[key] !== false) errors.push(`mutationBoundary ${key} drift`);
  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D09 ghost WBS identity rejection", () => {
  it("rejects all thirteen ghost identities without creating, aliasing or folding any of them", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `ghost-wbs-identity-rejection-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const ghostLedger = readJson(GHOST_LEDGER);
    const ids = nodeIds();
    // The expected rejection set is derived from the committed ledger, never restated by hand.
    const order = ghostLedger.bindings.map((entry: { missingNodeId: string }) => entry.missingNodeId);
    // biome-ignore format: the derived per-ghost binding stays compact for the shard budget
    const ghosts = new Map<string, Ghost>(ghostLedger.bindings.map((entry: { missingNodeId: string; directiveRef: string; proposedCanonicalId: string | null }) => [entry.missingNodeId, { directiveRef: entry.directiveRef, proposedCanonicalId: entry.proposedCanonicalId }]));

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-ghost-wbs-identity-rejection-2026-08-02", generatedAt: "2026-08-02", decisionId: "KGA-D09", status: "approved-application-pending", gapClosed: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.mutationBoundary).sort()).toEqual(BOUNDARY_KEYS);
    expect(Object.keys(report.ledgerBoundary).sort()).toEqual(GHOST_KEYS);
    expect(Object.keys(report.nodeUniverseBoundary).sort()).toEqual(UNIVERSE_KEYS);
    expect(Object.keys(report.predecessorBoundary).sort()).toEqual(PREDECESSOR_KEYS);
    expect(Object.keys(report.residualEvidence).sort()).toEqual(RESIDUAL_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "ghost WBS create/alias/fold/reject ledger", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "reject-13-ghosts", approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN, tokenScopeShare: D09_SHARE });
    expect(report.provenance.approval.normalizedSelectionSha256).toBe(SELECTION_SHA256);
    // A record written under EPOCH-03 stamps the live head, never a superseded epoch.
    // biome-ignore format: the live EPOCH-03 stamp binding stays compact
    // Historical-at-write: the stamp names the sealed entry that governed when this record was
    // authored. It is resolved by that entry digest and only bounded by the live head, so
    // appending an epoch never invalidates it and the head is never copied into the stamp.
    // biome-ignore format: the sealed-entry stamp resolution stays compact for the shard budget
    const stamp = chain.entries.find((entry: { entrySha256: string }) => entry.entrySha256 === report.provenance.effectiveAuthority.chainHeadSha256);
    expect(stamp, "consumer-stamp-unresolvable").toBeDefined();
    expect(stamp.seq).toBeLessThanOrEqual(chain.chainHeadSeq);
    // biome-ignore format: the stamp mirrors the sealed entry it named, never the live head
    expect(report.provenance.effectiveAuthority).toMatchObject({ ref: CHAIN, seq: stamp.seq, chainHeadSha256: stamp.entrySha256, normalizedTextSha256: stamp.normalizedTextSha256 });
    expect(report.applicationSummary).toEqual(APPLICATION_SUMMARY);

    // Thirteen ghosts, thirteen individual rejections: no create, no alias, no fold, no node.
    expect(report.rejections).toHaveLength(13);
    // biome-ignore format: every rejection row stays key-closed so a silent create field cannot appear
    for (const row of report.rejections) expect(Object.keys(row).sort()).toEqual(ROW_KEYS);
    expect(report.rejections.map((row: { ghostNodeId: string }) => row.ghostNodeId)).toEqual(order);
    expect(validate(report, ghosts, order, ids)).toEqual([]);
    // biome-ignore format: the record must say in prose that nothing is created, aliased or folded
    expect(report.invariants.some((line: string) => line.includes("no node is created"))).toBe(true);
    // biome-ignore format: and that the seven candidate owner identities stay KGA-D04 work
    expect(report.invariants.some((line: string) => line.includes("KGA-D04"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([GHOST_LEDGER, ADDENDUM, CLOSURE, CHAIN, D04_RECORD, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelGhostWbsIdentityRejection.test.ts",
    );

    // The source ghost ledger is untouched: same bytes, same 13 rows, still candidate-unselected.
    const ghostBytes = fs.readFileSync(path.join(ROOT, GHOST_LEDGER));
    expect(ghostBytes.byteLength).toBe(GHOST_BYTES);
    expect(createHash("sha256").update(ghostBytes).digest("hex")).toBe(GHOST_SHA256);
    // biome-ignore format: the ledger stays pending, unselected and node-creation-free
    expect(ghostLedger).toMatchObject({ decisionId: "KGA-D09", nodeCreationAllowed: false, bindingsStatus: "candidate-unselected", decision: { status: "pending" } });
    expect(ghostLedger.bindings).toHaveLength(13);
    // biome-ignore format: every committed binding stays unselected with its directive text intact
    for (const binding of ghostLedger.bindings) { expect(binding.selected).toBe(false); expect(exists(binding.directiveRef)).toBe(true); }
    // biome-ignore format: exactly seven of the thirteen rows carry a proposed canonical identity
    expect(ghostLedger.bindings.filter((binding: { proposedCanonicalId: string | null }) => binding.proposedCanonicalId)).toHaveLength(7);

    // The live 650-node universe holds none of the thirteen ghost ids and none of D04's candidates.
    expect(ids.size).toBe(NODE_COUNT);
    for (const ghost of order) expect(ids.has(ghost)).toBe(false);
    // KGA-D04 keeps its own disjoint seven-candidate share; this record does not re-decide it.
    const d04 = readJson(D04_RECORD);
    // biome-ignore format: the D04 record stays exactly seven candidate-owner rejections
    expect(d04).toMatchObject({ decisionId: "KGA-D04", status: "approved-application-pending", gapClosed: false, decision: { tokenScopeShare: D04_SHARE } });
    expect(d04.dispositions).toHaveLength(7);
    // biome-ignore format: every D04 row stays an owner rejection with no owner assigned
    for (const row of d04.dispositions) { expect(row.ownerAssignment).toBeNull(); expect(ids.has(row.candidateOwnerId)).toBe(false); }
    expect(d04.decision.tokenScopeShare).not.toBe(D09_SHARE);

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D09.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D09")).toMatchObject({ disposition: "reject-13-ghosts", ghostCount: 13, applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D09; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((entry: { id: string }) => entry.id === "KGA-D09")).toMatchObject({ topic: "ghost WBS create/alias/fold/reject ledger", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D09");

    // Application state may promote D09 only inside this scope, and never past the global gate.
    const state = readJson(LEDGER);
    const row = state.rows.find((entry: { id: string }) => entry.id === "KGA-D09");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D09 row is legal only as this exact scoped, evidence-bound record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D09", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, REPORT] });
    // biome-ignore format: otherwise D09 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: partial application never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });

    // biome-ignore format: the negative ghost-rejection matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any, ids: Set<string>) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D04"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-ghost-wbs-identity-rejection-2026-08-03"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "create-13-ghost-nodes"; }, "selectedOption drift"],
      [(candidate) => { candidate.decision.approvalToken = "D09=CREATE_13_GHOSTS"; }, "approvalToken drift"],
      [(candidate) => { candidate.decision.tokenScopeShare = D04_SHARE; }, "token scope drift"],
      [(candidate) => { candidate.applicationSummary.ghostIdentitiesRejected = 7; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.residualDirectiveReferenceDisposition = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "candidate-owner-identity-rejection-only"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.rejections.pop(); }, "ghost set drift"],
      [(candidate) => { candidate.rejections.reverse(); }, "ghost set drift"],
      [(candidate) => { candidate.rejections[0].disposition = "folded-into-existing-node"; }, "disposition drift archetype-agreement"],
      [(candidate) => { candidate.rejections[0].create = true; }, "option drift archetype-agreement"],
      [(candidate) => { candidate.rejections[3].alias = true; }, "option drift k-evidence"],
      [(candidate) => { candidate.rejections[5].fold = true; }, "option drift k-kms"],
      [(candidate) => { candidate.rejections[5].nodeCreated = true; }, "node created k-kms"],
      [(_, candidateIds) => candidateIds.add("k-kms"), "ghost node k-kms exists"],
      [(candidate) => { candidate.rejections[9].ownerIdentityDecidedHere = true; }, "owner identity decided k-obligation"],
      [(candidate) => { candidate.rejections[2].residualDirectiveText = "resolved"; }, "residual drift k-event-projection"],
      [(candidate) => { candidate.rejections[1].directiveRef = "docs/does-not-bind.md"; }, "binding drift archetype-document-composition"],
      [(candidate) => { candidate.rejections[4].proposedCanonicalId = "k-exec-context"; }, "binding drift k-exec-context"],
      [(candidate) => { candidate.ledgerBoundary.sha256 = "drift"; }, "ghost ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.bytes = GHOST_BYTES + 1; }, "ghost ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.rowCount = 7; }, "ghost ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.proposalCount = 13; }, "ghost ledger byte identity drift"],
      [(candidate) => { candidate.ledgerBoundary.bindingsStatus = "candidate-selected"; }, "ghost ledger status drift"],
      [(candidate) => { candidate.ledgerBoundary.ownerDecisionId = "KGA-D04"; }, "ghost ledger status drift"],
      [(candidate) => { candidate.ledgerBoundary.rewrittenByThisRecord = true; }, "ghost ledger rewrite drift"],
      [(candidate) => { candidate.ledgerBoundary.mutationAllowed = true; }, "ghost ledger rewrite drift"],
      [(candidate) => { candidate.nodeUniverseBoundary.ghostIdsPresent = 1; }, "node universe drift"],
      [(candidate) => { candidate.nodeUniverseBoundary.nodeCount = NODE_COUNT + 13; }, "node universe drift"],
      [(candidate) => { candidate.nodeUniverseBoundary.mutationAllowed = true; }, "node universe drift"],
      [(candidate) => { candidate.predecessorBoundary.decisionId = "KGA-D09"; }, "predecessor binding drift"],
      [(candidate) => { candidate.predecessorBoundary.scopeShare = D09_SHARE; }, "predecessor binding drift"],
      [(candidate) => { candidate.predecessorBoundary.candidateOwnerIdentitiesRejected = 13; }, "predecessor binding drift"],
      [(candidate) => { candidate.predecessorBoundary.ownerIdentityDecidedHere = true; }, "predecessor disjointness drift"],
      [(candidate) => { candidate.predecessorBoundary.rewrittenByThisRecord = true; }, "predecessor disjointness drift"],
      [(candidate) => { candidate.residualEvidence.directiveRefCount = 0; }, "residual evidence drift"],
      [(candidate) => { candidate.residualEvidence.status = "closed"; }, "residual evidence drift"],
      [(candidate) => { candidate.residualEvidence.resolution = "auto-resolved"; }, "residual evidence drift"],
      [(candidate) => { candidate.residualEvidence.mutationAllowed = true; }, "residual evidence drift"],
      [(candidate) => { candidate.mutationBoundary.generatedNodes = true; }, "mutationBoundary generatedNodes drift"],
      [(candidate) => { candidate.mutationBoundary.ghostWbsBindingLedger = true; }, "mutationBoundary ghostWbsBindingLedger drift"],
      [(candidate) => { candidate.mutationBoundary.moduleParents = true; }, "mutationBoundary moduleParents drift"],
      [(candidate) => { candidate.mutationBoundary.nodeOwners = true; }, "mutationBoundary nodeOwners drift"],
      [(candidate) => { candidate.mutationBoundary.dodClaims = true; }, "mutationBoundary dodClaims drift"],
      [(candidate) => { candidate.mutationBoundary.registryDecisions = true; }, "mutationBoundary registryDecisions drift"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.kernelReady = true; }, "authorityBoundary kernelReady drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); const candidateIds = new Set(ids); mutate(candidate, candidateIds); expect(validate(candidate, ghosts, order, candidateIds)).toContain(error); }
  });
});
