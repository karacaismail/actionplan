import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DECISION_REF = "reports/kernel-public-delivery-decision-2026-08-21.json";
export const SCOPE = "M0_PUBLIC_ONLY_CLOSURE";

// biome-ignore format: the pinned public-only repository policy stays compact for the shard budget.
const REPOSITORY_VISIBILITY = { kernelGithubRepo: "PUBLIC_ONLY", mainBranch: "protected", retiredAssumptions: ["private-repository", "team-plan-repository", "private-reusable-workflow"] };
export const OWNER_CREDENTIAL_GATE = "OWNER_EXPLICIT_CURRENT_CREDENTIAL_USE_MANDATED";
export const OWNER_PROTECTION_GATE = "OWNER_RETAINED_CREDENTIAL_RISK_DECISION_NO_REASK";
export const REVIEWER_IDENTITY = "FRESH_CLAUDE_SESSION_PINNED_AT_REVIEW";
export const MANUAL_RISK_ACCEPTANCE_EXPIRY = "NONE";
export const ACTIONS_PUBLIC_GUARD_HANDOFF = "M1";
export const FASTAPI_DEVELOPMENT_BASE = "NEVER_DEVELOPMENT_BASE";
// biome-ignore format: M0 closes documentation-only; every activation flag stays closed.
const ACTIVATION_SCOPE = { codeStartAllowed: false, runtimeCodeAllowed: false, releaseAllowed: false, deployAllowed: false };
// biome-ignore format: the five owner-comprehension fields ADR-0027 AP-OC1 requires stay compact.
export const OWNER_COMPREHENSION_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
export const NO_SEPARATE_NARRATIVE_NON_GOAL =
  "no separate narrative standard or standards-catalog entry: MASTER scoped M0 to this decision record, its guard and its test only, so the human-readable meaning of the decision lives here, inline, not in docs/standards/ or src/data/standards/";

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function validatePublicDeliveryDecision(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["public-delivery-decision-missing"];
  if (record.schemaVersion !== "1.0.0") errors.push("schema-version-drift");
  if (record.id !== "kernel-public-delivery-decision-2026-08-21") errors.push("record-identity-drift");
  if (record.status !== "effective") errors.push("record-status-drift");
  if (record.scope !== SCOPE) errors.push("record-scope-drift");
  const decisions = record.decisions ?? {};
  if (!same(decisions.repositoryVisibility, REPOSITORY_VISIBILITY))
    errors.push("repository-visibility-drift");
  if (decisions.ownerCredentialGate !== OWNER_CREDENTIAL_GATE)
    errors.push("owner-credential-gate-drift");
  if (decisions.ownerProtectionGate !== OWNER_PROTECTION_GATE)
    errors.push("owner-protection-gate-drift");
  if (decisions.reviewerIdentity !== REVIEWER_IDENTITY) errors.push("reviewer-identity-drift");
  if (decisions.manualRiskAcceptanceExpiry !== MANUAL_RISK_ACCEPTANCE_EXPIRY)
    errors.push("manual-risk-acceptance-expiry-drift");
  if (decisions.actionsPublicGuardHandoff !== ACTIONS_PUBLIC_GUARD_HANDOFF)
    errors.push("actions-public-guard-handoff-drift");
  if (decisions.developmentBase?.fastapi !== FASTAPI_DEVELOPMENT_BASE)
    errors.push("fastapi-development-base-drift");
  if (!same(decisions.activationScope, ACTIVATION_SCOPE)) errors.push("activation-scope-drift");
  if (!Array.isArray(record.nonGoals) || !record.nonGoals.length)
    errors.push("non-goals-missing");
  if (!record.nonGoals?.includes(NO_SEPARATE_NARRATIVE_NON_GOAL))
    errors.push("no-separate-narrative-non-goal-missing");
  const owner = record.ownerComprehension ?? {};
  for (const field of OWNER_COMPREHENSION_FIELDS)
    if (typeof owner[field] !== "string" || !owner[field].trim())
      errors.push(`owner-comprehension-field-missing:${field}`);
  if (!record.rollback || typeof record.rollback.trigger !== "string" || !record.rollback.trigger)
    errors.push("rollback-missing");
  return [...new Set(errors)];
}

export const loadPublicDeliveryDecision = () =>
  JSON.parse(fs.readFileSync(path.join(ROOT, DECISION_REF), "utf8"));

let cached = null;
export function effectivePublicDeliveryDecision() {
  if (cached) return cached;
  const record = loadPublicDeliveryDecision();
  const errors = validatePublicDeliveryDecision(record);
  if (errors.length) throw new Error(`[kernel-public-delivery-guard] ${errors.join(",")}`);
  cached = record.decisions;
  return cached;
}
