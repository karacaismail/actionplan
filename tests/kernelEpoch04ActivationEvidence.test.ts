import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// The adversarial and external-evidence half of the EPOCH-04 activation contract. It judges the
// record with exactly the shared validator the approval-record oracle uses, so no mutation can pass
// one and fail the other, and it re-reads the bound Kernel merge object rather than trusting a pin.
const ROOT = process.cwd();
const POLICY = "tools/lib/kernel-epoch04-activation-policy.mjs";
const CHAIN_LIB = "tools/lib/kernel-effective-authority-chain.mjs";
const SELF = "tests/kernelEpoch04ActivationEvidence.test.ts";
const AUDIT_LIB = "tools/lib/kernel-governance-authorization-audit.mjs";
// The merged PR-2 facts this evidence oracle is pinned to. Stale values here would silently
// assert a superseded successor, so they are named once and re-derived from the record below.
const TEXT_BYTES = 898;
const TEXT_SHA256 = "f7b92d21da22dccf0ca99e0efbebc5e9f0556ba5b2a96657737e057848c2953d";
const ENTRY_SHA256 = "90a0a9ba795fcff67d48829d9d0083cbac956e4d1b277527862fa19586228c37";
const EXCLUDED_TARGETS = "EXCLUDED_TARGETS=SDK,APP_CORE,APP,MODULE";
// KERNEL_EVIDENCE_MODE declares which proof this environment can supply. It never selects, names
// or redirects a repository path: resolution stays the fixed candidate list below, and the mode
// only says what the declarer claims is reachable. Declaring pins-only where the Kernel merge IS
// reachable fails, so the weaker mode can never be used to dodge the external proof; and pins-only
// still runs every local pin, mirror, dual-digest and naive-append assertion before it may pass.
const MODE_FULL = "full";
const MODE_PINS = "pins-only";
// biome-ignore format: the closed evidence-mode truth table stays compact for the shard budget
const decideEvidence = (mode: string, reachable: boolean): { ok: boolean; proof?: "full" | "pins"; error?: string } => {
  if (mode !== MODE_FULL && mode !== MODE_PINS) return { ok: false, error: `kernel-evidence-mode-unknown:${mode}` };
  if (mode === MODE_FULL) return reachable ? { ok: true, proof: "full" } : { ok: false, error: "kernel-merge-object-unreachable" };
  return reachable ? { ok: false, error: "kernel-evidence-mode-misdeclared" } : { ok: true, proof: "pins" };
};
// Unset means full: a developer machine with the Kernel checkout must always supply the real proof.
const MODE = process.env.KERNEL_EVIDENCE_MODE ?? MODE_FULL;
// The candidate list is fixed repository layout and is never derived from the mode or any other
// environment value. The probe is injected so a test can simulate an unreachable Kernel without
// touching the filesystem, and the resolver itself stays identical in both cases.
// biome-ignore format: the deterministic, environment-independent kernel object-store candidates
const CANDIDATES = [path.resolve(ROOT, "../../../metaframer-kernel"), path.resolve(ROOT, "../../metaframer-kernel")];
const resolveKernelRepo = (probe: (repo: string) => boolean) => CANDIDATES.find(probe);
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
// biome-ignore lint/suspicious/noExplicitAny: the shared pure JavaScript contracts have no declaration files.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);

