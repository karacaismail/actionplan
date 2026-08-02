import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-adr-identity-quarantine-2026-08-02.json";
const COLLISIONS = "reports/kernel-adr-collision-source-bindings-2026-07-15.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const LEDGER = "reports/kernel-governance-application-state-2026-08-01.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const COLLISIONS_SHA256 = "5b88e6431b1d67b59e399b10162267d9bcb22226d2c8baceb83ee3991bddfbb0";
const COLLISIONS_BYTES = 3988;
const SCOPE = "adr-identity-quarantine-record";
const TOKEN = "D08=QUARANTINE_AMBIGUOUS_ADRS";
const QUARANTINED = "quarantined-ambiguous";
const RESOLUTION = "human-adr-identity-decision";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
type Expected = { topics: string[]; sourceBindingCount: number; consumerRefCount: number };
// biome-ignore format: the closed quarantine record root key set stays compact for the shard budget
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "collisionBoundary", "decision", "decisionId", "gapClosed", "generatedAt", "id", "invariants", "mutationBoundary", "nonGoals", "provenance", "quarantine", "rollback", "schemaVersion", "sourceRefs", "status"];
// biome-ignore format: the closed quarantine row key set stays compact for the shard budget
const ROW_KEYS = ["alias", "canonicalTopic", "consumerRefCount", "id", "machineConsumerUnblocked", "quarantineStatus", "resolution", "sourceBindingCount", "supersession", "topics"];
// biome-ignore format: the closed collision boundary key set stays compact for the shard budget
const COLLISION_KEYS = ["appliedByThisRecord", "bytes", "collisionCount", "collisionsStatus", "decisionStatus", "identityMutationAllowed", "mutationAllowed", "ref", "sha256"];
// biome-ignore format: the closed mutation boundary key set stays compact for the shard budget
const BOUNDARY_KEYS = ["adrCollisionLedger", "baseQueue", "closureAuthority", "edges", "effectiveAuthorityChain", "generatedNodes", "machineConsumerRules", "platformCode", "registryDecisions", "runtime"];
// biome-ignore format: the promoted application summary for this quarantine record stays compact
const APPLICATION_SUMMARY = { approved: 1, applied: 1, remaining: 0, applicationScope: SCOPE, ambiguousAdrIdentitiesQuarantined: 5, identityResolutionDisposition: "deferred-to-human-adr-identity-decision" };
// biome-ignore format: the exact identity-mutation floor mirrors the committed collision ledger
const IDENTITY_FLOOR = { renumber: false, alias: false, supersession: false };

