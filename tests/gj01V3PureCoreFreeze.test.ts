import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V3 Pure Core Shape Freeze: reference-only record freezing the framework-independent V3
// pipeline shape for CreateCustomer@1 — the closed ordered stage sequence, the success-outcome
// deterministic pending PreparedChangeSet shape (no CommitReceipt/committedAt/auditId/
// outboxEventIds), and the closed failure-outcome zero-write shape. Both outcomes are consumed
// from V2 by closed JSON Pointer only — never by copying V2's literal outcome/errorEnvelope
// values. Pins the Actionplan base; consumes V1/V2 freezes by sourceCommit and JSON Pointer.
// No executable pipeline, no V3-complete claim, no V4/V5+, no UI/SDK/second journey/release,
// no product readiness claim, no platform product code, no V1/V2 edits, no FastAPI base.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v3-pure-core-freeze-2026-08-22.json";
const VALIDATOR = "tools/lib/gj01-v3-pure-core-freeze.mjs";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v3-pure-core-freeze";
const ACTIONPLAN_SHA = "28025fa9efaa09b625bb9e04d5b0d67a4488c8e8";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "contract", "generatedAt", "id", "nonGoals", "prohibitions", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "waiver"];
// biome-ignore format: closed ordered stage sequence; a quietly reordered/dropped stage is a diff
const STAGES = ["actionSpecShapeCheck", "identityTenantGuard", "policyDecisionEvaluation", "invariantEvaluation", "idempotencyIntentResolution", "outcomeProjection", "preparedChangeSetProjection", "errorEnvelopeProjection"];
const INTENTS = ["customer", "audit", "transactionalOutbox", "idempotency"];
const FORBIDDEN_FIELDS = ["committedAt", "auditId", "outboxEventIds", "commitReceipt"];
// Literal V2-owned outcome/error-envelope values that must never be copied into the V3 record.
const FORBIDDEN_V2_LITERALS = ["ALLOW_COMMIT", "DENY", "INVALID", "CROSS_TENANT_DENY", "retryable"];
const STANDARDS_SOURCE_COMMIT = "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d";
const NOT_APPLICABLE_STANDARDS = ["observability", "release-versioning"];
const JOURNEY_FREEZE_SOURCE_COMMIT = "2105b0866e814622bd7cc346d06af33b97289105";
const CONTRACT_FREEZE_SOURCE_COMMIT = "28025fa9efaa09b625bb9e04d5b0d67a4488c8e8";
const SUCCESS_OUTCOME_POINTER = "/contract/outcomes/0";
const FAILURE_OUTCOME_POINTERS = [
  "/contract/outcomes/1",
  "/contract/outcomes/2",
  "/contract/outcomes/3",
];
const ERROR_ENVELOPE_POINTER = "/contract/errorEnvelope";

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));
// biome-ignore lint/suspicious/noExplicitAny: resolves an RFC 6901 JSON Pointer against an untyped document.
const resolvePointer = (doc: any, pointer: string): any =>
  pointer
    .split("/")
    .slice(1)
    .reduce((n, s) => n?.[s.replace(/~1/g, "/").replace(/~0/g, "~")], doc);

