import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V3B Execution Authorization: reference-only record superseding ONLY V3A's
// runtimeCodeAllowed/executablePipelineAllowed, exact-files-only, for one Kernel package. V3A is
// a mandatory source witness (omission fails closed). Does not edit V1/V2/V3A bytes.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v3b-execution-authorization-2026-08-22.json";
const VALIDATOR = "tools/lib/gj01-v3b-execution-authorization.mjs";
const V3A_RECORD = "reports/gj01-v3-pure-core-freeze-2026-08-22.json";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v3b-execution-authorization";
const V3A_SCOPE_HASH = "e9334669f2ee73a5b8ca670dae2e91af68c904ad5eb2bf9c42e51b889a71d909";
const V3A_SOURCE_COMMIT = "0ea17838c345f088066e3a457a9c2b0e277c8a3d";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["canonicalRefs", "capabilityDelta", "generatedAt", "id", "kernelPackage", "nonGoals", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "supersedes"];
// biome-ignore format: closed sorted Kernel file set; a quietly added/dropped/reordered file is a diff
const KERNEL_FILES = ["CHANGELOG.md", "planning/gj01-v3b-pure-core-pipeline.json", "src/application/create-customer-pipeline.mjs", "tests/kernel-create-customer-pipeline.test.mjs", "tests/repository-boundary.test.mjs"];
const KERNEL_FILE_SET_HASH = "4ebef319dd15083e928154b88ff7ff79112ff935b5ba1dfe114927233f0b1ad0";
const KERNEL_BASE_COMMIT = "8c2e5f0acf52338d2617547fad6585dd459b75f4";
const LIFTED_POINTERS = [
  "/prohibitions/runtimeCodeAllowed",
  "/prohibitions/executablePipelineAllowed",
];
const CLOSED_V3A_PROHIBITIONS = [
  "gitCommitPushByThisRecord",
  "v3CompleteClaimAllowed",
  "v4PersistenceImplementationAllowed",
  "v5RuntimeImplementationAllowed",
  "fastapiAsDevelopmentBaseAllowed",
  "djangoCarryOverAllowed",
  "uiDesignAllowed",
  "sdkGenerationAllowed",
  "secondJourneyAllowed",
  "releaseAllowed",
  "deployAllowed",
  "productReadinessAllowed",
  "platformProductCodeAllowed",
  "v1EditsAllowed",
  "v2EditsAllowed",
];

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

