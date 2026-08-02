import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const VALIDATOR = "tools/lib/kernel-governance-application-state.mjs";
const GATE_SCRIPT = "tools/agents/check-kernel-governance.mjs";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const D01_HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const D02_HANDOFF = "reports/kernel-surface-dependency-order-handoff-2026-08-01.json";
const D03_HANDOFF = "reports/kernel-module-registry-ownership-split-handoff-2026-08-01.json";
const D06_HANDOFF = "reports/kernel-db-substrate-queue-handoff-2026-07-15.json";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const EPOCH03_ENTRY_SHA256 = "9ce36513271352f891c5c73963ce1e7db94b316063587cf0506c8ff270a0984c";
const EPOCH03_TEXT_SHA256 = "4f00c2d3f3af743b975dcb29b8f54a913bc2b2de00df575469dc3598ef0d3aa5";
const EPOCH02_ENTRY_SHA256 = "782ef3c5b92455b79a76ae715864b585b4302f24ad7355d7fe606b35330c5029";
const EPOCH02_TEXT_SHA256 = "239711dc77b396dd51bc64a02fab9f32a47804c885490e3c644b487b2343c2df";
const DECLARATION_SHA256 = "46a33cb220e50c2f7a801d1a39112d3ff17be340efb701f9395efa86cf29611c";
const D01_SCOPE = "approved-descendant-materialization";
const D02_SCOPE = "governance-semantics-record";
const D03_SCOPE = "ownership-split-governance-record";
const D04_SCOPE = "unowned-directive-ownership-disposition-record";
const D04_RECORD = "reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json";
const D05_SCOPE = "scaffold-walking-skeleton-exit-semantics-record";
const D05_RECORD = "reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json";
const D08_SCOPE = "adr-identity-quarantine-record";
const D08_RECORD = "reports/kernel-adr-identity-quarantine-2026-08-02.json";
const D09_SCOPE = "ghost-wbs-identity-rejection-record";
const D09_RECORD = "reports/kernel-ghost-wbs-identity-rejection-2026-08-02.json";
const D10_SCOPE = "tenancy-physical-strategy-selection-record";
const D10_RECORD = "reports/kernel-tenancy-physical-strategy-selection-2026-08-02.json";
const PACK_HEADING = "## Application State Ledger — Partial Application, NO-GO";
const SELF = "tests/kernelGovernanceApplicationState.test.ts";
const QUOTES = ["'", '"', "`"];
const LEDGER_SIBLING_FLOOR = 5;
// The sole authoritative global summary, in the exact shape a normalized matcher body carries.
const OWNER_SUMMARY_LITERAL = "summary: { total: 10, applied: 8, pending: 2, canonical: 8 }";
const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

// biome-ignore format: the exact application-state row ledger stays compact for the shard budget
const ROWS = [{ id: "KGA-D01", applicationStatus: "applied", applicationScope: D01_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D01_HANDOFF] }, { id: "KGA-D02", applicationStatus: "applied", applicationScope: D02_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D02_HANDOFF] }, { id: "KGA-D03", applicationStatus: "applied", applicationScope: D03_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D03_HANDOFF] }, { id: "KGA-D04", applicationStatus: "applied", applicationScope: D04_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D04_RECORD] }, { id: "KGA-D05", applicationStatus: "applied", applicationScope: D05_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [INVENTORY, D05_RECORD] }, { id: "KGA-D06", applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending", gapClosed: false, evidenceRefs: [ADDENDUM, D06_HANDOFF] }, { id: "KGA-D07", applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending", gapClosed: false, evidenceRefs: [ADDENDUM] }, { id: "KGA-D08", applicationStatus: "applied", applicationScope: D08_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, D08_RECORD] }, { id: "KGA-D09", applicationStatus: "applied", applicationScope: D09_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, D09_RECORD] }, { id: "KGA-D10", applicationStatus: "applied", applicationScope: D10_SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, D10_RECORD] }];
// biome-ignore format: the exact fail-closed gate block stays compact for the shard budget
const GATE = { gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, kernelReady: false, sdkReady: false, appBuildable: false, verdict: "NO-GO", unlockCondition: "all-ten-rows-applied-canonical-with-human-runtime-evidence" };
// biome-ignore format: the exact intake binding and live EPOCH-03 stamp stay compact
const INTAKE = { closureRef: CLOSURE, registryRef: REGISTRY, normalizedSelectionPointer: "/approval/normalizedSelection", normalizedSelectionBytes: 691, normalizedSelectionSha256: SELECTION_SHA256, intakeMutationAllowed: false };
// biome-ignore format: the exact live head stamp stays compact for the shard budget
const STAMP = { ref: CHAIN, seq: 3, epochId: "AUTHORITY-SUPERSESSION-03", chainHeadSha256: EPOCH03_ENTRY_SHA256, normalizedTextSha256: EPOCH03_TEXT_SHA256 };
// biome-ignore format: the ledger-owned change boundary stays compact for the shard budget
const ALLOWED_FILES = ["tests/kernelTenancyPhysicalStrategyDisposition.test.ts", D10_RECORD, LEDGER, VALIDATOR, "tests/kernelGovernanceApplicationState.test.ts", PACK, "package.json", "tools/lib/kernel-governance-authorization-audit.mjs"];
// biome-ignore format: the exact closed root and row key sets stay compact for the shard budget
const ROOT_KEYS = ["changeBoundary", "effectiveAuthority", "gate", "generatedAt", "id", "intakeBinding", "invariants", "nonGoals", "rollback", "rows", "schemaVersion", "status", "summary"];
// biome-ignore format: the exact closed row key set stays compact for the shard budget
const ROW_KEYS = ["applicationScope", "applicationStatus", "canonicalStatus", "evidenceRefs", "gapClosed", "id"];
const PACK_SECTION_SHA256 = "acf5a1aaf50429f17aae0a20b8fa848ec61fbc455411b23dd7ecc3e351a1bfc8";

