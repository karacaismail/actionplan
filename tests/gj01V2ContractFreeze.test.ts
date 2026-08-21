import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V2 Contract Freeze: a reference-only record freezing the framework-independent
// field-name and invariant shapes for CreateCustomer@1 — ActionSpec fields, the closed
// outcome set, a non-leaking error envelope, retry-same-idempotency-key-only, a
// transactional-outbox event envelope, and CommitReceipt proof fields. It pins the
// Actionplan base and consumes M9's V1 journey freeze by sourceCommit pointer, never
// restating its owned values. No executable types/validation library, no V3/V4/V5+, no
// FastAPI/Django base, no UI, no SDK generation, no second journey, no release/deploy, no
// platform product code, no V1 edits.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v2-contract-freeze-2026-08-22.json";
const VALIDATOR = "tools/lib/gj01-v2-contract-freeze.mjs";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v2-contract-freeze";
const ACTIONPLAN_SHA = "2105b0866e814622bd7cc346d06af33b97289105";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "contract", "generatedAt", "id", "nonGoals", "prohibitions", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "waiver"];
const OUTCOMES = ["ALLOW_COMMIT", "DENY", "INVALID", "CROSS_TENANT_DENY"];
const STANDARDS_SOURCE_COMMIT = "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d";
const NOT_APPLICABLE_STANDARDS = ["observability", "release-versioning"];
const JOURNEY_FREEZE_SOURCE_COMMIT = "2105b0866e814622bd7cc346d06af33b97289105";

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("GJ01 V2 contract freeze reference-only record", () => {
  it("exists, is closed, and pins the Actionplan base plus the V1 journey freeze sourceCommit pointer", () => {
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
  });

  it("freezes exactly the CreateCustomer@1 field-name and invariant shapes", () => {
    const record = readJson(RECORD);
    expect(record.contract.journeyId).toBe("CreateCustomer@1");
    expect(record.contract.actionSpecFields.slice().sort()).toEqual(
      ["requestId", "actorId", "tenantId", "payload", "idempotencyKey"].sort(),
    );
    expect(record.contract.actionSpecFields).not.toContain("customer");
    expect(record.contract.payloadKind).toBe("CreateCustomerPayload");
    expect(record.contract.outcomes.slice().sort()).toEqual(OUTCOMES.slice().sort());
    expect(record.contract.errorEnvelope.nonLeaking).toBe(true);
    expect(record.contract.errorEnvelope.fields.slice().sort()).toEqual(
      ["code", "message", "requestId", "retryable"].sort(),
    );
    expect(record.contract.retryPolicy.sameIdempotencyKeyOnly).toBe(true);
    expect(record.contract.retryPolicy.noReceiptTransientFailure).toBe("retryable-same-key-only");
    expect(record.contract.retryPolicy.closedActionOutcomes).toBe("terminal-no-automatic-retry");
    expect(record.contract.eventEnvelope.kind).toBe("transactional-outbox");
    expect(record.contract.eventEnvelope.fields.slice().sort()).toEqual(
      [
        "eventId",
        "eventType",
        "requestId",
        "tenantId",
        "actorId",
        "resourceId",
        "idempotencyKey",
        "occurredAt",
        "payload",
      ].sort(),
    );
    expect(Array.isArray(record.contract.commitReceipt.fields)).toBe(true);
    expect(record.contract.commitReceipt.fields.length).toBeGreaterThan(0);
    expect(record.contract.commitReceipt.fields.slice().sort()).toEqual(
      [
        "requestId",
        "tenantId",
        "resourceId",
        "outcome",
        "committedAt",
        "auditId",
        "outboxEventIds",
        "idempotencyKey",
      ].sort(),
    );
    expect(record.capabilityDelta).toBe("NONE");
    expect(record.runnableProduct).toBe(false);
  });

  it("fails closed on pin, non-goal, applicability and scopeHash drift", async () => {
    expect(exists(VALIDATOR), `validator-missing:${VALIDATOR}`).toBe(true);
    const record = readJson(RECORD);
    const { evaluateContractFreeze, computeScopeHash, RECORD_ROOT_KEYS } = await load(VALIDATOR);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    const clean = evaluateContractFreeze({ record });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    expect(record.scopeHash).toBe(computeScopeHash(record));

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateContractFreeze({ record: r });
    };
    expect(
      drift((r: any) => {
        r.canonicalRefs.actionplanBase.sha = "0".repeat(40);
      }).accepted,
      "actionplan-pin-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.contract.secondJourney = { id: "UpdateCustomer@1" };
      }).accepted,
      "second-journey-not-refused",
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
        r.nonGoals = r.nonGoals.filter((line: string) => !/Django/.test(line));
      }).accepted,
      "django-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/executable types/.test(line));
      }).accepted,
      "executable-types-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V3/.test(line));
      }).accepted,
      "v3-non-goal-removed-not-refused",
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
        r.nonGoals = r.nonGoals.filter((line: string) => !/platform product code/.test(line));
      }).accepted,
      "platform-product-code-non-goal-removed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.filter((line: string) => !/V1 edits/.test(line));
      }).accepted,
      "v1-edits-non-goal-removed-not-refused",
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

    const matrixMutations: Array<[string, (r: any) => void]> = [
      [
        "row-missing",
        (r) => {
          r.applicability = r.applicability.slice(1);
        },
      ],
      [
        "applies-drift",
        (r) => {
          r.applicability[0].applies = false;
        },
      ],
      [
        "source-commit-drift",
        (r) => {
          r.applicability[0].sourceCommit = "0".repeat(40);
        },
      ],
      [
        "waiver-non-null",
        (r) => {
          r.waiver = { reason: "x" };
        },
      ],
      [
        "unknown-standard",
        (r) => {
          r.applicability.push({
            standard: "unknown-std",
            applies: true,
            reason: "x",
            sourceCommit: STANDARDS_SOURCE_COMMIT,
          });
          r.standardRefs.push("unknown-std");
        },
      ],
    ];
    for (const [tag, mutate] of matrixMutations)
      expect(drift(mutate).accepted, `applicability-${tag}-not-refused`).toBe(false);

    const attack = clone(record);
    attack.applicability[0].applies = false;
    attack.scopeHash = computeScopeHash(attack);
    expect(
      evaluateContractFreeze({ record: attack }).accepted,
      "applicability-matching-hash-recompute-not-refused",
    ).toBe(false);
  });

  it("closes prohibitions to exactly false and closes canonicalRefs pointers to exact pinned values", async () => {
    const record = readJson(RECORD);
    const { evaluateContractFreeze, PROHIBITION_KEYS } = await load(VALIDATOR);
    const clean = evaluateContractFreeze({ record });
    expect(clean.accepted).toBe(true);
    for (const key of PROHIBITION_KEYS) expect(record.prohibitions[key]).toBe(false);

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateContractFreeze({ record: r });
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
        r.canonicalRefs.journeyFreeze.path = "reports/other.json";
      }).accepted,
      "journey-freeze-path-drift-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects a silently opened V4 persistence shape plus a matching scopeHash recompute", async () => {
    const record = readJson(RECORD);
    const { evaluateContractFreeze, computeScopeHash } = await load(VALIDATOR);

    const tampered = clone(record);
    tampered.contract.persistence = "POSTGRESQL_RLS_AUDIT_OUTBOX";
    // The attack recomputes scopeHash after tampering so a scope-hash-only check would pass it.
    tampered.scopeHash = computeScopeHash(tampered);

    const result = evaluateContractFreeze({ record: tampered });
    expect(result.accepted, "v4-persistence-opened-with-recomputed-hash-not-refused").toBe(false);
    expect(tampered.scopeHash).toBe(computeScopeHash(tampered));
  });

  it("adversarially rejects an executable validation library sneaked into the contract, and an open error envelope", async () => {
    const record = readJson(RECORD);
    const { evaluateContractFreeze, computeScopeHash } = await load(VALIDATOR);

    const withLib = clone(record);
    withLib.contract.validationLibrary = "zod";
    withLib.scopeHash = computeScopeHash(withLib);
    expect(
      evaluateContractFreeze({ record: withLib }).accepted,
      "validation-library-not-refused",
    ).toBe(false);

    const openEnvelope = clone(record);
    openEnvelope.contract.errorEnvelope.nonLeaking = false;
    openEnvelope.scopeHash = computeScopeHash(openEnvelope);
    expect(
      evaluateContractFreeze({ record: openEnvelope }).accepted,
      "leaking-error-envelope-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects a removed or added CommitReceipt proof field even with scopeHash recomputed", async () => {
    const record = readJson(RECORD);
    const { evaluateContractFreeze, computeScopeHash } = await load(VALIDATOR);

    const removedField = clone(record);
    removedField.contract.commitReceipt.fields = removedField.contract.commitReceipt.fields.filter(
      (f: string) => f !== "auditId",
    );
    removedField.scopeHash = computeScopeHash(removedField);
    expect(
      evaluateContractFreeze({ record: removedField }).accepted,
      "commit-receipt-field-removed-not-refused",
    ).toBe(false);

    const extraField = clone(record);
    extraField.contract.commitReceipt.fields = [
      ...extraField.contract.commitReceipt.fields,
      "extraProof",
    ];
    extraField.scopeHash = computeScopeHash(extraField);
    expect(
      evaluateContractFreeze({ record: extraField }).accepted,
      "commit-receipt-extra-field-not-refused",
    ).toBe(false);
  });
});
