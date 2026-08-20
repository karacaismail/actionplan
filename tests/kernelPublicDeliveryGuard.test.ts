import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECISION = "reports/kernel-public-delivery-decision-2026-08-21.json";
const VALIDATOR = "tools/lib/kernel-public-delivery-guard.mjs";

const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const lib = () => import(path.join(ROOT, VALIDATOR));

describe("kernel-public-delivery-guard — M0 public-only closure decision", () => {
  it("accepts the canonical decision record with zero errors", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    expect(validatePublicDeliveryDecision(readJson(DECISION))).toEqual([]);
  });

  it("fails closed on a missing or malformed record", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    expect(validatePublicDeliveryDecision(undefined)).toEqual(["public-delivery-decision-missing"]);
    expect(validatePublicDeliveryDecision(null)).toEqual(["public-delivery-decision-missing"]);
  });

  it("rejects repository visibility drift back to a private/Team assumption", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.repositoryVisibility.kernelGithubRepo = "PRIVATE";
    expect(validatePublicDeliveryDecision(mutated)).toContain("repository-visibility-drift");
  });

  it("rejects a weakened owner credential or protection gate", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    const credential = clone(readJson(DECISION));
    credential.decisions.ownerCredentialGate = "IMPLICIT_STORED_CREDENTIAL_ALLOWED";
    expect(validatePublicDeliveryDecision(credential)).toContain("owner-credential-gate-drift");

    const protection = clone(readJson(DECISION));
    protection.decisions.ownerProtectionGate = "OWNER_MUST_REASK";
    expect(validatePublicDeliveryDecision(protection)).toContain("owner-protection-gate-drift");
  });

  it("rejects a reviewer-identity or manual-risk-acceptance-expiry change", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    const reviewer = clone(readJson(DECISION));
    reviewer.decisions.reviewerIdentity = "SAME_SESSION_AS_WRITER";
    expect(validatePublicDeliveryDecision(reviewer)).toContain("reviewer-identity-drift");

    const expiry = clone(readJson(DECISION));
    expiry.decisions.manualRiskAcceptanceExpiry = "90_DAYS";
    expect(validatePublicDeliveryDecision(expiry)).toContain(
      "manual-risk-acceptance-expiry-drift",
    );
  });

  it("rejects FastAPI being claimed as a development base", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.decisions.developmentBase.fastapi = "DEVELOPMENT_BASE";
    expect(validatePublicDeliveryDecision(mutated)).toContain("fastapi-development-base-drift");
  });

  it("rejects any activation-scope flag flipped true at M0", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    for (const key of ["codeStartAllowed", "runtimeCodeAllowed", "releaseAllowed", "deployAllowed"]) {
      const mutated = clone(readJson(DECISION));
      mutated.decisions.activationScope[key] = true;
      expect(validatePublicDeliveryDecision(mutated)).toContain("activation-scope-drift");
    }
  });

  it("rejects a missing rollback or non-goals block", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    const noRollback = clone(readJson(DECISION));
    delete noRollback.rollback;
    expect(validatePublicDeliveryDecision(noRollback)).toContain("rollback-missing");

    const noNonGoals = clone(readJson(DECISION));
    noNonGoals.nonGoals = [];
    expect(validatePublicDeliveryDecision(noNonGoals)).toContain("non-goals-missing");
  });

  it("rejects a record that drops the no-separate-narrative non-goal", async () => {
    const { validatePublicDeliveryDecision } = await lib();
    const mutated = clone(readJson(DECISION));
    mutated.nonGoals = mutated.nonGoals.filter(
      (goal: string) => !goal.startsWith("no separate narrative standard"),
    );
    expect(validatePublicDeliveryDecision(mutated)).toContain(
      "no-separate-narrative-non-goal-missing",
    );
  });

  it("rejects a missing or blank owner-comprehension field", async () => {
    const { validatePublicDeliveryDecision, OWNER_COMPREHENSION_FIELDS } = await lib();
    for (const field of OWNER_COMPREHENSION_FIELDS as string[]) {
      const missing = clone(readJson(DECISION));
      delete missing.ownerComprehension[field];
      expect(validatePublicDeliveryDecision(missing)).toContain(
        `owner-comprehension-field-missing:${field}`,
      );

      const blank = clone(readJson(DECISION));
      blank.ownerComprehension[field] = "   ";
      expect(validatePublicDeliveryDecision(blank)).toContain(
        `owner-comprehension-field-missing:${field}`,
      );
    }
  });

  it("exposes effectivePublicDeliveryDecision() as a fail-closed accessor", async () => {
    const { effectivePublicDeliveryDecision, DECISION_REF } = await lib();
    expect(DECISION_REF).toBe(DECISION);
    expect(effectivePublicDeliveryDecision()).toEqual(readJson(DECISION).decisions);
  });
});
