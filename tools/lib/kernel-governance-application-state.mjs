import { createHash } from "node:crypto";

export const APPLICATION_STATE_REF = "reports/kernel-governance-application-state-2026-08-01.json";
const CLOSURE_REF = "reports/kernel-governance-closure-authority-2026-07-31.json";
const REGISTRY_REF = "reports/kernel-governance-decision-registry-2026-07-15.json";
const CHAIN_REF = "reports/kernel-effective-authority-chain-2026-07-31.json";
const SELECTION_POINTER = "/approval/normalizedSelection";
const SELECTION_BYTES = 691;
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const HEAD_EPOCH_ID = "AUTHORITY-SUPERSESSION-03";
const GATE_COMMAND_PREFIX = "node tools/agents/check-kernel-governance.mjs && vitest run ";
const GATE_COMMAND_TEST = " tests/kernelGovernanceApplicationState.test.ts";
const IDS = Array.from({ length: 10 }, (_, index) => `KGA-D${String(index + 1).padStart(2, "0")}`);
// biome-ignore format: the exact closed ledger root key set stays compact for the shard budget
const ROOT_KEYS = ["changeBoundary", "effectiveAuthority", "gate", "generatedAt", "id", "intakeBinding", "invariants", "nonGoals", "rollback", "rows", "schemaVersion", "status", "summary"];
// biome-ignore format: the exact closed row key set stays compact for the shard budget
const ROW_KEYS = ["applicationScope", "applicationStatus", "canonicalStatus", "evidenceRefs", "gapClosed", "id"];
const STAMP_KEYS = ["chainHeadSha256", "epochId", "normalizedTextSha256", "ref", "seq"];
// biome-ignore format: the exact fail-closed gate block stays compact for the shard budget
const GATE = { gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, kernelReady: false, sdkReady: false, appBuildable: false, verdict: "NO-GO", unlockCondition: "all-ten-rows-applied-canonical-with-human-runtime-evidence" };
// biome-ignore format: the pinned ledger declarations stay compact for the shard budget
const DECLARATIONS = { changeBoundary: { allowedFiles: ["tests/kernelTenancyPhysicalStrategyDisposition.test.ts", "reports/kernel-tenancy-physical-strategy-selection-2026-08-02.json", APPLICATION_STATE_REF, "tools/lib/kernel-governance-application-state.mjs", "tests/kernelGovernanceApplicationState.test.ts", "docs/kernel-governance-decision-pack-2026-07-15.md", "package.json", "tools/lib/kernel-governance-authorization-audit.mjs"] }, intakeBinding: { closureRef: CLOSURE_REF, registryRef: REGISTRY_REF, normalizedSelectionPointer: SELECTION_POINTER, normalizedSelectionBytes: SELECTION_BYTES, normalizedSelectionSha256: SELECTION_SHA256, intakeMutationAllowed: false, note: "The GATE-01 approval intake is immutable and stays all-pending; it is read by digest only. Real application state lives here." }, rollback: { trigger: "an applied row loses its attestation contract or evidence, the intake digest or chain head stamp drifts, a scope widens, or a fail-closed gate flag flips", action: "revert this ledger, its validator, test, gate wiring, registry ref and pack section as one shard", runtimeDataImpact: "none" }, invariants: ["The GATE-01 approval intake stays byte-identical and all-pending; this ledger never writes back into it.", "An applied row rests only on the validator's closed applied-attestation contract for that decision id: exact artifact ref, exact artifact root id, exact application summary, approved-application-pending root status and the 691-byte GATE-01 approval digest. A decision with no contract can never be applied, however applied its JSON looks.", "canonicalStatus canonical holds only inside the row's applicationScope; nothing outside that scope is applied or canonical.", "KGA-D01 is canonical only as approved-descendant-materialization. KGA-D02 is canonical only as governance-semantics-record: its canonical edge application stays deferred to KGA-D07 and is neither applied nor canonical here.", "KGA-D03 is canonical only as ownership-split-governance-record: k-mod-l keeps module registry, manifest registration, versions, dependency resolution, declared permissions and registry health/lifecycle, k-capability keeps the capability catalog, user-tenant-plan entitlement resolution and allow/deny visibility, neither absorbs the other, no node, edge or owner is written and the combined PR-07 documents stay source-evidence-only. The live ownership projection is not repaired: capability-registry-contract stays a combined descendant under k-capability, unresolved and deferred to a bounded pre-PR-07 node re-scope shard.", "KGA-D04 is canonical only as unowned-directive-ownership-disposition-record: the seven KGA-G05 candidate owner identities are rejected with no node created and no owner assigned, KGA-G05 stays a P0 open gap, and the shared GATE-01 token is consumed only for that candidate-owner-identity rejection. The thirteen-row KGA-D09 ghost ledger stays read-only evidence, byte-identical, candidate-unselected and pending: its per-ghost dispositions are deferred to KGA-D09 and are neither applied nor canonical here.", "KGA-D05 is canonical only as scaffold-walking-skeleton-exit-semantics-record: PR-10 may prove scaffold-only and PR-11 walking-skeleton-only, neither ceiling promotes readiness, and no runtime, scaffold or SDK code is written. The base execution queue stays byte-identical with PR-10 and PR-11 blocked and nextActionable PR-01, and the cited PR packs stay source-evidence-only rather than a normative DoD.", "KGA-D08 is canonical only as adr-identity-quarantine-record: ADR-E1, ADR-M1, ADR-S1, ADR-X1 and the A5/ADR-0022 collision stay quarantined in place and ambiguous, with no canonical topic, alias, supersession, renumbering or machine-consumer unblock. The five-row ADR collision ledger stays byte-identical, ambiguous and pending, and identity resolution is deferred to the human ADR identity decision.", "KGA-D09 is canonical only as ghost-wbs-identity-rejection-record: all thirteen ghost WBS identities are rejected with create, alias and fold false, no node, owner, module parent or DoD claim is written, and all thirteen ids stay absent from the current-live 650-node universe. The thirteen-row ghost ledger stays byte-identical and is never rewritten in place, the thirteen directive documents are not edited and their dangling references stay open residual evidence, and the seven candidate owner identities stay the disjoint KGA-D04 token share.", "KGA-D10 is canonical only as tenancy-physical-strategy-selection-record: shared schema keyed by tenant_id is selected PLANNING_ONLY, VALID_BLOCKED and gated NO_GO, mandatory FORCE RLS deny-by-default survives unchanged, and there is no threshold and no automatic promotion. Selecting a topology enforces nothing: runtimeEnforcement, schemaApplied, policyApplied and migrationApplied stay false, the executor stays human-developer-only and enforcement is deferred to the KGA-D06 substrate. The tenancy authority inventory stays byte-identical with a null physical strategy.", "A pending row cites exactly its registry sourceReport and handoffRef, keeps applicationScope null and may not claim application or canonical completion.", "The effective-authority stamp binds the live EPOCH-03 chain head; an EPOCH-02, absent or otherwise stale stamp fails closed.", "Partial application is not gap closure: gapClosed, codeStart, runtime, readiness, release and deploy stay false and the verdict stays NO-GO.", "The registry keeps exactly KGA-D01..KGA-D10 in order, pending and unselected; this ledger records application, not selection."], nonGoals: ["do not mutate the GATE-01 approval intake, the effective-authority chain, the registry decisions or any generated projection", "do not write runtime, platform or kernel product code", "do not treat an applied row as runtime readiness, human verification evidence or a code-start permit", "do not read the KGA-D02 governance-semantics-record as canonical edge application, edge repair or KGA-D07 closure", "do not read the KGA-D03 ownership-split-governance-record as node, edge, owner or PR-07 execution application", "do not read the KGA-D04 unowned-directive-ownership-disposition-record as KGA-G05 closure, owner assignment, node creation or KGA-D09 ghost ledger application", "do not read the KGA-D05 scaffold-walking-skeleton-exit-semantics-record as exit evidence, queue application, PR-10/PR-11 unblocking, readiness promotion or a normative agent-pack DoD", "do not read the KGA-D08 adr-identity-quarantine-record as an ADR identity decision, canonical topic selection, renumbering, alias, supersession or machine-consumer unblock", "do not read the KGA-D09 ghost-wbs-identity-rejection-record as node creation, alias, fold, owner assignment, KGA-D04 reapplication, directive-document editing or ghost ledger rewriting", "do not read the KGA-D10 tenancy-physical-strategy-selection-record as schema, RLS policy, migration or runtime tenant-isolation application, as a relaxation of deny-by-default, or as KGA-D06 substrate completion"] };
// The closed set of decisions that may ever claim application, each with the exact artifact and the
// exact application summary that artifact must carry. Promoting KGA-D03 means adding its contract
// here on purpose: arbitrary JSON that merely looks applied can never satisfy an absent entry, and
// the pinned summary is what keeps a scoped record (D02) from reading as canonical edge repair.
// biome-ignore format: the closed applied-attestation registry stays compact for the shard budget
const ATTESTATIONS = { "KGA-D01": { ref: "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json", scope: "approved-descendant-materialization", id: "kernel-code-bearing-descendant-handoff-2026-07-15", summary: { approved: 33, applied: 33, remaining: 0 } }, "KGA-D02": { ref: "reports/kernel-surface-dependency-order-handoff-2026-08-01.json", scope: "governance-semantics-record", id: "kernel-surface-dependency-order-handoff-2026-08-01", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "governance-semantics-record", canonicalEdgeApplication: "deferred-to-KGA-D07" } }, "KGA-D03": { ref: "reports/kernel-module-registry-ownership-split-handoff-2026-08-01.json", scope: "ownership-split-governance-record", id: "kernel-module-registry-ownership-split-handoff-2026-08-01", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "ownership-split-governance-record", canonicalNodeApplication: "deferred-to-pr07-pre-execution-node-rescope" } }, "KGA-D04": { ref: "reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json", scope: "unowned-directive-ownership-disposition-record", id: "kernel-unowned-directive-ownership-disposition-2026-08-01", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "unowned-directive-ownership-disposition-record", candidateOwnerIdentitiesRejected: 7, ghostLedgerDisposition: "deferred-to-KGA-D09" } }, "KGA-D05": { ref: "reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json", scope: "scaffold-walking-skeleton-exit-semantics-record", id: "kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "scaffold-walking-skeleton-exit-semantics-record", exitCeilingsRecorded: 2, runtimeImplementation: "deferred-no-code-start" } }, "KGA-D08": { ref: "reports/kernel-adr-identity-quarantine-2026-08-02.json", scope: "adr-identity-quarantine-record", id: "kernel-adr-identity-quarantine-2026-08-02", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "adr-identity-quarantine-record", ambiguousAdrIdentitiesQuarantined: 5, identityResolutionDisposition: "deferred-to-human-adr-identity-decision" } }, "KGA-D09": { ref: "reports/kernel-ghost-wbs-identity-rejection-2026-08-02.json", scope: "ghost-wbs-identity-rejection-record", id: "kernel-ghost-wbs-identity-rejection-2026-08-02", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "ghost-wbs-identity-rejection-record", ghostIdentitiesRejected: 13, residualDirectiveReferenceDisposition: "deferred-to-human-directive-text-decision" } }, "KGA-D10": { ref: "reports/kernel-tenancy-physical-strategy-selection-2026-08-02.json", scope: "tenancy-physical-strategy-selection-record", id: "kernel-tenancy-physical-strategy-selection-2026-08-02", summary: { approved: 1, applied: 1, remaining: 0, applicationScope: "tenancy-physical-strategy-selection-record", physicalStrategySelected: "shared-schema", runtimeIsolationImplementation: "deferred-no-code-start" } } };
// The caller resolves through this predicate, so an unsafe ref is never joined, stat-ed or read.
export const isSafeEvidenceRef = (ref) =>
  typeof ref === "string" && ref !== "" && !ref.startsWith("/") && !ref.split("/").includes("..");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
// biome-ignore format: the exact applied-attestation oracle stays compact for the shard budget
const attests = (artifact, id, contract) => Boolean(artifact) && artifact.id === contract.id && artifact.decisionId === id && artifact.status === "approved-application-pending" && artifact.gapClosed === false && same(artifact.applicationSummary, contract.summary) && artifact.provenance?.approval?.normalizedSelectionSha256 === SELECTION_SHA256;

// biome-ignore format: the fail-closed application-state contract stays compact for the shard budget
export function validateKernelGovernanceApplicationState({ state, closure, chain, registry, scripts, evidence } = {}) {
  if (!state || typeof state !== "object" || !Array.isArray(state.rows))
    return [`application-state-ledger-missing:${APPLICATION_STATE_REF}`];
  const errors = [];
  const cited = evidence ?? {};
  // biome-ignore format: the exact ledger identity stays compact for the shard budget
  if (state.schemaVersion !== "1.0.0" || state.id !== "kernel-governance-application-state-2026-08-01" || state.generatedAt !== "2026-08-01" || state.status !== "partial-application-no-go") errors.push("application-state-identity-drift");
  if (!same(Object.keys(state).sort(), ROOT_KEYS)) errors.push("application-state-root-keys-drift");

  // The 691-byte GATE-01 selection is re-derived from the intake source, never from a Git command.
  const selection = closure?.approval?.normalizedSelection;
  // biome-ignore format: the source-derived intake digest assertion stays compact
  if (typeof selection !== "string" || Buffer.byteLength(selection, "utf8") !== SELECTION_BYTES || sha256(selection) !== SELECTION_SHA256) errors.push("application-state-intake-digest-forged");
  if (!same(state.intakeBinding, DECLARATIONS.intakeBinding))
    errors.push("application-state-intake-binding-drift");
  const intakeRows = Array.isArray(closure?.applications) ? closure.applications : [];
  // biome-ignore format: the immutable all-pending intake mirror stays compact
  if (intakeRows.length !== IDS.length || intakeRows.some((row) => row?.applicationStatus !== "pending" || row?.canonicalStatus !== "pending")) errors.push("application-state-intake-mutated");
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed"])
    if (closure?.application?.[key] !== false) errors.push(`application-state-intake-unlocked:${key}`);
  // This ledger owns its own change boundary; the frozen closure boundary is never touched.
  // biome-ignore format: the ledger-owned boundary and pinned declarations stay compact
  if (!same(state.changeBoundary, DECLARATIONS.changeBoundary)) errors.push("application-state-change-boundary-drift");
  // biome-ignore format: the exact declaration pin stays compact
  if (!same(state.invariants, DECLARATIONS.invariants) || !same(state.nonGoals, DECLARATIONS.nonGoals)) errors.push("application-state-declaration-drift");
  if (!same(state.rollback, DECLARATIONS.rollback)) errors.push("application-state-rollback-drift");

  // A stamp is valid only while it names the live head. A null, empty or unresolvable chain is a
  // named rejection, never a TypeError: an absent authority may not be read as an unbound one.
  const entries = Array.isArray(chain?.entries) ? chain.entries : [];
  const head = entries.find((entry) => entry?.seq === chain?.chainHeadSeq) ?? null;
  const stamp = state.effectiveAuthority ?? {};
  if (stamp.ref !== CHAIN_REF) errors.push("application-state-chain-ref-drift");
  if (!same(Object.keys(stamp).sort(), STAMP_KEYS))
    errors.push("application-state-stamp-keys-drift");
  if (!head || head.epochId !== HEAD_EPOCH_ID || head.status !== "effective")
    errors.push("application-state-chain-head-unresolvable");
  // biome-ignore format: the live EPOCH-03 head stamp contract stays compact
  else if (stamp.seq !== head.seq || stamp.epochId !== head.epochId || stamp.chainHeadSha256 !== chain?.chainHeadEntrySha256 || stamp.chainHeadSha256 !== head.entrySha256 || stamp.normalizedTextSha256 !== head.normalizedTextSha256) errors.push("application-state-chain-stamp-stale");

  const rows = state.rows;
  if (rows.length !== IDS.length) errors.push("application-state-row-count-drift");
  const seen = new Set();
  rows.forEach((row, index) => {
    const id = row?.id;
    if (id !== IDS[index]) errors.push(`application-state-row-order-drift:${index}`);
    if (seen.has(id)) errors.push(`application-state-row-duplicate:${id}`);
    seen.add(id);
    if (!same(Object.keys(row ?? {}).sort(), ROW_KEYS)) errors.push(`application-state-row-keys-drift:${id}`);
    const decision = (registry?.decisions ?? []).find((item) => item?.id === id);
    // biome-ignore format: the registry-derived evidence binding stays compact
    const derived = decision ? [decision.sourceReport, ...(decision.handoffRef ? [decision.handoffRef] : [])] : [];
    const refs = Array.isArray(row?.evidenceRefs) ? row.evidenceRefs : [];
    const applied = row?.applicationStatus === "applied";
    const contract = ATTESTATIONS[id] ?? null;
    for (const ref of refs) {
      // The same predicate the caller resolves with: an unsafe ref never reaches a filesystem read.
      if (!isSafeEvidenceRef(ref)) errors.push(`application-state-evidence-ref-unsafe:${id}:${ref}`);
      else if (!cited[ref]) errors.push(`application-state-evidence-unresolvable:${id}:${ref}`);
    }
    // biome-ignore format: a row cites exactly its registry-derived refs plus its own attested artifact
    if (!same(refs, applied && contract && !derived.includes(contract.ref) ? [...derived, contract.ref] : derived)) errors.push(`application-state-evidence-binding-drift:${id}`);
    if (row?.gapClosed !== false) errors.push(`application-state-row-gap-claim:${id}`);
    if (applied) {
      if (!contract) errors.push(`application-state-applied-without-contract:${id}`);
      if (row?.canonicalStatus !== "canonical") errors.push(`application-state-row-status-drift:${id}`);
      // biome-ignore format: an applied row is canonical only inside its pinned application scope
      if (row?.applicationScope !== (contract?.scope ?? null)) errors.push(`application-state-application-scope-drift:${id}`);
      // biome-ignore format: the exact artifact, summary, root status and approval digest must all hold
      if (!contract || !attests(cited[contract.ref], id, contract)) errors.push(`application-state-applied-without-evidence:${id}`);
    } else if (row?.applicationStatus === "pending") {
      if (row?.applicationScope !== null) errors.push(`application-state-application-scope-drift:${id}`);
      // biome-ignore format: a pending row may never carry canonical status or attested evidence
      if (row?.canonicalStatus !== "pending" || refs.some((ref) => Object.values(ATTESTATIONS).some((entry) => entry.ref === ref))) errors.push(`application-state-pending-claims-completion:${id}`);
    } else errors.push(`application-state-row-status-drift:${id}`);
  });

  const appliedCount = rows.filter((row) => row?.applicationStatus === "applied").length;
  const canonical = rows.filter((row) => row?.canonicalStatus === "canonical").length;
  // biome-ignore format: the derived summary contract stays compact
  if (!same(state.summary, { total: rows.length, applied: appliedCount, pending: rows.length - appliedCount, canonical })) errors.push("application-state-summary-drift");
  const gate = state.gate ?? {};
  if (!same(Object.keys(gate).sort(), Object.keys(GATE).sort()))
    errors.push("application-state-gate-keys-drift");
  for (const [key, value] of Object.entries(GATE))
    if (gate[key] !== value) errors.push(`application-state-gate-violation:${key}`);

  if (registry?.applicationStateRef !== APPLICATION_STATE_REF)
    errors.push("application-state-registry-ref-drift");
  const decisions = Array.isArray(registry?.decisions) ? registry.decisions : [];
  // biome-ignore format: the registry keeps exactly KGA-D01..KGA-D10 in order
  if (decisions.length !== IDS.length || decisions.some((item, index) => item?.id !== IDS[index])) errors.push("application-state-registry-identity-drift");
  // biome-ignore format: the registry stays discovery-only: pending, unselected and code-start denied
  if (decisions.some((item) => item?.status !== "pending" || item?.selectedOption !== null || item?.codeStartAllowed !== false)) errors.push("application-state-registry-selection-drift");
  // biome-ignore format: the registry verdict floor stays compact
  if (registry?.finalDecision?.verdict !== "NO-GO" || registry?.finalDecision?.codeStartAllowed !== false || registry?.finalDecision?.kernelReady !== false) errors.push("application-state-registry-verdict-drift");
  const command = typeof scripts?.["qa:kernel-governance"] === "string" ? scripts["qa:kernel-governance"] : "";
  if (!command.startsWith(GATE_COMMAND_PREFIX) || !command.includes(GATE_COMMAND_TEST))
    errors.push("application-state-gate-unwired");
  return [...new Set(errors)];
}

// biome-ignore format: the pre-read evidence resolution stays compact for the shard budget
export const resolveApplicationStateEvidence = (state, read) => Object.fromEntries([...new Set((state?.rows ?? []).flatMap((row) => row?.evidenceRefs ?? []))].filter(isSafeEvidenceRef).map((ref) => [ref, read(ref)]));
