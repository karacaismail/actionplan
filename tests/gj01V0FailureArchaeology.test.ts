import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V0 Failure Archaeology: a reference-only record classifying every V0-era artifact
// (dirty legacy platform scaffold, FastAPI/GraphQL DB-less development base, Django, the M7
// ASGI Delivery/framework-deferral decision, the legacy web/UI/infra horizontal scaffold) into
// exactly reuse|archive|reject with a concrete path/fact and a carryOverMode per row. It pins
// the Actionplan base and the platform snapshot commit, consumes M7's roadmap resolution and
// the standards-applicability/short-code/ai-governance sourceCommit pointers by reference, and
// never restates their owned values.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v0-failure-archaeology-2026-08-21.json";
const VALIDATOR = "tools/lib/gj01-v0-failure-archaeology.mjs";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v0-failure-archaeology";
const ACTIONPLAN_SHA = "0b0a1e658bc722986d702fd55c285e6d79188d33";
const PLATFORM_COMMIT = "930c09b4041fe91b5682806eb391b70745c007cd";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "disposition", "generatedAt", "id", "nonGoals", "platformSnapshot", "prohibitions", "runnableProduct", "schemaVersion", "scopeHash", "status"];
const MODES = ["reuse", "archive", "reject"];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("GJ01 V0 failure archaeology reference-only record", () => {
  it("exists, is closed, and pins Actionplan base plus the platform snapshot commit", () => {
    expect(exists(RECORD), `record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    expect(record.applicability).toBe(APPLICABILITY);
    expect(record.canonicalRefs.actionplanBase.sha).toBe(ACTIONPLAN_SHA);
    expect(record.platformSnapshot.commit).toBe(PLATFORM_COMMIT);
    expect(exists(record.canonicalRefs.roadmapResolution.path)).toBe(true);
    expect(record.canonicalRefs.roadmapResolution.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("classifies the platform snapshot as DB-less with no persistence evidence and dirty branding untouched", () => {
    const record = readJson(RECORD);
    expect(record.platformSnapshot).toEqual({
      commit: PLATFORM_COMMIT,
      filesChanged: 51,
      insertions: 4860,
      stack: ["FastAPI", "Strawberry", "Uvicorn", "httpx"],
      testedSurface: "DB_LESS_HEALTHZ_AND_GRAPHQL_PING_ONLY",
      persistenceEvidence: "ABSENT",
      workingTreeDirtyFiles: 11,
      workingTreeDirtyClassification: "BRANDING_UNTOUCHED",
    });
    expect(record.capabilityDelta).toBe("NONE");
    expect(record.runnableProduct).toBe(false);
  });

  it("closes every disposition row to exactly reuse|archive|reject with a concrete path/fact and carryOverMode", () => {
    const record = readJson(RECORD);
    expect(Array.isArray(record.disposition)).toBe(true);
    expect(record.disposition.length).toBeGreaterThanOrEqual(5);
    for (const row of record.disposition) {
      expect(MODES, `unknown-mode:${row.mode}`).toContain(row.mode);
      expect(typeof row.path, `path-missing:${JSON.stringify(row)}`).toBe("string");
      expect(row.path.length).toBeGreaterThan(0);
      expect(typeof row.fact, `fact-missing:${JSON.stringify(row)}`).toBe("string");
      expect(row.fact.length).toBeGreaterThan(0);
      expect(typeof row.carryOverMode, `carryOverMode-missing:${JSON.stringify(row)}`).toBe(
        "string",
      );
      expect(row.carryOverMode.length).toBeGreaterThan(0);
    }
    const django = record.disposition.find((r: { path: string }) => /django/i.test(r.path));
    expect(django?.mode, "django-not-rejected").toBe("reject");
    const m7Reuse = record.disposition.find((r: { path: string }) =>
      /gj01-roadmap-resolution/i.test(r.path),
    );
    expect(m7Reuse?.mode, "m7-decision-not-reused").toBe("reuse");
    expect(m7Reuse?.carryOverMode, "m7-reuse-not-zero-byte").toMatch(/ZERO_BYTE/);
  });

  it("fails closed on pin, mode, applicability and scopeHash drift", async () => {
    expect(exists(VALIDATOR), `validator-missing:${VALIDATOR}`).toBe(true);
    const record = readJson(RECORD);
    const { evaluateFailureArchaeology, computeScopeHash, RECORD_ROOT_KEYS, MODE_VALUES } =
      await load(VALIDATOR);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    expect(MODE_VALUES).toEqual(MODES);
    const clean = evaluateFailureArchaeology({ record });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    expect(record.scopeHash).toBe(computeScopeHash(record));

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateFailureArchaeology({ record: r });
    };
    expect(
      drift((r: any) => {
        r.canonicalRefs.actionplanBase.sha = "0".repeat(40);
      }).accepted,
      "actionplan-pin-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.platformSnapshot.commit = "0".repeat(40);
      }).accepted,
      "platform-commit-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.disposition[0].mode = "keep";
      }).accepted,
      "unknown-mode-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.disposition = r.disposition.slice(0, 0);
      }).accepted,
      "empty-disposition-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.disposition[0].fact = undefined;
      }).accepted,
      "missing-fact-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.applicability = "other";
      }).accepted,
      "applicability-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.capabilityDelta = "SOME";
      }).accepted,
      "capability-delta-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.runnableProduct = true;
      }).accepted,
      "runnable-product-drift-not-refused",
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

  it("closes record identity fields and canonicalRefs pointers to exact pinned values", async () => {
    const record = readJson(RECORD);
    const { evaluateFailureArchaeology } = await load(VALIDATOR);
    const clean = evaluateFailureArchaeology({ record });
    expect(clean.accepted).toBe(true);

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateFailureArchaeology({ record: r });
    };
    expect(
      drift((r: any) => {
        r.schemaVersion = "9.9.9";
      }).accepted,
      "schema-version-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.id = "other-id";
      }).accepted,
      "id-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.generatedAt = "2026-01-01";
      }).accepted,
      "generated-at-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.status = "draft";
      }).accepted,
      "status-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.standardsApplicability.sourceCommit = "0".repeat(40);
      }).accepted,
      "standards-applicability-source-commit-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.shortCode.path = "src/data/standards/other.json";
      }).accepted,
      "short-code-path-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.aiGovernance.status = "owned";
      }).accepted,
      "ai-governance-status-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.roadmapResolution.sourceCommit = "0".repeat(40);
      }).accepted,
      "roadmap-resolution-source-commit-value-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.actionplanBase.status = "unpinned";
      }).accepted,
      "actionplan-base-status-drift-not-refused",
    ).toBe(false);
  });

  it("adversarially rejects a silently reclassified row plus a matching scopeHash recompute (archive->reuse, ZERO_BYTE->COPY_BYTES)", async () => {
    const record = readJson(RECORD);
    const { evaluateFailureArchaeology, computeScopeHash } = await load(VALIDATOR);

    const tampered = clone(record);
    const legacyScaffoldRow = tampered.disposition.find((r: { carryOverMode: string }) =>
      r.carryOverMode.startsWith("ARCHIVE_EVIDENCE"),
    );
    legacyScaffoldRow.mode = "reuse";
    legacyScaffoldRow.carryOverMode = "COPY_BYTES";
    // The attack recomputes scopeHash after tampering so a scope-hash-only check would pass it.
    tampered.scopeHash = computeScopeHash(tampered);

    const result = evaluateFailureArchaeology({ record: tampered });
    expect(result.accepted, "reclassified-row-with-recomputed-hash-not-refused").toBe(false);
    expect(tampered.scopeHash).toBe(computeScopeHash(tampered));
  });
});
