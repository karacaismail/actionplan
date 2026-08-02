import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-tenancy-physical-strategy-selection-2026-08-02.json";
const INVENTORY = "reports/kernel-tenancy-authority-inventory-2026-07-15.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const ADR = "docs/adr-0026-tech-profiles.md";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const INVENTORY_SHA256 = "fe060b16a8a00e647ef98c72866db67de172b20bf59ee9059991e87b9bd7a399";
const INVENTORY_BYTES = 6844;
const TENANT_STRATEGY_NON_NULL = 27;
const SCOPE = "tenancy-physical-strategy-selection-record";
const TOKEN = "D10=SHARED_SCHEMA_TENANT_ID_FORCE_RLS";
const STRATEGY = "shared-schema";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
// biome-ignore format: the closed selection record root key set stays compact for the shard budget
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "decision", "decisionId", "dispositionState", "enforcementBoundary", "gapClosed", "generatedAt", "id", "invariants", "inventoryBoundary", "mutationBoundary", "nonGoals", "provenance", "rollback", "schemaVersion", "selection", "sourceRefs", "status"];
// biome-ignore format: the closed enforcement boundary key set stays compact for the shard budget
const ENFORCEMENT_KEYS = ["executor", "migrationApplied", "policyApplied", "resolution", "runtimeEnforcement", "schemaApplied"];
// biome-ignore format: selecting a topology enforces nothing; the substrate work stays KGA-D06
const ENFORCEMENT = { runtimeEnforcement: false, schemaApplied: false, policyApplied: false, migrationApplied: false, resolution: "deferred-to-KGA-D06-substrate", executor: "human-developer-only" };
// biome-ignore format: the closed tenancy selection key set stays compact for the shard budget
const SELECTION_KEYS = ["automaticPromotion", "denyByDefault", "physicalStrategy", "rowLevelSecurity", "tenantKey", "thresholdDisposition"];
// biome-ignore format: the closed planning-state key set stays compact for the shard budget
const STATE_KEYS = ["gate", "mode", "validity"];
// biome-ignore format: the closed inventory boundary key set stays compact for the shard budget
const INVENTORY_KEYS = ["appliedByThisRecord", "bytes", "decisionStatus", "mutationAllowed", "physicalStrategy", "ref", "sha256", "tenantStrategyNonNull"];
// biome-ignore format: the closed mutation boundary key set stays compact for the shard budget
const BOUNDARY_KEYS = ["baseQueue", "closureAuthority", "effectiveAuthorityChain", "generatedNodes", "generator", "migrations", "platformCode", "registryDecisions", "runtime", "tenancyAuthorityInventory"];
// biome-ignore format: the exact GATE-01 tenancy disposition mirrored from the approval intake
const SELECTION = { physicalStrategy: STRATEGY, tenantKey: "tenant_id", rowLevelSecurity: "FORCE RLS", denyByDefault: true, thresholdDisposition: "not-applicable-fixed-topology", automaticPromotion: false };
// biome-ignore format: the planning-only, valid-but-blocked, no-go disposition state
const STATE = { mode: "PLANNING_ONLY", validity: "VALID_BLOCKED", gate: "NO_GO" };
// biome-ignore format: the promoted application summary for this selection record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, physicalStrategySelected: STRATEGY, runtimeIsolationImplementation: "deferred-no-code-start" };

