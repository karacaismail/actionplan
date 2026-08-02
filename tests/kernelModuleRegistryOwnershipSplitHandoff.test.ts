import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HANDOFF = "reports/kernel-module-registry-ownership-split-handoff-2026-08-01.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const VALIDATOR = "tools/lib/kernel-governance-application-state.mjs";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const PR07_PACK = "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md";
const PR_EXECUTION = "docs/platform-initial-11-pr-execution-handoff-2026-07-09.md";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const SCOPE = "ownership-split-governance-record";
const D04_SCOPE = "unowned-directive-ownership-disposition-record";
const D04_RECORD = "reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json";
const D05_SCOPE = "scaffold-walking-skeleton-exit-semantics-record";
const D05_RECORD = "reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json";
const D08_SCOPE = "adr-identity-quarantine-record";
const D08_RECORD = "reports/kernel-adr-identity-quarantine-2026-08-02.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const D09_SCOPE = "ghost-wbs-identity-rejection-record";
const D09_RECORD = "reports/kernel-ghost-wbs-identity-rejection-2026-08-02.json";
const NODES = "src/data/generated/nodes";
const COMBINED_NODE = "src/data/generated/nodes/capability-registry-contract.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore format: the exact k-mod-l responsibility set stays compact for the shard budget
const MOD_L_OWNS = ["module-registry", "manifest-registration", "module-versions", "dependency-resolution", "declared-permissions", "registry-health-lifecycle"];
// biome-ignore format: the exact k-capability responsibility set stays compact for the shard budget
const CAPABILITY_OWNS = ["capability-catalog", "entitlement-resolution-user-tenant-plan", "allow-deny-visibility"];
// biome-ignore format: the exact promoted application summary stays compact for the shard budget
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, canonicalNodeApplication: "deferred-to-pr07-pre-execution-node-rescope" };

