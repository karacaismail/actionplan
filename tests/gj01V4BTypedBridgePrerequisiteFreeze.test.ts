import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V4B Typed Bridge Prerequisite Freeze: reference-only decision-freeze record closing only
// the typed bridge / generated SDK prerequisite boundary after V4A. No runtime code, no SDK
// generation, no framework selection. V4A is a mandatory source witness (omission fails closed).
// Does not edit V1/V2/V3/V3B/V4A bytes.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v4b-typed-bridge-prerequisite-freeze-2026-08-22.json";
const VALIDATOR = "tools/lib/gj01-v4b-typed-bridge-prerequisite-freeze.mjs";
const V4A_RECORD = "reports/gj01-v4-persistence-boundary-freeze-2026-08-22.json";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v4b-typed-bridge-prerequisite-freeze";
const V4A_SCOPE_HASH = "c2d34b85fab01d47505ae2eb330e7a79ca16a6d4c8fa7610bebcd400cb3427cc";
const V4A_SOURCE_COMMIT = "9f562e51f810c837bcc6db1dc9039d22067d7574";
const ACTIONPLAN_BASE_COMMIT = "9f562e51f810c837bcc6db1dc9039d22067d7574";
const KERNEL_BASE_COMMIT = "359389c4d8438b2e6624ca30e9350240bfc2a80e";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["allowedFiles", "businessPersistenceOwner", "canonicalRefs", "capabilityDelta", "frameworkIndependence", "generatedAt", "id", "kernelBasePin", "kernelBusinessTablePolicy", "nonGoals", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "typedBridge"];
// biome-ignore format: closed sorted allowed-files set for this writer lease; a quietly added/dropped path is a diff
const ALLOWED_FILES = ["reports/gj01-v4b-typed-bridge-prerequisite-freeze-2026-08-22.json", "tests/gj01V4BTypedBridgePrerequisiteFreeze.test.ts", "tools/lib/gj01-v4b-typed-bridge-prerequisite-freeze.mjs"];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("GJ01 V4B typed bridge prerequisite freeze reference-only record", () => {
  it("exists, is closed, and pins V4A source witness by path/sourceCommit/scopeHash", () => {
    expect(exists(RECORD), `record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    expect(record.recordApplicability).toBe(APPLICABILITY);
    expect(record.schemaVersion).toBe("1.0.0");
    expect(record.status).toBe("effective");
    expect(record.canonicalRefs.v4PersistenceBoundaryFreeze.path).toBe(V4A_RECORD);
    expect(record.canonicalRefs.v4PersistenceBoundaryFreeze.sourceCommit).toBe(V4A_SOURCE_COMMIT);
    expect(record.canonicalRefs.v4PersistenceBoundaryFreeze.scopeHash).toBe(V4A_SCOPE_HASH);
    expect(exists(record.canonicalRefs.v4PersistenceBoundaryFreeze.path)).toBe(true);
  });

  it("pins the merged Actionplan base and Kernel base as distinct facts", () => {
    const record = readJson(RECORD);
    expect(record.canonicalRefs.actionplanBasePin.commit).toBe(ACTIONPLAN_BASE_COMMIT);
    expect(record.canonicalRefs.actionplanBasePin.kind).toBe("merged-base-not-authored-source");
    expect(record.kernelBasePin.baseCommit).toBe(KERNEL_BASE_COMMIT);
    expect(record.kernelBasePin.writesThisRecord).toBe(false);
  });

  it("carries the exact sorted allowedFiles set for this writer lease and fails closed on drift", async () => {
    const record = readJson(RECORD);
    expect(record.allowedFiles).toEqual(ALLOWED_FILES);
    expect([...record.allowedFiles].sort()).toEqual(record.allowedFiles);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.allowedFiles = [...ALLOWED_FILES, "src/extra-unpinned-file.mjs"];
    expect(evaluateTypedBridgePrerequisiteFreeze({ record: mutated, v4aRecord }).errors).toContain(
      "allowed-files-drift",
    );
  });

  it("accepts the closed baseline record with a passing validator run", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze, computeScopeHash } = await load(VALIDATOR);
    expect(record.scopeHash).toBe(computeScopeHash(record));
    const result = evaluateTypedBridgePrerequisiteFreeze({ record, v4aRecord });
    expect(result.errors).toEqual([]);
    expect(result.accepted).toBe(true);
  });

  it("structurally proves no customer/CRM business table enters Kernel via kernelBusinessTablePolicy", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    expect(record.kernelBusinessTablePolicy.customerCrmBusinessTableAllowed).toBe(false);
    expect(record.kernelBusinessTablePolicy.owner).toBe("APPLICATION");
    const mutated = clone(record);
    mutated.kernelBusinessTablePolicy.customerCrmBusinessTableAllowed = true;
    expect(evaluateTypedBridgePrerequisiteFreeze({ record: mutated, v4aRecord }).errors).toContain(
      "kernel-business-table-policy-drift",
    );
  });

  it("rejects a claim that the typed bridge / generated SDK has been opened or produced", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    expect(record.typedBridge.artifactStatus).toBe("ABSENT_CLOSED");
    expect(record.typedBridge.generatedSdkPackageStatus).toBe("ABSENT_CLOSED");

    const bridgeOpened = clone(record);
    bridgeOpened.typedBridge.artifactStatus = "OPEN";
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: bridgeOpened, v4aRecord }).errors,
    ).toContain("bridge-gate-drift");

    const sdkPresent = clone(record);
    sdkPresent.typedBridge.generatedSdkPackageStatus = "PRESENT";
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: sdkPresent, v4aRecord }).errors,
    ).toContain("bridge-gate-drift");
  });

  it("rejects a runtime or direct in-process bridge claim", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    expect(record.typedBridge.directInProcessBridgeClaimed).toBe(false);
    expect(record.typedBridge.runtimeBridgeClaimed).toBe(false);

    const directClaim = clone(record);
    directClaim.typedBridge.directInProcessBridgeClaimed = true;
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: directClaim, v4aRecord }).errors,
    ).toContain("bridge-gate-drift");

    const runtimeClaim = clone(record);
    runtimeClaim.typedBridge.runtimeBridgeClaimed = true;
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: runtimeClaim, v4aRecord }).errors,
    ).toContain("bridge-gate-drift");
  });

  it("fails closed when the V4A witness is missing or its pinned scopeHash drifts", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);

    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record, v4aRecord: undefined }).errors,
    ).toContain("v4a-record-missing");

    const mutatedV4a = clone(v4aRecord);
    mutatedV4a.scopeHash = "0".repeat(64);
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record, v4aRecord: mutatedV4a }).errors,
    ).toContain("v4a-scope-hash-pin-mismatch");
  });

  it("fails closed when V4A's own persistence owner or typed-bridge closure drifts at the source", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);

    const openedAtSource = clone(v4aRecord);
    openedAtSource.typedBridge.artifactStatus = "OPEN";
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record, v4aRecord: openedAtSource }).errors,
    ).toContain("v4a-typed-bridge-artifact-status-not-closed-at-source");

    const ownerDrift = clone(v4aRecord);
    ownerDrift.businessPersistenceOwner = "KERNEL";
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record, v4aRecord: ownerDrift }).errors,
    ).toContain("v4a-business-persistence-owner-not-closed-at-source");
  });

  it("rejects a business persistence owner drift away from APPLICATION", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.businessPersistenceOwner = "KERNEL";
    expect(evaluateTypedBridgePrerequisiteFreeze({ record: mutated, v4aRecord }).errors).toContain(
      "business-persistence-owner-drift",
    );
  });

  it("rejects any framework adapter being selected or implemented in V4B", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    expect(record.frameworkIndependence.frameworkChoiceMadeHere).toBe(false);
    expect(record.frameworkIndependence.v4ServerChoiceMade).toBe(false);
    expect(record.frameworkIndependence.fastapiRole).toBe(
      "optional-adapter-never-development-base",
    );
    expect(record.frameworkIndependence.djangoStatus).toBe("absent");

    const mutated = clone(record);
    mutated.frameworkIndependence.frameworkChoiceMadeHere = true;
    expect(evaluateTypedBridgePrerequisiteFreeze({ record: mutated, v4aRecord }).errors).toContain(
      "framework-base-drift",
    );

    const serverChosen = clone(record);
    serverChosen.frameworkIndependence.v4ServerChoiceMade = true;
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: serverChosen, v4aRecord }).errors,
    ).toContain("framework-base-drift");
  });

  it("rejects capabilityDelta or runnableProduct being opened away from their closed values", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    expect(record.capabilityDelta).toBe("NONE");
    expect(record.runnableProduct).toBe(false);

    const capabilityOpened = clone(record);
    capabilityOpened.capabilityDelta = "MINOR";
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: capabilityOpened, v4aRecord }).errors,
    ).toContain("capability-delta-drift");

    const runnableOpened = clone(record);
    runnableOpened.runnableProduct = true;
    expect(
      evaluateTypedBridgePrerequisiteFreeze({ record: runnableOpened, v4aRecord }).errors,
    ).toContain("runnable-product-drift");
  });

  it("detects scopeHash drift when a pinned field is silently mutated", async () => {
    const record = readJson(RECORD);
    const v4aRecord = readJson(V4A_RECORD);
    const { evaluateTypedBridgePrerequisiteFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.nonGoals = [...mutated.nonGoals, "extra unpinned non-goal"];
    expect(evaluateTypedBridgePrerequisiteFreeze({ record: mutated, v4aRecord }).errors).toContain(
      "scope-hash-drift",
    );
  });
});
