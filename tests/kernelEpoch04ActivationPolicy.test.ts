import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
// This oracle reads the ledger but owns no KGA-Dxx row: it is the named, marker-declared consumer
// that kernelGovernanceApplicationState classifies; every other sibling owns exactly one id.
const APPLICATION_STATE_ROLE = "non-decision-consumer";
const ROOT = process.cwd();
const POLICY = "tools/lib/kernel-epoch04-activation-policy.mjs";
// The ledger path stays spelled out, not only behind the shared contract, so the sibling sweep
// still discovers this file; hiding it behind an import would exempt it from the leak detector.
const STATE = "reports/kernel-governance-application-state-2026-08-01.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shared pure JavaScript contract has no declaration file.
const policy = async (): Promise<any> => import(pathToFileURL(path.join(ROOT, POLICY)).href);
describe("EPOCH-04 kernel development activation policy", () => {
  it("fails closed until the activation record and its shared contract exist", async () => {
    // biome-ignore format: the primary missing-activation marker stays on one line
    const { KERNEL_MERGE, RECORD_REF } = await policy();
    expect(exists(POLICY), `epoch04-activation-contract-missing:${POLICY}`).toBe(true);
    // biome-ignore format: the exact missing-evidence marker stays on one line
    expect(exists(RECORD_REF), `epoch04-activation-evidence-missing:${KERNEL_MERGE}`).toBe(true);
  });
  it("activates kernel development only, over an immutable EPOCH-03 predecessor chain", async () => {
    const contract = await policy();
    // biome-ignore format: the shared contract surface stays compact for the shard budget
    const { validateEpoch04Activation, RECORD_REF, CHAIN_REF, CLOSURE_REF, REGISTRY_REF, STATE_REF, PACK_REF } = contract;
    // biome-ignore format: the closed key sets and pinned values stay compact for the shard budget
    const { ROOT_KEYS, ENTRY_KEYS, SCOPE_KEYS, EVIDENCE_KEYS, IMMUTABILITY_KEYS, APPEND_PREREQUISITE_KEYS } = contract;
    // biome-ignore format: the pinned predecessor and approval digests stay compact
    const { ACTIVATION_SCOPE, IMMOVABLE_FLOORS, EPOCH01_ENTRY_SHA256, EPOCH02_ENTRY_SHA256, EPOCH03_ENTRY_SHA256, APPROVAL_SHA256, APPROVAL_BYTES, EPOCH04, KERNEL_MERGE, EPOCH04_TOKEN_FLOOR, INHERITED_TOKENS, EPOCH04_TEXT_BYTES, EPOCH04_TEXT_SHA256 } = contract;
    // biome-ignore format: the canonical entry digest comes from the shipped chain validator
    const { entryDigest } = await import(pathToFileURL(path.join(ROOT, "tools/lib/kernel-effective-authority-chain.mjs")).href);
    const record = readJson(RECORD_REF);
    const chain = readJson(CHAIN_REF);
    // biome-ignore format: the exact activation identity and fail-closed root stay compact
    expect(record).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-epoch-04-activation-2026-08-02", generatedAt: "2026-08-02", decisionRef: EPOCH04, status: "approved-activation-pending-verification", gapClosed: false });
    expect(Object.keys(record).sort()).toEqual(ROOT_KEYS);
    expect(Object.keys(record.successorEntry).sort()).toEqual(ENTRY_KEYS);
    expect(Object.keys(record.activationScope).sort()).toEqual(SCOPE_KEYS);
    expect(Object.keys(record.evidence).sort()).toEqual(EVIDENCE_KEYS);
    expect(Object.keys(record.predecessorImmutability).sort()).toEqual(IMMUTABILITY_KEYS);
    expect(record.activationScope).toEqual(ACTIVATION_SCOPE);
    expect(validateEpoch04Activation(record)).toEqual([]);
    // biome-ignore format: the record must say in prose that runtime implementation has not started
    expect(record.invariants.some((line: string) => line.includes("runtime implementation"))).toBe(true);
    // biome-ignore format: and that the predecessor epochs stay byte-identical
    expect(record.invariants.some((line: string) => line.includes("EPOCH-03"))).toBe(true);
    expect(record.rollback.runtimeDataImpact).toBe("none");
    // Sealed-entry completeness is claimed; appendability is explicitly not, and each amendment a
    // biome-ignore format: the corrected append-readiness disclosure stays compact
    expect(record.chainBinding).toMatchObject({ sealedEntryFormComplete: true, appendableAsIs: false, appendExecutedHere: false });
    // biome-ignore format: the closed append-prerequisite key set stays compact
    expect(Object.keys(record.chainBinding.appendPrerequisites).sort()).toEqual(APPEND_PREREQUISITE_KEYS);
    // biome-ignore format: no prerequisite may be an empty placeholder
    expect(Object.values(record.chainBinding.appendPrerequisites).every((line) => typeof line === "string" && line.trim().length > 40)).toBe(true);
    // biome-ignore format: the overclaim correction is stated in prose, not only in a flag
    expect(record.invariants.some((line: string) => line.includes("not appendable as it stands"))).toBe(true);
    // The text is pinned token by token plus by length and digest; EXCLUDED_TARGETS is inherited.
    // biome-ignore format: every pinned token must actually appear in the sealed successor text
    for (const [token, value] of Object.entries(EPOCH04_TOKEN_FLOOR)) expect(record.successorEntry.normalizedText, token).toContain(`${token}=${value}`);
    // biome-ignore format: the pinned text length and digest are source constants, like EPOCH-03
    expect([INHERITED_TOKENS, record.successorEntry.normalizedTextBytes, record.successorEntry.normalizedTextSha256]).toEqual([["EXCLUDED_TARGETS"], EPOCH04_TEXT_BYTES, EPOCH04_TEXT_SHA256]);
    // biome-ignore format: an inherited token is pinned but never redeclared as superseded
    expect(record.successorEntry.supersedesDimensions).not.toContain("EXCLUDED_TARGETS");
    // A coherent rewrite that recomputes bytes and both digests is still rejected. The last three
    // probe the whole text: same-length prefix/status rewrite, free-text Codex-writer and MCP.
    // biome-ignore format: the coherent re-seal helper stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const reseal = (candidate: any) => { const e = candidate.successorEntry; e.normalizedTextBytes = Buffer.byteLength(e.normalizedText, "utf8"); e.normalizedTextSha256 = createHash("sha256").update(e.normalizedText, "utf8").digest("hex"); e.entrySha256 = entryDigest(e); };
    // biome-ignore format: the reachable token-floor negative matrix stays compact for the shard budget
    const swaps: Array<[string, string, string]> = [
      ["RUNTIME_IMPLEMENTATION_START=NO", "RUNTIME_IMPLEMENTATION_START=YES", "epoch04 token floor drift:RUNTIME_IMPLEMENTATION_START"],
      ["FORBIDDEN_INVOCATION=MCP_CLAUDE_IMPLEMENT", "FORBIDDEN_INVOCATION=NONE", "epoch04 token floor drift:FORBIDDEN_INVOCATION"],
      ["CLAUDE_INVOCATION=PANE_VISIBLE_AGENT_CLAUDE", "CLAUDE_INVOCATION=MCP_CLAUDE_IMPLEMENT", "epoch04 token floor drift:CLAUDE_INVOCATION"],
      [`KERNEL_MERGE=${KERNEL_MERGE}`, `KERNEL_MERGE=${"0".repeat(40)}`, "epoch04 token floor drift:KERNEL_MERGE"],
      ["RELEASE_ALLOWED=false", "RELEASE_ALLOWED=true", "epoch04 token floor drift:RELEASE_ALLOWED"],
      ["FORCE_GIT=false", "FORCE_GIT=true", "epoch04 token floor drift:FORCE_GIT"],
      ["EXCLUDED_TARGETS=SDK,APP_CORE,APP,MODULE", "EXCLUDED_TARGETS=SDK", "epoch04 token floor drift:EXCLUDED_TARGETS"],
      ["; EXCLUDED_TARGETS=SDK,APP_CORE,APP,MODULE", "", "epoch04 token floor drift:EXCLUDED_TARGETS"],
      ["VERDICT=GO-KERNEL-DEVELOPMENT-ONLY", "VERDICT=GO", "epoch04 token floor drift:VERDICT"],
      ["TAGGING=false", "TAGGING=false; INVENTED_TOKEN=YES", "epoch04 token floor orphan:INVENTED_TOKEN"],
      ["AUTHORITY-SUPERSESSION-04 EFFECTIVE", "AUTHORITY-SUPERSESSION-04 SUSPENDED", "successor text digest mismatch"],
      ["VERDICT=GO-KERNEL-DEVELOPMENT-ONLY", "VERDICT=GO-KERNEL-DEVELOPMENT-ONLY; CODEX WRITES REPOSITORY FILES DIRECTLY", "successor text bytes drift"],
      ["VERDICT=GO-KERNEL-DEVELOPMENT-ONLY", "VERDICT=GO-KERNEL-DEVELOPMENT-ONLY; MCP CLAUDE_IMPLEMENT PERMITTED FOR WRITES", "successor text digest mismatch"],
    ];
    // biome-ignore format: each swap is re-sealed so only the token floor can reject it
    for (const [from, to, error] of swaps) { const candidate = structuredClone(record); candidate.successorEntry.normalizedText = candidate.successorEntry.normalizedText.replace(from, to); reseal(candidate); expect(validateEpoch04Activation(candidate), error).toContain(error); }
    // A self-claimed entry digest, and an inherited token claimed as superseded, both fail closed.
    // biome-ignore format: the canonical entry-digest and inherited-token negatives stay compact
    expect(validateEpoch04Activation({ ...record, successorEntry: { ...record.successorEntry, entrySha256: "0".repeat(64) } })).toContain("successor entry digest drift");
    // biome-ignore format: EXCLUDED_TARGETS stays inherited, never redeclared as superseded
    expect(validateEpoch04Activation({ ...record, successorEntry: { ...record.successorEntry, supersedesDimensions: [...record.successorEntry.supersedesDimensions, "EXCLUDED_TARGETS"] } })).toContain("inherited token claimed superseded:EXCLUDED_TARGETS");
    // The record is historical pre-append evidence: it approved this successor while EPOCH-03 was
    // still the head. The successor has since been appended, so it IS the canonical head now — its
    // recorded link still names EPOCH-03 as its predecessor, which is what makes it a successor.
    expect(record.successorEntry.seq).toBe(chain.chainHeadSeq);
    expect(record.successorEntry.entrySha256).toBe(chain.chainHeadEntrySha256);
    expect(record.successorEntry.supersedes).toBe(chain.chainHeadSeq - 1);
    expect(record.successorEntry.previousEntrySha256).toBe(chain.entries.at(-2).entrySha256);
    // The appended head is byte-identical to the approved successor: nothing was altered on the way.
    expect(chain.entries.at(-1)).toEqual(record.successorEntry);
    // Predecessor entries in the live chain are untouched by this activation.
    // biome-ignore format: the append-only chain keeps EPOCH-01..03 exactly as recorded
    expect(chain.entries.slice(0, 3).map((entry: { seq: number; entrySha256: string }) => [entry.seq, entry.entrySha256])).toEqual([[1, EPOCH01_ENTRY_SHA256], [2, EPOCH02_ENTRY_SHA256], [3, EPOCH03_ENTRY_SHA256]]);
    expect(chain.appendOnly).toBe(true);
    // biome-ignore format: the historical invariant mirror stays compact
    expect(chain.historicalInvariant).toMatchObject({ sha256: APPROVAL_SHA256, bytes: APPROVAL_BYTES, mutation: "FORBIDDEN" });
    // The 691-byte GATE-01 selection is re-derived from its own source, never from the record.
    const selection = readJson(CLOSURE_REF).approval.normalizedSelection;
    expect(Buffer.byteLength(selection, "utf8")).toBe(APPROVAL_BYTES);
    expect(createHash("sha256").update(selection).digest("hex")).toBe(APPROVAL_SHA256);
    // Appended and in force: the live chain now heads at seq 4 with kernel development open.
    expect([chain.chainHeadSeq, chain.effectiveAuthorityBoundary.verdict]).toEqual([
      4,
      "GO-KERNEL-DEVELOPMENT-ONLY",
    ]);
    expect(chain.effectiveAuthorityBoundary.codeStartAllowed).toBe(true);
    // Still planning only: the record never claimed runtime start, and nothing downstream opened.
    expect(chain.effectiveAuthorityBoundary.releaseAllowed).toBe(false);
    expect(record.activationScope.runtimeImplementationStart).toBe("NO");
    // Floors that survive the activation are still the ones the chain recorded.
    // biome-ignore format: the surviving non-supersedable floors stay compact
    expect(chain.nonSupersedableFloors).toMatchObject(IMMOVABLE_FLOORS);
    // biome-ignore format: the per-invocation Claude account gate stays exact in the derived boundary
    expect(chain.effectiveAuthorityBoundary.claudeAuthGate).toMatchObject({ authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max", perInvocation: true, cachedEvidenceAllowed: false });
    expect(chain.effectiveAuthorityBoundary.platformProductWriter).toBe("human-developer-only");
    // The substrate is unchanged and still fully applied. The ledger-wide summary is owned by
    // kernelGovernanceApplicationState; this oracle asserts only that no row regressed.
    expect(STATE).toBe(STATE_REF);
    const state = readJson(STATE);
    // biome-ignore format: every decision row stays applied and canonical without a gap claim
    expect(state.rows.every((row: { applicationStatus: string; canonicalStatus: string; gapClosed: boolean }) => row.applicationStatus === "applied" && row.canonicalStatus === "canonical" && row.gapClosed === false)).toBe(true);
    expect(state.status).toBe("partial-application-no-go");
    // biome-ignore format: the registry stays discovery-only; activation is not decision closure
    expect(readJson(REGISTRY_REF).decisions.every((item: { status: string; selectedOption: null }) => item.status === "pending" && item.selectedOption === null)).toBe(true);
    expect(read(PACK_REF)).toContain("### KGA-D07");
    expect(APPLICATION_STATE_ROLE).toBe("non-decision-consumer");
  });
});