// biome-ignore format: the audited quarantine validator stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON fixtures.
function validate(report: any, expected: Map<string, Expected>, order: string[]): string[] {
  const errors: string[] = [];
  if (report.decisionId !== "KGA-D08") errors.push("decisionId drift");
  // biome-ignore format: the exact planning-only artifact identity stays compact
  if (report.id !== "kernel-adr-identity-quarantine-2026-08-02" || report.status !== "approved-application-pending") errors.push("artifact identity drift");
  if (report.gapClosed !== false) errors.push("fail-closed root drift");
  if (report.decision?.selectedOption !== "quarantine-ambiguous-adrs") errors.push("selectedOption drift");
  if (report.decision?.approvalToken !== TOKEN) errors.push("approvalToken drift");
  if (!same(report.applicationSummary, APPLICATION_SUMMARY)) errors.push("applicationSummary drift");
  if (report.provenance?.approval?.normalizedSelectionSha256 !== SELECTION_SHA256) errors.push("provenance drift");

  // Exactly the five committed collisions, in the committed ledger order, all still ambiguous.
  const rows = Array.isArray(report.quarantine) ? report.quarantine : [];
  if (!same(rows.map((row: { id: string }) => row.id), order)) errors.push("quarantine set drift");
  for (const row of rows) {
    const source = expected.get(row.id);
    if (!source) { errors.push(`quarantine id unknown ${row.id}`); continue; }
    // Quarantine preserves ambiguity: it never selects a topic, alias or supersession.
    if (row.quarantineStatus !== QUARANTINED) errors.push(`quarantine status drift ${row.id}`);
    if (row.canonicalTopic !== null) errors.push(`canonical topic selected ${row.id}`);
    if (row.alias !== null) errors.push(`alias selected ${row.id}`);
    if (row.supersession !== null) errors.push(`supersession selected ${row.id}`);
    if (row.resolution !== RESOLUTION) errors.push(`resolution drift ${row.id}`);
    // A quarantined identity never opens its machine consumers.
    if (row.machineConsumerUnblocked !== false) errors.push(`consumer unblocked ${row.id}`);
    if (!same(row.topics, source.topics)) errors.push(`topics drift ${row.id}`);
    // biome-ignore format: the committed binding and consumer counts stay pinned per collision
    if (row.sourceBindingCount !== source.sourceBindingCount || row.consumerRefCount !== source.consumerRefCount) errors.push(`binding count drift ${row.id}`);
  }

  // The collision ledger is read-only evidence here; this record never applies or reshapes it.
  const boundary = report.collisionBoundary ?? {};
  // biome-ignore format: the byte-pinned collision ledger identity stays compact
  if (boundary.ref !== COLLISIONS || boundary.sha256 !== COLLISIONS_SHA256 || boundary.bytes !== COLLISIONS_BYTES || boundary.collisionCount !== 5) errors.push("collision byte identity drift");
  // biome-ignore format: the ledger stays ambiguous and pending under its own decision owner
  if (boundary.collisionsStatus !== "ambiguous" || boundary.decisionStatus !== "pending") errors.push("collision status drift");
  if (!same(boundary.identityMutationAllowed, IDENTITY_FLOOR)) errors.push("identity mutation drift");
  if (boundary.mutationAllowed !== false || boundary.appliedByThisRecord !== false) errors.push("collision application drift");

  for (const key of BOUNDARY_KEYS) if (report.mutationBoundary?.[key] !== false) errors.push(`mutationBoundary ${key} drift`);
  // biome-ignore format: the fail-closed authority floor stays compact for the shard budget
  for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "readinessAllowed", "releaseAllowed", "deployAllowed", "kernelReady", "sdkReady", "appBuildable"]) if (report.authorityBoundary?.[key] !== false) errors.push(`authorityBoundary ${key} drift`);
  if (report.authorityBoundary?.verdict !== "NO-GO") errors.push("verdict drift");
  return errors;
}

