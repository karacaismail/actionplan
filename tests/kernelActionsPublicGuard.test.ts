import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECISION = "reports/kernel-actions-public-guard-decision-2026-08-21.json";
const VALIDATOR = "tools/lib/kernel-actions-public-guard.mjs";

const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const lib = () => import(path.join(ROOT, VALIDATOR));

describe("kernel-actions-public-guard — M1 public-only Actions guard decision", () => {
  it("accepts the canonical decision record with zero errors", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    expect(validateActionsPublicGuardDecision(readJson(DECISION))).toEqual([]);
  });

  it("fails closed on a missing or malformed record", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    expect(validateActionsPublicGuardDecision(undefined)).toEqual([
      "actions-public-guard-decision-missing",
    ]);
    expect(validateActionsPublicGuardDecision(null)).toEqual([
      "actions-public-guard-decision-missing",
    ]);
  });

  it("rejects pull_request_target being allowed for fork PRs", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.forkSafety.pullRequestTargetTrigger = "ALLOWED";
    expect(validateActionsPublicGuardDecision(mutated)).toContain("fork-safety-trigger-drift");
  });

  it("rejects a fork PR default token that is not read-only", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.forkSafety.forkPrDefaultToken = "READ_WRITE";
    expect(validateActionsPublicGuardDecision(mutated)).toContain("fork-pr-default-token-drift");
  });

  it("rejects any secret being referenced from a fork-triggered workflow", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.secretless.secretsUsedInForkTriggeredWorkflows = "ALLOWED";
    expect(validateActionsPublicGuardDecision(mutated)).toContain("secretless-gate-drift");

    const withRef = clone(readJson(DECISION));
    withRef.decisions.secretless.envSecretRefs = ["MY_SECRET"];
    expect(validateActionsPublicGuardDecision(withRef)).toContain("secretless-env-refs-present");
  });

  it("rejects a floating-tag or non-SHA action reference policy", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const floating = clone(readJson(DECISION));
    floating.decisions.shaPinning.floatingTagsAllowed = true;
    expect(validateActionsPublicGuardDecision(floating)).toContain(
      "sha-pinning-floating-tags-drift",
    );

    const style = clone(readJson(DECISION));
    style.decisions.shaPinning.actionRefStyle = "MAJOR_VERSION_TAG";
    expect(validateActionsPublicGuardDecision(style)).toContain("sha-pinning-ref-style-drift");
  });

  it("allows vetted third-party actions only when SHA-pin is still required", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const notAllowed = clone(readJson(DECISION));
    notAllowed.decisions.shaPinning.vettedThirdPartyActionsAllowed = false;
    expect(validateActionsPublicGuardDecision(notAllowed)).toContain(
      "sha-pinning-third-party-drift",
    );

    const noPinRequirement = clone(readJson(DECISION));
    noPinRequirement.decisions.shaPinning.thirdPartyActionsRequireShaPin = false;
    expect(validateActionsPublicGuardDecision(noPinRequirement)).toContain(
      "sha-pinning-third-party-requires-pin-drift",
    );
  });

  it("rejects default workflow permissions weaker than read-only", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.permissions.defaultWorkflowPermissions = "READ_WRITE";
    expect(validateActionsPublicGuardDecision(mutated)).toContain("default-permissions-drift");
  });

  it("rejects the reusable workflow being claimed as already existing", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.reusableWorkflow.existsToday = true;
    expect(validateActionsPublicGuardDecision(mutated)).toContain(
      "reusable-workflow-exists-today-drift",
    );
  });

  it("rejects any activation-scope flag flipped true at M1", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    for (const key of [
      "codeStartAllowed",
      "runtimeCodeAllowed",
      "releaseAllowed",
      "deployAllowed",
      "ciWiringAllowed",
    ]) {
      const mutated = clone(readJson(DECISION));
      mutated.decisions.activationScope[key] = true;
      expect(validateActionsPublicGuardDecision(mutated)).toContain("activation-scope-drift");
    }
  });

  it("rejects a missing rollback or non-goals block", async () => {
    const { validateActionsPublicGuardDecision } = await lib();
    const noRollback = clone(readJson(DECISION));
    noRollback.rollback = undefined;
    expect(validateActionsPublicGuardDecision(noRollback)).toContain("rollback-missing");

    const noNonGoals = clone(readJson(DECISION));
    noNonGoals.nonGoals = [];
    expect(validateActionsPublicGuardDecision(noNonGoals)).toContain("non-goals-missing");
  });

  it("rejects a record that drops the no-live-workflow non-goal", async () => {
    const { validateActionsPublicGuardDecision, NO_LIVE_WORKFLOW_NON_GOAL } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.nonGoals = mutated.nonGoals.filter(
      (goal: string) => goal !== NO_LIVE_WORKFLOW_NON_GOAL,
    );
    expect(validateActionsPublicGuardDecision(mutated)).toContain(
      "no-live-workflow-non-goal-missing",
    );
  });

  it("rejects a missing or blank owner-comprehension field", async () => {
    const { validateActionsPublicGuardDecision, OWNER_COMPREHENSION_FIELDS } = await lib();
    for (const field of OWNER_COMPREHENSION_FIELDS as string[]) {
      const missing = clone(readJson(DECISION));
      delete missing.ownerComprehension[field];
      expect(validateActionsPublicGuardDecision(missing)).toContain(
        `owner-comprehension-field-missing:${field}`,
      );

      const blank = clone(readJson(DECISION));
      blank.ownerComprehension[field] = "   ";
      expect(validateActionsPublicGuardDecision(blank)).toContain(
        `owner-comprehension-field-missing:${field}`,
      );
    }
  });

  it("exposes effectiveActionsPublicGuardDecision() as a fail-closed accessor", async () => {
    const { effectiveActionsPublicGuardDecision, DECISION_REF } = await lib();
    expect(DECISION_REF).toBe(DECISION);
    expect(effectiveActionsPublicGuardDecision()).toEqual(readJson(DECISION).decisions);
  });
});
