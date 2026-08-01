import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const EFFECTIVE_AUTHORITY_CHAIN_REF =
  "reports/kernel-effective-authority-chain-2026-07-31.json";
export const HISTORICAL_CLOSURE_REF = "reports/kernel-governance-closure-authority-2026-07-31.json";
export const HISTORICAL_SELECTION_POINTER = "/approval/normalizedSelection";
export const HISTORICAL_SELECTION_BYTES = 691;
export const HISTORICAL_SELECTION_SHA256 =
  "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
export const EPOCH02_TEXT_BYTES = 870;
export const EPOCH02_TEXT_SHA256 =
  "239711dc77b396dd51bc64a02fab9f32a47804c885490e3c644b487b2343c2df";
const HANDOFF_REF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const UNIVERSE_REF = "tools/lib/kernel-node-universe.mjs";
const GATE_REF = "tools/agents/check-kernel-governance.mjs";
const CONTRACT_REF = "AGENTS.md";

// biome-ignore format: the closed authority dimension registry stays compact for the shard budget.
export const AUTHORITY_DIMENSIONS = ["actionplanReviewer", "actionplanWriter", "claudeAuthGate", "codeStart", "deploy", "finalVerifier", "gitExecutor", "gitMode", "historicalApprovalMutation", "kernelReviewer", "kernelWriter", "orchestrator", "parallelism", "platformProductWriter", "release", "requirementsFirstPass", "runtimeCode", "technicalDecisions", "verdict", "workerAgentPool"];
// biome-ignore format: the non-supersedable floor table stays compact for the shard budget.
export const NON_SUPERSEDABLE_FLOORS = { claudeAuthGate: "CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK", codeStart: "NO", deploy: "NO", gitMode: "NONFORCE_NO_TAGS_CI_GATED", historicalApprovalMutation: "FORBIDDEN", platformProductWriter: "HUMAN_DEVELOPER_ONLY", release: "NO", runtimeCode: "NO", verdict: "NO-GO" };
// biome-ignore format: the Git floor table stays compact for the shard budget.
export const GIT_FLOOR = { authorizedNow: false, ciRequired: true, directDefaultBranchPush: false, force: false, reviewRequired: true, tags: false, workerGitMutationAllowed: false };
// biome-ignore format: the Claude-only role dimensions stay compact for the shard budget.
export const CLAUDE_ROLE_DIMENSIONS = ["actionplanReviewer", "actionplanWriter", "kernelReviewer", "kernelWriter", "requirementsFirstPass", "workerAgentPool"];
// biome-ignore format: the deterministic epoch-token to D01 boundary mapping stays compact.
const BOUNDARY_MAP = { actionplanWriter: { CLAUDE_ONLY_FAIL_CLOSED: "claude-only-fail-closed" }, kernelWriter: { CLAUDE_ONLY_FAIL_CLOSED: "claude-only-fail-closed" }, claudeAuthGate: { CLAUDE_AI_FIRSTPARTY_MAX_PER_INVOCATION_NO_FALLBACK: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max", perInvocation: true, cachedEvidenceAllowed: false } }, platformProductWriter: { HUMAN_DEVELOPER_ONLY: "human-developer-only" }, gitExecutor: { CODEX_EXPLICIT_USER_AUTH_ONLY: "codex" }, codeStart: { NO: false }, runtimeCode: { NO: false }, release: { NO: false }, deploy: { NO: false }, verdict: { "NO-GO": "NO-GO" } };
// biome-ignore format: the derived boundary key order matches the applied D7 contract byte order.
const BOUNDARY_KEYS = { actionplanWriter: "actionplanWriter", kernelWriter: "kernelWriter", claudeAuthGate: "claudeAuthGate", platformProductWriter: "platformProductWriter", gitExecutor: "gitExecutor", codeStart: "codeStartAllowed", runtimeCode: "runtimeCodeAllowed", release: "releaseAllowed", deploy: "deployAllowed", verdict: "verdict" };

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const byteOrder = (left, right) =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  // biome-ignore format: the canonical NFC object encoder stays one deterministic expression.
  if (value !== null && typeof value === "object") return `{${Object.keys(value).map((key) => key.normalize("NFC")).sort(byteOrder).map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  return JSON.stringify(value === undefined ? null : value);
};

export const canonicalJson = (value) => canonical(value);
export const entryDigest = (entry) => {
  const { entrySha256: _omitted, ...hashed } = entry ?? {};
  return sha256(canonicalJson(hashed));
};
export const chainDigest = (entries) =>
  sha256(`${(entries ?? []).map((entry) => entry?.entrySha256 ?? "").join("\n")}\n`);

// biome-ignore format: the RFC 6901 pointer walk stays one deterministic reduction.
const resolvePointer = (document, pointer) => String(pointer ?? "").split("/").slice(1).reduce((node, token) => (node == null ? undefined : node[token.replaceAll("~1", "/").replaceAll("~0", "~")]), document);

// biome-ignore format: the normalized-text token table stays one deterministic expression.
const tokenMap = (text) => new Map(String(text ?? "").split(";").map((segment) => segment.trim()).filter((segment) => segment.includes("=")).map((segment) => [segment.slice(0, segment.indexOf("=")), segment.slice(segment.indexOf("=") + 1)]));

export function resolveAuthorityDimensions(chain) {
  const errors = [];
  const resolved = {};
  const registry = new Set(AUTHORITY_DIMENSIONS);
  for (const entry of chain?.entries ?? []) {
    const declared = entry?.dimensions ?? {};
    const superseded = new Set(entry?.supersedesDimensions ?? []);
    for (const key of superseded) {
      if (!Object.hasOwn(resolved, key))
        errors.push(`authority-dimension-unresolved-supersession:${key}`);
      if (!Object.hasOwn(declared, key))
        errors.push(`authority-dimension-supersession-without-value:${key}`);
    }
    for (const [key, cell] of Object.entries(declared)) {
      if (!registry.has(key)) {
        errors.push(`authority-dimension-orphan:${key}`);
        continue;
      }
      if (Object.hasOwn(resolved, key) && !superseded.has(key))
        errors.push(`authority-dimension-overlap:${key}`);
      const value = cell?.value;
      if (typeof value !== "string" || !value.trim() || /tbd|defer|unknown|pending/i.test(value))
        errors.push(`authority-dimension-unresolved-value:${key}`);
      resolved[key] = { seq: entry?.seq, token: cell?.token, value };
    }
  }
  for (const key of AUTHORITY_DIMENSIONS)
    if (!Object.hasOwn(resolved, key)) errors.push(`authority-dimension-omission:${key}`);
  return { errors, resolved };
}

export function deriveAuthorityBoundary(chain) {
  const { resolved } = resolveAuthorityDimensions(chain);
  const errors = [];
  const boundary = {};
  for (const [key, target] of Object.entries(BOUNDARY_KEYS)) {
    const value = resolved[key]?.value;
    const mapped = value === undefined ? undefined : BOUNDARY_MAP[key]?.[value];
    if (mapped === undefined) {
      errors.push(`derived-boundary-unmapped:${key}:${value ?? "missing"}`);
      continue;
    }
    boundary[target] = structuredClone(mapped);
  }
  return { errors, boundary };
}

const validateSequence = (entries, errors) => {
  const seen = new Set();
  entries.forEach((entry, index) => {
    const expectedSeq = index + 1;
    if (seen.has(entry?.seq)) errors.push(`duplicate-epoch-seq:${entry?.seq}`);
    seen.add(entry?.seq);
    // biome-ignore format: the exact gapped/reordered seq oracle stays compact.
    if (entry?.seq !== expectedSeq) errors.push(Number(entry?.seq) > expectedSeq ? `gapped-epoch-seq:${entry?.seq}` : `reordered-epoch-seq:${entry?.seq}`);
    if (entryDigest(entry) !== entry?.entrySha256) errors.push(`entry-digest-drift:${entry?.seq}`);
    const previous = index ? entries[index - 1] : null;
    if ((entry?.previousEntrySha256 ?? null) !== (previous ? previous.entrySha256 : null))
      errors.push(index ? `broken-previous-link:${entry?.seq}` : "genesis-previous-link-drift");
    if ((entry?.supersedes ?? null) !== (previous ? previous.seq : null))
      errors.push(index ? `epoch-supersession-fork:${entry?.seq}` : "genesis-supersession-drift");
    if (typeof entry?.supersedes === "number" && entry.supersedes >= entry.seq)
      errors.push(`epoch-supersession-cycle:${entry.seq}`);
  });
};

const validateHistory = (chain, closure, errors) => {
  const genesis = chain.entries[0];
  const ref = genesis?.normalizedTextRef ?? {};
  // biome-ignore format: the exact genesis reference contract stays compact.
  if (ref.path !== HISTORICAL_CLOSURE_REF || ref.jsonPointer !== HISTORICAL_SELECTION_POINTER || genesis?.sourceRef !== HISTORICAL_CLOSURE_REF || genesis?.sourceType !== "user-admin-gate-approval") errors.push("genesis-reference-replacement");
  if (Object.hasOwn(genesis ?? {}, "normalizedText")) errors.push("genesis-text-copy-forbidden");
  // biome-ignore format: the historical invariant mirror stays compact for the shard budget.
  if (!same(chain.historicalInvariant, { path: HISTORICAL_CLOSURE_REF, jsonPointer: HISTORICAL_SELECTION_POINTER, bytes: HISTORICAL_SELECTION_BYTES, sha256: HISTORICAL_SELECTION_SHA256, mutation: "FORBIDDEN" })) errors.push("historical-invariant-drift");
  const text = resolvePointer(closure, ref.jsonPointer ?? HISTORICAL_SELECTION_POINTER);
  if (typeof text !== "string") {
    errors.push("historical-text-unresolvable");
    return null;
  }
  if (
    Buffer.byteLength(text, "utf8") !== HISTORICAL_SELECTION_BYTES ||
    ref.bytes !== HISTORICAL_SELECTION_BYTES
  )
    errors.push("historical-text-bytes-drift");
  if (sha256(text) !== HISTORICAL_SELECTION_SHA256 || ref.sha256 !== HISTORICAL_SELECTION_SHA256)
    errors.push("historical-text-digest-drift");
  if (JSON.stringify(chain).includes(text)) errors.push("genesis-text-copy-forbidden");
  return text;
};

const validateHead = (chain, errors) => {
  const head = chain.entries.at(-1);
  if (head?.status !== "effective") errors.push("effective-epoch-not-head");
  if (chain.entries.filter((entry) => entry?.status === "effective").length !== 1)
    errors.push("effective-epoch-count-drift");
  if (head?.epochId !== "AUTHORITY-SUPERSESSION-02") errors.push("epoch-identity-drift");
  const text = head?.normalizedText;
  if (typeof text !== "string") {
    errors.push("epoch-text-missing");
    return head;
  }
  if (
    Buffer.byteLength(text, "utf8") !== EPOCH02_TEXT_BYTES ||
    head.normalizedTextBytes !== EPOCH02_TEXT_BYTES
  )
    errors.push("epoch-text-bytes-drift");
  if (sha256(text) !== EPOCH02_TEXT_SHA256 || head.normalizedTextSha256 !== EPOCH02_TEXT_SHA256)
    errors.push("epoch-text-digest-drift");
  const tokens = tokenMap(text);
  if (
    tokens.get("SOURCE") !== "DIRECT_USER_ADMIN_INSTRUCTION" ||
    head.sourceType !== "direct-user-admin-instruction"
  )
    errors.push("epoch-source-type-drift");
  if (head.sourceRef !== null) errors.push("epoch-source-ref-fabricated");
  if (tokens.get("SUPERSEDES") !== "EPOCH-01") errors.push("epoch-supersession-token-drift");
  if (tokens.get("SCOPE") !== head.supersessionScope) errors.push("epoch-scope-drift");
  return head;
};

const validateFloors = (chain, closure, resolved, errors) => {
  if (!same(chain.nonSupersedableFloors, NON_SUPERSEDABLE_FLOORS))
    errors.push("floor-registry-drift");
  for (const [key, value] of Object.entries(NON_SUPERSEDABLE_FLOORS))
    if (resolved[key]?.value !== value) errors.push(`authority-floor-violation:${key}`);
  for (const [key, value] of Object.entries(GIT_FLOOR))
    if (chain.gitFloor?.[key] !== value) errors.push(`git-floor-violation:${key}`);
  const git = closure?.authorityBoundary?.gitAuthorization ?? {};
  for (const key of ["force", "tags", "directDefaultBranchPush"])
    if (git[key] !== false) errors.push(`historical-git-floor-divergence:${key}`);
  for (const key of ["ciRequired", "reviewRequired"])
    if (git[key] !== true) errors.push(`historical-git-floor-divergence:${key}`);
  if (closure?.authorityBoundary?.workerGitMutationAllowed !== false)
    errors.push("historical-git-floor-divergence:workerGitMutationAllowed");
};

const validateOrchestration = (chain, resolved, errors) => {
  const policy = chain.orchestrationPolicy ?? {};
  const writers = [resolved.actionplanWriter?.value, resolved.kernelWriter?.value];
  // biome-ignore format: the exact repo-writer floor stays compact.
  if (policy.codexRepoWriter !== false || writers.some((value) => /CODEX/.test(String(value ?? "")))) errors.push("codex-repo-writer-enabled");
  for (const key of CLAUDE_ROLE_DIMENSIONS)
    if (resolved[key]?.value !== "CLAUDE_ONLY_FAIL_CLOSED") errors.push(`claude-role-loss:${key}`);
  if (policy.claudeSelfDelegationAllowed !== false) errors.push("claude-self-delegation-enabled");
  // biome-ignore format: the exact single-shared-writer floor stays compact.
  if (policy.concurrentRepoWriters !== 1 || policy.writerLease !== "single-repo-writer" || resolved.parallelism?.value !== "PANE_MULTI_AGENT_SINGLE_SHARED_WRITER") errors.push("shared-writer-parallelism-enabled");
  // biome-ignore format: the exact Codex orchestration role contract stays compact.
  if (policy.codexExternalDirectiveWriter !== true || policy.codexFinalVerifier !== "read-only" || resolved.finalVerifier?.value !== "CODEX_READ_ONLY" || resolved.orchestrator?.value !== "MASTER_ORCHESTRATOR_REQUIREMENTS_GAP_REVIEW_DIRECTIVE_FINAL_VERIFIER") errors.push("codex-orchestration-role-drift");
  if (!same(policy.claudeRoles, CLAUDE_ROLE_DIMENSIONS)) errors.push("claude-role-registry-drift");
};

const validateConsumers = (chain, handoff, universeBoundary, boundary, errors) => {
  // biome-ignore format: the consumer binding mirror stays compact for the shard budget.
  if (!same(chain.consumerBindings, { handoffRef: HANDOFF_REF, universeRef: UNIVERSE_REF, gateRef: GATE_REF, contractRef: CONTRACT_REF })) errors.push("consumer-binding-drift");
  if (!same(chain.effectiveAuthorityBoundary, boundary)) errors.push("derived-boundary-drift");
  if (universeBoundary !== undefined && !same(universeBoundary, boundary))
    errors.push("universe-authority-divergence");
  if (!handoff) return;
  const effective = handoff.provenance?.effectiveAuthority;
  if (!effective) errors.push("handoff-effective-authority-missing");
  else {
    if (effective.ref !== EFFECTIVE_AUTHORITY_CHAIN_REF)
      errors.push("handoff-effective-authority-ref-drift");
    if (effective.seq !== chain.chainHeadSeq) errors.push("handoff-effective-authority-seq-drift");
    if (effective.chainHeadSha256 !== chain.chainHeadEntrySha256)
      errors.push("handoff-effective-authority-chain-head-drift");
    if (effective.normalizedTextSha256 !== EPOCH02_TEXT_SHA256)
      errors.push("handoff-effective-authority-text-digest-drift");
  }
  const approval = handoff.provenance?.approval ?? {};
  // biome-ignore format: the exact preserved historical approval ref stays compact.
  if (approval.gateId !== "GATE-01" || approval.authority !== "user-admin" || approval.normalizedSelectionSha256 !== HISTORICAL_SELECTION_SHA256) errors.push("handoff-historical-approval-ref-overwritten");
  if (!same(handoff.authorityBoundary, boundary)) errors.push("handoff-authority-divergence");
};

// biome-ignore format: the validator entry contract stays on one line.
export function validateKernelEffectiveAuthorityChain({ chain, closure, handoff, universeBoundary } = {}) {
  if (!chain || typeof chain !== "object" || !Array.isArray(chain.entries) || !chain.entries.length)
    return [`effective-authority-chain-missing:${EFFECTIVE_AUTHORITY_CHAIN_REF}`];
  const errors = [];
  // biome-ignore format: the exact append-only chain identity stays compact.
  if (chain.schemaVersion !== "1.0.0" || chain.id !== "kernel-effective-authority-chain-2026-07-31" || chain.status !== "effective" || chain.appendOnly !== true) errors.push("chain-identity-drift");
  if (!same(chain.dimensionRegistry, AUTHORITY_DIMENSIONS)) errors.push("dimension-registry-drift");
  const historicalText = validateHistory(chain, closure, errors);
  const head = validateHead(chain, errors);
  validateSequence(chain.entries, errors);
  if (chain.chainHeadSeq !== head?.seq) errors.push("chain-head-seq-drift");
  if (chain.chainHeadEntrySha256 !== head?.entrySha256) errors.push("chain-head-digest-drift");
  if (chain.chainSha256 !== chainDigest(chain.entries)) errors.push("chain-digest-drift");
  chain.entries.forEach((entry, index) => {
    const tokens = tokenMap(index === 0 ? historicalText : entry?.normalizedText);
    for (const [key, cell] of Object.entries(entry?.dimensions ?? {}))
      if (tokens.get(cell?.token) !== cell?.value)
        errors.push(`authority-dimension-token-drift:${entry?.seq}:${key}`);
  });
  const { errors: dimensionErrors, resolved } = resolveAuthorityDimensions(chain);
  errors.push(...dimensionErrors);
  validateFloors(chain, closure, resolved, errors);
  validateOrchestration(chain, resolved, errors);
  const derived = deriveAuthorityBoundary(chain);
  errors.push(...derived.errors);
  validateConsumers(chain, handoff, universeBoundary, derived.boundary, errors);
  return [...new Set(errors)];
}

export const loadEffectiveAuthorityChain = () =>
  JSON.parse(fs.readFileSync(path.join(ROOT, EFFECTIVE_AUTHORITY_CHAIN_REF), "utf8"));

let cachedEffectiveAuthority = null;
export function effectiveD01Authority() {
  if (cachedEffectiveAuthority) return cachedEffectiveAuthority;
  const chain = loadEffectiveAuthorityChain();
  const { errors, boundary } = deriveAuthorityBoundary(chain);
  if (errors.length) throw new Error(`[kernel-effective-authority-chain] ${errors.join(",")}`);
  cachedEffectiveAuthority = {
    boundary,
    seq: chain.chainHeadSeq,
    chainHeadSha256: chain.chainHeadEntrySha256,
    normalizedTextSha256: chain.entries.at(-1)?.normalizedTextSha256,
  };
  return cachedEffectiveAuthority;
}