// biome-ignore format: the audited tenancy-selection validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D10") errors.push("decisionId drift");
  // biome-ignore format: the exact planning-only artifact identity stays compact
  if (report.id !== "kernel-tenancy-physical-strategy-selection-2026-08-02" || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== STRATEGY) errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");

  // The record is planning-only, valid but blocked from application, and gated NO_GO.
  if (!same(report.dispositionState, STATE)) errors.push("disposition state drift");
  // The selected topology is exactly the approved GATE-01 disposition, with RLS never weakened.
  if (!same(report.selection, SELECTION)) errors.push("selection drift");
  if (report.selection?.denyByDefault !== true) errors.push("deny-by-default weakened");
  if (report.selection?.rowLevelSecurity !== "FORCE RLS") errors.push("mandatory rls weakened");
  // A fixed topology has no tenant-count threshold and never self-promotes to another strategy.
  if (report.selection?.automaticPromotion !== false) errors.push("automatic promotion drift");

  // A selected topology is not an enforced one: nothing is applied and no executor is a machine.
  if (!same(report.enforcementBoundary, ENFORCEMENT)) errors.push("enforcement boundary drift");
  // biome-ignore format: every applied-enforcement flag stays false whatever else the record says
  for (const key of ["runtimeEnforcement", "schemaApplied", "policyApplied", "migrationApplied"]) if (report.enforcementBoundary?.[key] !== false) errors.push(`enforcement ${key} applied`);

  // The tenancy authority inventory stays read-only evidence and keeps its unselected strategy.
  const inventory = report.inventoryBoundary ?? {};
  // biome-ignore format: the byte-pinned tenancy inventory identity stays compact
  if (inventory.ref !== INVENTORY || inventory.sha256 !== INVENTORY_SHA256 || inventory.bytes !== INVENTORY_BYTES || inventory.tenantStrategyNonNull !== TENANT_STRATEGY_NON_NULL) errors.push("inventory byte identity drift");
  // biome-ignore format: the inventory itself never selects a topology and stays pending
  if (inventory.physicalStrategy !== null || inventory.decisionStatus !== "pending") errors.push("inventory selection drift");
  if (inventory.mutationAllowed !== false || inventory.appliedByThisRecord !== false) errors.push("inventory application drift");

  for (const key of BOUNDARY_KEYS) if (report.mutationBoundary?.[key] !== false) errors.push(`mutationBoundary ${key} drift`);
  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D10 tenancy physical strategy disposition", () => {
  it("records the approved shared-schema selection as planning-only, valid-blocked and NO_GO", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `tenancy-physical-strategy-selection-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const inventory = readJson(INVENTORY);

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-tenancy-physical-strategy-selection-2026-08-02", generatedAt: "2026-08-02", decisionId: "KGA-D10", status: "approved-application-pending", gapClosed: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.selection).sort()).toEqual(SELECTION_KEYS);
    expect(Object.keys(report.dispositionState).sort()).toEqual(STATE_KEYS);
    expect(Object.keys(report.inventoryBoundary).sort()).toEqual(INVENTORY_KEYS);
    expect(Object.keys(report.enforcementBoundary).sort()).toEqual(ENFORCEMENT_KEYS);
    expect(Object.keys(report.mutationBoundary).sort()).toEqual(BOUNDARY_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "tenancy physical storage and isolation strategy", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: STRATEGY, approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN });
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
    expect(report.selection).toEqual(SELECTION);
    expect(report.dispositionState).toEqual(STATE);
    expect(report.enforcementBoundary).toEqual(ENFORCEMENT);
    expect(validate(report)).toEqual([]);
    // biome-ignore format: the record must say in prose that mandatory RLS deny-by-default survives
    expect(report.invariants.some((line: string) => line.includes("deny-by-default"))).toBe(true);
    // biome-ignore format: and that ADR-0026 is still not the tenancy authority
    expect(report.invariants.some((line: string) => line.includes("ADR-0026"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([INVENTORY, ADDENDUM, CLOSURE, CHAIN, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelTenancyPhysicalStrategyDisposition.test.ts",
    );

    // The tenancy authority inventory is untouched: same bytes, still pending and unselected.
    const inventoryBytes = fs.readFileSync(path.join(ROOT, INVENTORY));
    expect(inventoryBytes.byteLength).toBe(INVENTORY_BYTES);
    expect(createHash("sha256").update(inventoryBytes).digest("hex")).toBe(INVENTORY_SHA256);
    // biome-ignore format: the inventory keeps a null strategy, a null threshold and mandatory RLS
    expect(inventory).toMatchObject({ decisionId: "KGA-D10", status: "pending", tenancy: { physicalStrategy: null, threshold: null, mandatoryRls: true, acceptedInvariant: "PostgreSQL RLS deny-by-default" } });
    // ADR-0026 is a frontend tech-profile ADR and is still not the tenancy authority.
    // biome-ignore format: the invalid-authority binding stays exactly as the inventory recorded it
    expect(inventory.tenancy.invalidAuthority).toEqual({ id: "ADR-0026", actualScope: "frontend-tech-profiles", isTenancyAuthority: false });
    expect(exists(ADR)).toBe(true);
    // biome-ignore format: the classification inventory never selected a topology either
    expect(inventory.tenantStrategyInventory.totalNonNull).toBe(TENANT_STRATEGY_NON_NULL);
    // biome-ignore format: the addendum mirror keeps the pending, unselected physical strategy
    expect(readJson(ADDENDUM).structuralFindings.tenancyPhysicalStrategy).toMatchObject({ status: "pending-human-decision", physicalStrategy: null, adr0026IsTenancyAuthority: false });

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D10.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D10")).toMatchObject({ disposition: STRATEGY, tenantKey: "tenant_id", rowLevelSecurity: "FORCE RLS", denyByDefault: true, thresholdDisposition: "not-applicable-fixed-topology", automaticPromotion: false, applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D10; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((entry: { id: string }) => entry.id === "KGA-D10")).toMatchObject({ topic: "tenancy physical storage and isolation strategy", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D10");

    // Application state may promote D10 only inside this scope, and never past the global gate.
    // The ledger-wide summary is owned by tests/kernelGovernanceApplicationState.test.ts.
    const state = readJson(LEDGER);
    const row = state.rows.find((entry: { id: string }) => entry.id === "KGA-D10");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D10 row is legal only as this exact scoped, evidence-bound record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D10", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, REPORT] });
    // biome-ignore format: otherwise D10 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: selecting a topology never unlocks code, runtime, readiness, release or deploy
    // The gate tracks the effective-authority chain, so the three moving values are derived from
    // it rather than pinned to one epoch. Exactly two tuples are legal — pre-append and
    // post-append — and the polarity must match the head, so a mixed or invented state fails.
    const boundary = readJson(CHAIN).effectiveAuthorityBoundary;
    // biome-ignore format: the two legal boundary tuples stay compact for the shard budget
    expect([boundary.codeStartAllowed, boundary.runtimeCodeAllowed, boundary.verdict]).toEqual(boundary.verdict === "NO-GO" ? [false, false, "NO-GO"] : [true, true, "GO-KERNEL-DEVELOPMENT-ONLY"]);
    expect(boundary.verdict === "NO-GO").toBe(readJson(CHAIN).chainHeadSeq < 4);
    // The four floors this report owns stay literal; only the chain-tracked three derive.
    // biome-ignore format: the immovable gate floors stay compact for the shard budget
    expect(state.gate).toMatchObject({ gapClosed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, codeStartAllowed: boundary.codeStartAllowed, runtimeCodeAllowed: boundary.runtimeCodeAllowed, verdict: boundary.verdict });

    // biome-ignore format: the negative tenancy-selection matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D06"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-tenancy-physical-strategy-selection-2026-08-03"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "schema-per-tenant"; }, "selectedOption drift"],
      [(candidate) => { candidate.decision.approvalToken = "D10=HYBRID"; }, "approvalToken drift"],
      [(candidate) => { candidate.applicationSummary.physicalStrategySelected = "hybrid"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.runtimeIsolationImplementation = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "tenancy-runtime-isolation-record"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.dispositionState.mode = "RUNTIME_READY"; }, "disposition state drift"],
      [(candidate) => { candidate.dispositionState.validity = "VALID_UNBLOCKED"; }, "disposition state drift"],
      [(candidate) => { candidate.dispositionState.gate = "GO"; }, "disposition state drift"],
      [(candidate) => { candidate.selection.physicalStrategy = "hybrid"; }, "selection drift"],
      [(candidate) => { candidate.selection.tenantKey = "org_id"; }, "selection drift"],
      [(candidate) => { candidate.selection.rowLevelSecurity = "ENABLE RLS"; }, "mandatory rls weakened"],
      [(candidate) => { candidate.selection.denyByDefault = false; }, "deny-by-default weakened"],
      [(candidate) => { candidate.selection.thresholdDisposition = "promote-at-1000-tenants"; }, "selection drift"],
      [(candidate) => { candidate.selection.automaticPromotion = true; }, "automatic promotion drift"],
      [(candidate) => { candidate.enforcementBoundary.runtimeEnforcement = true; }, "enforcement runtimeEnforcement applied"],
      [(candidate) => { candidate.enforcementBoundary.schemaApplied = true; }, "enforcement schemaApplied applied"],
      [(candidate) => { candidate.enforcementBoundary.policyApplied = true; }, "enforcement policyApplied applied"],
      [(candidate) => { candidate.enforcementBoundary.migrationApplied = true; }, "enforcement migrationApplied applied"],
      [(candidate) => { candidate.enforcementBoundary.resolution = "applied-in-this-record"; }, "enforcement boundary drift"],
      [(candidate) => { candidate.enforcementBoundary.executor = "codex"; }, "enforcement boundary drift"],
      [(candidate) => { candidate.inventoryBoundary.sha256 = "drift"; }, "inventory byte identity drift"],
      [(candidate) => { candidate.inventoryBoundary.bytes = INVENTORY_BYTES + 1; }, "inventory byte identity drift"],
      [(candidate) => { candidate.inventoryBoundary.tenantStrategyNonNull = 0; }, "inventory byte identity drift"],
      [(candidate) => { candidate.inventoryBoundary.physicalStrategy = STRATEGY; }, "inventory selection drift"],
      [(candidate) => { candidate.inventoryBoundary.decisionStatus = "applied"; }, "inventory selection drift"],
      [(candidate) => { candidate.inventoryBoundary.mutationAllowed = true; }, "inventory application drift"],
      [(candidate) => { candidate.inventoryBoundary.appliedByThisRecord = true; }, "inventory application drift"],
      [(candidate) => { candidate.mutationBoundary.generatedNodes = true; }, "mutationBoundary generatedNodes drift"],
      [(candidate) => { candidate.mutationBoundary.generator = true; }, "mutationBoundary generator drift"],
      [(candidate) => { candidate.mutationBoundary.migrations = true; }, "mutationBoundary migrations drift"],
      [(candidate) => { candidate.mutationBoundary.tenancyAuthorityInventory = true; }, "mutationBoundary tenancyAuthorityInventory drift"],
      [(candidate) => { candidate.mutationBoundary.runtime = true; }, "mutationBoundary runtime drift"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.kernelReady = true; }, "authorityBoundary kernelReady drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); mutate(candidate); expect(validate(candidate)).toContain(error); }
  });
});
