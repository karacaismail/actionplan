import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V1 Journey Freeze: a reference-only record freezing the single owner-visible
// CreateCustomer@1 journey (authenticated tenant-scoped actor selects tenant context, submits a
// new-customer intent, PDP/invariant decides the outcome, an ALLOW_COMMIT outcome requires a
// single atomic commit and yields a CommitReceipt, DENY/INVALID/CROSS_TENANT_DENY outcomes
// produce zero business write, and retrying the same intent never produces a duplicate
// customer) plus the explicit V2-V5+/UI/second-journey/SDK/release/FastAPI/Django non-goals. It
// pins the Actionplan base, consumes M7's roadmap resolution and M8's V0 failure archaeology by
// sourceCommit pointer, and never restates their owned values.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v1-journey-freeze-2026-08-22.json";
const VALIDATOR = "tools/lib/gj01-v1-journey-freeze.mjs";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v1-journey-freeze";
const ACTIONPLAN_SHA = "f9e7b05151017e9649b4e226142ff5b347f65563";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "generatedAt", "id", "journey", "nonGoals", "prohibitions", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "waiver"];
const OUTCOMES = ["ALLOW_COMMIT", "DENY", "INVALID", "CROSS_TENANT_DENY"];
const STANDARDS_SOURCE_COMMIT = "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d";
const NOT_APPLICABLE_STANDARDS = ["data-api-contract", "observability", "release-versioning"];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("GJ01 V1 journey freeze reference-only record", () => {
  it("exists, is closed, and pins the Actionplan base plus M7/M8 sourceCommit pointers", () => {
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
    expect(exists(record.canonicalRefs.roadmapResolution.path)).toBe(true);
    expect(record.canonicalRefs.roadmapResolution.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(exists(record.canonicalRefs.failureArchaeology.path)).toBe(true);
    expect(record.canonicalRefs.failureArchaeology.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("freezes exactly the CreateCustomer@1 journey with a single-commit success path and zero-write denial paths", () => {
    const record = readJson(RECORD);
    expect(record.journey.id).toBe("CreateCustomer@1");
    expect(Array.isArray(record.journey.steps)).toBe(true);
    expect(record.journey.steps.length).toBeGreaterThanOrEqual(6);
    expect(record.journey.outcomes.slice().sort()).toEqual(OUTCOMES.slice().sort());
    expect(record.capabilityDelta).toBe("NONE");
    expect(record.runnableProduct).toBe(false);
  });

  it("fails closed on pin, non-goal, applicability and scopeHash drift", async () => {
    expect(exists(VALIDATOR), `validator-missing:${VALIDATOR}`).toBe(true);
    const record = readJson(RECORD);
    const { evaluateJourneyFreeze, computeScopeHash, RECORD_ROOT_KEYS } = await load(VALIDATOR);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    const clean = evaluateJourneyFreeze({ record });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    expect(record.scopeHash).toBe(computeScopeHash(record));

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateJourneyFreeze({ record: r });
    };
    expect(
      drift((r: any) => {
        r.canonicalRefs.actionplanBase.sha = "0".repeat(40);
      }).accepted,
      "actionplan-pin-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.journey.secondJourney = { id: "UpdateCustomer@1" };
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
        r.nonGoals = r.nonGoals.filter(
          (line: string) => !/FastAPI/.test(line) && !/development base/.test(line),
        );
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
        r.nonGoals = r.nonGoals.filter((line: string) => !/V2/.test(line));
      }).accepted,
      "v2-non-goal-removed-not-refused",
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
      ["row-missing", (r) => { r.applicability = r.applicability.slice(1); }],
      ["applies-drift", (r) => { r.applicability[0].applies = false; }],
      ["source-commit-drift", (r) => { r.applicability[0].sourceCommit = "0".repeat(40); }],
      ["waiver-non-null", (r) => { r.waiver = { reason: "x" }; }],
      ["unknown-standard", (r) => { r.applicability.push({ standard: "unknown-std", applies: true, reason: "x", sourceCommit: STANDARDS_SOURCE_COMMIT }); r.standardRefs.push("unknown-std"); }],
    ];
    for (const [tag, mutate] of matrixMutations)
      expect(drift(mutate).accepted, `applicability-${tag}-not-refused`).toBe(false);

    const attack = clone(record);
    attack.applicability[0].applies = false;
    attack.scopeHash = computeScopeHash(attack);
    expect(evaluateJourneyFreeze({ record: attack }).accepted, "applicability-matching-hash-recompute-not-refused").toBe(false);
  });

  it("closes prohibitions to exactly false and closes canonicalRefs pointers to exact pinned values", async () => {
    const record = readJson(RECORD);
    const { evaluateJourneyFreeze, PROHIBITION_KEYS } = await load(VALIDATOR);
    const clean = evaluateJourneyFreeze({ record });
    expect(clean.accepted).toBe(true);
    for (const key of PROHIBITION_KEYS) expect(record.prohibitions[key]).toBe(false);

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateJourneyFreeze({ record: r });
    };
    expect(
      drift((r: any) => {
        r.prohibitions[PROHIBITION_KEYS[0]] = true;
      }).accepted,
      "prohibition-not-closed-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.roadmapResolution.sourceCommit = "0".repeat(40);
      }).accepted,
      "roadmap-resolution-source-commit-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.failureArchaeology.sourceCommit = "0".repeat(40);
      }).accepted,
      "failure-archaeology-source-commit-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.failureArchaeology.path = "reports/other.json";
      }).accepted,
      "failure-archaeology-path-drift-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects a silently opened V4 scope plus a matching scopeHash recompute", async () => {
    const record = readJson(RECORD);
    const { evaluateJourneyFreeze, computeScopeHash } = await load(VALIDATOR);

    const tampered = clone(record);
    tampered.journey.persistence = "POSTGRESQL_RLS_AUDIT_OUTBOX";
    // The attack recomputes scopeHash after tampering so a scope-hash-only check would pass it.
    tampered.scopeHash = computeScopeHash(tampered);

    const result = evaluateJourneyFreeze({ record: tampered });
    expect(result.accepted, "v4-scope-opened-with-recomputed-hash-not-refused").toBe(false);
    expect(tampered.scopeHash).toBe(computeScopeHash(tampered));
  });
});