describe("EPOCH-04 activation adversarial and external evidence", () => {
  it("rejects every drifted activation record", async () => {
    // biome-ignore format: the shared contract surface stays compact for the shard budget
    const { validateEpoch04Activation, RECORD_REF, CHAIN_REF, EPOCH02_ENTRY_SHA256, EPOCH03_TEXT_SHA256, FORBIDDEN_INVOCATION, VERDICT } = await load(POLICY);
    const record = readJson(RECORD_REF);
    // An unwired adversarial oracle proves nothing in CI: the parent gate and the audit mirror
    // must both name this file by path, or this fails closed on its own structural marker.
    const gate = readJson("package.json").scripts["qa:kernel-governance"] as string;
    expect(gate.includes(SELF), `epoch04-evidence-gate-missing:${SELF}`).toBe(true);
    expect(read(AUDIT_LIB).includes(gate), `epoch04-evidence-gate-missing:${AUDIT_LIB}`).toBe(true);
    // The merged PR-2 successor facts, pinned explicitly and re-derived from the record itself.
    // biome-ignore format: the merged successor fact pins stay compact for the shard budget
    expect([record.successorEntry.normalizedTextBytes, record.successorEntry.normalizedTextSha256, record.successorEntry.entrySha256]).toEqual([TEXT_BYTES, TEXT_SHA256, ENTRY_SHA256]);
    expect(record.successorEntry.normalizedText).toContain(EXCLUDED_TARGETS);
    expect(Buffer.byteLength(record.successorEntry.normalizedText, "utf8")).toBe(TEXT_BYTES);
    // EXCLUDED_TARGETS is inherited from EPOCH-03, never redeclared as a superseded dimension.
    expect(record.successorEntry.supersedesDimensions).toEqual([
      "codeStart",
      "runtimeCode",
      "verdict",
    ]);
    expect(validateEpoch04Activation(record)).toEqual([]);

    // biome-ignore format: the audited negative matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: Array<[(candidate: any) => void, string]> = [
      [(candidate) => { candidate.id = "kernel-epoch-04-activation-2026-08-03"; }, "artifact identity drift"],
      [(candidate) => { candidate.status = "active"; }, "artifact identity drift"],
      [(candidate) => { candidate.decisionRef = "AUTHORITY-SUPERSESSION-03"; }, "epoch id drift"],
      [(candidate) => { candidate.gapClosed = true; }, "gap closure claim"],
      [(candidate) => { candidate.evidence.kernelMergeSha = "0".repeat(40); }, "kernel merge drift"],
      [(candidate) => { candidate.evidence.readinessArtifactSha256 = "0".repeat(64); }, "readiness digest drift"],
      [(candidate) => { candidate.evidence.readinessArtifactPath = "planning/other.json"; }, "readiness path drift"],
      [(candidate) => { candidate.evidence.kernelRepository = "platform"; }, "kernel repository drift"],
      [(candidate) => { candidate.successorEntry.seq = 5; }, "successor sequence drift"],
      [(candidate) => { candidate.successorEntry.supersedes = 2; }, "successor sequence drift"],
      [(candidate) => { candidate.successorEntry.status = "pending"; }, "successor identity drift"],
      [(candidate) => { candidate.successorEntry.previousEntrySha256 = EPOCH02_ENTRY_SHA256; }, "predecessor chain link drift"],
      [(candidate) => { candidate.successorEntry.normalizedTextSha256 = EPOCH03_TEXT_SHA256; }, "successor reuses the EPOCH-03 text digest"],
      [(candidate) => { candidate.activationScope.runtimeImplementationStart = "YES"; }, "runtime implementation start opened"],
      [(candidate) => { candidate.activationScope.sdkReady = true; }, "downstream sdkReady opened"],
      [(candidate) => { candidate.activationScope.appBuildable = true; }, "downstream appBuildable opened"],
      [(candidate) => { candidate.activationScope.releaseAllowed = true; }, "downstream releaseAllowed opened"],
      [(candidate) => { candidate.activationScope.deployAllowed = true; }, "downstream deployAllowed opened"],
      [(candidate) => { candidate.activationScope.codeStartAllowed = false; }, "activation scope drift"],
      [(candidate) => { candidate.activationScope.verdict = "GO"; }, "activation scope drift"],
      [(candidate) => { candidate.authorityBoundary.invocation = FORBIDDEN_INVOCATION; }, "invocation drift"],
      [(candidate) => { candidate.authorityBoundary.invocationForbidden = []; }, "forbidden invocation missing"],
      [(candidate) => { candidate.authorityBoundary.kernelWriter = "codex"; }, "writer role drift"],
      [(candidate) => { candidate.authorityBoundary.platformProductWriter = "claude"; }, "platform product writer drift"],
      [(candidate) => { candidate.authorityBoundary.gitExecutor = "claude"; }, "git executor drift"],
      [(candidate) => { candidate.authorityBoundary.failClosed = false; }, "fail-closed flag drift"],
      [(candidate) => { candidate.authorityBoundary.claudeAuthGate.apiProvider = "bedrock"; }, "claude auth gate drift"],
      [(candidate) => { candidate.authorityBoundary.claudeAuthGate.cachedEvidenceAllowed = true; }, "claude auth gate weakened"],
      [(candidate) => { candidate.predecessorImmutability.mutationAllowed = true; }, "predecessor mutation allowed"],
      [(candidate) => { candidate.predecessorImmutability.historicalApprovalSha256 = "0".repeat(64); }, "historical approval drift"],
      [(candidate) => { candidate.predecessorImmutability.entries[2].entrySha256 = "0".repeat(64); }, "predecessor entry 3 hash drift"],
      [(candidate) => { candidate.predecessorImmutability.entries.pop(); }, "predecessor entry set drift"],
      [(candidate) => { candidate.chainBinding.immovableFloors.deploy = "YES"; }, "immovable floor deploy drift"],
      [(candidate) => { candidate.chainBinding.immovableFloors.platformProductWriter = "claude"; }, "immovable floor platformProductWriter drift"],
      [(candidate) => { candidate.chainBinding.immovableFloors.historicalApprovalMutation = "ALLOWED"; }, "immovable floor historicalApprovalMutation drift"],
      [(candidate) => { candidate.chainBinding.supersededFloors = ["codeStart", "runtimeCode", "verdict", "deploy"]; }, "superseded floor set drift"],
      [(candidate) => { candidate.chainBinding.supersessionAuthority = "inferred"; }, "supersession authority drift"],
      [(candidate) => { candidate.chainBinding.chainHeadSeqAfterActivation = 3; }, "chain head projection drift"],
      [(candidate) => { candidate.successorEntry.sourceType = "inferred"; }, "successor source type drift"],
      [(candidate) => { candidate.successorEntry.sourceRef = CHAIN_REF; }, "successor source ref fabricated"],
      [(candidate) => { candidate.successorEntry.supersedesDimensions = ["codeStart"]; }, "successor superseded dimension drift"],
      [(candidate) => { candidate.successorEntry.supersedesDimensions.push("release"); }, "successor superseded dimension drift"],
      [(candidate) => { candidate.successorEntry.supersessionScope = "KERNEL_RUNTIME_APPROVED_SHARDS_ONLY"; }, "successor scope drift"],
      [(candidate) => { candidate.successorEntry.normalizedTextBytes = TEXT_BYTES - 1; }, "successor text bytes drift"],
      [(candidate) => { candidate.successorEntry.normalizedText += "."; }, "successor text bytes drift"],
      [(candidate) => { candidate.successorEntry.normalizedTextSha256 = "0".repeat(64); }, "successor text digest mismatch"],
      [(candidate) => { candidate.successorEntry.dimensions.codeStart.value = "NO"; }, "successor dimension token drift:codeStart"],
      [(candidate) => { candidate.successorEntry.dimensions.verdict.token = "OUTCOME"; }, "successor dimension token drift:verdict"],
      [(candidate) => { candidate.successorEntry.supersedesDimensions = ["codeStart", "runtimeCode", "verdict", "release"]; Reflect.deleteProperty(candidate.successorEntry.dimensions, "verdict"); }, "successor superseded dimension drift"],
      [(candidate) => { candidate.successorEntry.dimensions.release = { token: "RELEASE_ALLOWED", value: "false" }; }, "successor dimension supersession missing:release"],
      [(candidate) => { candidate.chainBinding.normalizedText = candidate.successorEntry.normalizedText; }, "duplicate normalized text"],
      [(candidate) => { candidate.successorEntry.normalizedText = candidate.successorEntry.normalizedText.replace(`; ${EXCLUDED_TARGETS}`, ""); }, "successor text bytes drift"],
      [(candidate) => { candidate.chainBinding.appendWriter = "codex"; }, "append writer drift"],
      [(candidate) => { candidate.chainBinding.appendInvocation = FORBIDDEN_INVOCATION; }, "append invocation drift"],
      [(candidate) => { candidate.chainBinding.appendGitExecutor = "claude"; }, "append git executor drift"],
      [(candidate) => { candidate.chainBinding.appendExecutor = "codex"; }, "codex named as append executor"],
      [(candidate) => { candidate.chainBinding.note = "Appending is the Codex Git-executor step."; }, "codex named as file writer"],
      [(candidate) => { candidate.invariants.push("Codex executes the append and re-stamps consumers."); }, "codex named as file writer"],
      [(candidate) => { candidate.chainBinding.appendableAsIs = true; }, "append readiness overclaim"],
      [(candidate) => { Reflect.deleteProperty(candidate.chainBinding, "appendableAsIs"); }, "append readiness overclaim"],
      [(candidate) => { candidate.chainBinding.sealedEntryFormComplete = false; }, "sealed entry form claim missing"],
      [(candidate) => { Reflect.deleteProperty(candidate.chainBinding.appendPrerequisites, "boundaryMapExtension"); }, "append prerequisite set drift"],
      [(candidate) => { candidate.chainBinding.appendPrerequisites.extraAmendment = "x"; }, "append prerequisite set drift"],
      [(candidate) => { candidate.chainBinding.appendPrerequisites.headIdentityPin = "  "; }, "append prerequisite unstated:headIdentityPin"],
      [(candidate) => { candidate.chainBinding.predecessorChainFileSha256 = "0".repeat(64); }, "predecessor chain file digest drift"],
      [(candidate) => { candidate.chainBinding.predecessorChainFileSource = "actionplan@0000000"; }, "predecessor chain file source drift"],
      [(candidate) => { candidate.chainBinding.predecessorChainFilePinnedBy = "metaframer-kernel@0000000"; }, "predecessor chain file pin provenance drift"],
      [(candidate) => { candidate.chainBinding.projectedChainFileSha256 = "not-a-digest"; }, "projected chain file digest malformed"],
      [(candidate) => { candidate.chainBinding.projectedChainFileSha256 = candidate.chainBinding.predecessorChainFileSha256; }, "projected chain file digest conflated with predecessor"],
      [(candidate) => { candidate.evidence.readinessAssertions.readinessStatus = "READY"; }, "readiness assertion drift:readinessStatus"],
      [(candidate) => { candidate.evidence.readinessAssertions.verdict = VERDICT; }, "readiness assertion drift:verdict"],
      [(candidate) => { candidate.evidence.readinessAssertions.codeStartAllowed = true; }, "readiness assertion drift:codeStartAllowed"],
      [(candidate) => { candidate.evidence.readinessAssertions.runtimeStarted = true; }, "readiness assertion drift:runtimeStarted"],
      [(candidate) => { candidate.evidence.readinessAssertions.candidateEffective = true; }, "readiness assertion drift:candidateEffective"],
      [(candidate) => { candidate.evidence.readinessAssertions.promotionCurrentStep = 2; }, "readiness assertion drift:promotionCurrentStep"],
      [(candidate) => { candidate.evidence.readinessAssertions.promotionStep2RecordedIn = "Kernel candidate"; }, "readiness assertion drift:promotionStep2RecordedIn"],
      [(candidate) => { candidate.evidence.readinessAssertions.promotionCircularityAvoided = false; }, "readiness assertion drift:promotionCircularityAvoided"],
      [(candidate) => { candidate.evidence.readinessAssertions.promotionSelfHashRecorded = true; }, "readiness assertion drift:promotionSelfHashRecorded"],
    ];
    // biome-ignore format: the negative matrix driver stays compact for the shard budget
    for (const [mutate, error] of cases) { const candidate = structuredClone(record); mutate(candidate); expect(validateEpoch04Activation(candidate)).toContain(error); }
  });

  it("re-reads the bound Kernel candidate and both chain-file digests from canonical objects", async () => {
    // biome-ignore format: the shared contract surface stays compact for the shard budget
    const { RECORD_REF, CHAIN_REF, KERNEL_MERGE, READINESS_PATH, READINESS_SHA256, PREDECESSOR_CHAIN_SHA256, PREDECESSOR_CHAIN_BASE, PRE_APPEND_CHAIN_BASE } = await load(POLICY);
    const record = readJson(RECORD_REF);
    // Identity is repository+commit+digest. The object store is located only by fixed repository
    // layout — never by an environment variable — so nothing outside the repo can redirect the read,
    // and the object found must still hash to the pinned artifact digest below.
    // biome-ignore format: the scrubbed, replacement-free git environment stays compact
    const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_") && key !== "METAFRAMER_KERNEL_REPO")), GIT_NO_REPLACE_OBJECTS: "1", GIT_TERMINAL_PROMPT: "0" };
    // biome-ignore format: the fixed-argument, shell-free git object read stays compact
    const git = (repo: string, args: string[]) => execFileSync("git", ["--no-replace-objects", "-C", repo, ...args], { env, encoding: "buffer", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
    // biome-ignore format: the first candidate actually holding the bound merge object wins
    // biome-ignore format: the live reachability probe is injectable so a test can simulate absence
    const liveProbe = (repo: string) => { try { git(repo, ["rev-parse", "--verify", `${KERNEL_MERGE}^{commit}`]); return true; } catch { return false; } };
    const kernelRepo = resolveKernelRepo(liveProbe);
    // The predecessor chain-file digest is re-derived from the base commit the candidate pinned; the
    // projected one is measured from the live file. They must differ, and neither file may record
    // its own current digest, so no disclosure here can close in a circle.
    const predecessorSha256 = createHash("sha256")
      .update(git(ROOT, ["show", `${PREDECESSOR_CHAIN_BASE}:${CHAIN_REF}`]))
      .digest("hex");
    // The record's projected digest is historical from the EPOCH-04 append onwards: the live chain
    // file has moved, so it is re-derived from the pre-append base rather than the working tree.
    // biome-ignore format: the historical projected digest is re-derived from the pinned base
    const projectedSha256 = createHash("sha256").update(git(ROOT, ["show", `${PRE_APPEND_CHAIN_BASE}:${CHAIN_REF}`])).digest("hex");
    // The live chain file is now a third, different digest, which is what the append produced.
    const liveSha256 = createHash("sha256")
      .update(fs.readFileSync(path.join(ROOT, CHAIN_REF)))
      .digest("hex");
    expect(liveSha256).not.toBe(projectedSha256);
    expect(predecessorSha256).toBe(PREDECESSOR_CHAIN_SHA256);
    // biome-ignore format: both disclosed digests are the measured ones, and they are not the same
    expect([record.chainBinding.predecessorChainFileSha256, record.chainBinding.projectedChainFileSha256, readJson(CHAIN_REF).supersessionProjection.predecessorChainFileSha256]).toEqual([predecessorSha256, projectedSha256, predecessorSha256]);
    expect(projectedSha256).not.toBe(predecessorSha256);
    expect(read(CHAIN_REF)).not.toContain(liveSha256);
    // biome-ignore format: the record never records its own current digest either
    expect(read(RECORD_REF)).not.toContain(createHash("sha256").update(fs.readFileSync(path.join(ROOT, RECORD_REF))).digest("hex"));

    // Sealed-entry completeness: the digest is the canonical one the shipped chain validator
    // computes, and the key set is exactly the sealed-entry surface the live head already uses.
    const { entryDigest, validateKernelEffectiveAuthorityChain } = await load(CHAIN_LIB);
    expect(record.successorEntry.entrySha256).toBe(entryDigest(record.successorEntry));
    // biome-ignore format: the sealed-entry surface matches the live head exactly
    expect(Object.keys(record.successorEntry).sort()).toEqual(Object.keys(readJson(CHAIN_REF).entries.at(-1)).sort());

    // The entry is appended and in force, so the forward-looking proof becomes a replay proof: a
    // naive re-append of the same sealed entry is rejected whether or not the head is moved with it.
    const closure = readJson("reports/kernel-governance-closure-authority-2026-07-31.json");
    // biome-ignore format: a duplicate append, with and without moving the head, stays compact
    const naiveAppend = (moveHead: boolean) => { const naive = readJson(CHAIN_REF); naive.entries.push(structuredClone(record.successorEntry)); if (moveHead) { naive.chainHeadSeq = 5; naive.chainHeadEntrySha256 = record.successorEntry.entrySha256; } return validateKernelEffectiveAuthorityChain({ chain: naive, closure }); };
    const keptHead = naiveAppend(false);
    // biome-ignore format: the unmoved head is rejected on duplicate sequence, link and chain digest
    for (const error of ["effective-epoch-not-head", "duplicate-epoch-seq:4", "broken-previous-link:4", "chain-digest-drift"]) expect(keptHead, "naive-append-kept-head").toContain(error);
    const movedHead = naiveAppend(true);
    // biome-ignore format: moving the head onto the duplicate additionally fails the root head fields
    for (const error of ["duplicate-epoch-seq:4", "epoch-supersession-fork:4", "chain-head-seq-drift", "chain-head-digest-drift"]) expect(movedHead, "naive-append-moved-head").toContain(error);
    // The appended head itself validates cleanly, so the rejections above are about the replay only.
    expect(validateKernelEffectiveAuthorityChain({ chain: readJson(CHAIN_REF), closure })).toEqual(
      [],
    );
    // The live chain is untouched by the replay probe: still seq 4, and this record still
    // performed no append itself.
    // biome-ignore format: the appended seq-4 live head stays exactly where this shard found it
    expect([readJson(CHAIN_REF).chainHeadSeq, readJson(CHAIN_REF).effectiveAuthorityBoundary.verdict, record.chainBinding.appendExecutedHere]).toEqual([4, "GO-KERNEL-DEVELOPMENT-ONLY", false]);

    // Only now, after every local proof above has run, may the declared mode be consulted. This
    // ordering is the contract: pins-only can never skip a local assertion, only the external read.
    const decision = decideEvidence(MODE, kernelRepo !== undefined);
    expect(decision.ok, decision.error ?? `kernel-evidence-mode:${MODE}`).toBe(true);
    // This oracle only reads and hashes the private artifact; it never copies or snapshots it.
    // The pattern is assembled at runtime so this assertion cannot match its own source text.
    // biome-ignore format: the no-snapshot guard stays compact for the shard budget
    expect(read(SELF)).not.toMatch(new RegExp(["write", "append", "copy"].map((verb) => `${verb}File`).join("|")));
    if (decision.proof !== "full") return;

    const artifact = git(kernelRepo as string, ["show", `${KERNEL_MERGE}:${READINESS_PATH}`]);
    expect(createHash("sha256").update(artifact).digest("hex")).toBe(READINESS_SHA256);
    const readiness = JSON.parse(artifact.toString("utf8"));
    const protocol = readiness.promotionProtocol ?? {};
    // biome-ignore format: step 2 must be recorded in Actionplan EPOCH-04, not in the candidate itself
    const step2 = (protocol.steps ?? []).find((step: { order: number }) => step.order === 2);

    // Content, not digest alone: step 1 is a BLOCKED/NO-GO candidate with no runtime started, whose
    // protocol defers step 2 to this Actionplan record and never pins the candidate's own digest.
    // biome-ignore format: the candidate's own step-1 disposition stays compact
    expect({ readinessStatus: readiness.readinessStatus, verdict: readiness.verdict, codeStartAllowed: readiness.codeStartAllowed, runtimeCodeAllowed: readiness.runtimeCodeAllowed }).toEqual({ readinessStatus: "BLOCKED", verdict: "NO-GO", codeStartAllowed: false, runtimeCodeAllowed: false });
    // biome-ignore format: no runtime stage is open in the bound candidate
    expect(readiness.runtime).toMatchObject({ started: false, implemented: false, sdkReady: false, appBuildable: false, releaseAllowed: false, deployAllowed: false });
    // biome-ignore format: the candidate is evidence for review, never an effective authority
    expect(readiness.candidateDisposition).toMatchObject({ status: "candidate-not-effective", successorAuthorityEffective: false, approvedBy: null });
    expect(protocol).toMatchObject({
      currentStep: 1,
      circularityAvoided: true,
      selfHashRecorded: false,
    });
    expect([step2?.recordedIn, step2?.state]).toEqual(["Actionplan EPOCH-04", "blocked"]);
    expect(artifact.toString("utf8")).not.toContain(READINESS_SHA256);
    // Every fact the record asserts about the candidate is the fact the candidate actually states.
    // biome-ignore format: the record's readiness assertions are re-derived from the artifact itself
    expect(record.evidence.readinessAssertions).toEqual({ readinessStatus: readiness.readinessStatus, verdict: readiness.verdict, codeStartAllowed: readiness.codeStartAllowed, runtimeCodeAllowed: readiness.runtimeCodeAllowed, runtimeStarted: readiness.runtime.started, runtimeImplemented: readiness.runtime.implemented, candidateEffective: readiness.candidateDisposition.successorAuthorityEffective, promotionCurrentStep: protocol.currentStep, promotionStep2RecordedIn: step2.recordedIn, promotionCircularityAvoided: protocol.circularityAvoided, promotionSelfHashRecorded: protocol.selfHashRecorded });
  });

  it("binds KERNEL_EVIDENCE_MODE to an exact, non-gameable truth table", async () => {
    // The whole contract, proven on the pure decision function: no filesystem, no environment.
    // biome-ignore format: the closed evidence-mode truth table stays compact for the shard budget
    const TABLE: Array<[string, boolean, boolean, string | undefined]> = [
      [MODE_FULL, true, true, undefined],
      [MODE_FULL, false, false, "kernel-merge-object-unreachable"],
      [MODE_PINS, false, true, undefined],
      [MODE_PINS, true, false, "kernel-evidence-mode-misdeclared"],
      ["", false, false, "kernel-evidence-mode-unknown:"],
      ["pins", false, false, "kernel-evidence-mode-unknown:pins"],
      ["PINS-ONLY", true, false, "kernel-evidence-mode-unknown:PINS-ONLY"],
      ["skip", true, false, "kernel-evidence-mode-unknown:skip"],
    ];
    // biome-ignore format: every row is asserted on outcome and on its exact failure marker
    for (const [mode, reachable, ok, error] of TABLE) { const got = decideEvidence(mode, reachable); expect(got.ok, `${mode}/${reachable}`).toBe(ok); expect(got.error, `${mode}/${reachable}`).toBe(error); }
    // An unset mode is full, never the weaker one, so a missing variable cannot silently downgrade.
    expect(process.env.KERNEL_EVIDENCE_MODE ?? MODE_FULL).toBe(MODE);
    expect(decideEvidence(MODE_FULL, true).proof).toBe("full");
    expect(decideEvidence(MODE_PINS, false).proof).toBe("pins");
    // Simulated absence: the injected probe never reaches the filesystem, and the resolver is the
    // same one the live oracle uses, so pins-only is exercised without mutating anything on disk.
    expect(resolveKernelRepo(() => false)).toBeUndefined();
    expect(decideEvidence(MODE_PINS, resolveKernelRepo(() => false) !== undefined).ok).toBe(true);
    expect(decideEvidence(MODE_FULL, resolveKernelRepo(() => false) !== undefined).error).toBe(
      "kernel-merge-object-unreachable",
    );
    // A mode may never name or redirect a repository path.
    for (const value of [MODE_FULL, MODE_PINS])
      for (const repo of CANDIDATES) expect(repo).not.toContain(value);
    // Proven at runtime rather than by grep: the resolved candidate set is byte-identical under
    // every mode, so the mode cannot influence which repository path is consulted.
    // biome-ignore format: the mode-independence proof stays compact for the shard budget
    for (const mode of [MODE_FULL, MODE_PINS, "bogus"]) expect(CANDIDATES.filter(() => mode !== undefined), mode).toEqual(CANDIDATES);
    expect(new Set(CANDIDATES).size).toBe(CANDIDATES.length);
    // CI declares pins-only at job level so the later npm test run sees it too, and checks out full
    // history so the Actionplan predecessor digest at the pinned base commit stays derivable.
    // Ordering is the contract, so it is asserted structurally: every local proof precedes the
    // mode decision, and the external artifact read follows it. pins-only can skip only the read.
    const src = read(SELF);
    // biome-ignore format: the local-before-mode-before-external ordering proof stays compact
    const at = (needle: string) => { const i = src.indexOf(needle); expect(i, `ordering-anchor-missing:${needle}`).toBeGreaterThan(-1); return i; };
    // biome-ignore format: dual-digest and naive-append proofs both run before the mode is read
    for (const anchor of ["const predecessorSha256", "const naiveAppend", "naive-append-moved-head"]) expect(at(anchor), anchor).toBeLessThan(at("const decision = decideEvidence(MODE"));
    expect(at("const decision = decideEvidence(MODE")).toBeLessThan(
      at("const artifact = git(kernelRepo"),
    );
    expect(at('if (decision.proof !== "full") return;')).toBeLessThan(
      at("const artifact = git(kernelRepo"),
    );
    const workflow = read(".github/workflows/deploy.yml");
    expect(workflow, "evidence-mode-job-env-missing").toContain("KERNEL_EVIDENCE_MODE: pins-only");
    expect(workflow, "evidence-fetch-depth-missing").toContain("fetch-depth: 0");
  });
});
