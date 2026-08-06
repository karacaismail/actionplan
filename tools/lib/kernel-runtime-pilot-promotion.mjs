import { createHash } from "node:crypto";
import { canonicalJson } from "./kernel-effective-authority-chain.mjs";
// The GO-RUNTIME-PILOT promotion evaluator. It never treats the contract as its own authority: the
// frozen gate triples, their digest and the authority anchor are pinned here, so a contract forged
// together with a matching submission still fails. Everything fails closed, and GO-PRODUCTION is a
// rejection rather than an outcome this evaluator can ever reach.
export const CONTRACT_REF = "reports/kernel-runtime-pilot-promotion-contract-2026-08-06.json";
export const PROMOTION_VERDICT = "GO-RUNTIME-PILOT";
export const FORBIDDEN_VERDICT = "GO-PRODUCTION";
// The immutable frozen gate set: ten [order, id, definition] triples, this order, permanently.
// biome-ignore format: the frozen gate triple table stays compact for the shard budget
export const GATE_DEFINITIONS = [[1, "GRP-01", "authority/consumer sync"], [2, "GRP-02", "contract, dependency and Onion boundary lock"], [3, "GRP-03", "one pilot app/module/archetype scope"], [4, "GRP-04", "baseline, SLO, RTO, RPO"], [5, "GRP-05", "PostgreSQL, RLS, transaction, outbox, audit baseline"], [6, "GRP-06", "typed action/envelope, PDP, primitive contracts"], [7, "GRP-07", "generated SDK"], [8, "GRP-08", "golden-slice end-to-end evidence"], [9, "GRP-09", "security, rollback, independent verification"], [10, "GRP-10", "atomic promotion and human countersign"]];
export const GATE_IDS = GATE_DEFINITIONS.map(([, id]) => id);
// biome-ignore format: the pinned freeze digest of the table above stays on one line
export const EXPECTED_GATE_SET_SHA256 = "3f8c98150e66d2e9b4ea4f453eff58045fc0c16d069a4fa8d0f5d1650881b4f6";
// The immutable authority anchor, pinned here rather than read from the contract, so the contract
// cannot vouch for itself.
// biome-ignore format: the pinned authority anchor stays compact for the shard budget
export const EXPECTED_AUTHORITY = { actionplanCommit: "673a23c3093cf254d9d59b5c109f065f93416d29", chainRef: "reports/kernel-effective-authority-chain-2026-07-31.json", chainHeadSeq: 4, chainHeadEntrySha256: "90a0a9ba795fcff67d48829d9d0083cbac956e4d1b277527862fa19586228c37", chainSha256: "f2315ba09192e3614e272bb7256ae41a288f1a6fdc435cb67aca74954ec3a1b8", stateRef: "reports/kernel-governance-application-state-2026-08-01.json", kernelRepository: "metaframer-kernel", kernelCommit: "f62dc8e8cbacaa510aea1187212dc7171cbffa0a", kernelAccess: "read-only", currentVerdict: "GO-KERNEL-DEVELOPMENT-ONLY" };
// The only three buckets a post-freeze finding may land in; a fourth would be a new gate.
// biome-ignore format: the closed later-topic classification set stays compact for the shard budget
export const CLASSIFICATIONS = ["existing-gate-evidence", "post-pilot-backlog", "production-blocker"];
// The canonical freeze rule. Definitions are hashed with ids, so a gate cannot keep its name and
// quietly change its meaning.
const triples = (gates) => (gates ?? []).map((gate) => [gate?.order, gate?.id, gate?.definition]);
// biome-ignore format: the freeze rule stays one deterministic expression
export const freezeDigest = (gates) => createHash("sha256").update(canonicalJson(triples(gates)), "utf8").digest("hex");

