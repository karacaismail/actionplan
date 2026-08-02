import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// Single fail-closed RED oracle for the missing append-only EPOCH-03 kernel-runtime successor
// policy. One `it` on purpose: while EPOCH-03 is absent the suite reports exactly one failure,
// `successor-policy-epoch-missing:EPOCH-03`, and every downstream contract check below only runs
// once the successor exists — so GREEN still has to satisfy the whole contract in one pass.
// Append-only is literal: `status` is inside entryDigest, so a sealed entry can never be demoted.
// EPOCH-01 and EPOCH-02 stay byte- and hash-identical, EPOCH-02 keeps status="effective" as
// historical-at-entry, and the one current head is derived from chainHeadSeq plus the supersedes
// relation — never by rewriting prior entry status.
const ROOT = process.cwd();
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const LIB = "tools/lib/kernel-effective-authority-chain.mjs";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const UNIVERSE = "tools/lib/kernel-node-universe.mjs";
const HISTORICAL_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const EPOCH01_ENTRY_SHA256 = "367cf0579654a82b2d056a2dd1f9aeb0d68b181fbf4d2bc5892244db0786cd99";
const EPOCH02_ENTRY_SHA256 = "782ef3c5b92455b79a76ae715864b585b4302f24ad7355d7fe606b35330c5029";
const EPOCH02_TEXT_SHA256 = "239711dc77b396dd51bc64a02fab9f32a47804c885490e3c644b487b2343c2df";
// biome-ignore format: the exact 870-byte Codex-approved EPOCH-02 text stays on one immutable line.
const EPOCH02_TEXT = "AUTHORITY-SUPERSESSION-02 EFFECTIVE; SOURCE=DIRECT_USER_ADMIN_INSTRUCTION; SUPERSEDES=EPOCH-01; SCOPE=ROLE_ASSIGNMENT_AND_EXECUTION_PROTOCOL_ONLY; CODEX=MASTER_ORCHESTRATOR_REQUIREMENTS_GAP_REVIEW_DIRECTIVE_FINAL_VERIFIER; REQUIREMENTS_FIRST_PASS=CLAUDE_ONLY_FAIL_CLOSED; ACTIONPLAN_WRITER=CLAUDE_ONLY_FAIL_CLOSED; KERNEL_WRITER=CLAUDE_ONLY_FAIL_CLOSED; ACTIONPLAN_REVIEWER=CLAUDE_ONLY_FAIL_CLOSED; KERNEL_REVIEWER=CLAUDE_ONLY_FAIL_CLOSED; WORKER_AGENT_POOL=CLAUDE_ONLY_FAIL_CLOSED; PARALLELISM=PANE_MULTI_AGENT_SINGLE_SHARED_WRITER; FINAL_VERIFIER=CODEX_READ_ONLY; GIT_EXECUTOR=CODEX_EXPLICIT_USER_AUTH_ONLY; GIT_MODE=NONFORCE_NO_TAGS_CI_GATED; PLATFORM_PRODUCT_WRITER=HUMAN_DEVELOPER_ONLY; CLAUDE_AUTH_GATE=CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK; CODE_START=NO; RUNTIME_CODE=NO; RELEASE=NO; DEPLOY=NO; VERDICT=NO-GO; HISTORICAL_APPROVAL_MUTATION=FORBIDDEN";
// biome-ignore format: the derived D01 boundary stays byte-identical across the EPOCH-03 supersession.
const BOUNDARY = { actionplanWriter: "claude-only-fail-closed", kernelWriter: "claude-only-fail-closed", claudeAuthGate: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max", perInvocation: true, cachedEvidenceAllowed: false }, platformProductWriter: "human-developer-only", gitExecutor: "codex", codeStartAllowed: true, runtimeCodeAllowed: true, releaseAllowed: false, deployAllowed: false, verdict: "GO-KERNEL-DEVELOPMENT-ONLY" };
// biome-ignore format: the exact EPOCH-03 effective token/scope contract stays compact for the shard budget.
// EPOCH-03 is now a sealed predecessor; its token floor is asserted in the chain oracle.
// biome-ignore format: the non-supersedable floors EPOCH-03 must carry forward untouched.
// biome-ignore format: the exact EPOCH-04 head token floor stays compact for the shard budget
const EPOCH04_TOKENS: Record<string, string> = { SOURCE: "DIRECT_USER_ADMIN_INSTRUCTION", SUPERSEDES: "EPOCH-03", SCOPE: "KERNEL_DEVELOPMENT_ACTIVATION_ONLY", CODE_START: "YES", RUNTIME_CODE: "YES", RUNTIME_IMPLEMENTATION_START: "NO", SDK_READY: "false", APP_BUILDABLE: "false", RELEASE_ALLOWED: "false", DEPLOY_ALLOWED: "false", VERDICT: "GO-KERNEL-DEVELOPMENT-ONLY" };
const EPOCH03_ENTRY_SHA256 = "9ce36513271352f891c5c73963ce1e7db94b316063587cf0506c8ff270a0984c";
const EPOCH04_ENTRY_SHA256 = "90a0a9ba795fcff67d48829d9d0083cbac956e4d1b277527862fa19586228c37";
const CARRIED_FLOORS: Record<string, string> = {
  claudeAuthGate: "CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK",
  historicalApprovalMutation: "FORBIDDEN",
  platformProductWriter: "HUMAN_DEVELOPER_ONLY",
};
// codeStart, runtimeCode and verdict stay sealed at their EPOCH-03 values while the approved
// EPOCH-04 successor is pending; they are simply no longer labeled non-supersedable.
// codeStart, runtimeCode and verdict were superseded by the appended EPOCH-04 head and are now the
// values in force; their EPOCH-02 originals stay sealed in that entry.
// biome-ignore format: the superseded-now-in-force table stays compact for the shard budget
const SUPERSEDED_NOW_IN_FORCE: Record<string, string> = { codeStart: "YES", runtimeCode: "YES", verdict: "GO-KERNEL-DEVELOPMENT-ONLY" };

type Cell = { token: string; value: string };
// biome-ignore format: the append-only entry surface stays compact for the shard budget.
type Entry = { seq: number; epochId: string; status: string; sourceType: string; sourceRef: string | null; supersedes: number | null; supersedesDimensions: string[]; previousEntrySha256: string | null; dimensions: Record<string, Cell>; entrySha256: string; normalizedText?: string; normalizedTextBytes?: number; normalizedTextSha256?: string; supersessionScope?: string; normalizedTextRef?: { path: string; jsonPointer: string; bytes: number; sha256: string } };
// biome-ignore format: only the chain fields this successor shard constrains stay in the local view.
type Chain = { entries: Entry[]; chainHeadSeq: number; chainHeadEntrySha256: string; chainSha256: string; appendOnly: boolean; gitFloor: Record<string, boolean>; effectiveAuthorityBoundary: typeof BOUNDARY; historicalInvariant: Record<string, unknown> };

const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(read(relative)) as T;
const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
// biome-ignore lint/suspicious/noExplicitAny: the pure JavaScript oracle has no declaration file.
const lib = async (): Promise<any> => import(pathToFileURL(path.join(ROOT, LIB)).href);
// biome-ignore format: the normalized-text token table mirrors the validator's own parser.
const tokenMap = (text: string) => new Map(String(text ?? "").split(";").map((segment) => segment.trim()).filter((segment) => segment.includes("=")).map((segment) => [segment.slice(0, segment.indexOf("=")), segment.slice(segment.indexOf("=") + 1)]));
const fixture = () => ({
  chain: readJson<Chain>(CHAIN),
  closure: readJson<Record<string, unknown>>(CLOSURE),
  handoff: readJson<Record<string, unknown>>(HANDOFF),
  universeBoundary: structuredClone(BOUNDARY),
});
const successor = (chain: Chain) => chain.entries?.find((entry) => entry?.seq === 4);

// Fail-closed preflight: names the absent successor epoch before any downstream contract runs.
function preflight(): string[] {
  if (!exists(CHAIN)) return [`effective-authority-chain-missing:${CHAIN}`];
  if (!exists(LIB)) return [`effective-authority-validator-missing:${LIB}`];
  const head = successor(readJson<Chain>(CHAIN));
  if (!head || typeof head.normalizedText !== "string")
    return ["successor-policy-epoch-missing:EPOCH-03"];
  return [];
}

describe("kernel runtime successor policy (EPOCH-04)", () => {
  it("appends EPOCH-04 over frozen predecessors and holds the full successor contract", async () => {
    const gate = preflight();
    expect(gate, gate.join(",")).toEqual([]);

    const { chainDigest, deriveAuthorityBoundary, effectiveD01Authority, entryDigest } =
      await lib();
    const { resolveAuthorityDimensions, validateKernelEffectiveAuthorityChain } = await lib();
    const chain = readJson<Chain>(CHAIN);
    const [genesis, epoch02] = chain.entries;
    const head = successor(chain) as Entry;

    // 1. Append-only shape: a fourth epoch, no sealed predecessor demoted.
    expect(chain.appendOnly).toBe(true);
    expect(chain.entries.map((entry) => entry.seq)).toEqual([1, 2, 3, 4]);
    expect(head.epochId).toMatch(/04$/);
    expect(head.epochId).not.toBe("AUTHORITY-SUPERSESSION-02");
    expect(head.status).toBe("effective");
    expect(head.sourceType).toBe("direct-user-admin-instruction");
    expect(head.sourceRef).toBeNull();
    expect(head.supersedes).toBe(3);
    expect(head.supersessionScope).toBe("KERNEL_DEVELOPMENT_ACTIVATION_ONLY");
    // The status each entry was sealed with is historical-at-entry and frozen.
    expect(chain.entries.map((entry) => entry.status)).toEqual([
      "superseded",
      "effective",
      "effective",
      "effective",
    ]);

    // 2. One current head, derived from chainHeadSeq and the supersedes relation — not from status.
    expect(chain.chainHeadSeq).toBe(4);
    expect(chain.chainHeadEntrySha256).toBe(head.entrySha256);
    expect(chain.entries.map((entry) => entry.supersedes)).toEqual([null, 1, 2, 3]);
    const supersededSeqs = new Set(chain.entries.map((entry) => entry.supersedes).filter(Boolean));
    const terminal = chain.entries.filter((entry) => !supersededSeqs.has(entry.seq));
    expect(terminal.map((entry) => entry.seq)).toEqual([4]);
    expect(epoch02.status).toBe("effective");
    expect(effectiveD01Authority()).toEqual({
      boundary: BOUNDARY,
      seq: 4,
      chainHeadSha256: head.entrySha256,
      normalizedTextSha256: head.normalizedTextSha256,
    });

    // 3. Exact EPOCH-04 effective tokens and scope; EPOCH-03 is now a sealed predecessor.
    const tokens = tokenMap(head.normalizedText ?? "");
    for (const [token, value] of Object.entries(EPOCH04_TOKENS))
      expect(tokens.get(token), `EPOCH-04 token ${token}`).toBe(value);
    expect(tokens.get("SCOPE")).toBe(head.supersessionScope);
    for (const [key, cell] of Object.entries(head.dimensions ?? {}))
      expect(tokens.get(cell?.token), `EPOCH-04 dimension ${key}`).toBe(cell?.value);

    // 4. EPOCH-01 and EPOCH-02 stay byte- and hash-identical. entryDigest covers every byte of an
    //    entry except entrySha256 itself — `status` included — so pinning the stored and the
    //    recomputed digest freezes the whole sealed entry.
    expect(chain.historicalInvariant).toEqual({
      path: CLOSURE,
      jsonPointer: "/approval/normalizedSelection",
      bytes: 691,
      sha256: HISTORICAL_SHA256,
      mutation: "FORBIDDEN",
    });
    expect(genesis.entrySha256).toBe(EPOCH01_ENTRY_SHA256);
    expect(entryDigest(genesis)).toBe(EPOCH01_ENTRY_SHA256);
    expect(genesis.status).toBe("superseded");
    expect(genesis.normalizedTextRef).toEqual({
      path: CLOSURE,
      jsonPointer: "/approval/normalizedSelection",
      bytes: 691,
      sha256: HISTORICAL_SHA256,
    });
    expect(Object.hasOwn(genesis, "normalizedText")).toBe(false);
    expect(read(CHAIN)).not.toContain(
      readJson<{ approval: { normalizedSelection: string } }>(CLOSURE).approval.normalizedSelection,
    );
    expect(epoch02.entrySha256).toBe(EPOCH02_ENTRY_SHA256);
    expect(entryDigest(epoch02)).toBe(EPOCH02_ENTRY_SHA256);
    expect(epoch02.epochId).toBe("AUTHORITY-SUPERSESSION-02");
    expect(epoch02.normalizedText).toBe(EPOCH02_TEXT);
    expect(epoch02.normalizedTextBytes).toBe(870);
    expect(epoch02.normalizedTextSha256).toBe(EPOCH02_TEXT_SHA256);
    expect(epoch02.previousEntrySha256).toBe(EPOCH01_ENTRY_SHA256);
    expect(Object.keys(epoch02.dimensions)).toHaveLength(19);

    // 5. Deterministic reseal over four linked entries.
    for (const entry of chain.entries) expect(entryDigest(entry)).toBe(entry.entrySha256);
    expect(head.previousEntrySha256).toBe(EPOCH03_ENTRY_SHA256);
    expect(head.normalizedTextBytes).toBe(Buffer.byteLength(head.normalizedText ?? "", "utf8"));
    expect(head.normalizedTextSha256).toBe(sha256(head.normalizedText ?? ""));
    expect(chain.chainSha256).toBe(chainDigest(chain.entries));

    // 6. Auth gate, platform prohibition and the release/deploy floors stay effective under EPOCH-04.
    const { errors, resolved } = resolveAuthorityDimensions(chain);
    expect(errors).toEqual([]);
    for (const [key, value] of Object.entries(CARRIED_FLOORS))
      expect(resolved[key]?.value, `carried floor ${key}`).toBe(value);
    for (const [key, value] of Object.entries(SUPERSEDED_NOW_IN_FORCE))
      expect(resolved[key]?.value, `superseded now in force ${key}`).toBe(value);
    // The three superseded dimensions now resolve from the seq-4 head, not from EPOCH-02.
    // EPOCH-04 redeclares exactly the three activation dimensions, so they resolve from the head.
    for (const key of Object.keys(SUPERSEDED_NOW_IN_FORCE)) expect(resolved[key]?.seq, key).toBe(4);
    // The role dimensions EPOCH-03 sealed are untouched by that append and still resolve from seq 3.
    expect(resolved.actionplanWriter?.seq).toBe(3);
    expect(resolved.kernelReviewer?.seq).toBe(3);
    expect(resolved.orchestrator?.seq).toBe(3);
    // biome-ignore format: the Git floor table stays compact for the shard budget.
    expect(chain.gitFloor).toEqual({ authorizedNow: false, ciRequired: true, directDefaultBranchPush: false, force: false, reviewRequired: true, tags: false, workerGitMutationAllowed: false });
    expect(chain.effectiveAuthorityBoundary).toEqual(BOUNDARY);
    expect(deriveAuthorityBoundary(chain)).toEqual({ errors: [], boundary: BOUNDARY });

    // 7. The validator accepts this chain and rejects successor drift or predecessor rewrites.
    expect(validateKernelEffectiveAuthorityChain(fixture())).toEqual([]);
    const reseal = (input: ReturnType<typeof fixture>) => {
      let previous: string | null = null;
      for (const entry of input.chain.entries) {
        entry.previousEntrySha256 = previous;
        entry.entrySha256 = entryDigest(entry);
        previous = entry.entrySha256;
      }
      input.chain.chainHeadEntrySha256 = input.chain.entries.at(-1)?.entrySha256 ?? "";
    };
    const retext = (input: ReturnType<typeof fixture>, from: string, to: string) => {
      const target = successor(input.chain) as Entry;
      target.normalizedText = (target.normalizedText ?? "").replace(from, to);
      target.normalizedTextBytes = Buffer.byteLength(target.normalizedText, "utf8");
      target.normalizedTextSha256 = sha256(target.normalizedText);
      reseal(input);
    };
    // Error codes are the GREEN implementation's choice; the oracle only requires a fail-closed
    // verdict. Every predecessor mutation below is internally resealed and chain-consistent, so it
    // is detectable only by pinned EPOCH-01/EPOCH-02 digests — the append-only floor under test.
    // biome-ignore format: the table-driven successor negative matrix stays compact for the shard budget.
    const matrix: Array<[string, (input: ReturnType<typeof fixture>) => void]> = [
      ["release-allowed", (input) => retext(input, "RELEASE_ALLOWED=false", "RELEASE_ALLOWED=true")],
      ["deploy-allowed", (input) => retext(input, "DEPLOY_ALLOWED=false", "DEPLOY_ALLOWED=true")],
      ["direct-main-write", (input) => retext(input, "DIRECT_MAIN_WRITE=false", "DIRECT_MAIN_WRITE=true")],
      ["force-git", (input) => retext(input, "FORCE_GIT=false", "FORCE_GIT=true")],
      ["tagging", (input) => retext(input, "TAGGING=false", "TAGGING=true")],
      ["excluded-targets", (input) => retext(input, "EXCLUDED_TARGETS=SDK,APP_CORE,APP,MODULE", "EXCLUDED_TARGETS=SDK")],
      ["code-start", (input) => retext(input, "CODE_START=YES", "CODE_START=NO")],
      ["runtime-code", (input) => retext(input, "RUNTIME_CODE=YES", "RUNTIME_CODE=NO")],
      ["verdict", (input) => retext(input, "VERDICT=GO-KERNEL-DEVELOPMENT-ONLY", "VERDICT=GO")],
      ["kernel-runtime-writer", (input) => retext(input, "KERNEL_RUNTIME_WRITER=CLAUDE_ONLY_FAIL_CLOSED", "KERNEL_RUNTIME_WRITER=CODEX_ONLY")],
      ["scope", (input) => retext(input, "SCOPE=KERNEL_DEVELOPMENT_ACTIVATION_ONLY", "SCOPE=ALL_TARGETS")],
      ["supersedes-token", (input) => retext(input, "SUPERSEDES=EPOCH-03", "SUPERSEDES=EPOCH-01")],
      ["auth-gate-fallback", (input) => { (input.chain.effectiveAuthorityBoundary.claudeAuthGate).cachedEvidenceAllowed = true; }],
      ["platform-writer", (input) => { input.chain.effectiveAuthorityBoundary.platformProductWriter = "claude-only-fail-closed"; }],
      ["epoch02-status-demoted", (input) => { input.chain.entries[1].status = "superseded"; reseal(input); }],
      ["epoch02-text-rewrite", (input) => { input.chain.entries[1].normalizedText = `${EPOCH02_TEXT}.`; reseal(input); }],
      ["epoch02-dimension-rewrite", (input) => { input.chain.entries[1].dimensions.verdict.value = "GO"; reseal(input); }],
      ["genesis-status-rewrite", (input) => { input.chain.entries[0].status = "effective"; reseal(input); }],
      ["genesis-dimension-rewrite", (input) => { input.chain.entries[0].dimensions.gitExecutor.value = "CLAUDE"; reseal(input); }],
      ["successor-supersession-fork", (input) => { (successor(input.chain) as Entry).supersedes = 1; reseal(input); }],
      ["successor-dropped", (input) => { input.chain.entries.pop(); input.chain.chainHeadSeq = 2; reseal(input); }],
    ];
    for (const [label, mutate] of matrix) {
      const input = fixture();
      mutate(input);
      expect(validateKernelEffectiveAuthorityChain(input), label).not.toEqual([]);
    }

    // 8. Regression: consumer stamps resolve through sealed entry digests, never through a raw
    //    head sequence. The code-bearing handoff was restamped onto the seq-4 EPOCH-04 head and
    //    resolves there — and a stamp naming no sealed entry still fails closed.
    // biome-ignore lint/suspicious/noExplicitAny: the pure JavaScript oracle has no declaration file.
    const universe: any = await import(pathToFileURL(path.join(ROOT, UNIVERSE)).href);
    const stampDrift = [
      "effective-authority-seq-drift",
      "effective-authority-chain-head-drift",
      "effective-authority-text-digest-drift",
      "effective-authority-stamp-superseded",
    ];
    const handoffAt = (chainHeadSha256?: string) => {
      const artifact = readJson<{ provenance: { effectiveAuthority: Record<string, unknown> } }>(
        HANDOFF,
      );
      if (chainHeadSha256) artifact.provenance.effectiveAuthority.chainHeadSha256 = chainHeadSha256;
      return artifact;
    };
    // The handoff is restamped onto the appended head, because it mirrors the boundary in force.
    expect(handoffAt().provenance.effectiveAuthority).toMatchObject({
      seq: 4,
      chainHeadSha256: EPOCH04_ENTRY_SHA256,
    });
    const sealedErrors = universe.validateKernelNodeUniverse({
      records: [],
      handoff: handoffAt(),
    }).errors;
    for (const code of stampDrift) expect(sealedErrors, code).not.toContain(code);
    const forgedErrors = universe.validateKernelNodeUniverse({
      records: [],
      handoff: handoffAt(sha256("forged")),
    }).errors;
    expect(forgedErrors).toContain("effective-authority-chain-head-drift");
    expect(universe.resolveD01AuthorityBoundary()).toEqual(BOUNDARY);

    // 9. Adversarial: naming a sealed entry is necessary but not sufficient. A stamp forged onto
    //    the sealed EPOCH-01 genesis passes every shape check — real entry digest, matching seq,
    //    behind the head — yet binds the pre-supersession authority, so it must fail closed. Two
    //    shapes, because genesis seals its text digest through normalizedTextRef and carries no
    //    inline normalizedTextSha256: omitting the stamp digest must not compare equal to the
    //    entry's absent one (undefined === undefined), and supplying the genuine ref digest must
    //    not buy acceptance either.
    const epoch01Errors = (normalizedTextSha256?: string): string[] => {
      const artifact = readJson<{ provenance: { effectiveAuthority: Record<string, unknown> } }>(
        HANDOFF,
      );
      // Rebuilt rather than mutated so the omitted case genuinely lacks the key.
      const { normalizedTextSha256: _sealed, ...rest } = artifact.provenance.effectiveAuthority;
      artifact.provenance.effectiveAuthority = {
        ...rest,
        seq: 1,
        chainHeadSha256: EPOCH01_ENTRY_SHA256,
        ...(normalizedTextSha256 === undefined ? {} : { normalizedTextSha256 }),
      };
      return universe.validateKernelNodeUniverse({ records: [], handoff: artifact }).errors;
    };
    const digestOmitted = epoch01Errors();
    expect(digestOmitted).toContain("effective-authority-stamp-superseded");
    expect(digestOmitted).toContain("effective-authority-text-digest-drift");
    const refDigest = epoch01Errors(genesis.normalizedTextRef?.sha256);
    expect(refDigest).toContain("effective-authority-stamp-superseded");
    // The genesis digest is genuine, so this stamp is rejected for its age alone — never because
    // the oracle happened to mistake it for an unsealed or forged entry.
    expect(refDigest).not.toContain("effective-authority-chain-head-drift");
    expect(refDigest).not.toContain("effective-authority-seq-drift");
    // The current head remains an acceptable stamp: the rule rejects stale authority, not history.
    const headErrors = universe.validateKernelNodeUniverse({
      records: [],
      handoff: (() => {
        const artifact = readJson<{
          provenance: { effectiveAuthority: Record<string, unknown> };
        }>(HANDOFF);
        Object.assign(artifact.provenance.effectiveAuthority, {
          seq: 4,
          chainHeadSha256: head.entrySha256,
          normalizedTextSha256: head.normalizedTextSha256,
        });
        return artifact;
      })(),
    }).errors;
    for (const code of stampDrift) expect(headErrors, code).not.toContain(code);
  });
});
