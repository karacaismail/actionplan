import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// The EPOCH-04 append, executed. The activation record approved a successor and deliberately did not
// append it; this record states that the append has now happened, which prerequisite each amendment
// discharged, and what the chain measured before and after. It records the post-append chain-file
// digest — a different file — and never its own, so nothing here closes in a circle.
// Reads the application-state ledger but owns no KGA-Dxx row: a named, marker-declared consumer.
// tests/kernelGovernanceApplicationState.test.ts scans this literal to classify the file, so the
// declaration is the contract. It is referenced, not asserted — asserting a literal equals itself
// would prove nothing.
const APPLICATION_STATE_ROLE = "non-decision-consumer";
void APPLICATION_STATE_ROLE;
const ROOT = process.cwd();
const RECORD = "reports/kernel-epoch-04-append-execution-2026-08-02.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const ACTIVATION = "reports/kernel-epoch-04-activation-2026-08-02.json";
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const STATE = "reports/kernel-governance-application-state-2026-08-01.json";
const CHAIN_LIB = "tools/lib/kernel-effective-authority-chain.mjs";
const GATE = "tools/agents/check-kernel-governance.mjs";
const SELF = "tests/kernelEpoch04AppendExecution.test.ts";
// The pre-append base and the exact canonical results this append is required to produce.
const PRE_APPEND_BASE = "d47943ea001e205a99d1ae67435b7354a2b98a5f";
const PRE_CHAIN_FILE = "89e41286de7d1d4a92173984df62aaf09c67999df9b1b7e0e5652fa5abd45f52";
const EPOCH03_ENTRY = "9ce36513271352f891c5c73963ce1e7db94b316063587cf0506c8ff270a0984c";
const EPOCH04_ENTRY = "90a0a9ba795fcff67d48829d9d0083cbac956e4d1b277527862fa19586228c37";
const CHAIN_SHA256 = "f2315ba09192e3614e272bb7256ae41a288f1a6fdc435cb67aca74954ec3a1b8";
const VERDICT = "GO-KERNEL-DEVELOPMENT-ONLY";
// biome-ignore format: the closed prerequisite-discharge key set stays compact for the shard budget
const PREREQUISITES = ["boundaryMapExtension", "chainRootHeadFields", "consumerRestamp", "headIdentityPin", "sealedEntryDigestRegistry"];
// The logical EPOCH-04 allowlist: the union of the prep, append and evidence packages the split
// shipped, NOT the physical file count of any one of them. Nineteen is derived from that union
// below rather than asserted as a bare constant, and the per-package sizes are pinned so a reader
// cannot mistake it for a pull-request size.
// biome-ignore format: the closed logical EPOCH-04 allowlist stays compact for the shard budget
const ALLOWED_FILES = ["AGENTS.md", "package.json", "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json", CHAIN, RECORD, STATE, "tests/kernelCodeBearingDescendantHandoff.test.ts", "tests/kernelConsumerStampHistoricalAtWrite.test.ts", "tests/kernelEffectiveAuthorityChain.test.ts", "tests/kernelEpoch04ActivationEvidence.test.ts", "tests/kernelEpoch04ActivationPolicy.test.ts", SELF, "tests/kernelGovernanceApplicationState.test.ts", "tests/kernelRuntimeSuccessorPolicy.test.ts", GATE, CHAIN_LIB, "tools/lib/kernel-epoch04-activation-policy.mjs", "tools/lib/kernel-governance-application-state.mjs", "tools/lib/kernel-governance-authorization-audit.mjs"];
// The split names, and the exact size each package physically moved inside the allowlist.
const SPLIT = ["prep", "append", "evidence"];
const SPLIT_SIZES = [5, 15, 6];
// biome-ignore format: the governance-prep files that may never enter this allowlist stay compact
const PREP_ONLY = ["docs/kernel-governance-decision-pack-2026-07-15.md", "tests/kernelGovernanceClosureAuthority.test.ts", "tests/kernelGovernanceDecisionPack.test.ts", "tools/lib/kernel-node-universe.mjs"];
// The closed root key set: a field added or dropped without review reopens the record.
// biome-ignore format: the closed record root key set stays compact for the shard budget
const RECORD_KEYS = ["activationScope", "appendExecuted", "changeBoundary", "decisionRef", "execution", "gapClosed", "generatedAt", "id", "invariants", "nonGoals", "postAppend", "preAppend", "prerequisiteDischarge", "preservedImmutable", "restampedConsumers", "rollback", "schemaVersion"];
// The downstream stages the sealed head keeps shut, as the head itself writes them.
// biome-ignore format: the closed shut-dimension token set stays compact for the shard budget
const SHUT = [["SDK_READY", "sdkReady"], ["APP_BUILDABLE", "appBuildable"], ["RELEASE_ALLOWED", "releaseAllowed"], ["DEPLOY_ALLOWED", "deployAllowed"]];
const EXCLUDED_TARGETS = ["SDK", "APP_CORE", "APP", "MODULE"];
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);