describe("kernel governance application state ledger", () => {
  it("records real canonical application state without mutating the GATE-01 intake", () => {
    // biome-ignore format: the primary missing-ledger marker stays on one line
    expect(fs.existsSync(path.join(ROOT, LEDGER)), `application-state-ledger-missing: ${LEDGER}`).toBe(true);
    const state = readJson(LEDGER);
    const closure = readJson(CLOSURE);
    const chain = readJson(CHAIN);
    const registry = readJson(REGISTRY);

    expect(Object.keys(state).sort()).toEqual(ROOT_KEYS);
    // biome-ignore format: the exact ledger contract stays compact for the shard budget
    expect(state).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-governance-application-state-2026-08-01", generatedAt: "2026-08-01", status: "partial-application-no-go", intakeBinding: INTAKE, effectiveAuthority: STAMP, rows: ROWS, summary: { total: 10, applied: 8, pending: 2, canonical: 8 }, gate: GATE });
    for (const row of state.rows) expect(Object.keys(row).sort()).toEqual(ROW_KEYS);
    // This test is the sole owner of the exact pending-id set: it is derived from the pinned rows,
    // checked against the live ledger and reconciled with the summary, so no sibling restates it.
    // biome-ignore format: the pending ids are derived, never restated as a second literal ratchet
    const pendingIds = ROWS.filter((item) => item.applicationStatus === "pending").map((item) => item.id);
    // biome-ignore format: the live ledger must present exactly those pending ids, in row order
    expect(state.rows.filter((item: { applicationStatus: string }) => item.applicationStatus === "pending").map((item: { id: string }) => item.id)).toEqual(pendingIds);
    expect(pendingIds).toEqual(["KGA-D06", "KGA-D07"]);
    expect(state.summary.pending).toBe(pendingIds.length);
    // The ledger owns its own change boundary; the frozen closure boundary is never widened.
    expect(state.changeBoundary).toEqual({ allowedFiles: ALLOWED_FILES });
    expect(closure.changeBoundary.allowedFiles).not.toContain(LEDGER);
    // biome-ignore format: the exact invariant and non-goal content is pinned by digest
    expect(createHash("sha256").update(JSON.stringify({ changeBoundary: state.changeBoundary, invariants: state.invariants, nonGoals: state.nonGoals })).digest("hex")).toBe(DECLARATION_SHA256);

    // The 691-byte GATE-01 selection is asserted from the intake source itself, never from Git.
    const selection = closure.approval.normalizedSelection;
    expect(Buffer.byteLength(selection, "utf8")).toBe(691);
    expect(createHash("sha256").update(selection).digest("hex")).toBe(SELECTION_SHA256);
    // The immutable intake still carries all ten rows pending; the live state lives only here.
    // biome-ignore format: the all-pending intake mirror stays compact for the shard budget
    expect(closure.applications.every((row: { applicationStatus: string; canonicalStatus: string }) => row.applicationStatus === "pending" && row.canonicalStatus === "pending")).toBe(true);
    // KGA-D02 is applied only as a governance-semantics record: edge repair stays KGA-D07 work.
    // biome-ignore format: the exact D02 scope and deferred canonical edge application stay compact
    expect(readJson(D02_HANDOFF).applicationSummary).toMatchObject({ applicationScope: D02_SCOPE, canonicalEdgeApplication: "deferred-to-KGA-D07" });
    // biome-ignore format: the exact D01 applied counts stay compact for the shard budget
    expect(readJson(D01_HANDOFF).applicationSummary).toEqual({ approved: 33, applied: 33, remaining: 0 });
    // KGA-D04 is applied only as a candidate-owner rejection: the D09 ghost ledger stays deferred.
    // biome-ignore format: the exact D04 scope and deferred ghost ledger disposition stay compact
    expect(readJson(D04_RECORD).applicationSummary).toEqual({ approved: 1, applied: 1, remaining: 0, applicationScope: D04_SCOPE, candidateOwnerIdentitiesRejected: 7, ghostLedgerDisposition: "deferred-to-KGA-D09" });
    // KGA-D05 is applied only as an exit-ceiling record: no runtime, scaffold or SDK code starts.
    // biome-ignore format: the exact D05 scope and deferred runtime implementation stay compact
    expect(readJson(D05_RECORD).applicationSummary).toEqual({ approved: 1, applied: 1, remaining: 0, applicationScope: D05_SCOPE, exitCeilingsRecorded: 2, runtimeImplementation: "deferred-no-code-start" });
    // KGA-D08 is applied only as a quarantine record: no ADR identity is resolved or aliased.
    // biome-ignore format: the exact D08 scope and deferred identity resolution stay compact
    expect(readJson(D08_RECORD).applicationSummary).toEqual({ approved: 1, applied: 1, remaining: 0, applicationScope: D08_SCOPE, ambiguousAdrIdentitiesQuarantined: 5, identityResolutionDisposition: "deferred-to-human-adr-identity-decision" });
    // KGA-D09 is applied only as a ghost rejection: no node is created, aliased or folded.
    // biome-ignore format: the exact D09 scope and deferred residual directive refs stay compact
    expect(readJson(D09_RECORD).applicationSummary).toEqual({ approved: 1, applied: 1, remaining: 0, applicationScope: D09_SCOPE, ghostIdentitiesRejected: 13, residualDirectiveReferenceDisposition: "deferred-to-human-directive-text-decision" });
    // KGA-D10 is applied only as a topology selection: nothing is enforced, applied or migrated.
    // biome-ignore format: the exact D10 scope and deferred runtime isolation stay compact
    expect(readJson(D10_RECORD).applicationSummary).toEqual({ approved: 1, applied: 1, remaining: 0, applicationScope: D10_SCOPE, physicalStrategySelected: "shared-schema", runtimeIsolationImplementation: "deferred-no-code-start" });
    // The stamp binds the live EPOCH-03 head, not the superseded EPOCH-02 stamp its evidence uses.
    expect(state.effectiveAuthority.seq).toBe(chain.chainHeadSeq);
    expect(state.effectiveAuthority.chainHeadSha256).toBe(chain.chainHeadEntrySha256);
    expect(state.effectiveAuthority.chainHeadSha256).not.toBe(EPOCH02_ENTRY_SHA256);
    expect(state.effectiveAuthority.normalizedTextSha256).not.toBe(EPOCH02_TEXT_SHA256);
    expect(registry.applicationStateRef).toBe(LEDGER);
    expect(registry.closureStateRef).toBe(`${CLOSURE}#application`);
    // biome-ignore format: the ten registry decision identities stay pinned in order
    expect(registry.decisions.map((decision: { id: string }) => decision.id)).toEqual(Array.from({ length: 10 }, (_, index) => `KGA-D${String(index + 1).padStart(2, "0")}`));

    const gate = readJson("package.json").scripts["qa:kernel-governance"];
    expect(gate).toContain("tests/kernelGovernanceApplicationState.test.ts");
    // biome-ignore format: the gate wiring and pinned pack semantics stay compact
    expect(fs.readFileSync(path.join(ROOT, GATE_SCRIPT), "utf8")).toContain("validateKernelGovernanceApplicationState");
    const pack = fs.readFileSync(path.join(ROOT, PACK), "utf8");
    expect(pack.split(PACK_HEADING).length).toBe(2);
    // biome-ignore format: the exact normalized application-state pack section stays compact
    const section = pack.slice(pack.indexOf(PACK_HEADING)).split("\n## ")[0].replaceAll("\r\n", "\n").trim();
    // biome-ignore format: the pack section is ratcheted by exact normalized bytes and digest
    expect([Buffer.byteLength(section, "utf8"), createHash("sha256").update(section, "utf8").digest("hex")]).toEqual([4484, PACK_SECTION_SHA256]);
  });

  it("fails closed on forged intake, stale stamps, unbacked application and unwired gates", async () => {
    // biome-ignore format: the missing-validator marker stays on one line
    expect(fs.existsSync(path.join(ROOT, VALIDATOR)), `application-state-validator-missing: ${VALIDATOR}`).toBe(true);
    const { validateKernelGovernanceApplicationState, resolveApplicationStateEvidence } =
      await import(pathToFileURL(path.join(ROOT, VALIDATOR)).href);
    const read: string[] = [];
    // biome-ignore format: pre-read proof — the gate's resolver never hands its reader an unsafe ref
    const probe = resolveApplicationStateEvidence({ rows: [{ evidenceRefs: ["/etc/passwd", `reports/../${INVENTORY}`, "", INVENTORY] }] }, (ref: string) => { read.push(ref); return { ref }; });
    expect([read, Object.keys(probe)]).toEqual([[INVENTORY], [INVENTORY]]);
    const state = readJson(LEDGER);
    // biome-ignore format: the cited evidence set is derived from the ledger itself
    const refs = [...new Set(state.rows.flatMap((row: { evidenceRefs: string[] }) => row.evidenceRefs))] as string[];
    // biome-ignore format: the live validator input stays compact for the shard budget
    const input = { state, closure: readJson(CLOSURE), chain: readJson(CHAIN), registry: readJson(REGISTRY), scripts: readJson("package.json").scripts, evidence: Object.fromEntries(refs.map((ref) => [ref, fs.existsSync(path.join(ROOT, ref)) ? readJson(ref) : null])) };
    expect(validateKernelGovernanceApplicationState(input)).toEqual([]);
    // An absent authority chain is a named rejection, never a TypeError or an unbound pass.
    // biome-ignore format: the null-chain fail-closed oracle stays compact
    for (const chain of [null, undefined, {}, { entries: [] }]) expect(validateKernelGovernanceApplicationState({ ...input, chain })).toContain("application-state-chain-head-unresolvable");

    // biome-ignore format: the negative application-state matrix stays compact for the shard budget
    const mutations: Array<(candidate: typeof input) => void> = [
      (candidate) => { candidate.state.intakeBinding.normalizedSelectionSha256 = "0".repeat(64); },
      (candidate) => { candidate.state.intakeBinding.normalizedSelectionBytes = 690; },
      (candidate) => { candidate.state.intakeBinding.intakeMutationAllowed = true; },
      (candidate) => { candidate.state.intakeBinding.closureRef = "reports/other.json"; },
      (candidate) => { candidate.state.intakeBinding.note = "application is complete"; },
      (candidate) => { candidate.state.intakeBinding.codeStartAllowed = true; },
      (candidate) => { candidate.state.effectiveAuthority.runtimeReady = true; },
      (candidate) => { candidate.state.rollback.runtimeDataImpact = "runtime"; },
      (candidate) => { candidate.state.rollback.trigger = "never"; },
      (candidate) => { candidate.state.rollback.action = "keep the ledger and drop its validator"; },
      (candidate) => { candidate.state.rollback.owner = "claude"; },
      (candidate) => { candidate.closure.approval.normalizedSelection += "."; },
      (candidate) => { candidate.closure.applications[0].canonicalStatus = "canonical"; },
      (candidate) => { candidate.closure.application.codeStartAllowed = true; },
      (candidate) => { candidate.state.effectiveAuthority.seq = 2; candidate.state.effectiveAuthority.chainHeadSha256 = EPOCH02_ENTRY_SHA256; candidate.state.effectiveAuthority.normalizedTextSha256 = EPOCH02_TEXT_SHA256; },
      (candidate) => { candidate.state.effectiveAuthority.chainHeadSha256 = EPOCH02_ENTRY_SHA256; },
      (candidate) => { candidate.state.effectiveAuthority.normalizedTextSha256 = EPOCH02_TEXT_SHA256; },
      (candidate) => { candidate.state.effectiveAuthority.epochId = "AUTHORITY-SUPERSESSION-02"; },
      (candidate) => { candidate.state.effectiveAuthority.ref = "reports/other-chain.json"; },
      (candidate) => { candidate.chain.chainHeadSeq = 2; },
      (candidate) => { candidate.state.rows[0].evidenceRefs = [INVENTORY]; },
      (candidate) => { candidate.state.rows[0].evidenceRefs.push("reports/does-not-exist.json"); },
      (candidate) => { candidate.state.rows[0].evidenceRefs.push("/etc/passwd"); },
      (candidate) => { candidate.state.rows[0].evidenceRefs[1] = `reports/../${D01_HANDOFF}`; },
      (candidate) => { candidate.evidence[D01_HANDOFF].applicationSummary.remaining = 1; },
      (candidate) => { candidate.evidence[D01_HANDOFF].applicationSummary.applied = 0; },
      (candidate) => { candidate.evidence[D01_HANDOFF].applicationSummary.approved = 32; },
      (candidate) => { candidate.evidence[D01_HANDOFF].status = "applied"; },
      (candidate) => { candidate.evidence[D01_HANDOFF].id = "kernel-code-bearing-descendant-handoff-2026-07-16"; },
      (candidate) => { candidate.evidence[D02_HANDOFF].id = "kernel-surface-dependency-order-handoff-2026-08-02"; },
      (candidate) => { candidate.evidence[D03_HANDOFF].id = "kernel-module-registry-ownership-split-handoff-2026-08-02"; },
      (candidate) => { candidate.evidence[D03_HANDOFF].applicationSummary.canonicalNodeApplication = "applied"; },
      (candidate) => { candidate.evidence[D03_HANDOFF].applicationSummary.canonicalNodeApplication = "not-applicable-no-node-mutation"; },
      (candidate) => { candidate.evidence[D03_HANDOFF].applicationSummary.applicationScope = "module-registry-and-capability-merged"; },
      (candidate) => { candidate.state.rows[2].applicationScope = D01_SCOPE; },
      (candidate) => { candidate.evidence[D01_HANDOFF].gapClosed = true; },
      (candidate) => { candidate.evidence[D02_HANDOFF].decisionId = "KGA-D03"; },
      (candidate) => { candidate.evidence[D02_HANDOFF].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[D02_HANDOFF].applicationSummary.applicationScope = "canonical-edge-application"; },
      (candidate) => { candidate.evidence[D02_HANDOFF].applicationSummary.canonicalEdgeApplication = "applied"; },
      (candidate) => { candidate.state.rows[0].applicationScope = D02_SCOPE; },
      (candidate) => { candidate.state.rows[1].applicationScope = D01_SCOPE; },
      (candidate) => { candidate.state.rows[1].applicationScope = null; },
      (candidate) => { candidate.state.rows[2].applicationScope = D02_SCOPE; },
      (candidate) => { candidate.state.rows[0].codeStartAllowed = true; },
      (candidate) => { candidate.state.rows[2].runtimeReady = true; },
      (candidate) => { candidate.state.rows[2].applicationStatus = "pending"; },
      (candidate) => { candidate.state.rows[2].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[2].evidenceRefs.push(D01_HANDOFF); },
      (candidate) => { Object.assign(candidate.state.rows[5], { applicationStatus: "applied", applicationScope: D10_SCOPE, canonicalStatus: "canonical", evidenceRefs: [ADDENDUM, D06_HANDOFF, D10_RECORD] }); candidate.state.summary = { total: 10, applied: 9, pending: 1, canonical: 9 }; },
      (candidate) => { candidate.evidence[D10_RECORD].id = "kernel-tenancy-physical-strategy-selection-2026-08-03"; },
      (candidate) => { candidate.evidence[D10_RECORD].status = "applied"; },
      (candidate) => { candidate.evidence[D10_RECORD].decisionId = "KGA-D06"; },
      (candidate) => { candidate.evidence[D10_RECORD].gapClosed = true; },
      (candidate) => { candidate.evidence[D10_RECORD].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[D10_RECORD].applicationSummary.physicalStrategySelected = "hybrid"; },
      (candidate) => { candidate.evidence[D10_RECORD].applicationSummary.runtimeIsolationImplementation = "applied"; },
      (candidate) => { candidate.evidence[D10_RECORD].applicationSummary.applicationScope = "tenancy-runtime-isolation-record"; },
      (candidate) => { candidate.state.rows[9].applicationScope = D09_SCOPE; },
      (candidate) => { candidate.state.rows[9].applicationScope = null; },
      (candidate) => { candidate.state.rows[9].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[9].evidenceRefs = [ADDENDUM]; },
      (candidate) => { candidate.state.rows[8].applicationScope = D10_SCOPE; },
      (candidate) => { candidate.evidence[D09_RECORD].id = "kernel-ghost-wbs-identity-rejection-2026-08-03"; },
      (candidate) => { candidate.evidence[D09_RECORD].status = "applied"; },
      (candidate) => { candidate.evidence[D09_RECORD].decisionId = "KGA-D04"; },
      (candidate) => { candidate.evidence[D09_RECORD].gapClosed = true; },
      (candidate) => { candidate.evidence[D09_RECORD].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[D09_RECORD].applicationSummary.ghostIdentitiesRejected = 7; },
      (candidate) => { candidate.evidence[D09_RECORD].applicationSummary.residualDirectiveReferenceDisposition = "applied"; },
      (candidate) => { candidate.evidence[D09_RECORD].applicationSummary.applicationScope = "candidate-owner-identity-rejection-only"; },
      (candidate) => { candidate.state.rows[8].applicationScope = D08_SCOPE; },
      (candidate) => { candidate.state.rows[8].applicationScope = null; },
      (candidate) => { candidate.state.rows[8].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[8].evidenceRefs = [ADDENDUM]; },
      (candidate) => { candidate.state.rows[7].applicationScope = D09_SCOPE; },
      (candidate) => { candidate.evidence[D08_RECORD].id = "kernel-adr-identity-quarantine-2026-08-03"; },
      (candidate) => { candidate.evidence[D08_RECORD].status = "applied"; },
      (candidate) => { candidate.evidence[D08_RECORD].decisionId = "KGA-D09"; },
      (candidate) => { candidate.evidence[D08_RECORD].gapClosed = true; },
      (candidate) => { candidate.evidence[D08_RECORD].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[D08_RECORD].applicationSummary.ambiguousAdrIdentitiesQuarantined = 4; },
      (candidate) => { candidate.evidence[D08_RECORD].applicationSummary.identityResolutionDisposition = "applied"; },
      (candidate) => { candidate.evidence[D08_RECORD].applicationSummary.applicationScope = "adr-identity-resolution-record"; },
      (candidate) => { candidate.state.rows[7].applicationScope = D05_SCOPE; },
      (candidate) => { candidate.state.rows[7].applicationScope = null; },
      (candidate) => { candidate.state.rows[7].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[7].evidenceRefs = [ADDENDUM]; },
      (candidate) => { candidate.state.rows[4].applicationScope = D08_SCOPE; },
      (candidate) => { candidate.evidence[D05_RECORD].id = "kernel-scaffold-walking-skeleton-exit-semantics-2026-08-02"; },
      (candidate) => { candidate.evidence[D05_RECORD].status = "applied"; },
      (candidate) => { candidate.evidence[D05_RECORD].decisionId = "KGA-D11"; },
      (candidate) => { candidate.evidence[D05_RECORD].gapClosed = true; },
      (candidate) => { candidate.evidence[D05_RECORD].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[D05_RECORD].applicationSummary.exitCeilingsRecorded = 1; },
      (candidate) => { candidate.evidence[D05_RECORD].applicationSummary.runtimeImplementation = "applied"; },
      (candidate) => { candidate.evidence[D05_RECORD].applicationSummary.applicationScope = "sdk-implementation-record"; },
      (candidate) => { candidate.state.rows[4].applicationScope = D04_SCOPE; },
      (candidate) => { candidate.state.rows[4].applicationScope = null; },
      (candidate) => { candidate.state.rows[4].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[4].evidenceRefs = [INVENTORY]; },
      (candidate) => { candidate.state.rows[3].applicationScope = D05_SCOPE; },
      (candidate) => { candidate.evidence[D04_RECORD].id = "kernel-unowned-directive-ownership-disposition-2026-08-02"; },
      (candidate) => { candidate.evidence[D04_RECORD].status = "applied"; },
      (candidate) => { candidate.evidence[D04_RECORD].decisionId = "KGA-D09"; },
      (candidate) => { candidate.evidence[D04_RECORD].gapClosed = true; },
      (candidate) => { candidate.evidence[D04_RECORD].provenance.approval.normalizedSelectionSha256 = "drift"; },
      (candidate) => { candidate.evidence[D04_RECORD].applicationSummary.candidateOwnerIdentitiesRejected = 6; },
      (candidate) => { candidate.evidence[D04_RECORD].applicationSummary.ghostLedgerDisposition = "applied"; },
      (candidate) => { candidate.evidence[D04_RECORD].applicationSummary.applicationScope = "ghost-wbs-ledger-application"; },
      (candidate) => { candidate.state.rows[3].applicationScope = D03_SCOPE; },
      (candidate) => { candidate.state.rows[3].applicationScope = null; },
      (candidate) => { candidate.state.rows[3].canonicalStatus = "pending"; },
      (candidate) => { candidate.state.rows[3].evidenceRefs = [INVENTORY]; },
      (candidate) => { candidate.state.rows[2].applicationScope = D04_SCOPE; },
      (candidate) => { candidate.state.rows[5].evidenceRefs = [ADDENDUM]; },
      (candidate) => { candidate.state.rows[0].applicationStatus = "done"; },
      (candidate) => { candidate.state.rows[0].gapClosed = true; },
      (candidate) => { candidate.state.rows.pop(); },
      (candidate) => { candidate.state.rows = [candidate.state.rows[1], candidate.state.rows[0], ...candidate.state.rows.slice(2)]; },
      (candidate) => { candidate.state.rows[3].id = "KGA-D03"; },
      (candidate) => { candidate.state.summary.applied = 9; },
      (candidate) => { candidate.state.summary.pending = 1; },
      (candidate) => { candidate.state.summary.canonical = 3; },
      (candidate) => { candidate.state.summary.total = 11; },
      (candidate) => { candidate.state.gate.gapClosed = true; },
      (candidate) => { candidate.state.gate.codeStartAllowed = true; },
      (candidate) => { candidate.state.gate.runtimeCodeAllowed = true; },
      (candidate) => { candidate.state.gate.readinessAllowed = true; },
      (candidate) => { candidate.state.gate.releaseAllowed = true; },
      (candidate) => { candidate.state.gate.deployAllowed = true; },
      (candidate) => { candidate.state.gate.verdict = "GO"; },
      (candidate) => { candidate.state.status = "complete"; },
      (candidate) => { candidate.state.id = "kernel-governance-application-state-2026-08-02"; },
      (candidate) => { candidate.state.runtimeReady = true; },
      (candidate) => { candidate.state = Object.fromEntries(Object.entries(candidate.state).filter(([key]) => key !== "rollback")); },
      (candidate) => { candidate.state.changeBoundary.allowedFiles.pop(); },
      (candidate) => { candidate.state.changeBoundary.allowedFiles.push("src/data/generated/nodes/k-surface.json"); },
      (candidate) => { candidate.state.invariants[3] = "KGA-D02 canonical edge application is applied."; },
      (candidate) => { candidate.state.invariants.pop(); },
      (candidate) => { candidate.state.nonGoals.pop(); },
      (candidate) => { candidate.registry.applicationStateRef = "reports/other.json"; },
      (candidate) => { candidate.registry.decisions[4].id = "KGA-D99"; },
      (candidate) => { candidate.registry.decisions = [candidate.registry.decisions[1], candidate.registry.decisions[0], ...candidate.registry.decisions.slice(2)]; },
      (candidate) => { candidate.registry.decisions[2].selectedOption = "applied"; },
      (candidate) => { candidate.registry.decisions[2].codeStartAllowed = true; },
      (candidate) => { candidate.registry.finalDecision.verdict = "GO"; },
      (candidate) => { candidate.scripts["qa:kernel-governance"] = candidate.scripts["qa:kernel-governance"].replace(" tests/kernelGovernanceApplicationState.test.ts", ""); },
      (candidate) => { candidate.scripts["qa:kernel-governance"] = `echo ${candidate.scripts["qa:kernel-governance"]}`; },
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const mutate of mutations) { const candidate = structuredClone(input); mutate(candidate); expect(validateKernelGovernanceApplicationState(candidate).length).toBeGreaterThan(0); }
  });

  it("owns the global ledger summary pin and lets no sibling governance test restate it", () => {
    // The ledger-wide summary belongs to this test. A sibling that re-pins it turns every future
    // decision promotion into a multi-file edit, which has already blocked three shards in a row.
    // Detection is source-structural, not line-based: comments are stripped, whitespace is
    // normalized so multiline pins collapse, and each expect() call site is read with balanced
    // parens so extra matcher arguments and nested calls cannot hide a pin.
    const source = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");
    // biome-ignore format: the string-aware comment stripper stays compact for the shard budget
    const stripComments = (text: string) => { let out = ""; let mode = "code"; for (let i = 0; i < text.length; i += 1) { const c = text[i]; const n = text[i + 1]; if (mode === "code") { if (c === "/" && n === "/") { mode = "line"; i += 1; continue; } if (c === "/" && n === "*") { mode = "block"; i += 1; continue; } if (QUOTES.includes(c)) mode = c; out += c; continue; } if (mode === "line") { if (c === "\n") { mode = "code"; out += c; } continue; } if (mode === "block") { if (c === "*" && n === "/") { mode = "code"; i += 1; } continue; } if (c === "\\") { out += c + (n ?? ""); i += 1; continue; } if (c === mode) mode = "code"; out += c; } return out; };
    // biome-ignore format: the balanced-paren reader stays compact for the shard budget
    const balanced = (text: string, open: number) => { let depth = 0; for (let i = open; i < text.length; i += 1) { if (text[i] === "(") depth += 1; else if (text[i] === ")") { depth -= 1; if (depth === 0) return { body: text.slice(open + 1, i), end: i }; } } return { body: "", end: text.length }; };
    // biome-ignore format: every expect() call site is returned as its argument list plus matcher body
    const calls = (raw: string) => { const text = stripComments(raw).replace(/\s+/g, " "); const out: Array<{ arg: string; body: string }> = []; for (let i = text.indexOf("expect("); i !== -1; i = text.indexOf("expect(", i + 1)) { const arg = balanced(text, i + 6); const tail = text.slice(arg.end + 1, arg.end + 1400); const matcher = /^\s*\.\w+\(/.exec(tail); const body = matcher ? balanced(tail, tail.indexOf("(")).body : ""; out.push({ arg: arg.body, body }); } return out; };
    // A pin is an assertion on a resolved .summary carrying a literal row total, or any matcher
    // body nesting summary: { total: ... }. Negative-matrix clones assign instead of asserting.
    // biome-ignore format: the deterministic global-summary pin detector stays compact
    const pins = (raw: string) => calls(raw).filter((call) => (/\.summary\b/.test(call.arg) && /\btotal\s*:\s*\d+/.test(call.body)) || /\bsummary\s*:\s*\{[^{}]*\btotal\s*:\s*\d+/.test(call.body));
    // A sibling's own decision id is the one it asserts in its artifact identity expect.
    // biome-ignore format: the artifact-identity decision id derivation stays compact
    const ownIds = (raw: string) => { const ids = new Set<string>(); for (const call of calls(raw)) { if (!call.body.includes("schemaVersion")) continue; const id = /decisionId\s*:\s*"(KGA-D\d\d)"/.exec(call.body); if (id) ids.add(id[1]); } return [...ids]; };
    // biome-ignore format: an own-row assertion names the sibling's decision id and its scope together
    const assertsOwnRow = (raw: string, id: string) => calls(raw).some((call) => `${call.arg} ${call.body}`.includes(id) && `${call.arg} ${call.body}`.includes("applicationScope"));

    // The detector is proven against synthetic pins before it is trusted against real siblings.
    // biome-ignore format: the adversarial detector matrix stays compact for the shard budget
    const ADVERSARIAL: Array<[string, boolean]> = [
      ["expect(state.summary).toEqual({ total: 10, applied: 7 });", true],
      ["expect(state.summary, `pin`).toEqual({ total: 10, applied: 7 });", true],
      ["expect(readJson(LEDGER).summary).toEqual({ total: 10, applied: 7 });", true],
      ["expect(state).toMatchObject({ rows: ROWS, summary: { total: 10, applied: 7 }, gate: GATE });", true],
      ["expect(\n  state.summary,\n).toEqual({\n  total: 10,\n  applied: 7,\n});", true],
      ["// expect(state.summary).toEqual({ total: 10 });", false],
      ["/* expect(state.summary).toEqual({ total: 10 }); */", false],
      ["(candidate) => { candidate.state.summary = { total: 10, applied: 7 }; },", false],
      ["(candidate) => { candidate.state.summary.canonical = 3; },", false],
      ["expect(report.applicationSummary).toEqual({ approved: 1, applied: 1 });", false],
      ["expect(state.gate).toMatchObject({ verdict: 'NO-GO' });", false],
      ["expect(rows.filter((r) => r.applicationStatus === 'pending')).toEqual(ids);", false],
    ];
    // biome-ignore format: the adversarial driver stays compact for the shard budget
    for (const [snippet, flagged] of ADVERSARIAL) expect(pins(snippet).length > 0, `detector-mismatch: ${snippet}`).toBe(flagged);

    // Every sibling that actually reads the ledger is discovered, so D04, D05 and any future
    // D06/D07/D10 ledger test is covered without this list ever being restated by hand.
    // biome-ignore format: the dynamic ledger-touching sibling discovery stays compact
    const siblings = fs.readdirSync(path.join(ROOT, "tests")).filter((file) => file.endsWith(".test.ts")).map((file) => `tests/${file}`).filter((file) => file !== SELF && source(file).includes(LEDGER)).sort();
    // Discovery may never silently degrade to an empty set and pass vacuously.
    expect(siblings.length).toBeGreaterThanOrEqual(LEDGER_SIBLING_FLOOR);
    // biome-ignore format: every leaking sibling is reported by exact path for a one-look diagnosis
    const leaks = siblings.filter((file) => pins(source(file)).length > 0).map((file) => `application-state-global-summary-pin-leak:${file}`);
    expect(leaks).toEqual([]);

    // The relocation must keep exactly one owner. Counting any pin here would also count the
    // adversarial snippets above, so the owner is identified by its exact normalized literal.
    // biome-ignore format: the exactly-one authoritative owner pin check stays compact
    expect(pins(source(SELF)).filter((call) => call.body.includes(OWNER_SUMMARY_LITERAL))).toHaveLength(1);
    // Nothing was dropped: each KGA-Dxx sibling still asserts its own row by id and scope together.
    // biome-ignore format: the assertion-anchored own-row proof stays compact for the shard budget
    const dropped = siblings.flatMap((file) => { const ids = ownIds(source(file)); if (ids.length !== 1) return []; return assertsOwnRow(source(file), ids[0]) ? [] : [`application-state-sibling-row-assertion-missing:${file}`]; });
    expect(dropped).toEqual([]);
    // biome-ignore format: and every discovered sibling really does name exactly one decision id
    expect(siblings.filter((file) => ownIds(source(file)).length !== 1)).toEqual([]);
  });
});