describe("KGA-D03 module registry ownership split handoff", () => {
  it("publishes a planning-only ownership split bound to the GATE-01 D03 selection", () => {
    // biome-ignore format: the primary missing-handoff marker stays on one line
    expect(exists(HANDOFF), `module-registry-ownership-split-handoff-missing: ${HANDOFF}`).toBe(true);
    const report = readJson(HANDOFF);
    const chain = readJson(CHAIN);

    // biome-ignore format: the exact handoff identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-module-registry-ownership-split-handoff-2026-08-01", generatedAt: "2026-08-01", decisionId: "KGA-D03", status: "approved-application-pending", gapClosed: false, nodeMutation: false });
    // biome-ignore format: the exact closed handoff root key set stays compact for the shard budget
    expect(Object.keys(report).sort()).toEqual(["applicationSummary", "authorityBoundary", "decision", "decisionId", "gapBinding", "gapClosed", "generatedAt", "id", "invariants", "legacySources", "liveOwnershipConflict", "mutationBoundary", "nodeMutation", "nonGoals", "ownershipContract", "provenance", "rollback", "schemaVersion", "sourceRefs", "status"]);
    // biome-ignore format: the ownership and mutation contracts stay key-closed for the shard budget
    expect(Object.keys(report.ownershipContract).sort()).toEqual(["absorption", "boundaryRule", "capabilityOwner", "capabilityOwns", "existingPlacement", "mergeAllowed", "moduleRegistryOwner", "moduleRegistryOwns", "ownerReassignment"]);
    // biome-ignore format: the mutation boundary stays key-closed so a new escape hatch cannot appear
    expect(Object.keys(report.mutationBoundary).sort()).toEqual(["baseQueue", "closureAuthority", "edges", "effectiveAuthorityChain", "generatedNodes", "platformCode", "registryDecisions", "runtime"]);
    expect(report.legacySources).toHaveLength(2);
    // biome-ignore format: the exact selected option and approval binding stay compact
    expect(report.decision).toMatchObject({ topic: "PR-07 capability versus module-registry ownership", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "split-module-registry-and-capability", approvalRef: `${CLOSURE}#/approval`, approvalToken: "D03=SPLIT_MODULE_REGISTRY_AND_CAPABILITY" });
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

    // Neither module absorbs the other: two owners, two disjoint responsibility sets, no merge.
    // biome-ignore format: the exact ownership split contract stays compact
    expect(report.ownershipContract).toMatchObject({ moduleRegistryOwner: "k-mod-l", capabilityOwner: "k-capability", absorption: "none", mergeAllowed: false, ownerReassignment: false });
    expect(report.ownershipContract.moduleRegistryOwns).toEqual(MOD_L_OWNS);
    expect(report.ownershipContract.capabilityOwns).toEqual(CAPABILITY_OWNS);
    // biome-ignore format: the two responsibility sets must never intersect
    expect(MOD_L_OWNS.filter((item) => CAPABILITY_OWNS.includes(item))).toEqual([]);

    // The combined PR-07 documents are read as source evidence; they do not decide ownership.
    // biome-ignore format: the legacy combined PR-07 sources stay evidence-only
    for (const ref of [PR07_PACK, PR_EXECUTION]) expect(report.legacySources.find((item: { ref: string }) => item.ref === ref)).toMatchObject({ role: "source-evidence-only", canonicalOwnership: false, supersededBy: HANDOFF });
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([INVENTORY, CLOSURE, CHAIN, PR07_PACK, PR_EXECUTION, COMBINED_NODE]));
    // biome-ignore format: this shard writes governance only — no node, edge, queue or runtime change
    expect(report.mutationBoundary).toMatchObject({ generatedNodes: false, edges: false, baseQueue: false, registryDecisions: false, closureAuthority: false, effectiveAuthorityChain: false, platformCode: false, runtime: false });
    // biome-ignore format: the fail-closed authority boundary stays compact
    expect(report.authorityBoundary).toMatchObject({ codeStartAllowed: false, runtimeCodeAllowed: false, releaseAllowed: false, deployAllowed: false, kernelReady: false, sdkReady: false, appBuildable: false, verdict: "NO-GO" });
    expect(report.rollback.runtimeDataImpact).toBe("none");
  });

  it("records the live combined capability-registry-contract as unresolved, not repaired", () => {
    // biome-ignore format: the conflict record depends on the same missing handoff
    expect(exists(HANDOFF), `module-registry-ownership-split-handoff-missing: ${HANDOFF}`).toBe(true);
    const report = readJson(HANDOFF);
    const node = readJson(COMBINED_NODE);
    const conflict = report.liveOwnershipConflict;

    // The live descendant really is parented to k-capability and really does combine both sides.
    expect(node.id).toBe("capability-registry-contract");
    expect(node.parentId).toBe("k-capability");
    expect(node.title).toContain("Module Registry");
    expect(node.title).toContain("Capability");
    expect(node.summary).toContain("Module manifest");
    expect(node.summary).toContain("capability/entitlement");
    // biome-ignore format: the conflict record stays key-closed so a silent field cannot appear
    expect(Object.keys(conflict).sort()).toEqual(["combinedScope", "conflictsWith", "currentParentId", "graphProjectionApplied", "nodeId", "nodeRef", "nodeRescopeComplete", "note", "resolutionOwner", "resolutionShard", "resolutionStatus", "title"]);
    // biome-ignore format: the exact unresolved conflict disposition stays compact
    expect(conflict).toMatchObject({ nodeRef: COMBINED_NODE, nodeId: node.id, title: node.title, currentParentId: "k-capability", conflictsWith: "ownershipContract.moduleRegistryOwns", resolutionStatus: "deferred-to-pr07-pre-execution-node-rescope", resolutionOwner: "codex" });
    // biome-ignore format: the combined scope names both sides of the approved split
    expect(conflict.combinedScope).toEqual(["module-registry", "manifest-registration", "registry-health-lifecycle", "capability-catalog", "entitlement-resolution-user-tenant-plan"]);
    // Live ownership is not exclusive yet: no claim of a repaired projection may pass.
    expect(conflict.graphProjectionApplied).toBe(false);
    expect(conflict.nodeRescopeComplete).toBe(false);
    expect(report.applicationSummary.canonicalNodeApplication).toBe(
      "deferred-to-pr07-pre-execution-node-rescope",
    );
    expect(report.ownershipContract.existingPlacement["capability-registry-contract"]).toContain(
      "unresolved",
    );
    // biome-ignore format: the record must say in prose that the projection is not repaired
    expect(report.invariants.some((line: string) => line.includes("live ownership projection is not repaired"))).toBe(true);
    // biome-ignore format: and that the combined descendant must be re-scoped before PR-07 code start
    expect(report.invariants.some((line: string) => line.includes("capability-registry-contract") && line.includes("before any PR-07 code start"))).toBe(true);
  });

  it("keeps k-mod-l and k-capability separate live nodes with the manifest contract under k-mod-l", () => {
    const modL = readJson(`${NODES}/k-mod-l.json`);
    const capability = readJson(`${NODES}/k-capability.json`);
    const manifest = readJson(`${NODES}/module-registry-manifest-contract.json`);

    expect([modL.id, capability.id]).toEqual(["k-mod-l", "k-capability"]);
    expect(modL.parentId).toBe(capability.parentId);
    expect(modL.id).not.toBe(capability.parentId);
    expect(capability.id).not.toBe(modL.parentId);
    expect(manifest.parentId).toBe("k-mod-l");
    expect(exists(`${NODES}/k-mod-l.json`) && exists(`${NODES}/k-capability.json`)).toBe(true);
  });

  it("leaves the immutable closure intake and the decision registry fail-closed", () => {
    const closure = readJson(CLOSURE);
    const registry = readJson(REGISTRY);
    const d03 = closure.applications.find((row: { id: string }) => row.id === "KGA-D03");
    const decision = registry.decisions.find((item: { id: string }) => item.id === "KGA-D03");

    expect(closure.approval.normalizedSelection).toContain(
      "D03=SPLIT_MODULE_REGISTRY_AND_CAPABILITY",
    );
    expect(d03).toMatchObject({ applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D03; it never selects or closes it
    expect(decision).toMatchObject({ topic: "PR-07 capability versus module-registry ownership", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D03");
  });

  it("promotes application-state D03 only inside its scope, under an explicit attestation contract", async () => {
    // biome-ignore format: the promotion depends on the same missing handoff
    expect(exists(HANDOFF), `module-registry-ownership-split-handoff-missing: ${HANDOFF}`).toBe(true);
    const state = readJson(LEDGER);
    const row = state.rows.find((item: { id: string }) => item.id === "KGA-D03");

    // biome-ignore format: D03 becomes applied and canonical only inside the ownership split scope
    expect(row).toEqual({ id: "KGA-D03", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, HANDOFF] });
    // D04 is applied alongside D03, but only inside its own scoped disposition record.
    // biome-ignore format: the neighbouring D04 row is pinned exactly, never skipped
    expect(state.rows.find((item: { id: string }) => item.id === "KGA-D04")).toEqual({ id: "KGA-D04", applicationStatus: "applied", applicationScope: D04_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D04_RECORD] });
    // D05 is applied alongside D03 and D04, but only inside its own exit-semantics scope.
    // biome-ignore format: the neighbouring D05 row is pinned exactly, never skipped
    expect(state.rows.find((item: { id: string }) => item.id === "KGA-D05")).toEqual({ id: "KGA-D05", applicationStatus: "applied", applicationScope: D05_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D05_RECORD] });
    // D08 is applied alongside D03, D04 and D05, but only inside its own quarantine scope.
    // biome-ignore format: the neighbouring D08 row is pinned exactly, never skipped
    expect(state.rows.find((item: { id: string }) => item.id === "KGA-D08")).toEqual({ id: "KGA-D08", applicationStatus: "applied", applicationScope: D08_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, D08_RECORD] });
    // D09 is applied alongside its predecessors, but only inside its own rejection scope.
    // biome-ignore format: the neighbouring D09 row is pinned exactly, never skipped
    expect(state.rows.find((item: { id: string }) => item.id === "KGA-D09")).toEqual({ id: "KGA-D09", applicationStatus: "applied", applicationScope: D09_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, D09_RECORD] });
    // The exact pending-id set is owned by tests/kernelGovernanceApplicationState.test.ts; this
    // test keeps only the fail-closed semantics every pending row must satisfy, whichever they are.
    // biome-ignore format: every pending row keeps a null scope and no canonical or gap claim
    for (const pending of state.rows.filter((item: { applicationStatus: string }) => item.applicationStatus === "pending")) expect(pending).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending", gapClosed: false });
    // biome-ignore format: partial application never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });
    // The promotion is only legal because the validator gained a deliberate D03 contract.
    // biome-ignore format: an arbitrary applied-looking artifact may never satisfy an absent contract
    expect(read(VALIDATOR)).toContain(`"KGA-D03": { ref: "${HANDOFF}", scope: "${SCOPE}"`);
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelModuleRegistryOwnershipSplitHandoff.test.ts",
    );

    // biome-ignore format: the live validator input is rebuilt from the promoted ledger
    const { validateKernelGovernanceApplicationState, resolveApplicationStateEvidence } = await import(pathToFileURL(path.join(ROOT, VALIDATOR)).href);
    // biome-ignore format: evidence resolves through the shared safe-ref resolver only
    const input = { state, closure: readJson(CLOSURE), chain: readJson(CHAIN), registry: readJson(REGISTRY), scripts: readJson("package.json").scripts, evidence: resolveApplicationStateEvidence(state, (ref: string) => (exists(ref) ? readJson(ref) : null)) };
    expect(validateKernelGovernanceApplicationState(input)).toEqual([]);

    // biome-ignore format: the negative D03 promotion matrix stays compact for the shard budget
    const mutations: Array<(candidate: typeof input) => void> = [
      (candidate) => { candidate.state.rows[2].applicationScope = "governance-semantics-record"; },
      (candidate) => { candidate.state.rows[2].applicationScope = null; },
      (candidate) => { candidate.state.rows[2].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[2].evidenceRefs = [INVENTORY]; },
      (candidate) => { candidate.state.summary = { total: 10, applied: 2, pending: 8, canonical: 2 }; },
      (candidate) => { candidate.state.summary.canonical = 3; },
      (candidate) => { candidate.evidence[HANDOFF].id = "kernel-module-registry-ownership-split-handoff-2026-08-02"; },
      (candidate) => { candidate.evidence[HANDOFF].decisionId = "KGA-D04"; },
      (candidate) => { candidate.evidence[HANDOFF].status = "applied-and-closed"; },
      (candidate) => { candidate.evidence[HANDOFF].gapClosed = true; },
      (candidate) => { candidate.evidence[HANDOFF].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[HANDOFF].applicationSummary.applicationScope = "module-registry-and-capability-merged"; },
      (candidate) => { candidate.evidence[HANDOFF].applicationSummary.remaining = 1; },
      (candidate) => { Object.assign(candidate.state.rows[3], { applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", evidenceRefs: [INVENTORY, HANDOFF] }); candidate.state.summary = { total: 10, applied: 5, pending: 5, canonical: 5 }; },
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const mutate of mutations) { const candidate = structuredClone(input); mutate(candidate); expect(validateKernelGovernanceApplicationState(candidate).length).toBeGreaterThan(0); }
  });
});