describe("GJ01 V3 pure core shape freeze reference-only record", () => {
  it("exists, is closed, and pins the Actionplan base plus V1/V2 sourceCommit pointers", () => {
    expect(exists(RECORD), `record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    expect(record.recordApplicability).toBe(APPLICABILITY);
    expect(record.waiver).toBeNull();
    expect(Array.isArray(record.standardRefs)).toBe(true);
    expect(record.applicability.length).toBe(record.standardRefs.length);
    for (const row of record.applicability) {
      expect(record.standardRefs).toContain(row.standard);
      expect(typeof row.reason).toBe("string");
      expect(row.reason.length).toBeGreaterThan(0);
      expect(row.sourceCommit).toBe(STANDARDS_SOURCE_COMMIT);
      expect(row.applies).toBe(!NOT_APPLICABLE_STANDARDS.includes(row.standard));
    }
    expect(record.canonicalRefs.actionplanBase.sha).toBe(ACTIONPLAN_SHA);
    expect(exists(record.canonicalRefs.journeyFreeze.path)).toBe(true);
    expect(record.canonicalRefs.journeyFreeze.sourceCommit).toBe(JOURNEY_FREEZE_SOURCE_COMMIT);
    expect(exists(record.canonicalRefs.contractFreeze.path)).toBe(true);
    expect(record.canonicalRefs.contractFreeze.sourceCommit).toBe(CONTRACT_FREEZE_SOURCE_COMMIT);
  });

  it("freezes exactly the closed ordered V3 pipeline stage sequence", () => {
    const record = readJson(RECORD);
    expect(record.contract.journeyId).toBe("CreateCustomer@1");
    expect(record.contract.pipelineStages).toEqual(STAGES);
    expect(record.contract.pipelineStages.length).toBe(8);
  });

  it("freezes the success-outcome deterministic pending PreparedChangeSet shape with no CommitReceipt/proof fields", () => {
    const record = readJson(RECORD);
    const allow = record.contract.allowOutcome;
    expect(allow.outcomePointer).toEqual({
      source: "contractFreeze",
      pointer: SUCCESS_OUTCOME_POINTER,
    });
    expect(allow.preparedChangeSet.persistenceState).toBe("pending");
    expect(allow.preparedChangeSet.deterministic).toBe(true);
    expect(allow.preparedChangeSet.intentOwnership).toBe("application-owned");
    expect(allow.preparedChangeSet.intents.slice().sort()).toEqual(INTENTS.slice().sort());
    const raw = JSON.stringify(record);
    for (const field of FORBIDDEN_FIELDS) expect(raw.includes(field)).toBe(false);
    expect(record.capabilityDelta).toBe("NONE");
    expect(record.runnableProduct).toBe(false);
  });

  it("references the closed failure-outcome zero-write V2 shape by JSON Pointer only, never restating V2-owned literal values", () => {
    const record = readJson(RECORD);
    const nonAllow = record.contract.nonAllowOutcomes;
    expect(nonAllow.outcomePointers).toEqual({
      source: "contractFreeze",
      pointers: FAILURE_OUTCOME_POINTERS,
    });
    expect(nonAllow.errorEnvelopePointer).toEqual({
      source: "contractFreeze",
      pointer: ERROR_ENVELOPE_POINTER,
    });
    expect(nonAllow.writeIntent).toBe("zero-write");
    // No restatement of V2's owned outcome-name / errorEnvelope.fields literal values.
    expect(nonAllow).not.toHaveProperty("outcomes");
    expect(nonAllow).not.toHaveProperty("fields");
    expect(record.contract).not.toHaveProperty("actionSpecFields");
    expect(record.contract).not.toHaveProperty("errorEnvelope");
    const raw = JSON.stringify(record);
    for (const literal of FORBIDDEN_V2_LITERALS) expect(raw.includes(`"${literal}"`)).toBe(false);
  });

  it("resolves the success and failure outcome pointers plus the error-envelope pointer against the real V2 record", () => {
    const record = readJson(RECORD);
    const v2 = readJson(record.canonicalRefs.contractFreeze.path);

    const resolvedSuccess = resolvePointer(v2, record.contract.allowOutcome.outcomePointer.pointer);
    expect(resolvedSuccess).toBe("ALLOW_COMMIT");

    const resolvedFailures = record.contract.nonAllowOutcomes.outcomePointers.pointers.map(
      (p: string) => resolvePointer(v2, p),
    );
    expect(resolvedFailures.slice().sort()).toEqual(
      ["DENY", "INVALID", "CROSS_TENANT_DENY"].sort(),
    );

    const resolvedEnvelope = resolvePointer(
      v2,
      record.contract.nonAllowOutcomes.errorEnvelopePointer.pointer,
    );
    expect(resolvedEnvelope).toEqual(v2.contract.errorEnvelope);
    expect(resolvedEnvelope.nonLeaking).toBe(true);
  });

  it("fails closed on pin, stage-order, non-goal, applicability and scopeHash drift", async () => {
    expect(exists(VALIDATOR), `validator-missing:${VALIDATOR}`).toBe(true);
    const record = readJson(RECORD);
    const { evaluatePureCoreFreeze, computeScopeHash, RECORD_ROOT_KEYS, PIPELINE_STAGES } =
      await load(VALIDATOR);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    expect(PIPELINE_STAGES).toEqual(STAGES);
    const clean = evaluatePureCoreFreeze({ record });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    expect(record.scopeHash).toBe(computeScopeHash(record));

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluatePureCoreFreeze({ record: r });
    };

    expect(
      drift((r: any) => {
        r.canonicalRefs.actionplanBase.sha = "0".repeat(40);
      }).accepted,
      "actionplan-pin-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        const s = [...r.contract.pipelineStages];
        [s[0], s[1]] = [s[1], s[0]];
        r.contract.pipelineStages = s;
      }).accepted,
      "stage-order-swap-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.pipelineStages = r.contract.pipelineStages.filter(
          (s: string) => s !== "policyDecisionEvaluation",
        );
      }).accepted,
      "pdp-stage-missing-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.pipelineStages = r.contract.pipelineStages.filter(
          (s: string) => s !== "invariantEvaluation",
        );
      }).accepted,
      "invariant-stage-missing-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.allowOutcome.preparedChangeSet.persistenceState = "committed";
      }).accepted,
      "persistence-state-not-pending-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.allowOutcome.preparedChangeSet.commitReceipt = { auditId: "x" };
      }).accepted,
      "commit-receipt-reintroduced-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.allowOutcome.preparedChangeSet.committedAt = "2026-08-22T00:00:00Z";
      }).accepted,
      "committed-at-reintroduced-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.pipelineStages = [...r.contract.pipelineStages, "runtimeDispatch"];
      }).accepted,
      "executable-runtime-stage-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.runnableProduct = true;
      }).accepted,
      "runnable-product-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/FastAPI/.test(line));
      }).accepted,
      "fastapi-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/executable pipeline/.test(line));
      }).accepted,
      "executable-pipeline-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V3-complete/.test(line));
      }).accepted,
      "v3-complete-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V4/.test(line));
      }).accepted,
      "v4-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V5/.test(line));
      }).accepted,
      "v5-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/product readiness/.test(line));
      }).accepted,
      "product-readiness-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V1 edits/.test(line));
      }).accepted,
      "v1-edits-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V2 edits/.test(line));
      }).accepted,
      "v2-edits-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.applicability = "other";
      }).accepted,
      "applicability-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.scopeHash = "deadbeef";
      }).accepted,
      "hash-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.extraRoot = "x";
      }).accepted,
      "unknown-root-not-refused",
    ).toBe(false);
    expect(drift(() => {}).accepted, "harness-rejects-clean").toBe(true);
  });

  it("closes prohibitions to exactly false and closes canonicalRefs pointers to exact pinned values", async () => {
    const record = readJson(RECORD);
    const { evaluatePureCoreFreeze, PROHIBITION_KEYS } = await load(VALIDATOR);
    const clean = evaluatePureCoreFreeze({ record });
    expect(clean.accepted).toBe(true);
    for (const key of PROHIBITION_KEYS) expect(record.prohibitions[key]).toBe(false);

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluatePureCoreFreeze({ record: r });
    };
    expect(
      drift((r: any) => {
        r.prohibitions[PROHIBITION_KEYS[0]] = true;
      }).accepted,
      "prohibition-not-closed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.journeyFreeze.sourceCommit = "0".repeat(40);
      }).accepted,
      "journey-freeze-source-commit-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.contractFreeze.sourceCommit = "0".repeat(40);
      }).accepted,
      "contract-freeze-source-commit-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.contractFreeze.path = "reports/other.json";
      }).accepted,
      "contract-freeze-path-drift-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects a silently opened V4 persistence shape plus a matching scopeHash recompute", async () => {
    const record = readJson(RECORD);
    const { evaluatePureCoreFreeze, computeScopeHash } = await load(VALIDATOR);

    const tampered = clone(record);
    tampered.contract.allowOutcome.preparedChangeSet.persistence = "POSTGRESQL_RLS_UOW";
    tampered.scopeHash = computeScopeHash(tampered);
    const result = evaluatePureCoreFreeze({ record: tampered });
    expect(result.accepted, "v4-persistence-opened-with-recomputed-hash-not-refused").toBe(false);
    expect(tampered.scopeHash).toBe(computeScopeHash(tampered));
  });

  it("adversarially rejects an added or removed application-owned intent even with scopeHash recomputed", async () => {
    const record = readJson(RECORD);
    const { evaluatePureCoreFreeze, computeScopeHash } = await load(VALIDATOR);

    const extraIntent = clone(record);
    extraIntent.contract.allowOutcome.preparedChangeSet.intents = [
      ...extraIntent.contract.allowOutcome.preparedChangeSet.intents,
      "notification",
    ];
    extraIntent.scopeHash = computeScopeHash(extraIntent);
    expect(
      evaluatePureCoreFreeze({ record: extraIntent }).accepted,
      "extra-intent-not-refused",
    ).toBe(false);

    const removedIntent = clone(record);
    removedIntent.contract.allowOutcome.preparedChangeSet.intents =
      removedIntent.contract.allowOutcome.preparedChangeSet.intents.filter(
        (i: string) => i !== "audit",
      );
    removedIntent.scopeHash = computeScopeHash(removedIntent);
    expect(
      evaluatePureCoreFreeze({ record: removedIntent }).accepted,
      "removed-intent-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects a fabricated literal ALLOW outcome or a copied V2 outcome-name list even with scopeHash recomputed", async () => {
    const record = readJson(RECORD);
    const { evaluatePureCoreFreeze, computeScopeHash } = await load(VALIDATOR);

    const fabricatedAllow = clone(record);
    fabricatedAllow.contract.allowOutcome.outcome = "ALLOW";
    fabricatedAllow.scopeHash = computeScopeHash(fabricatedAllow);
    expect(
      evaluatePureCoreFreeze({ record: fabricatedAllow }).accepted,
      "fabricated-allow-literal-not-refused",
    ).toBe(false);

    const copiedOutcomeList = clone(record);
    copiedOutcomeList.contract.nonAllowOutcomes.outcomes = ["DENY", "INVALID", "CROSS_TENANT_DENY"];
    copiedOutcomeList.scopeHash = computeScopeHash(copiedOutcomeList);
    expect(
      evaluatePureCoreFreeze({ record: copiedOutcomeList }).accepted,
      "copied-v2-outcome-list-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects FastAPI/Django reintroduced as the development base even with scopeHash recomputed", async () => {
    const record = readJson(RECORD);
    const { evaluatePureCoreFreeze, computeScopeHash } = await load(VALIDATOR);

    const withFramework = clone(record);
    withFramework.contract.developmentBase = "FastAPI";
    withFramework.scopeHash = computeScopeHash(withFramework);
    expect(
      evaluatePureCoreFreeze({ record: withFramework }).accepted,
      "fastapi-development-base-not-refused",
    ).toBe(false);
  });
});
