import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const LIB = "tools/lib/kernel-effective-authority-chain.mjs";
const UNIVERSE = "tools/lib/kernel-node-universe.mjs";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const GATE = "tools/agents/check-kernel-governance.mjs";
const HISTORICAL_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const EPOCH_TEXT_SHA256 = "239711dc77b396dd51bc64a02fab9f32a47804c885490e3c644b487b2343c2df";
// biome-ignore format: the exact 870-byte Codex-approved EPOCH-02 text stays on one immutable line.
const EPOCH_TEXT = "AUTHORITY-SUPERSESSION-02 EFFECTIVE; SOURCE=DIRECT_USER_ADMIN_INSTRUCTION; SUPERSEDES=EPOCH-01; SCOPE=ROLE_ASSIGNMENT_AND_EXECUTION_PROTOCOL_ONLY; CODEX=MASTER_ORCHESTRATOR_REQUIREMENTS_GAP_REVIEW_DIRECTIVE_FINAL_VERIFIER; REQUIREMENTS_FIRST_PASS=CLAUDE_ONLY_FAIL_CLOSED; ACTIONPLAN_WRITER=CLAUDE_ONLY_FAIL_CLOSED; KERNEL_WRITER=CLAUDE_ONLY_FAIL_CLOSED; ACTIONPLAN_REVIEWER=CLAUDE_ONLY_FAIL_CLOSED; KERNEL_REVIEWER=CLAUDE_ONLY_FAIL_CLOSED; WORKER_AGENT_POOL=CLAUDE_ONLY_FAIL_CLOSED; PARALLELISM=PANE_MULTI_AGENT_SINGLE_SHARED_WRITER; FINAL_VERIFIER=CODEX_READ_ONLY; GIT_EXECUTOR=CODEX_EXPLICIT_USER_AUTH_ONLY; GIT_MODE=NONFORCE_NO_TAGS_CI_GATED; PLATFORM_PRODUCT_WRITER=HUMAN_DEVELOPER_ONLY; CLAUDE_AUTH_GATE=CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK; CODE_START=NO; RUNTIME_CODE=NO; RELEASE=NO; DEPLOY=NO; VERDICT=NO-GO; HISTORICAL_APPROVAL_MUTATION=FORBIDDEN";
const EPOCH01_ENTRY_SHA256 = "367cf0579654a82b2d056a2dd1f9aeb0d68b181fbf4d2bc5892244db0786cd99";
const EPOCH02_ENTRY_SHA256 = "782ef3c5b92455b79a76ae715864b585b4302f24ad7355d7fe606b35330c5029";
const EPOCH03_TEXT_SHA256 = "4f00c2d3f3af743b975dcb29b8f54a913bc2b2de00df575469dc3598ef0d3aa5";
const EPOCH03_ENTRY_SHA256 = "9ce36513271352f891c5c73963ce1e7db94b316063587cf0506c8ff270a0984c";
const EPOCH04_ENTRY_SHA256 = "90a0a9ba795fcff67d48829d9d0083cbac956e4d1b277527862fa19586228c37";
const EPOCH04_TEXT_SHA256 = "f7b92d21da22dccf0ca99e0efbebc5e9f0556ba5b2a96657737e057848c2953d";
// biome-ignore format: EPOCH-04 supersedes exactly the three approved activation dimensions.
const EPOCH04_SUPERSEDES = ["codeStart", "runtimeCode", "verdict"];
// biome-ignore format: the exact 524-byte Codex-approved EPOCH-03 text stays on one immutable line.
const EPOCH03_TEXT = "AUTHORITY-SUPERSESSION-03 EFFECTIVE; SOURCE=DIRECT_USER_ADMIN_INSTRUCTION; SUPERSEDES=EPOCH-02; SCOPE=KERNEL_RUNTIME_APPROVED_SHARDS_ONLY; CODEX=MASTER_READ_ONLY_ORCHESTRATOR_FINAL_VERIFIER_GIT_EXECUTOR; KERNEL_RUNTIME_WRITER=CLAUDE_ONLY_FAIL_CLOSED; ACTIONPLAN_WRITER=CLAUDE_ONLY_FAIL_CLOSED; KERNEL_REVIEWER=CLAUDE_ONLY_FAIL_CLOSED; RELEASE_ALLOWED=false; DEPLOY_ALLOWED=false; DIRECT_MAIN_WRITE=false; FORCE_GIT=false; TAGGING=false; EXCLUDED_TARGETS=SDK,APP_CORE,APP,MODULE; CODE_START=NO; RUNTIME_CODE=NO; VERDICT=NO-GO";
// biome-ignore format: the closed authority dimension registry stays compact for the shard budget.
const REGISTRY = ["actionplanReviewer", "actionplanWriter", "claudeAuthGate", "codeStart", "deploy", "finalVerifier", "gitExecutor", "gitMode", "historicalApprovalMutation", "kernelReviewer", "kernelRuntimeWriter", "kernelWriter", "orchestrator", "parallelism", "platformProductWriter", "release", "requirementsFirstPass", "runtimeCode", "technicalDecisions", "verdict", "workerAgentPool"];
// biome-ignore format: the derived D01 boundary stays byte-identical to the applied D7 contract.
const BOUNDARY = { actionplanWriter: "claude-only-fail-closed", kernelWriter: "claude-only-fail-closed", claudeAuthGate: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max", perInvocation: true, cachedEvidenceAllowed: false }, platformProductWriter: "human-developer-only", gitExecutor: "codex", codeStartAllowed: true, runtimeCodeAllowed: true, releaseAllowed: false, deployAllowed: false, verdict: "GO-KERNEL-DEVELOPMENT-ONLY" };
// biome-ignore format: EPOCH-01 keeps the only dimensions its 691-byte GATE-01 text actually encodes.
const EPOCH01_DIMENSIONS = ["actionplanWriter", "deploy", "gitExecutor", "gitMode", "kernelWriter", "release", "technicalDecisions"];
// biome-ignore format: EPOCH-02 supersedes exactly six EPOCH-01 dimensions and adds thirteen new ones.
const EPOCH02_SUPERSEDES = ["actionplanWriter", "deploy", "gitExecutor", "gitMode", "kernelWriter", "release"];
// biome-ignore format: EPOCH-03 supersedes exactly three EPOCH-02 dimensions and adds one new one.
const EPOCH03_SUPERSEDES = ["actionplanWriter", "kernelReviewer", "orchestrator"];
// biome-ignore format: the sorted EPOCH-03 dimension surface stays compact for the shard budget.
const EPOCH03_DIMENSIONS = ["actionplanWriter", "kernelReviewer", "kernelRuntimeWriter", "orchestrator"];
// biome-ignore format: the Claude-only role dimensions stay compact for the shard budget.
const CLAUDE_ROLES = ["actionplanReviewer", "actionplanWriter", "kernelReviewer", "kernelRuntimeWriter", "kernelWriter", "requirementsFirstPass", "workerAgentPool"];

type Cell = { token: string; value: string };
// biome-ignore format: the append-only entry surface stays compact for the shard budget.
type Entry = { seq: number; epochId: string; status: string; sourceType: string; sourceRef: string | null; supersedes: number | null; supersedesDimensions: string[]; previousEntrySha256: string | null; dimensions: Record<string, Cell>; entrySha256: string; normalizedText?: string; normalizedTextBytes?: number; normalizedTextSha256?: string; supersessionScope?: string; normalizedTextRef?: { path: string; jsonPointer: string; bytes: number; sha256: string } };
// biome-ignore format: the chain root surface stays compact for the shard budget.
type Chain = { schemaVersion: string; id: string; status: string; appendOnly: boolean; dimensionRegistry: string[]; historicalInvariant: Record<string, unknown>; entries: Entry[]; chainHeadSeq: number; chainHeadEntrySha256: string; chainSha256: string; nonSupersedableFloors: Record<string, string>; supersessionProjection: { supersededFloors: string[]; supersessionAuthority: string; supersedingEpoch: string; sealedEntriesMutated: boolean; historicalApprovalMutated: boolean; predecessorChainFileSha256: string; predecessorChainFileSource: string; appendWriter: string; appendInvocation: string; appendGitExecutor: string }; gitFloor: Record<string, boolean>; orchestrationPolicy: Record<string, unknown>; effectiveAuthorityBoundary: typeof BOUNDARY; consumerBindings: Record<string, string> };

const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// The digest of the chain file at actionplan@7312ac0, the base the Kernel readiness candidate pinned.
const PREDECESSOR_CHAIN_FILE_SHA256 =
  "8d7f6a79342101397d925ff5f4861f5422c354e2f35ca0b3823e1f4f8c204715";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(read(relative)) as T;
const preflight = () => {
  if (!exists(CHAIN)) return [`effective-authority-chain-missing:${CHAIN}`];
  if (!exists(LIB)) return [`effective-authority-validator-missing:${LIB}`];
  return [];
};
// biome-ignore lint/suspicious/noExplicitAny: the pure JavaScript oracle has no declaration file.
const lib = async (): Promise<any> => import(pathToFileURL(path.join(ROOT, LIB)).href);
// biome-ignore lint/suspicious/noExplicitAny: the pure JavaScript oracle has no declaration file.
const universeLib = async (): Promise<any> => import(pathToFileURL(path.join(ROOT, UNIVERSE)).href);
const fixture = () => ({
  chain: readJson<Chain>(CHAIN),
  closure: readJson<Record<string, unknown>>(CLOSURE),
  handoff: readJson<Record<string, unknown>>(HANDOFF),
  universeBoundary: structuredClone(BOUNDARY),
});

describe("kernel effective authority supersession chain", () => {
  it("fails closed until the append-only chain and its validator exist", async () => {
    const gate = preflight();
    expect(gate, gate.join(",")).toEqual([]);
    const chain = readJson<Chain>(CHAIN);
    // biome-ignore format: exact closed chain root stays compact for the shard budget.
    expect(Object.keys(chain).sort()).toEqual(["appendOnly", "canonicalHashAlgorithm", "chainHeadEntrySha256", "chainHeadSeq", "chainSha256", "consumerBindings", "dimensionRegistry", "effectiveAuthorityBoundary", "entries", "gitFloor", "historicalInvariant", "id", "nonGoals", "nonSupersedableFloors", "orchestrationPolicy", "rollback", "schemaVersion", "status", "supersessionProjection"]);
    expect(chain).toMatchObject({
      schemaVersion: "1.0.0",
      id: "kernel-effective-authority-chain-2026-07-31",
      status: "effective",
      appendOnly: true,
      chainHeadSeq: 4,
      dimensionRegistry: REGISTRY,
      effectiveAuthorityBoundary: BOUNDARY,
      historicalInvariant: {
        path: CLOSURE,
        jsonPointer: "/approval/normalizedSelection",
        bytes: 691,
        sha256: HISTORICAL_SHA256,
        mutation: "FORBIDDEN",
      },
    });
    expect(chain.entries).toHaveLength(4);
    const [genesis, epoch02, epoch03, head] = chain.entries;
    expect(genesis).toMatchObject({
      seq: 1,
      status: "superseded",
      sourceType: "user-admin-gate-approval",
      sourceRef: CLOSURE,
      supersedes: null,
      supersedesDimensions: [],
      previousEntrySha256: null,
      normalizedTextRef: { path: CLOSURE, bytes: 691, sha256: HISTORICAL_SHA256 },
    });
    expect(Object.hasOwn(genesis, "normalizedText")).toBe(false);
    expect(read(CHAIN)).not.toContain(
      readJson<{ approval: { normalizedSelection: string } }>(CLOSURE).approval.normalizedSelection,
    );
    expect(Object.keys(genesis.dimensions).sort()).toEqual(EPOCH01_DIMENSIONS);
    // EPOCH-02 is a sealed predecessor now: byte- and hash-identical, and it keeps the
    // status it was appended with, because `status` is inside its pinned entry digest.
    // biome-ignore format: the sealed EPOCH-02 predecessor surface stays compact for the shard budget.
    expect(epoch02).toMatchObject({ seq: 2, epochId: "AUTHORITY-SUPERSESSION-02", status: "effective", supersedes: 1, supersedesDimensions: EPOCH02_SUPERSEDES, supersessionScope: "ROLE_ASSIGNMENT_AND_EXECUTION_PROTOCOL_ONLY", normalizedText: EPOCH_TEXT, normalizedTextBytes: 870, normalizedTextSha256: EPOCH_TEXT_SHA256, previousEntrySha256: EPOCH01_ENTRY_SHA256, entrySha256: EPOCH02_ENTRY_SHA256 });
    expect(genesis.entrySha256).toBe(EPOCH01_ENTRY_SHA256);
    expect(Object.keys(epoch02.dimensions)).toHaveLength(19);
    // EPOCH-03 is now a sealed predecessor, byte-identical to how it was appended.
    // biome-ignore format: the sealed EPOCH-03 surface stays compact for the shard budget.
    expect(epoch03).toMatchObject({ seq: 3, epochId: "AUTHORITY-SUPERSESSION-03", status: "effective", sourceType: "direct-user-admin-instruction", sourceRef: null, supersedes: 2, supersedesDimensions: EPOCH03_SUPERSEDES, supersessionScope: "KERNEL_RUNTIME_APPROVED_SHARDS_ONLY", normalizedText: EPOCH03_TEXT, normalizedTextBytes: 524, normalizedTextSha256: EPOCH03_TEXT_SHA256, previousEntrySha256: EPOCH02_ENTRY_SHA256 });
    expect(Buffer.byteLength(epoch03.normalizedText ?? "", "utf8")).toBe(524);
    expect(Object.keys(epoch03.dimensions).sort()).toEqual(EPOCH03_DIMENSIONS);
    // The appended EPOCH-04 head supersedes exactly the three approved activation dimensions.
    // biome-ignore format: the EPOCH-04 head surface stays compact for the shard budget.
    expect(head).toMatchObject({ seq: 4, epochId: "AUTHORITY-SUPERSESSION-04", status: "effective", sourceType: "direct-user-admin-instruction", sourceRef: null, supersedes: 3, supersedesDimensions: EPOCH04_SUPERSEDES, supersessionScope: "KERNEL_DEVELOPMENT_ACTIVATION_ONLY", normalizedTextBytes: 898, normalizedTextSha256: EPOCH04_TEXT_SHA256, previousEntrySha256: EPOCH03_ENTRY_SHA256, entrySha256: EPOCH04_ENTRY_SHA256 });
    expect(Buffer.byteLength(head.normalizedText ?? "", "utf8")).toBe(898);
    expect(Object.keys(head.dimensions).sort()).toEqual(EPOCH04_SUPERSEDES);
  });

  it("recomputes historical, epoch, entry and chain digests deterministically", async () => {
    expect(preflight()).toEqual([]);
    const { canonicalJson, chainDigest, entryDigest } = await lib();
    const chain = readJson<Chain>(CHAIN);
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe('{"a":[2,{"c":4,"d":3}],"b":1}');
    for (const entry of chain.entries) expect(entryDigest(entry)).toBe(entry.entrySha256);
    expect(chain.chainHeadEntrySha256).toBe(chain.entries[3].entrySha256);
    expect(chain.chainSha256).toBe(chainDigest(chain.entries));
    expect(validateSelf(await lib(), fixture())).toEqual([]);
  });

  it("resolves every authority dimension exactly once behind the carried-forward floors", async () => {
    expect(preflight()).toEqual([]);
    const { deriveAuthorityBoundary, resolveAuthorityDimensions } = await lib();
    const chain = readJson<Chain>(CHAIN);
    const { errors, resolved } = resolveAuthorityDimensions(chain);
    expect(errors).toEqual([]);
    expect(Object.keys(resolved).sort()).toEqual(REGISTRY);
    // Every dimension's provenance epoch is pinned: EPOCH-01 keeps only technicalDecisions,
    // EPOCH-03 owns its four, and EPOCH-02 still owns everything else.
    expect(resolved.technicalDecisions.seq).toBe(1);
    for (const key of EPOCH03_DIMENSIONS) expect(resolved[key].seq, key).toBe(3);
    // biome-ignore format: the EPOCH-02 remainder stays one deterministic expression.
    for (const key of REGISTRY.filter((k) => k !== "technicalDecisions" && !EPOCH03_DIMENSIONS.includes(k) && !EPOCH04_SUPERSEDES.includes(k))) expect(resolved[key].seq, key).toBe(2);
    // EPOCH-04 redeclares exactly the three activation dimensions, so they resolve from the head.
    for (const key of EPOCH04_SUPERSEDES) expect(resolved[key].seq, key).toBe(4);
    for (const key of CLAUDE_ROLES) expect(resolved[key].value).toBe("CLAUDE_ONLY_FAIL_CLOSED");
    // biome-ignore format: the non-supersedable floor table stays compact for the shard budget.
    expect(chain.nonSupersedableFloors).toEqual({ claudeAuthGate: "CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK", deploy: "NO", gitMode: "NONFORCE_NO_TAGS_CI_GATED", historicalApprovalMutation: "FORBIDDEN", platformProductWriter: "HUMAN_DEVELOPER_ONLY", release: "NO" });
    // codeStart, runtimeCode and verdict left the projection only under a named superseding epoch.
    // biome-ignore format: the exact supersession projection stays compact for the shard budget.
    expect(chain.supersessionProjection).toMatchObject({ supersededFloors: ["codeStart", "runtimeCode", "verdict"], supersessionAuthority: "direct-user-admin-instruction", supersedingEpoch: "AUTHORITY-SUPERSESSION-04", sealedEntriesMutated: false, historicalApprovalMutated: false });
    // The append is a Claude writer action; Codex writes no file and only commits after verifying.
    // biome-ignore format: the corrected append-role projection stays compact for the shard budget.
    expect(chain.supersessionProjection).toMatchObject({ appendWriter: "claude-only-fail-closed", appendInvocation: "pane-visible-agent-claude", appendGitExecutor: "codex" });
    // The predecessor chain-file digest is disclosed and independently re-derived from its base
    // commit below; this file never records its own current digest.
    expect(chain.supersessionProjection.predecessorChainFileSha256).toBe(
      PREDECESSOR_CHAIN_FILE_SHA256,
    );
    const chainFileSha256 = createHash("sha256").update(read(CHAIN)).digest("hex");
    expect(read(CHAIN)).not.toContain(chainFileSha256);
    expect(chainFileSha256).not.toBe(PREDECESSOR_CHAIN_FILE_SHA256);
    // The appended EPOCH-04 head carries its own dimensions; the pre-activation values stay sealed
    // in entries[2], the EPOCH-03 predecessor, which the token proof below reads.
    expect(chain.entries.at(-1)?.dimensions).toBeDefined();
    // biome-ignore format: the sealed EPOCH-03 token floor stays exactly as it was appended.
    for (const token of ["CODE_START=NO", "RUNTIME_CODE=NO", "VERDICT=NO-GO"]) expect(chain.entries[2]?.normalizedText).toContain(token);
    // ...while the appended head carries the activated values.
    // biome-ignore format: the EPOCH-04 head token proof stays compact for the shard budget.
    for (const token of ["CODE_START=YES", "RUNTIME_CODE=YES", "VERDICT=GO-KERNEL-DEVELOPMENT-ONLY"]) expect(chain.entries.at(-1)?.normalizedText).toContain(token);
    // biome-ignore format: the Git floor table stays compact for the shard budget.
    expect(chain.gitFloor).toEqual({ authorizedNow: false, ciRequired: true, directDefaultBranchPush: false, force: false, reviewRequired: true, tags: false, workerGitMutationAllowed: false });
    expect(chain.orchestrationPolicy).toMatchObject({
      codexRepoWriter: false,
      codexExternalDirectiveWriter: true,
      codexFinalVerifier: "read-only",
      claudeSelfDelegationAllowed: false,
      concurrentRepoWriters: 1,
      writerLease: "single-repo-writer",
      claudeRoles: CLAUDE_ROLES,
    });
    expect(deriveAuthorityBoundary(chain)).toEqual({ errors: [], boundary: BOUNDARY });
  });

  it("rejects history, chain, precedence, floor, consumer and orchestration drift", async () => {
    expect(preflight()).toEqual([]);
    const module = await lib();
    const { validateKernelEffectiveAuthorityChain, entryDigest } = module;
    expect(validateKernelEffectiveAuthorityChain({})).toEqual([
      `effective-authority-chain-missing:${CHAIN}`,
    ]);
    const reseal = (input: ReturnType<typeof fixture>) => {
      for (const entry of input.chain.entries) entry.entrySha256 = entryDigest(entry);
    };
    // biome-ignore format: the table-driven negative matrix stays compact for the shard budget.
    const matrix: Array<[string, string, (input: ReturnType<typeof fixture>) => void]> = [
      ["history", "historical-text-bytes-drift", (input) => { (input.closure.approval as { normalizedSelection: string }).normalizedSelection += "."; }],
      ["history", "historical-text-digest-drift", (input) => { (input.chain.entries[0].normalizedTextRef as { sha256: string }).sha256 = EPOCH_TEXT_SHA256; }],
      ["history", "genesis-reference-replacement", (input) => { (input.chain.entries[0].normalizedTextRef as { jsonPointer: string }).jsonPointer = "/approval/responseText"; }],
      ["history", "genesis-reference-replacement", (input) => { input.chain.entries[0].sourceRef = HANDOFF; }],
      ["history", "genesis-text-copy-forbidden", (input) => { input.chain.entries[0].normalizedText = (input.closure.approval as { normalizedSelection: string }).normalizedSelection; }],
      ["history", "historical-invariant-drift", (input) => { (input.chain.historicalInvariant as { mutation: string }).mutation = "ALLOWED"; }],
      ["chain", "epoch-text-bytes-drift", (input) => { input.chain.entries[3].normalizedText += "."; }],
      ["chain", "epoch-text-digest-drift", (input) => { input.chain.entries[3].normalizedTextSha256 = HISTORICAL_SHA256; }],
      ["chain", "sealed-entry-digest-drift:2", (input) => { input.chain.entries[1].normalizedText += "."; reseal(input); }],
      ["chain", "entry-digest-drift:1", (input) => { input.chain.entries[0].entrySha256 = HISTORICAL_SHA256; }],
      ["chain", "broken-previous-link:2", (input) => { input.chain.entries[1].previousEntrySha256 = HISTORICAL_SHA256; }],
      ["chain", "duplicate-epoch-seq:1", (input) => { input.chain.entries[1].seq = 1; reseal(input); }],
      ["chain", "gapped-epoch-seq:3", (input) => { input.chain.entries[1].seq = 3; reseal(input); }],
      ["chain", "reordered-epoch-seq:1", (input) => { input.chain.entries.reverse(); }],
      ["chain", "epoch-supersession-fork:2", (input) => { input.chain.entries[1].supersedes = null; reseal(input); }],
      ["chain", "epoch-supersession-cycle:2", (input) => { input.chain.entries[1].supersedes = 2; reseal(input); }],
      ["chain", "chain-head-digest-drift", (input) => { input.chain.chainHeadEntrySha256 = HISTORICAL_SHA256; }],
      ["chain", "chain-head-seq-drift", (input) => { input.chain.chainHeadSeq = 1; }],
      ["chain", "chain-digest-drift", (input) => { input.chain.chainSha256 = HISTORICAL_SHA256; }],
      ["chain", "sealed-entry-digest-drift:1", (input) => { input.chain.entries[0].status = "effective"; reseal(input); }],
      ["chain", "effective-epoch-not-head", (input) => { input.chain.entries[2].supersedes = 1; reseal(input); }],
      ["precedence", "authority-dimension-omission:verdict", (input) => { Reflect.deleteProperty(input.chain.entries[1].dimensions, "verdict"); Reflect.deleteProperty(input.chain.entries[3].dimensions, "verdict"); input.chain.entries[3].supersedesDimensions = ["codeStart", "runtimeCode"]; reseal(input); }],
      ["precedence", "authority-dimension-overlap:kernelWriter", (input) => { input.chain.entries[1].supersedesDimensions = []; reseal(input); }],
      ["precedence", "authority-dimension-orphan:inventedAuthority", (input) => { input.chain.entries[1].dimensions.inventedAuthority = { token: "INVENTED", value: "YES" }; reseal(input); }],
      ["precedence", "authority-dimension-unresolved-value:verdict", (input) => { input.chain.entries[1].dimensions.verdict.value = "TBD"; reseal(input); }],
      ["precedence", "authority-dimension-token-drift:2:gitExecutor", (input) => { input.chain.entries[1].dimensions.gitExecutor.value = "CODEX"; reseal(input); }],
      ["precedence", "authority-dimension-supersession-without-value:technicalDecisions", (input) => { input.chain.entries[1].supersedesDimensions.push("technicalDecisions"); reseal(input); }],
      ["floor", "authority-floor-violation:platformProductWriter", (input) => { input.chain.entries[1].dimensions.platformProductWriter.value = "CLAUDE_ONLY_FAIL_CLOSED"; reseal(input); }],
      ["floor", "authority-floor-violation:claudeAuthGate", (input) => { input.chain.entries[1].dimensions.claudeAuthGate.value = "CLAUDE_AI_FIRSTPARTY_MAX_CACHED_FALLBACK"; reseal(input); }],
      ["floor", "superseded-floor-registry-drift", (input) => { input.chain.supersessionProjection.supersededFloors = ["codeStart"]; }],
      ["floor", "superseded-floor-authority-drift", (input) => { input.chain.supersessionProjection.supersessionAuthority = "inferred"; }],
      ["floor", "superseding-epoch-drift", (input) => { input.chain.supersessionProjection.supersedingEpoch = "AUTHORITY-SUPERSESSION-03"; }],
      ["floor", "superseding-epoch-drift", (input) => { Reflect.deleteProperty(input.chain.supersessionProjection, "supersedingEpoch"); }],
      ["floor", "supersession-projection-mutation-claim", (input) => { input.chain.supersessionProjection.historicalApprovalMutated = true; }],
      // Re-pinning a superseded floor is caught against the document's own tables, not two constants.
      ["floor", "superseded-floor-still-pinned:codeStart", (input) => { input.chain.nonSupersedableFloors.codeStart = "NO"; }],
      ["floor", "superseded-floor-still-pinned:verdict", (input) => { input.chain.nonSupersedableFloors.verdict = "NO-GO"; }],
      ["floor", "predecessor-chain-file-digest-drift", (input) => { input.chain.supersessionProjection.predecessorChainFileSha256 = "0".repeat(64); }],
      ["floor", "predecessor-chain-file-source-drift", (input) => { input.chain.supersessionProjection.predecessorChainFileSource = "actionplan@0000000"; }],
      ["floor", "chain-file-self-digest-circularity:chainFileSha256", (input) => { (input.chain.supersessionProjection as Record<string, unknown>).chainFileSha256 = "0".repeat(64); }],
      ["floor", "append-writer-drift", (input) => { input.chain.supersessionProjection.appendWriter = "codex"; }],
      ["floor", "append-invocation-drift", (input) => { input.chain.supersessionProjection.appendInvocation = "mcp-claude_implement"; }],
      ["floor", "append-git-executor-drift", (input) => { input.chain.supersessionProjection.appendGitExecutor = "claude"; }],
      ["floor", "authority-floor-violation:release", (input) => { input.chain.entries[1].dimensions.release.value = "YES"; reseal(input); }],
      ["floor", "authority-floor-violation:deploy", (input) => { input.chain.entries[1].dimensions.deploy.value = "YES"; reseal(input); }],
      ["floor", "supersession-projection-mutation-claim", (input) => { input.chain.supersessionProjection.sealedEntriesMutated = true; }],
      ["floor", "authority-floor-violation:historicalApprovalMutation", (input) => { input.chain.entries[1].dimensions.historicalApprovalMutation.value = "ALLOWED"; reseal(input); }],
      ["floor", "floor-registry-drift", (input) => { input.chain.nonSupersedableFloors.verdict = "GO"; }],
      ["floor", "git-floor-violation:force", (input) => { input.chain.gitFloor.force = true; }],
      ["floor", "git-floor-violation:tags", (input) => { input.chain.gitFloor.tags = true; }],
      ["floor", "git-floor-violation:directDefaultBranchPush", (input) => { input.chain.gitFloor.directDefaultBranchPush = true; }],
      ["floor", "git-floor-violation:workerGitMutationAllowed", (input) => { input.chain.gitFloor.workerGitMutationAllowed = true; }],
      ["floor", "git-floor-violation:authorizedNow", (input) => { input.chain.gitFloor.authorizedNow = true; }],
      ["floor", "historical-git-floor-divergence:force", (input) => { ((input.closure.authorityBoundary as Record<string, Record<string, unknown>>).gitAuthorization).force = true; }],
      ["floor", "historical-git-floor-divergence:workerGitMutationAllowed", (input) => { (input.closure.authorityBoundary as Record<string, unknown>).workerGitMutationAllowed = true; }],
      ["consumer", "handoff-effective-authority-missing", (input) => { Reflect.deleteProperty(input.handoff.provenance as Record<string, unknown>, "effectiveAuthority"); }],
      ["consumer", "handoff-effective-authority-ref-drift", (input) => { (((input.handoff.provenance as Record<string, Record<string, unknown>>).effectiveAuthority)).ref = CLOSURE; }],
      ["consumer", "handoff-effective-authority-seq-drift", (input) => { (((input.handoff.provenance as Record<string, Record<string, unknown>>).effectiveAuthority)).seq = 1; }],
      ["consumer", "handoff-effective-authority-chain-head-drift", (input) => { (((input.handoff.provenance as Record<string, Record<string, unknown>>).effectiveAuthority)).chainHeadSha256 = HISTORICAL_SHA256; }],
      ["consumer", "handoff-effective-authority-text-digest-drift", (input) => { (((input.handoff.provenance as Record<string, Record<string, unknown>>).effectiveAuthority)).normalizedTextSha256 = HISTORICAL_SHA256; }],
      ["consumer", "handoff-effective-authority-text-digest-drift", (input) => { Reflect.deleteProperty(((input.handoff.provenance as Record<string, Record<string, unknown>>).effectiveAuthority), "normalizedTextSha256"); }],
      ["consumer", "handoff-effective-authority-stamp-superseded", (input) => { Object.assign(((input.handoff.provenance as Record<string, Record<string, unknown>>).effectiveAuthority), { seq: 1, chainHeadSha256: EPOCH01_ENTRY_SHA256, normalizedTextSha256: HISTORICAL_SHA256 }); }],
      ["consumer", "handoff-historical-approval-ref-overwritten", (input) => { (((input.handoff.provenance as Record<string, Record<string, unknown>>).approval)).normalizedSelectionSha256 = EPOCH_TEXT_SHA256; }],
      ["consumer", "handoff-authority-divergence", (input) => { (input.handoff.authorityBoundary as Record<string, unknown>).verdict = "GO"; }],
      ["consumer", "universe-authority-divergence", (input) => { input.universeBoundary.gitExecutor = "claude"; }],
      ["consumer", "consumer-binding-drift", (input) => { input.chain.consumerBindings.handoffRef = CLOSURE; }],
      ["orchestration", "codex-repo-writer-enabled", (input) => { input.chain.orchestrationPolicy.codexRepoWriter = true; }],
      ["orchestration", "codex-repo-writer-enabled", (input) => { input.chain.entries[2].dimensions.actionplanWriter.value = "CODEX_GOVERNANCE_ONLY"; reseal(input); }],
      ["orchestration", "claude-role-loss:kernelReviewer", (input) => { input.chain.entries[2].dimensions.kernelReviewer.value = "CODEX_ONLY"; reseal(input); }],
      ["orchestration", "claude-role-loss:kernelRuntimeWriter", (input) => { input.chain.entries[2].dimensions.kernelRuntimeWriter.value = "CODEX_ONLY"; reseal(input); }],
      ["orchestration", "codex-orchestration-role-drift", (input) => { input.chain.entries[2].dimensions.orchestrator.value = "MASTER_ORCHESTRATOR_REQUIREMENTS_GAP_REVIEW_DIRECTIVE_FINAL_VERIFIER"; reseal(input); }],
      ["orchestration", "claude-self-delegation-enabled", (input) => { input.chain.orchestrationPolicy.claudeSelfDelegationAllowed = true; }],
      ["orchestration", "shared-writer-parallelism-enabled", (input) => { input.chain.orchestrationPolicy.concurrentRepoWriters = 2; }],
      ["orchestration", "shared-writer-parallelism-enabled", (input) => { input.chain.entries[1].dimensions.parallelism.value = "PANE_MULTI_AGENT_MULTI_WRITER"; reseal(input); }],
      ["orchestration", "codex-orchestration-role-drift", (input) => { input.chain.entries[1].dimensions.finalVerifier.value = "CLAUDE_READ_ONLY"; reseal(input); }],
      ["orchestration", "claude-role-registry-drift", (input) => { (input.chain.orchestrationPolicy.claudeRoles as string[]).pop(); }],
      // codeStart, runtimeCode and verdict are supersedable prospectively, by appending a successor.
      // That never licenses rewriting what EPOCH-03 already sealed: the head token floor still fails
      // closed on each of the three, and resealing the entry only moves the failure to the head digest.
      ["chain", "epoch-token-floor-drift:CODE_START", (input) => { input.chain.entries[3].normalizedText = String(input.chain.entries[3].normalizedText).replace("CODE_START=YES", "CODE_START=NO"); }],
      ["chain", "epoch-token-floor-drift:RUNTIME_CODE", (input) => { input.chain.entries[3].normalizedText = String(input.chain.entries[3].normalizedText).replace("RUNTIME_CODE=YES", "RUNTIME_CODE=NO"); }],
      ["chain", "epoch-token-floor-drift:VERDICT", (input) => { input.chain.entries[3].normalizedText = String(input.chain.entries[3].normalizedText).replace("VERDICT=GO-KERNEL-DEVELOPMENT-ONLY", "VERDICT=NO-GO"); }],
      ["chain", "chain-head-digest-drift", (input) => { input.chain.entries[3].normalizedText = String(input.chain.entries[3].normalizedText).replace("CODE_START=YES", "CODE_START=NO"); reseal(input); }],
    ];
    const groups = new Set<string>();
    for (const [group, expected, mutate] of matrix) {
      const input = fixture();
      mutate(input);
      expect(validateKernelEffectiveAuthorityChain(input), `${group}/${expected}`).toContain(
        expected,
      );
      groups.add(group);
    }
    expect([...groups].sort()).toEqual([
      "chain",
      "consumer",
      "floor",
      "history",
      "orchestration",
      "precedence",
    ]);
  });

  it("binds a consumer stamp to a sealed entry that still governs, on a total text digest", async () => {
    expect(preflight()).toEqual([]);
    const { validateKernelEffectiveAuthorityChain } = await lib();
    const restamp = (stamp: Record<string, unknown>): string[] => {
      const input = fixture();
      (input.handoff.provenance as Record<string, unknown>).effectiveAuthority = stamp;
      return validateKernelEffectiveAuthorityChain(input);
    };
    // EPOCH-01 is sealed but pre-supersession: the chain prefix ending at it no longer derives the
    // boundary in force. Omitting the digest must not pass by comparing undefined against the
    // genesis entry, which seals its text through normalizedTextRef and carries no
    // `normalizedTextSha256` of its own — two absent values must never satisfy the comparison.
    expect(restamp({ ref: CHAIN, seq: 1, chainHeadSha256: EPOCH01_ENTRY_SHA256 })).toEqual([
      "handoff-effective-authority-stamp-superseded",
      "handoff-effective-authority-text-digest-drift",
    ]);
    // The genuine normalizedTextRef digest resolves, so only the superseded boundary rejects it.
    // biome-ignore format: the genuine genesis-ref stamp stays compact for the shard budget.
    expect(restamp({ ref: CHAIN, seq: 1, chainHeadSha256: EPOCH01_ENTRY_SHA256, normalizedTextSha256: HISTORICAL_SHA256 })).toEqual(["handoff-effective-authority-stamp-superseded"]);
    // Appending EPOCH-04 moved the derived boundary, so a predecessor stamp still RESOLVES to its
    // sealed entry but no longer GOVERNS. The rule is preserved, not weakened: only the head governs.
    // biome-ignore format: the superseded EPOCH-02 consumer stamp stays compact for the shard budget.
    expect(restamp({ ref: CHAIN, seq: 2, chainHeadSha256: EPOCH02_ENTRY_SHA256, normalizedTextSha256: EPOCH_TEXT_SHA256 })).toEqual(["handoff-effective-authority-stamp-superseded"]);
    // biome-ignore format: the current EPOCH-04 head stamp stays compact for the shard budget.
    expect(restamp({ ref: CHAIN, seq: 4, chainHeadSha256: EPOCH04_ENTRY_SHA256, normalizedTextSha256: EPOCH04_TEXT_SHA256 })).toEqual([]);
    // A forged digest naming no sealed entry still fails closed on both the head and the text.
    // biome-ignore format: the forged future stamp stays compact for the shard budget.
    expect(restamp({ ref: CHAIN, seq: 4, chainHeadSha256: "f".repeat(64), normalizedTextSha256: EPOCH03_TEXT_SHA256 })).toEqual(["handoff-effective-authority-chain-head-drift", "handoff-effective-authority-text-digest-drift"]);
    expect(readJson<Chain>(CHAIN).entries[2].entrySha256).toBe(EPOCH03_ENTRY_SHA256);
    expect(readJson<Chain>(CHAIN).entries[3].entrySha256).toBe(EPOCH04_ENTRY_SHA256);
  });

  it("binds AGENTS.md, the handoff, the node universe and the governance gate to the chain", async () => {
    expect(preflight()).toEqual([]);
    const chain = readJson<Chain>(CHAIN);
    const { EFFECTIVE_AUTHORITY_CHAIN_REF } = await lib();
    const { resolveD01AuthorityBoundary } = await universeLib();
    expect(EFFECTIVE_AUTHORITY_CHAIN_REF).toBe(CHAIN);
    expect(resolveD01AuthorityBoundary()).toEqual(BOUNDARY);
    expect(read(UNIVERSE)).toContain("kernel-effective-authority-chain.mjs");
    expect(read(GATE)).toContain("validateKernelEffectiveAuthorityChain");
    expect(chain.consumerBindings).toEqual({
      handoffRef: HANDOFF,
      universeRef: UNIVERSE,
      gateRef: GATE,
      contractRef: "AGENTS.md",
    });
    const provenance = readJson<{ provenance: Record<string, Record<string, unknown>> }>(
      HANDOFF,
    ).provenance;
    expect(provenance.approval.normalizedSelectionSha256).toBe(HISTORICAL_SHA256);
    // The handoff mirrors the boundary in force, so the EPOCH-04 append restamped it onto the seq-4
    // head; consumers that only resolve a stamp stay pinned to the entry they were authored against.
    expect(provenance.effectiveAuthority).toEqual({
      ref: CHAIN,
      seq: 4,
      chainHeadSha256: EPOCH04_ENTRY_SHA256,
      normalizedTextSha256: EPOCH04_TEXT_SHA256,
    });
    expect(chain.entries[1].entrySha256).toBe(EPOCH02_ENTRY_SHA256);
    const agents = read("AGENTS.md");
    expect(agents).toContain(CHAIN);
    expect(agents).toContain("EPOCH-04");
    // EPOCH-03 stays named as the sealed predecessor it now is.
    expect(agents).toContain("EPOCH-03");
    expect(agents).toContain("KERNEL_RUNTIME_WRITER=CLAUDE_ONLY_FAIL_CLOSED");
    expect(agents).toContain("ACTIONPLAN_WRITER=CLAUDE_ONLY_FAIL_CLOSED");
    expect(agents).toContain("human-developer-only");
    expect(agents).toContain("Açık Kullanıcı/Admin yetkisi");
    expect(agents).toContain("yalnız Codex");
    expect(agents).toContain("PM, uzman ve Claude");
    expect(agents).not.toContain(
      "Actionplan changeset'ini uygulayıp test ve PR teslimini yapabilen tek AI rolü yalnız Codex'tir",
    );
  });

  it("fails closed in a complete checkout whose chain library is absent", () => {
    const universe = read(UNIVERSE);
    for (const marker of [
      '"AGENTS.md", "package.json"',
      "COMPLETE_CHECKOUT_MARKERS",
      "isCompleteCheckout",
      "effective-authority-chain-missing:",
      CHAIN,
    ])
      expect(universe).toContain(marker);
    const complete = probe(true);
    expect(complete.thrown).toBe(`effective-authority-chain-missing:${CHAIN}`);
    expect(complete.errors).toContain(`effective-authority-chain-missing:${CHAIN}`);
    expect(complete.errors).toContain("authority-boundary-drift");
    const partial = probe(false);
    expect(partial.thrown).toBe(`effective-authority-chain-missing:${CHAIN}`);
    expect(partial.errors).not.toContain(`effective-authority-chain-missing:${CHAIN}`);
    expect(partial.errors).not.toContain("authority-boundary-drift");
  });
});

// Copies only tools/lib/kernel-node-universe.mjs into a bare temp root, never renaming or deleting
// a real file, so the chain library is genuinely absent. `markers` decides whether the sandbox
// looks like a complete Actionplan checkout (AGENTS.md + package.json) or a partial tool fixture.
function probe(markers: boolean): { errors: string[]; thrown: string } {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "authority-checkout-"));
  try {
    for (const directory of ["tools/lib", "reports"])
      fs.mkdirSync(path.join(sandbox, directory), { recursive: true });
    for (const relative of [UNIVERSE, HANDOFF])
      fs.copyFileSync(path.join(ROOT, relative), path.join(sandbox, relative));
    if (markers)
      for (const marker of ["AGENTS.md", "package.json"])
        fs.writeFileSync(
          path.join(sandbox, marker),
          marker.endsWith(".json") ? "{}\n" : "marker\n",
        );
    fs.writeFileSync(
      path.join(sandbox, "probe.mjs"),
      [
        'import { readFileSync } from "node:fs";',
        `const universe = await import("./${UNIVERSE}");`,
        `const handoff = JSON.parse(readFileSync("${HANDOFF}", "utf8"));`,
        "let thrown = '';",
        "try { universe.resolveD01AuthorityBoundary(); } catch (error) { thrown = error.message; }",
        "const { errors } = universe.validateKernelNodeUniverse({ records: [], handoff });",
        "console.log(JSON.stringify({ errors, thrown }));",
      ].join("\n"),
    );
    const run = spawnSync(process.execPath, ["probe.mjs"], { cwd: sandbox, encoding: "utf8" });
    expect(run.status, run.stderr).toBe(0);
    return JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "{}");
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
}

// biome-ignore lint/suspicious/noExplicitAny: the pure JavaScript oracle has no declaration file.
function validateSelf(module: any, input: ReturnType<typeof fixture>): string[] {
  return module.validateKernelEffectiveAuthorityChain(input);
}