// biome-ignore format: the audited negative matrix stays compact for the shard budget
describe("KGA-D08 ADR identity quarantine", () => {
  it("quarantines the five ambiguous ADR identities without resolving, aliasing or unblocking them", () => {
    // biome-ignore format: the primary missing-record marker stays on one line
    expect(exists(REPORT), `adr-identity-quarantine-missing: ${REPORT}`).toBe(true);
    const report = readJson(REPORT);
    const chain = readJson(CHAIN);
    const collisions = readJson(COLLISIONS);
    const addendum = readJson(ADDENDUM);
    // The expected quarantine set is derived from committed evidence, never restated by hand.
    const order = collisions.collisions.map((entry: { id: string }) => entry.id);
    // biome-ignore format: the derived per-collision expectation stays compact for the shard budget
    const expected = new Map<string, Expected>(collisions.collisions.map((entry: { id: string; topics: string[]; sourceBindings: unknown[]; machineConsumerRefs: unknown[] }) => [entry.id, { topics: entry.topics, sourceBindingCount: entry.sourceBindings.length, consumerRefCount: entry.machineConsumerRefs.length }]));

    // biome-ignore format: the exact record identity and fail-closed root stay compact
    expect(report).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-adr-identity-quarantine-2026-08-02", generatedAt: "2026-08-02", decisionId: "KGA-D08", status: "approved-application-pending", gapClosed: false });
    expect(Object.keys(report).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(report.mutationBoundary).sort()).toEqual(BOUNDARY_KEYS);
    expect(Object.keys(report.collisionBoundary).sort()).toEqual(COLLISION_KEYS);
    // biome-ignore format: the exact approved-not-applied decision binding stays compact
    expect(report.decision).toMatchObject({ topic: "ADR identity, status and supersession authority", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "quarantine-ambiguous-adrs", approvalRef: `${CLOSURE}#/approval`, approvalToken: TOKEN });
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

    // Five collisions, five quarantines: nothing is renumbered, aliased, superseded or opened.
    expect(report.quarantine).toHaveLength(5);
    // biome-ignore format: every quarantine row stays key-closed so a silent canonical field cannot appear
    for (const row of report.quarantine) expect(Object.keys(row).sort()).toEqual(ROW_KEYS);
    expect(report.quarantine.map((row: { id: string }) => row.id)).toEqual(order);
    expect(validate(report, expected, order)).toEqual([]);
    // biome-ignore format: the record must say in prose that quarantine preserves ambiguity
    expect(report.invariants.some((line: string) => line.includes("ambiguous"))).toBe(true);
    // biome-ignore format: and that machine consumers stay closed behind the human ADR decision
    expect(report.invariants.some((line: string) => line.includes("machine consumer"))).toBe(true);
    // biome-ignore format: the required source evidence set stays compact for the shard budget
    expect(report.sourceRefs).toEqual(expect.arrayContaining([COLLISIONS, ADDENDUM, CLOSURE, CHAIN, PACK]));
    expect(report.rollback.runtimeDataImpact).toBe("none");
    expect(readJson("package.json").scripts["qa:kernel-governance"]).toContain(
      "tests/kernelAdrIdentityQuarantine.test.ts",
    );

    // The collision ledger is untouched: same bytes, same five ambiguous rows, still pending.
    const collisionBytes = fs.readFileSync(path.join(ROOT, COLLISIONS));
    expect(collisionBytes.byteLength).toBe(COLLISIONS_BYTES);
    expect(createHash("sha256").update(collisionBytes).digest("hex")).toBe(COLLISIONS_SHA256);
    // biome-ignore format: the ledger stays ambiguous, approval-free and identity-frozen
    expect(collisions).toMatchObject({ decisionId: "KGA-D08", collisionsStatus: "ambiguous", approvalRefAllowed: false, identityMutationAllowed: IDENTITY_FLOOR, decision: { status: "pending" } });
    expect(collisions.collisions).toHaveLength(5);
    // biome-ignore format: every committed collision keeps ambiguous status and an unselected topic
    for (const entry of collisions.collisions) { expect(entry.status).toBe("ambiguous"); expect(entry.canonicalTopic).toBeNull(); }
    // The addendum finding is the same five ambiguous identities; the two sources agree.
    // biome-ignore format: the addendum mirror stays the second independent evidence source
    expect(addendum.structuralFindings.adrCollisions.map((entry: { id: string; status: string }) => [entry.id, entry.status])).toEqual(order.map((id: string) => [id, "ambiguous"]));
    // biome-ignore format: every committed source binding and machine consumer ref still resolves
    for (const entry of collisions.collisions) for (const ref of [...entry.sourceBindings, ...entry.machineConsumerRefs]) expect(exists(ref.path)).toBe(true);

    // The immutable GATE-01 intake and the decision registry stay fail-closed for D08.
    const closure = readJson(CLOSURE);
    expect(closure.approval.normalizedSelection).toContain(TOKEN);
    // biome-ignore format: the intake row is discovered, never promoted in place
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D08")).toMatchObject({ disposition: "quarantine-ambiguous-adrs", applicationStatus: "pending", canonicalStatus: "pending" });
    // biome-ignore format: the registry discovers D08; it never selects or closes it
    expect(readJson(REGISTRY).decisions.find((entry: { id: string }) => entry.id === "KGA-D08")).toMatchObject({ topic: "ADR identity, status and supersession authority", status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(read(PACK)).toContain("### KGA-D08");

    // Application state may promote D08 only inside this scope, and never past the global gate.
    const state = readJson(LEDGER);
    const row = state.rows.find((entry: { id: string }) => entry.id === "KGA-D08");
    expect(row.gapClosed).toBe(false);
    // biome-ignore format: a promoted D08 row is legal only as this exact scoped, evidence-bound record
    if (row.applicationStatus === "applied") expect(row).toEqual({ id: "KGA-D08", applicationStatus: "applied", applicationScope: SCOPE, canonicalStatus: "canonical", gapClosed: false, evidenceRefs: [ADDENDUM, REPORT] });
    // biome-ignore format: otherwise D08 stays pending with no scope at all
    else expect(row).toMatchObject({ applicationStatus: "pending", applicationScope: null, canonicalStatus: "pending" });
    // biome-ignore format: partial application never unlocks code, runtime, readiness, release or deploy
    expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });

    // biome-ignore format: the negative quarantine matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any) => void, string]> = [
      [(candidate) => { candidate.decisionId = "KGA-D09"; }, "decisionId drift"],
      [(candidate) => { candidate.id = "kernel-adr-identity-quarantine-2026-08-03"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "applied"; }, "artifact identity drift"],
      [(candidate) => { candidate.gapClosed = true; }, "fail-closed root drift"],
      [(candidate) => { candidate.decision.selectedOption = "resolve-ambiguous-adrs"; }, "selectedOption drift"],
      [(candidate) => { candidate.decision.approvalToken = "D08=RESOLVE_ADRS"; }, "approvalToken drift"],
      [(candidate) => { candidate.applicationSummary.ambiguousAdrIdentitiesQuarantined = 4; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.identityResolutionDisposition = "applied"; }, "applicationSummary drift"],
      [(candidate) => { candidate.applicationSummary.applicationScope = "adr-identity-resolution-record"; }, "applicationSummary drift"],
      [(candidate) => { candidate.provenance.approval.normalizedSelectionSha256 = "0".repeat(64); }, "provenance drift"],
      [(candidate) => { candidate.quarantine.pop(); }, "quarantine set drift"],
      [(candidate) => { candidate.quarantine.reverse(); }, "quarantine set drift"],
      [(candidate) => { candidate.quarantine[0].quarantineStatus = "resolved"; }, "quarantine status drift ADR-E1"],
      [(candidate) => { candidate.quarantine[0].canonicalTopic = "evidence-seal"; }, "canonical topic selected ADR-E1"],
      [(candidate) => { candidate.quarantine[1].alias = "ADR-M2"; }, "alias selected ADR-M1"],
      [(candidate) => { candidate.quarantine[2].supersession = "ADR-S2"; }, "supersession selected ADR-S1"],
      [(candidate) => { candidate.quarantine[3].resolution = "auto-renumbered"; }, "resolution drift ADR-X1"],
      [(candidate) => { candidate.quarantine[3].machineConsumerUnblocked = true; }, "consumer unblocked ADR-X1"],
      [(candidate) => { candidate.quarantine[4].machineConsumerUnblocked = true; }, "consumer unblocked ADR-A5/ADR-0022"],
      [(candidate) => { candidate.quarantine[0].topics = ["evidence-seal"]; }, "topics drift ADR-E1"],
      [(candidate) => { candidate.quarantine[4].sourceBindingCount = 2; }, "binding count drift ADR-A5/ADR-0022"],
      [(candidate) => { candidate.quarantine[2].consumerRefCount = 1; }, "binding count drift ADR-S1"],
      [(candidate) => { candidate.collisionBoundary.sha256 = "drift"; }, "collision byte identity drift"],
      [(candidate) => { candidate.collisionBoundary.bytes = COLLISIONS_BYTES + 1; }, "collision byte identity drift"],
      [(candidate) => { candidate.collisionBoundary.collisionCount = 4; }, "collision byte identity drift"],
      [(candidate) => { candidate.collisionBoundary.collisionsStatus = "resolved"; }, "collision status drift"],
      [(candidate) => { candidate.collisionBoundary.decisionStatus = "applied"; }, "collision status drift"],
      [(candidate) => { candidate.collisionBoundary.identityMutationAllowed.renumber = true; }, "identity mutation drift"],
      [(candidate) => { candidate.collisionBoundary.identityMutationAllowed.alias = true; }, "identity mutation drift"],
      [(candidate) => { candidate.collisionBoundary.identityMutationAllowed.supersession = true; }, "identity mutation drift"],
      [(candidate) => { candidate.collisionBoundary.mutationAllowed = true; }, "collision application drift"],
      [(candidate) => { candidate.collisionBoundary.appliedByThisRecord = true; }, "collision application drift"],
      [(candidate) => { candidate.mutationBoundary.adrCollisionLedger = true; }, "mutationBoundary adrCollisionLedger drift"],
      [(candidate) => { candidate.mutationBoundary.machineConsumerRules = true; }, "mutationBoundary machineConsumerRules drift"],
      [(candidate) => { candidate.mutationBoundary.generatedNodes = true; }, "mutationBoundary generatedNodes drift"],
      [(candidate) => { candidate.mutationBoundary.runtime = true; }, "mutationBoundary runtime drift"],
      [(candidate) => { candidate.authorityBoundary.codeStartAllowed = true; }, "authorityBoundary codeStartAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.readinessAllowed = true; }, "authorityBoundary readinessAllowed drift"],
      [(candidate) => { candidate.authorityBoundary.kernelReady = true; }, "authorityBoundary kernelReady drift"],
      [(candidate) => { candidate.authorityBoundary.verdict = "GO"; }, "verdict drift"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(report); mutate(candidate); expect(validate(candidate, expected, order)).toContain(error); }
  });
});
