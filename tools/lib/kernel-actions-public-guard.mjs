import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const DECISION_REF = "reports/kernel-actions-public-guard-decision-2026-08-21.json";
export const SCOPE = "M1_PUBLIC_ACTIONS_GUARD";

export const OWNER_COMPREHENSION_FIELDS = [
  "once",
  "simdi",
  "fark",
  "kullaniciYolculugu",
  "kalanEngel",
];
export const NO_LIVE_WORKFLOW_NON_GOAL =
  "no live workflow YAML, no CI wiring, no GitHub mutations: M1 scopes to this decision record, its guard and its test only — the reusable-workflow contract this record describes has no runtime instance yet";

// biome-ignore format: the pinned fork-safety contract stays compact for the shard budget.
const FORK_SAFETY = { pullRequestTargetTrigger: "FORBIDDEN", pullRequestTriggerOnly: "REQUIRED", forkPrDefaultToken: "READ_ONLY" };
// biome-ignore format: the secretless gate stays compact.
const SECRETLESS = { secretsUsedInForkTriggeredWorkflows: "NEVER", envSecretRefs: [] };
// biome-ignore format: the SHA-pinning contract stays compact.
const SHA_PINNING = { actionRefStyle: "FULL_COMMIT_SHA_ONLY", floatingTagsAllowed: false, vettedThirdPartyActionsAllowed: true, thirdPartyActionsRequireShaPin: true };
export const DEFAULT_WORKFLOW_PERMISSIONS = "READ_ONLY";
// biome-ignore format: M1 closes documentation-only; every activation flag stays closed.
const ACTIVATION_SCOPE = { codeStartAllowed: false, runtimeCodeAllowed: false, releaseAllowed: false, deployAllowed: false, ciWiringAllowed: false };

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function validateActionsPublicGuardDecision(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["actions-public-guard-decision-missing"];
  if (record.schemaVersion !== "1.0.0") errors.push("schema-version-drift");
  if (record.id !== "kernel-actions-public-guard-decision-2026-08-21")
    errors.push("record-identity-drift");
  if (record.status !== "effective") errors.push("record-status-drift");
  if (record.scope !== SCOPE) errors.push("record-scope-drift");

  const decisions = record.decisions ?? {};

  const forkSafety = decisions.forkSafety ?? {};
  if (
    forkSafety.pullRequestTargetTrigger !== FORK_SAFETY.pullRequestTargetTrigger ||
    forkSafety.pullRequestTriggerOnly !== FORK_SAFETY.pullRequestTriggerOnly
  )
    errors.push("fork-safety-trigger-drift");
  if (forkSafety.forkPrDefaultToken !== FORK_SAFETY.forkPrDefaultToken)
    errors.push("fork-pr-default-token-drift");

  const secretless = decisions.secretless ?? {};
  if (
    secretless.secretsUsedInForkTriggeredWorkflows !==
    SECRETLESS.secretsUsedInForkTriggeredWorkflows
  )
    errors.push("secretless-gate-drift");
  if (!Array.isArray(secretless.envSecretRefs) || secretless.envSecretRefs.length)
    errors.push("secretless-env-refs-present");

  const shaPinning = decisions.shaPinning ?? {};
  if (shaPinning.floatingTagsAllowed !== SHA_PINNING.floatingTagsAllowed)
    errors.push("sha-pinning-floating-tags-drift");
  if (shaPinning.actionRefStyle !== SHA_PINNING.actionRefStyle)
    errors.push("sha-pinning-ref-style-drift");
  if (shaPinning.vettedThirdPartyActionsAllowed !== SHA_PINNING.vettedThirdPartyActionsAllowed)
    errors.push("sha-pinning-third-party-drift");
  if (shaPinning.thirdPartyActionsRequireShaPin !== SHA_PINNING.thirdPartyActionsRequireShaPin)
    errors.push("sha-pinning-third-party-requires-pin-drift");

  const permissions = decisions.permissions ?? {};
  if (permissions.defaultWorkflowPermissions !== DEFAULT_WORKFLOW_PERMISSIONS)
    errors.push("default-permissions-drift");
  if (permissions.topLevelPermissionsBlockRequired !== true)
    errors.push("top-level-permissions-block-drift");

  const reusableWorkflow = decisions.reusableWorkflow ?? {};
  if (reusableWorkflow.existsToday !== false) errors.push("reusable-workflow-exists-today-drift");
  if (reusableWorkflow.contractOnly !== true) errors.push("reusable-workflow-contract-only-drift");

  if (!same(decisions.activationScope, ACTIVATION_SCOPE)) errors.push("activation-scope-drift");

  if (!Array.isArray(record.nonGoals) || !record.nonGoals.length) errors.push("non-goals-missing");
  if (!record.nonGoals?.includes(NO_LIVE_WORKFLOW_NON_GOAL))
    errors.push("no-live-workflow-non-goal-missing");

  const owner = record.ownerComprehension ?? {};
  for (const field of OWNER_COMPREHENSION_FIELDS)
    if (typeof owner[field] !== "string" || !owner[field].trim())
      errors.push(`owner-comprehension-field-missing:${field}`);

  if (!record.rollback || typeof record.rollback.trigger !== "string" || !record.rollback.trigger)
    errors.push("rollback-missing");

  return [...new Set(errors)];
}

export const loadActionsPublicGuardDecision = () =>
  JSON.parse(fs.readFileSync(path.join(ROOT, DECISION_REF), "utf8"));

let cached = null;
export function effectiveActionsPublicGuardDecision() {
  if (cached) return cached;
  const record = loadActionsPublicGuardDecision();
  const errors = validateActionsPublicGuardDecision(record);
  if (errors.length) throw new Error(`[kernel-actions-public-guard] ${errors.join(",")}`);
  cached = record.decisions;
  return cached;
}
