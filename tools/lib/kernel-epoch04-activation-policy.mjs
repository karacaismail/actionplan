import { createHash } from "node:crypto";
import { entryDigest } from "./kernel-effective-authority-chain.mjs";
// The EPOCH-04 approval-record contract, shared so the approval-record and external-evidence
// oracles judge by identical rules. R holds the artefact refs plus the one bound Kernel merge.
// biome-ignore format: the closed reference surface stays compact for the shard budget
const R = { RECORD_REF: "reports/kernel-epoch-04-activation-2026-08-02.json", CHAIN_REF: "reports/kernel-effective-authority-chain-2026-07-31.json", CLOSURE_REF: "reports/kernel-governance-closure-authority-2026-07-31.json", REGISTRY_REF: "reports/kernel-governance-decision-registry-2026-07-15.json", STATE_REF: "reports/kernel-governance-application-state-2026-08-01.json", PACK_REF: "docs/kernel-governance-decision-pack-2026-07-15.md", KERNEL_MERGE: "f62dc8e8cbacaa510aea1187212dc7171cbffa0a", READINESS_SHA256: "532b780bac4049b852def1a76298b0e1ac63cc27c8748a786b65c509b137f297", READINESS_PATH: "planning/kernel-ai-development-readiness.json", KERNEL_REPOSITORY: "metaframer-kernel" };
// biome-ignore format: the closed reference export surface stays compact for the shard budget
export const { RECORD_REF, CHAIN_REF, CLOSURE_REF, REGISTRY_REF, STATE_REF, PACK_REF, KERNEL_MERGE, READINESS_SHA256, READINESS_PATH, KERNEL_REPOSITORY } = R;
// EPOCH-01..03 sealed hashes plus the chain-file digest the Kernel candidate pinned: byte pins all.
// biome-ignore format: the pinned sealed predecessor digests stay compact for the shard budget
const PINS = { EPOCH01_ENTRY_SHA256: "367cf0579654a82b2d056a2dd1f9aeb0d68b181fbf4d2bc5892244db0786cd99", EPOCH02_ENTRY_SHA256: "782ef3c5b92455b79a76ae715864b585b4302f24ad7355d7fe606b35330c5029", EPOCH03_ENTRY_SHA256: "9ce36513271352f891c5c73963ce1e7db94b316063587cf0506c8ff270a0984c", EPOCH03_TEXT_SHA256: "4f00c2d3f3af743b975dcb29b8f54a913bc2b2de00df575469dc3598ef0d3aa5", PREDECESSOR_CHAIN_SHA256: "8d7f6a79342101397d925ff5f4861f5422c354e2f35ca0b3823e1f4f8c204715" };
// biome-ignore format: the pinned digest export surface stays compact for the shard budget
export const { EPOCH01_ENTRY_SHA256, EPOCH02_ENTRY_SHA256, EPOCH03_ENTRY_SHA256, EPOCH03_TEXT_SHA256, PREDECESSOR_CHAIN_SHA256 } = PINS;
// The pinned scalars: the 691-byte GATE-01 approval, the epoch and verdict identity, the current
// invocation and its forbidden MCP counterpart, and the base the predecessor digest comes from.
// biome-ignore format: the closed scalar surface stays compact for the shard budget
const S = { APPROVAL_SHA256: "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6", APPROVAL_BYTES: 691, EPOCH04: "AUTHORITY-SUPERSESSION-04", VERDICT: "GO-KERNEL-DEVELOPMENT-ONLY", INVOCATION: "pane-visible-agent-claude", FORBIDDEN_INVOCATION: "mcp-claude_implement", PREDECESSOR_CHAIN_BASE: "7312ac0b17bbddf3bd92d9aa53a73c6a9578f45d", EPOCH04_TEXT_BYTES: 898, EPOCH04_TEXT_SHA256: "f7b92d21da22dccf0ca99e0efbebc5e9f0556ba5b2a96657737e057848c2953d", INHERITED_TOKENS: ["EXCLUDED_TARGETS"] };
// biome-ignore format: the closed scalar export surface stays compact for the shard budget
export const { APPROVAL_SHA256, APPROVAL_BYTES, EPOCH04, VERDICT, INVOCATION, FORBIDDEN_INVOCATION, PREDECESSOR_CHAIN_BASE, EPOCH04_TEXT_BYTES, EPOCH04_TEXT_SHA256, INHERITED_TOKENS } = S;
// The closed contract surface: every key set and value table the record is judged against. ROOT/
// ENTRY/SCOPE/EVIDENCE/IMMUTABILITY are exact key sets; APPEND_PREREQUISITE names the amendments a
// real append still needs, none performed here. Kernel development opens; every downstream stage
// and every immovable floor stays exactly as recorded.
// biome-ignore format: the closed contract surface stays compact for the shard budget
const C = { ROOT_KEYS: ["activationScope", "authorityBoundary", "chainBinding", "decisionRef", "evidence", "gapClosed", "generatedAt", "id", "invariants", "nonGoals", "predecessorImmutability", "rollback", "schemaVersion", "status", "successorEntry"], ENTRY_KEYS: ["dimensions", "entrySha256", "epochId", "normalizedText", "normalizedTextBytes", "normalizedTextSha256", "previousEntrySha256", "seq", "sourceRef", "sourceType", "status", "supersedes", "supersedesDimensions", "supersessionScope"], APPEND_PREREQUISITE_KEYS: ["boundaryMapExtension", "chainRootHeadFields", "consumerRestamp", "headIdentityPin", "sealedEntryDigestRegistry"], SCOPE_KEYS: ["appBuildable", "codeStartAllowed", "deployAllowed", "releaseAllowed", "runtimeCodeAllowed", "runtimeImplementationStart", "sdkReady", "verdict"], EVIDENCE_KEYS: ["kernelMergeSha", "kernelRepository", "readinessArtifactPath", "readinessArtifactSha256", "readinessAssertions"], IMMUTABILITY_KEYS: ["chainRef", "entries", "historicalApprovalBytes", "historicalApprovalSha256", "mutationAllowed"], READINESS_ASSERTIONS: { readinessStatus: "BLOCKED", verdict: "NO-GO", codeStartAllowed: false, runtimeCodeAllowed: false, runtimeStarted: false, runtimeImplemented: false, candidateEffective: false, promotionCurrentStep: 1, promotionStep2RecordedIn: "Actionplan EPOCH-04", promotionCircularityAvoided: true, promotionSelfHashRecorded: false }, ACTIVATION_SCOPE: { verdict: VERDICT, codeStartAllowed: true, runtimeCodeAllowed: true, runtimeImplementationStart: "NO", sdkReady: false, appBuildable: false, releaseAllowed: false, deployAllowed: false }, IMMOVABLE_FLOORS: { claudeAuthGate: "CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK", deploy: "NO", gitMode: "NONFORCE_NO_TAGS_CI_GATED", historicalApprovalMutation: "FORBIDDEN", platformProductWriter: "HUMAN_DEVELOPER_ONLY", release: "NO" } };
// biome-ignore format: the closed contract export surface stays compact for the shard budget
export const { ROOT_KEYS, ENTRY_KEYS, APPEND_PREREQUISITE_KEYS, SCOPE_KEYS, EVIDENCE_KEYS, IMMUTABILITY_KEYS, READINESS_ASSERTIONS, ACTIVATION_SCOPE, IMMOVABLE_FLOORS } = C;
// The complete EPOCH-04 normalized-text floor: exact keys, exact values. Pinning only the three
// superseded dimensions left a coherent rewrite of roles, auth gate, invocation, the no-MCP ban,
// Kernel pins, no-runtime-start, downstream stages, the Git floor, release/deploy or the verdict
// free to pass by recomputing bytes and both digests. EXCLUDED_TARGETS survives from EPOCH-03, so
// it is pinned here but is inherited, never a superseded dimension.
// biome-ignore format: the exact EPOCH-04 token floor stays compact for the shard budget
export const EPOCH04_TOKEN_FLOOR = { SOURCE: "DIRECT_USER_ADMIN_INSTRUCTION", SUPERSEDES: "EPOCH-03", SCOPE: "KERNEL_DEVELOPMENT_ACTIVATION_ONLY", CODEX: "MASTER_READ_ONLY_ORCHESTRATOR_FINAL_VERIFIER_GIT_EXECUTOR", KERNEL_RUNTIME_WRITER: "CLAUDE_ONLY_FAIL_CLOSED", ACTIONPLAN_WRITER: "CLAUDE_ONLY_FAIL_CLOSED", KERNEL_REVIEWER: "CLAUDE_ONLY_FAIL_CLOSED", CLAUDE_INVOCATION: "PANE_VISIBLE_AGENT_CLAUDE", FORBIDDEN_INVOCATION: "MCP_CLAUDE_IMPLEMENT", PLATFORM_PRODUCT_WRITER: "HUMAN_DEVELOPER_ONLY", KERNEL_MERGE: KERNEL_MERGE, READINESS_ARTIFACT_SHA256: READINESS_SHA256, CODE_START: "YES", RUNTIME_CODE: "YES", RUNTIME_IMPLEMENTATION_START: "NO", SDK_READY: "false", APP_BUILDABLE: "false", RELEASE_ALLOWED: "false", DEPLOY_ALLOWED: "false", DIRECT_MAIN_WRITE: "false", FORCE_GIT: "false", TAGGING: "false", EXCLUDED_TARGETS: "SDK,APP_CORE,APP,MODULE", VERDICT: "GO-KERNEL-DEVELOPMENT-ONLY" };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
// biome-ignore format: the normalized-text token table mirrors the chain validator's own reader
const tokenMap = (text) => new Map(String(text ?? "").split(";").map((s) => s.trim()).filter((s) => s.includes("=")).map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1)]));
// biome-ignore format: the audited EPOCH-04 activation validator stays compact for the shard budget
export function validateEpoch04Activation(record) {
  const errors = [];
  // biome-ignore format: the exact activation identity stays compact
  if (record.id !== "kernel-epoch-04-activation-2026-08-02" || record.status !== "approved-activation-pending-verification") errors.push("artifact identity drift");
  if (record.decisionRef !== EPOCH04) errors.push("epoch id drift");
  if (record.gapClosed !== false) errors.push("gap closure claim");
  // The activation binds exactly one Kernel merge and one readiness artifact digest.
  const evidence = record.evidence ?? {};
  if (evidence.kernelMergeSha !== KERNEL_MERGE) errors.push("kernel merge drift");
  if (evidence.kernelRepository !== KERNEL_REPOSITORY) errors.push("kernel repository drift");
  if (evidence.readinessArtifactSha256 !== READINESS_SHA256) errors.push("readiness digest drift");
  if (evidence.readinessArtifactPath !== READINESS_PATH) errors.push("readiness path drift");
  // Successor entry is seq 4 over EPOCH-03 and chains to its exact predecessor hash.
  const entry = record.successorEntry ?? {};
  if (entry.seq !== 4 || entry.supersedes !== 3) errors.push("successor sequence drift");
  if (entry.epochId !== EPOCH04 || entry.status !== "effective") errors.push("successor identity drift");
  if (entry.previousEntrySha256 !== EPOCH03_ENTRY_SHA256) errors.push("predecessor chain link drift");
  if (typeof entry.normalizedTextSha256 !== "string" || !/^[0-9a-f]{64}$/.test(entry.normalizedTextSha256)) errors.push("successor text digest malformed");
  if (entry.normalizedTextSha256 === EPOCH03_TEXT_SHA256) errors.push("successor reuses the EPOCH-03 text digest");
  // Sealed-entry completeness: every field a sealed entry carries, self-consistent in bytes/digest.
  if (entry.sourceType !== "direct-user-admin-instruction") errors.push("successor source type drift");
  if (entry.sourceRef !== null) errors.push("successor source ref fabricated");
  if (!same(entry.supersedesDimensions, ["codeStart", "runtimeCode", "verdict"])) errors.push("successor superseded dimension drift");
  if (entry.supersessionScope !== "KERNEL_DEVELOPMENT_ACTIVATION_ONLY") errors.push("successor scope drift");
  if (typeof entry.normalizedText !== "string" || Buffer.byteLength(entry.normalizedText ?? "", "utf8") !== EPOCH04_TEXT_BYTES || entry.normalizedTextBytes !== EPOCH04_TEXT_BYTES) errors.push("successor text bytes drift");
  if (createHash("sha256").update(String(entry.normalizedText ?? ""), "utf8").digest("hex") !== EPOCH04_TEXT_SHA256 || entry.normalizedTextSha256 !== EPOCH04_TEXT_SHA256) errors.push("successor text digest mismatch");
  // The scope token in the text and the entry's own scope field must agree, as validateHead
  // requires.
  if (typeof entry.normalizedText === "string" && !entry.normalizedText.includes(`SCOPE=${entry.supersessionScope};`)) errors.push("successor scope token drift");
  // Every declared dimension must be backed by its own token in the text, as the chain validator
  // checks.
    for (const [key, cell] of Object.entries(entry.dimensions ?? {})) if (!String(entry.normalizedText ?? "").includes(`${cell.token}=${cell.value}`)) errors.push(`successor dimension token drift:${key}`);
  // A dimension may only be redeclared if the entry says it supersedes it.
    for (const key of Object.keys(entry.dimensions ?? {})) if (!(entry.supersedesDimensions ?? []).includes(key)) errors.push(`successor dimension supersession missing:${key}`);
  // The normalized text may live in exactly one place, so no second copy can silently drift.
  if (record.chainBinding?.normalizedText !== undefined) errors.push("duplicate normalized text");
  // The closed token floor: exact keys, exact values. A coherent rewrite that also recomputes bytes
  // and both digests still fails here, because the text itself is pinned token by token.
  const tokens = tokenMap(entry.normalizedText);
  for (const [token, value] of Object.entries(EPOCH04_TOKEN_FLOOR)) if (tokens.get(token) !== value) errors.push(`epoch04 token floor drift:${token}`);
  for (const token of tokens.keys()) if (!Object.hasOwn(EPOCH04_TOKEN_FLOOR, token)) errors.push(`epoch04 token floor orphan:${token}`);
  // Inherited tokens survive from EPOCH-03; they are pinned but must never be claimed as
  // superseded.
  for (const token of INHERITED_TOKENS) if ((entry.supersedesDimensions ?? []).includes(token)) errors.push(`inherited token claimed superseded:${token}`);
  // The entry digest is the canonical one the shipped chain validator computes, not a self-claim.
  if (entry.entrySha256 !== entryDigest(entry)) errors.push("successor entry digest drift");
  // Sealed-entry completeness is not appendability. The record must say so and must enumerate every
  // amendment a real append still needs, or it overclaims what this shard delivered.
  const prerequisites = record.chainBinding?.appendPrerequisites ?? {};
  if (record.chainBinding?.appendableAsIs !== false) errors.push("append readiness overclaim");
  if (record.chainBinding?.sealedEntryFormComplete !== true) errors.push("sealed entry form claim missing");
  if (!same(Object.keys(prerequisites).sort(), APPEND_PREREQUISITE_KEYS)) errors.push("append prerequisite set drift");
    for (const [key, value] of Object.entries(prerequisites)) if (typeof value !== "string" || !value.trim()) errors.push(`append prerequisite unstated:${key}`);
  // Kernel development opens; runtime implementation start and every downstream stage do not.
  if (!same(record.activationScope, ACTIVATION_SCOPE)) errors.push("activation scope drift");
  if (record.activationScope?.runtimeImplementationStart !== "NO") errors.push("runtime implementation start opened");
  // biome-ignore format: the downstream floor stays shut whatever else the record says
  for (const key of ["sdkReady", "appBuildable", "releaseAllowed", "deployAllowed"]) if (record.activationScope?.[key] !== false) errors.push(`downstream ${key} opened`);
  // The current writer invocation is the Pane-visible, Claude-only, fail-closed one.
  const authority = record.authorityBoundary ?? {};
  if (authority.invocation !== INVOCATION) errors.push("invocation drift");
  if (!Array.isArray(authority.invocationForbidden) || !authority.invocationForbidden.includes(FORBIDDEN_INVOCATION)) errors.push("forbidden invocation missing");
  // biome-ignore format: the writer, product-writer and executor roles stay exactly as recorded
  if (authority.actionplanWriter !== "claude-only-fail-closed" || authority.kernelWriter !== "claude-only-fail-closed") errors.push("writer role drift");
  if (authority.platformProductWriter !== "human-developer-only") errors.push("platform product writer drift");
  if (authority.gitExecutor !== "codex") errors.push("git executor drift");
  if (authority.failClosed !== true) errors.push("fail-closed flag drift");
  // biome-ignore format: the per-invocation Claude account gate stays exact
  if (authority.claudeAuthGate?.authMethod !== "claude.ai" || authority.claudeAuthGate?.apiProvider !== "firstParty" || authority.claudeAuthGate?.subscriptionType !== "max") errors.push("claude auth gate drift");
  if (authority.claudeAuthGate?.perInvocation !== true || authority.claudeAuthGate?.cachedEvidenceAllowed !== false) errors.push("claude auth gate weakened");
  // Role correction: Codex writes no repository file. The append is a Claude writer action under
  // the Pane-visible invocation; Codex only verifies and then commits, pushes and merges.
  if (record.chainBinding?.appendWriter !== "claude-only-fail-closed") errors.push("append writer drift");
  if (record.chainBinding?.appendInvocation !== INVOCATION) errors.push("append invocation drift");
  if (record.chainBinding?.appendGitExecutor !== "codex") errors.push("append git executor drift");
  if (record.chainBinding?.appendExecutor !== undefined) errors.push("codex named as append executor");
  if (/Codex (executes|performs|writes) the append|Codex Git-executor step/.test(JSON.stringify(record))) errors.push("codex named as file writer");
  // Predecessor hashes and the historical approval are immutable.
  const immutability = record.predecessorImmutability ?? {};
  if (immutability.chainRef !== CHAIN_REF) errors.push("chain ref drift");
  if (immutability.mutationAllowed !== false) errors.push("predecessor mutation allowed");
  if (immutability.historicalApprovalSha256 !== APPROVAL_SHA256 || immutability.historicalApprovalBytes !== APPROVAL_BYTES) errors.push("historical approval drift");
  // biome-ignore format: each predecessor entry keeps the exact hash the chain already recorded
  const expected = [{ seq: 1, entrySha256: EPOCH01_ENTRY_SHA256 }, { seq: 2, entrySha256: EPOCH02_ENTRY_SHA256 }, { seq: 3, entrySha256: EPOCH03_ENTRY_SHA256 }];
  if (!same(immutability.entries?.map((row) => row.seq), [1, 2, 3])) errors.push("predecessor entry set drift");
  for (const row of immutability.entries ?? []) {
    const match = expected.find((item) => item.seq === row.seq);
    if (!match || row.entrySha256 !== match.entrySha256) errors.push(`predecessor entry ${row.seq} hash drift`);
  }
  // Floors this activation may never move.
    for (const [key, value] of Object.entries(IMMOVABLE_FLOORS)) if (record.chainBinding?.immovableFloors?.[key] !== value) errors.push(`immovable floor ${key} drift`);
  // The activation must say, in the record itself, which floors it moves and under what authority.
  // biome-ignore format: an unexplained floor change is a named rejection, not a silent one
  if (!same(record.chainBinding?.supersededFloors, ["codeStart", "runtimeCode", "verdict"])) errors.push("superseded floor set drift");
  if (record.chainBinding?.supersessionAuthority !== "direct-user-admin-instruction") errors.push("supersession authority drift");
  if (record.chainBinding?.chainHeadSeqAfterActivation !== 4) errors.push("chain head projection drift");
  // Two distinct chain-file digests are disclosed: the predecessor the Kernel candidate pinned at
  // its base commit, and the digest this shard projects. Conflating them would hide a drift.
  const binding = record.chainBinding ?? {};
  if (binding.predecessorChainFileSha256 !== PREDECESSOR_CHAIN_SHA256) errors.push("predecessor chain file digest drift");
  if (!String(binding.predecessorChainFileSource ?? "").includes(PREDECESSOR_CHAIN_BASE)) errors.push("predecessor chain file source drift");
  if (!String(binding.predecessorChainFilePinnedBy ?? "").includes(KERNEL_MERGE)) errors.push("predecessor chain file pin provenance drift");
  if (typeof binding.projectedChainFileSha256 !== "string" || !/^[0-9a-f]{64}$/.test(binding.projectedChainFileSha256)) errors.push("projected chain file digest malformed");
  if (binding.projectedChainFileSha256 === binding.predecessorChainFileSha256) errors.push("projected chain file digest conflated with predecessor");
  // The bound candidate's own content facts: step 1 is BLOCKED/NO-GO, step 2 is this record, and
  // the candidate never pins its own digest, so the promotion cannot close in a circle.
  const assertions = record.evidence?.readinessAssertions ?? {};
    for (const [key, value] of Object.entries(READINESS_ASSERTIONS)) if (assertions[key] !== value) errors.push(`readiness assertion drift:${key}`);
  return errors;
}