describe("GJ01 V3B execution authorization reference-only record", () => {
  it("exists, is closed, and pins the V3A source by path/sourceCommit/scopeHash", () => {
    expect(exists(RECORD), `record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    expect(record.recordApplicability).toBe(APPLICABILITY);
    expect(record.schemaVersion).toBe("1.0.0");
    expect(record.status).toBe("effective");
    expect(record.canonicalRefs.v3aFreeze.path).toBe(V3A_RECORD);
    expect(record.canonicalRefs.v3aFreeze.sourceCommit).toBe(V3A_SOURCE_COMMIT);
    expect(record.canonicalRefs.v3aFreeze.scopeHash).toBe(V3A_SCOPE_HASH);
    expect(exists(record.canonicalRefs.v3aFreeze.path)).toBe(true);
  });

  it("pins the exact Kernel package: repo, PUBLIC visibility, base commit, sorted file set, and path-set hash", () => {
    const record = readJson(RECORD);
    expect(record.kernelPackage.repository).toBe("metaframer-net/metaframer-kernel");
    expect(record.kernelPackage.visibility).toBe("PUBLIC");
    expect(record.kernelPackage.baseCommit).toBe(KERNEL_BASE_COMMIT);
    expect(record.kernelPackage.files).toEqual(KERNEL_FILES);
    expect([...record.kernelPackage.files].sort()).toEqual(record.kernelPackage.files);
    expect(record.kernelPackage.fileSetHash).toBe(KERNEL_FILE_SET_HASH);
    expect(record.kernelPackage.fileSetHashKind).toBe("path-set-hash-not-content-hash");
  });

  it("lifts exactly the two named V3A prohibitions, each exact-files-only, and nothing else", () => {
    const record = readJson(RECORD);
    expect(record.supersedes.source).toBe("v3aFreeze");
    expect(record.supersedes.lifted).toHaveLength(2);
    const pointers = record.supersedes.lifted.map(
      (l: { prohibitionPointer: string }) => l.prohibitionPointer,
    );
    expect(pointers.sort()).toEqual([...LIFTED_POINTERS].sort());
    for (const lift of record.supersedes.lifted) {
      expect(lift.from).toBe(false);
      expect(lift.to).toBe(true);
      expect(lift.qualifier).toBe("exact-files-only");
      expect(lift.scope).toBe("kernelPackage");
    }
    expect(record.supersedes.allOtherProhibitionsRemainClosed).toBe(true);
  });

  it("does not touch V3A bytes: V3A on disk still closes both lifted prohibitions and every other prohibition", () => {
    const v3a = readJson(V3A_RECORD);
    expect(v3a.scopeHash).toBe(V3A_SCOPE_HASH);
    for (const pointer of LIFTED_POINTERS) {
      expect(resolvePointer(v3a, pointer)).toBe(false);
    }
    for (const key of CLOSED_V3A_PROHIBITIONS) {
      expect(v3a.prohibitions[key]).toBe(false);
    }
  });

  it("keeps runnableProduct false and capabilityDelta authorization-only, never a runnable product capability", () => {
    const record = readJson(RECORD);
    expect(record.runnableProduct).toBe(false);
    expect(record.capabilityDelta).toBe("authorization-only");
  });

  it("self-consistent scopeHash and Kernel file-set path-set hash via the pure validator", async () => {
    const record = readJson(RECORD);
    const { computeScopeHash, computeKernelFileSetHash } = await load(VALIDATOR);
    expect(record.scopeHash).toBe(computeScopeHash(record));
    expect(computeKernelFileSetHash(record.kernelPackage.files)).toBe(
      record.kernelPackage.fileSetHash,
    );
  });

  it("accepts the record as-is via the fail-closed validator, cross-checked against V3A on disk", async () => {
    const record = readJson(RECORD);
    const v3aRecord = readJson(V3A_RECORD);
    const { evaluateExecutionAuthorization } = await load(VALIDATOR);
    const { accepted, errors } = evaluateExecutionAuthorization({ record, v3aRecord });
    expect(errors, "unexpected-validator-errors").toEqual([]);
    expect(accepted).toBe(true);
  });

  it("fail-closed: rejects a widened lift qualifier and a third, unlisted lifted prohibition", async () => {
    const record = readJson(RECORD);
    const v3aRecord = readJson(V3A_RECORD);
    const { evaluateExecutionAuthorization } = await load(VALIDATOR);
    const widened = clone(record);
    widened.supersedes.lifted[0].qualifier = "unbounded";
    expect(evaluateExecutionAuthorization({ record: widened, v3aRecord }).errors).toContain(
      "supersedes-drift",
    );
    const extraLift = clone(record);
    extraLift.supersedes.lifted.push({
      prohibitionPointer: "/prohibitions/releaseAllowed",
      from: false,
      to: true,
      qualifier: "exact-files-only",
      scope: "kernelPackage",
    });
    expect(evaluateExecutionAuthorization({ record: extraLift, v3aRecord }).errors).toContain(
      "supersedes-drift",
    );
  });

  it("fail-closed: rejects runnableProduct=true and a drifted kernelPackage file set", async () => {
    const record = readJson(RECORD);
    const v3aRecord = readJson(V3A_RECORD);
    const { evaluateExecutionAuthorization } = await load(VALIDATOR);
    const mutatedRunnable = clone(record);
    mutatedRunnable.runnableProduct = true;
    expect(evaluateExecutionAuthorization({ record: mutatedRunnable, v3aRecord }).errors).toContain(
      "runnable-product-drift",
    );
    const mutatedFiles = clone(record);
    mutatedFiles.kernelPackage.files.push("src/extra-unpinned-file.mjs");
    expect(evaluateExecutionAuthorization({ record: mutatedFiles, v3aRecord }).errors).toContain(
      "kernel-package-drift",
    );
  });

  it("fail-closed: rejects a record whose scopeHash was mutated to no longer match its own scope", async () => {
    const record = readJson(RECORD);
    const v3aRecord = readJson(V3A_RECORD);
    const { evaluateExecutionAuthorization } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.scopeHash = "0".repeat(64);
    const { accepted, errors } = evaluateExecutionAuthorization({ record: mutated, v3aRecord });
    expect(accepted).toBe(false);
    expect(errors).toContain("scope-hash-drift");
  });

  it("fail-closed: rejects a mutated or wholly omitted V3A source witness (mutation and omission refusal)", async () => {
    const record = readJson(RECORD);
    const v3aRecord = readJson(V3A_RECORD);
    const { evaluateExecutionAuthorization } = await load(VALIDATOR);
    const mutatedV3a = clone(v3aRecord);
    mutatedV3a.prohibitions.runtimeCodeAllowed = true;
    expect(evaluateExecutionAuthorization({ record, v3aRecord: mutatedV3a }).errors).toContain(
      "v3a-runtime-code-allowed-not-closed-at-source",
    );
    for (const omitted of [undefined, null, "not-an-object"]) {
      const { accepted, errors } = evaluateExecutionAuthorization({ record, v3aRecord: omitted });
      expect(accepted).toBe(false);
      expect(errors).toContain("v3a-record-missing");
    }
  });

  it("fail-closed: rejects an unknown root key added to the record", async () => {
    const record = readJson(RECORD);
    const v3aRecord = readJson(V3A_RECORD);
    const { evaluateExecutionAuthorization } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.extraUnknownKey = "surprise";
    const { accepted, errors } = evaluateExecutionAuthorization({ record: mutated, v3aRecord });
    expect(accepted).toBe(false);
    expect(errors).toContain("record-root-drift");
  });
});