// Judge one submission, returning every reason it failed rather than only the first, so it cannot be
// repaired one hidden rejection at a time.
export function evaluateRuntimePilotPromotion({ contract, submission } = {}) {
  const errors = [];
  const binding = contract?.authorityBinding ?? {};
  const rule = contract?.promotionRule ?? {};
  const given = submission ?? {};
  // The contract is judged against the pinned anchor BEFORE it is used as one, so a forged binding
  // matched by a forged submission dies where submission-vs-contract equality cannot help.
  // biome-ignore format: every pinned authority field is compared and named individually
  for (const [key, value] of Object.entries(EXPECTED_AUTHORITY)) if (binding[key] !== value) errors.push(`contract-authority-mismatch:${key}`);
  // Semantic freeze: the contract's triples must BE the frozen ones, so redefining or reordering
  // gates and recomputing a perfectly consistent digest over the result does not survive.
  // biome-ignore format: the semantic gate-set comparison stays one expression
  if (canonicalJson(triples(contract?.gates)) !== canonicalJson(GATE_DEFINITIONS)) errors.push("contract-gate-set-drift");
  // biome-ignore format: the frozen digest is pinned, not merely self-consistent
  if (contract?.gateSetSha256 !== EXPECTED_GATE_SET_SHA256) errors.push("contract-gate-set-hash-drift");
  // ...and the contract's stated digest must still match its own gate list.
  // biome-ignore format: the self-consistency check stays on one line
  if (contract?.gateSetSha256 !== freezeDigest(contract?.gates)) errors.push("contract-freeze-drift");
  // The submission must carry the same frozen gate set the contract froze.
  if (given.gateSetSha256 !== contract?.gateSetSha256) errors.push("gate-set-hash-drift");

  // Exactly the ten frozen gates: nothing unknown, nothing missing, nothing counted twice.
  const seen = new Map();
  for (const gate of given.gates ?? []) {
    const id = gate?.id;
    if (!GATE_IDS.includes(id)) errors.push(`unknown-gate:${id}`);
    else if (seen.has(id)) errors.push(`duplicate-gate:${id}`);
    else seen.set(id, gate);
  }
  for (const id of GATE_IDS) if (!seen.has(id)) errors.push(`missing-gate:${id}`);
  // 10/10 GREEN. Any other status is not green.
  // biome-ignore format: the green sweep names each gate that is not green
  for (const id of GATE_IDS) if (seen.has(id) && seen.get(id).status !== "GREEN") errors.push(`gate-not-green:${id}`);

  // The submission's pins must match the contract's, which the anchor above already validated.
  // biome-ignore format: the three pinned identities stay compact for the shard budget
  if (given.actionplanCommit !== binding.actionplanCommit) errors.push("actionplan-commit-mismatch");
  // biome-ignore format: the authority head pin stays on one line
  if (given.chainHeadEntrySha256 !== binding.chainHeadEntrySha256) errors.push("authority-head-mismatch");
  if (given.kernelCommit !== binding.kernelCommit) errors.push("kernel-commit-mismatch");

  // Independent verification: the writer may never verify or close its own promotion, whether it
  // says so or simply presents itself under the verifier's name.
  const verifier = given.independentVerifier;
  if (!verifier?.id) errors.push("independent-verifier-missing");
  // biome-ignore format: self-verification is caught by identity and by the claim alike
  else if (verifier.id === given.writer?.id || verifier.independentOfWriter !== true) errors.push("self-verification");
  // biome-ignore format: a contract that permits self-closure is refused rather than obeyed
  if (rule.writerMaySelfClose === true || rule.writerMaySelfVerify === true) errors.push("self-closure-permitted");
  // The human countersign defaults to false: absent, unsigned and malformed are the same answer.
  if (given.humanCountersign?.signed !== true) errors.push("countersign-missing");
  // GO-RUNTIME-PILOT is the only reachable verdict; a production claim is refused, not downgraded.
  // biome-ignore format: production is never an outcome this evaluator can reach
  if (given.targetVerdict === FORBIDDEN_VERDICT) errors.push("production-promotion-claimed");
  // biome-ignore format: any other target verdict is named rather than silently coerced
  else if (given.targetVerdict !== PROMOTION_VERDICT) errors.push(`unknown-target-verdict:${given.targetVerdict}`);

  const promotionAllowed = errors.length === 0;
  return { errors, promotionAllowed, verdict: promotionAllowed ? PROMOTION_VERDICT : null };
}

// Classify a topic found after the freeze. A request for a new promotion gate is named and refused
// rather than quietly folded into one of the three buckets.
export function classifyLaterTopic({ classification } = {}) {
  const errors = [];
  if (classification === "new-promotion-gate") errors.push("new-promotion-gate-forbidden");
  // biome-ignore format: the unknown-bucket rejection stays on one line
  else if (!CLASSIFICATIONS.includes(classification)) errors.push(`unknown-classification:${classification}`);
  return { errors, classification, createsGate: false };
}