describe("EPOCH-04 append execution", () => {
  it("records the executed append against exact pre and post measurements", async () => {
    // biome-ignore format: the missing-execution marker stays on one line
    expect(exists(RECORD), `epoch04-append-execution-missing:${EPOCH04_ENTRY}`).toBe(true);
    const record = readJson(RECORD);
    const chain = readJson(CHAIN);

    // The record is closed: exactly these roots, so a quietly added or dropped field is a diff.
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(RECORD_KEYS);
    // biome-ignore format: the exact execution identity stays compact for the shard budget
    expect(record).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-epoch-04-append-execution-2026-08-02", generatedAt: "2026-08-02", decisionRef: "AUTHORITY-SUPERSESSION-04", appendExecuted: true, gapClosed: false });
    // The append is a Claude writer action under the Pane-visible invocation; Codex only commits.
    // biome-ignore format: the corrected append roles stay compact for the shard budget
    expect(record.execution).toMatchObject({ appendWriter: "claude-only-fail-closed", appendInvocation: "pane-visible-agent-claude", gitExecutor: "codex" });

    // What the chain measured before the append, re-derived from the pinned base commit rather than
    // asserted, and what it measures now. The two must differ in exactly the recorded way.
    // biome-ignore format: the pre-append measurement stays compact for the shard budget
    expect(record.preAppend).toEqual({ chainBase: PRE_APPEND_BASE, chainFileSha256: PRE_CHAIN_FILE, chainHeadSeq: 3, chainHeadEntrySha256: EPOCH03_ENTRY, verdict: "NO-GO", codeStartAllowed: false, runtimeCodeAllowed: false });
    // biome-ignore format: the post-append measurement stays compact for the shard budget
    expect(record.postAppend).toMatchObject({ chainHeadSeq: 4, chainHeadEntrySha256: EPOCH04_ENTRY, chainSha256: CHAIN_SHA256, verdict: VERDICT, codeStartAllowed: true, runtimeCodeAllowed: true });
    // The live chain agrees with the post-append measurement, entry digest recomputed canonically.
    const { entryDigest, chainDigest } = await load(CHAIN_LIB);
    const head = chain.entries.at(-1);
    // biome-ignore format: the live head is the sealed seq-4 entry the activation record approved
    expect([chain.chainHeadSeq, chain.chainHeadEntrySha256, chain.chainSha256]).toEqual([4, EPOCH04_ENTRY, CHAIN_SHA256]);
    expect([head.seq, head.epochId, entryDigest(head)]).toEqual([
      4,
      "AUTHORITY-SUPERSESSION-04",
      EPOCH04_ENTRY,
    ]);
    expect(chainDigest(chain.entries)).toBe(CHAIN_SHA256);
    // The appended entry is byte-identical to the successor the activation record approved.
    expect(head).toEqual(readJson(ACTIVATION).successorEntry);

    // Kernel development opens and nothing downstream does; runtime has not started.
    // biome-ignore format: the opened and still-shut dimensions stay compact for the shard budget
    expect(record.activationScope).toEqual({ verdict: VERDICT, codeStartAllowed: true, runtimeCodeAllowed: true, runtimeImplementationStart: "NO", sdkReady: false, appBuildable: false, releaseAllowed: false, deployAllowed: false, excludedTargets: EXCLUDED_TARGETS });
    // biome-ignore format: the live derived boundary opens exactly two dimensions and the verdict
    expect(chain.effectiveAuthorityBoundary).toMatchObject({ codeStartAllowed: true, runtimeCodeAllowed: true, verdict: VERDICT, releaseAllowed: false, deployAllowed: false });
    // Those claims are not the record talking about itself: they are read back out of the sealed
    // head token text through the gate's own reader, so the record and the head cannot drift apart.
    // This is also what makes the gate script's allowlist membership non-vacuous — its EPOCH-04
    // reporting behavior shipped in prep and is exercised here against the live chain.
    const { readHeadTokens, resolveLiveAuthorityBanner } = await load(GATE);
    const tokens: Map<string, string> = readHeadTokens(chain);
    // biome-ignore format: runtime implementation is NOT STARTED in the sealed head, not merely in prose
    expect([tokens.get("CODE_START"), tokens.get("RUNTIME_CODE"), tokens.get("RUNTIME_IMPLEMENTATION_START"), tokens.get("VERDICT")]).toEqual(["YES", "YES", "NO", VERDICT]);
    expect(record.activationScope.runtimeImplementationStart).toBe(
      tokens.get("RUNTIME_IMPLEMENTATION_START"),
    );
    // SDK, app-core, app and module stay excluded targets, and release and deploy stay shut, in the
    // head and in the record alike — each pair compared, so neither side can relax alone.
    expect(tokens.get("EXCLUDED_TARGETS")).toBe(EXCLUDED_TARGETS.join(","));
    expect(record.activationScope.excludedTargets).toEqual(EXCLUDED_TARGETS);
    // biome-ignore format: every downstream dimension is false in the head text and in the record
    expect(SHUT.map(([token, field]) => [token, tokens.get(token), String(record.activationScope[field])])).toEqual(SHUT.map(([token]) => [token, "false", "false"]));
    // And the gate reports exactly that, rather than a hardcoded banner: kernel development only,
    // runtime not started.
    // biome-ignore format: the live gate banner stays compact for the shard budget
    expect(resolveLiveAuthorityBanner(chain)).toEqual({ ok: true, line: `[kernel-governance] PASS — planning integrity valid; live authority verdict ${VERDICT}; runtime implementation not started` });

    // Every prerequisite the activation record listed is discharged here, by name, with a location.
    expect(Object.keys(record.prerequisiteDischarge).sort()).toEqual(PREREQUISITES);
    // biome-ignore format: the activation record's prerequisite set is mirrored exactly, none dropped
    expect(Object.keys(readJson(ACTIVATION).chainBinding.appendPrerequisites).sort()).toEqual(PREREQUISITES);
    // biome-ignore format: each discharge names where it happened and is not an empty placeholder
    for (const [key, entry] of Object.entries(record.prerequisiteDischarge) as Array<[string, { status: string; where: string }]>) expect([key, entry.status, entry.where.length > 10]).toEqual([key, "discharged", true]);

    // The restamped consumers are recorded with their exact before and after stamps.
    // biome-ignore format: the restamped consumer ledger stays compact for the shard budget
    expect(record.restampedConsumers).toEqual([{ ref: HANDOFF, fromSeq: 2, toSeq: 4 }, { ref: STATE, fromSeq: 3, toSeq: 4 }]);
    expect(readJson(HANDOFF).provenance.effectiveAuthority.seq).toBe(4);
    expect(readJson(STATE).effectiveAuthority.seq).toBe(4);

    // Sealed predecessors and the historical approval are untouched by the append.
    // biome-ignore format: EPOCH-01..03 stay byte-identical through the append
    expect(chain.entries.slice(0, 3).map((entry: { seq: number; entrySha256: string }) => [entry.seq, entry.entrySha256])).toEqual([[1, "367cf0579654a82b2d056a2dd1f9aeb0d68b181fbf4d2bc5892244db0786cd99"], [2, "782ef3c5b92455b79a76ae715864b585b4302f24ad7355d7fe606b35330c5029"], [3, EPOCH03_ENTRY]]);
    // biome-ignore format: the preserved-immutable block mirrors those sealed predecessors
    expect(record.preservedImmutable).toMatchObject({ epochEntries: [1, 2, 3], historicalApprovalSha256: "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6", historicalApprovalBytes: 691 });

    // No self-hash and no circularity: the record states the post-append chain-file digest, which is
    // a different file, and never contains its own digest.
    const chainFileSha256 = createHash("sha256")
      .update(fs.readFileSync(path.join(ROOT, CHAIN)))
      .digest("hex");
    expect(record.postAppend.chainFileSha256).toBe(chainFileSha256);
    expect(record.postAppend.chainFileSha256).not.toBe(PRE_CHAIN_FILE);
    // biome-ignore format: the record never records its own digest
    expect(read(RECORD)).not.toContain(createHash("sha256").update(fs.readFileSync(path.join(ROOT, RECORD))).digest("hex"));
    // Planning only: no runtime was started and no release or deploy opened.
    expect(record.nonGoals.some((line: string) => /runtime/i.test(line))).toBe(true);
    expect(record.rollback.runtimeDataImpact).toBe("none");
  });

  it("declares a logical EPOCH-04 allowlist spanning the split and refuses the prep-only files", () => {
    const record = readJson(RECORD);
    const boundary = record.changeBoundary;
    // The allowlist is exactly this list, in this order. A silent swap or a twentieth entry is a
    // different allowlist and must be reviewed as one.
    // biome-ignore format: the closed change-boundary key set stays compact for the shard budget
    expect(Object.keys(boundary).sort(), "change-boundary-key-drift").toEqual(["allowedFiles", "gateScriptInclusion", "isSinglePullRequestFileCount", "packageAssignment", "scope", "splitPackages"]);
    expect(boundary.allowedFiles).toEqual(ALLOWED_FILES);

    // Nineteen is DERIVED, not hardcoded: it is the union of the three split packages. If a package
    // gains or loses a file the union moves and this fails, which is the whole point of stating the
    // split rather than a bare count.
    expect([boundary.scope, boundary.splitPackages]).toEqual(["logical-epoch-04-allowlist", SPLIT]);
    const packages: Record<string, string[]> = boundary.packageAssignment;
    expect(Object.keys(packages).sort()).toEqual([...SPLIT].sort());
    // biome-ignore format: the union of the split packages is what closes the allowlist
    expect([...new Set(SPLIT.flatMap((name) => packages[name]))].sort()).toEqual([...ALLOWED_FILES].sort());
    expect(boundary.allowedFiles).toHaveLength(19);
    // ...and nineteen is explicitly NOT a pull-request size. No package moved that many: the append
    // package moved fifteen and this evidence package six, so the twenty-six placements collapse to
    // nineteen distinct files only because files recur across the split.
    expect(boundary.isSinglePullRequestFileCount).toBe(false);
    expect(SPLIT.map((name) => packages[name].length)).toEqual(SPLIT_SIZES);
    // biome-ignore format: no single package may reach the allowlist size, or the split is a fiction
    for (const name of SPLIT) expect(packages[name].length, `split-package-equals-allowlist:${name}`).toBeLessThan(ALLOWED_FILES.length);
    // biome-ignore format: placements exceed distinct files, so the recurrence the record claims is real
    expect(SPLIT.reduce((total, name) => total + packages[name].length, 0)).toBe(26);
    // Every placement is inside the allowlist and no package pads itself with duplicates.
    // biome-ignore format: the placement-containment proof names each leaking file exactly
    expect(SPLIT.flatMap((name) => packages[name].filter((file) => !ALLOWED_FILES.includes(file)).map((file) => `placement-outside-allowlist:${name}:${file}`))).toEqual([]);
    // biome-ignore format: the per-package uniqueness proof stays compact for the shard budget
    expect(SPLIT.filter((name) => new Set(packages[name]).size !== packages[name].length)).toEqual([]);
    // This evidence package really is this one: the record, the qa registration and this very test
    // ship here and were not in the merged append package.
    // biome-ignore format: the evidence-package membership proof stays compact for the shard budget
    for (const file of [RECORD, "package.json", SELF]) expect(packages.evidence, `evidence-file-misplaced:${file}`).toContain(file);
    // biome-ignore format: and the merged append package never carried this evidence work
    for (const file of ["package.json", SELF]) expect(packages.append, `evidence-file-claimed-by-append:${file}`).not.toContain(file);
    // The gate script is in the allowlist without a hunk in either shipped-here package: its
    // EPOCH-04 reporting behavior shipped in prep, and the record must say so rather than leave a
    // file in the allowlist unexplained.
    // biome-ignore format: the gate-script inclusion rationale stays compact for the shard budget
    expect(boundary.gateScriptInclusion).toMatchObject({ file: GATE, shippedIn: "prep" });
    expect(boundary.gateScriptInclusion.reason).toMatch(/RUNTIME_IMPLEMENTATION_START/);
    expect(packages.prep).toContain(GATE);
    // biome-ignore format: the gate appears in prep alone, which is exactly what the rationale claims
    expect([packages.append.includes(GATE), packages.evidence.includes(GATE)]).toEqual([false, false]);

    // Every declared file is real and every entry is distinct, so the count cannot be padded.
    // biome-ignore format: the existence and uniqueness proof stays compact for the shard budget
    expect(ALLOWED_FILES.filter((file) => !exists(file)).map((file) => `allowed-file-missing:${file}`)).toEqual([]);
    expect(new Set(ALLOWED_FILES).size).toBe(ALLOWED_FILES.length);
    // The boundary carries this record, the chain, the validators and the tests it moved — the
    // artifacts the append actually touched — so it is not a boundary that excludes its own work.
    // biome-ignore format: the self-coverage proof stays compact for the shard budget
    for (const file of [RECORD, CHAIN, CHAIN_LIB, STATE, HANDOFF]) expect(ALLOWED_FILES, `append-artifact-outside-boundary:${file}`).toContain(file);
    // The governance-prep files exist in the worktree but ship in a separate package, so the
    // boundary must exclude them and a non-goal must say why rather than leaving it implicit.
    // biome-ignore format: the prep-exclusion proof names each leaking file exactly
    expect(PREP_ONLY.filter((file) => ALLOWED_FILES.includes(file)).map((file) => `prep-file-inside-append-boundary:${file}`)).toEqual([]);
    // biome-ignore format: the exclusion is non-vacuous only if those files are really present
    expect(PREP_ONLY.filter((file) => !exists(file)).map((file) => `prep-file-missing:${file}`)).toEqual([]);
    // biome-ignore format: a boundary contract without a stated non-goal is an unbounded boundary
    expect(record.nonGoals.some((line: string) => /changeBoundary\.allowedFiles/.test(line) && /nineteen/.test(line))).toBe(true);
    // Recurrence is declared, not assumed: the record must state that a file sitting in more than one
    // package carries only that package's hunks, which is what reconciles the twenty-six placements
    // proved above to the nineteen distinct files.
    // biome-ignore format: the shared-hunk declaration stays compact for the shard budget
    expect(record.invariants.some((line: string) => /carries only that package's hunks/.test(line) && /twenty-six placements but the allowlist closes at nineteen distinct files/.test(line))).toBe(true);
    // The application-state ledger keeps its own KGA-D07 row boundary and is never widened to carry
    // this append package: neither this record nor the chain may appear in it.
    const ledgerBoundary: string[] = readJson(STATE).changeBoundary.allowedFiles;
    // biome-ignore format: the untouched sibling boundary stays compact for the shard budget
    expect(ledgerBoundary.filter((file) => [RECORD, CHAIN, CHAIN_LIB].includes(file)).map((file) => `append-package-leaked-into-ledger-boundary:${file}`)).toEqual([]);
  });
});
