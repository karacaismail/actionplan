import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 V4A Persistence Boundary Freeze: reference-only decision-freeze record. No runtime code,
// no adapter/SDK generation, no framework selection. V3 and V3B are mandatory source witnesses
// (omission fails closed). Does not edit V1/V2/V3/V3B bytes.
const ROOT = process.cwd();
const RECORD = "reports/gj01-v4-persistence-boundary-freeze-2026-08-22.json";
const VALIDATOR = "tools/lib/gj01-v4-persistence-boundary-freeze.mjs";
const V2_RECORD = "reports/gj01-v2-contract-freeze-2026-08-22.json";
const V3_RECORD = "reports/gj01-v3-pure-core-freeze-2026-08-22.json";
const V3B_RECORD = "reports/gj01-v3b-execution-authorization-2026-08-22.json";
const APPLICABILITY = "actionplan-kernel-governance-gj01-v4-persistence-boundary-freeze";
const V2_SCOPE_HASH = "66e727aec3cf78f67312df1e2a04fd03f8a89103b0d259eb69aca530df127771";
const V2_SOURCE_COMMIT = "28025fa9efaa09b625bb9e04d5b0d67a4488c8e8";
const V3_SCOPE_HASH = "e9334669f2ee73a5b8ca670dae2e91af68c904ad5eb2bf9c42e51b889a71d909";
const V3B_SCOPE_HASH = "a86ad31d8b6a7b1c9f69be0a909fbc9dde1d4d1bd671bae57760c68aa71ca3d1";
const V3B_SOURCE_COMMIT = "75202acfb7b2e1cc238e8ddb884cf40a4b1a2010";
const ACTIONPLAN_BASE_COMMIT = "72a6f76c612d474e3765f1ff5920df76b2f786f2";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["allowedFiles", "atomicContract", "businessPersistenceOwner", "canonicalRefs", "capabilityDelta", "frameworkIndependence", "generatedAt", "id", "kernelBasePin", "kernelBusinessTablePolicy", "nonGoals", "preparedChangeSetBinding", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "substrate", "typedBridge"];
const PREPARED_CHANGE_SET_INTENTS = ["customer", "audit", "transactionalOutbox", "idempotency"];
const KERNEL_BASE_COMMIT = "359389c4d8438b2e6624ca30e9350240bfc2a80e";
// biome-ignore format: closed sorted allowed-files set for this writer lease; a quietly added/dropped path is a diff
const ALLOWED_FILES = ["reports/gj01-v4-persistence-boundary-freeze-2026-08-22.json", "tests/gj01V4PersistenceBoundaryFreeze.test.ts", "tools/lib/gj01-v4-persistence-boundary-freeze.mjs"];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("GJ01 V4A persistence boundary freeze reference-only record", () => {
  it("exists, is closed, and pins V3 and V3B source witnesses by path/sourceCommit/scopeHash", () => {
    expect(exists(RECORD), `record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    expect(record.recordApplicability).toBe(APPLICABILITY);
    expect(record.schemaVersion).toBe("1.0.0");
    expect(record.status).toBe("effective");
    expect(record.canonicalRefs.v2ContractFreeze.path).toBe(V2_RECORD);
    expect(record.canonicalRefs.v2ContractFreeze.sourceCommit).toBe(V2_SOURCE_COMMIT);
    expect(record.canonicalRefs.v2ContractFreeze.scopeHash).toBe(V2_SCOPE_HASH);
    expect(record.canonicalRefs.v3PureCoreFreeze.path).toBe(V3_RECORD);
    expect(record.canonicalRefs.v3PureCoreFreeze.scopeHash).toBe(V3_SCOPE_HASH);
    expect(record.canonicalRefs.v3bExecutionAuthorization.path).toBe(V3B_RECORD);
    expect(record.canonicalRefs.v3bExecutionAuthorization.sourceCommit).toBe(V3B_SOURCE_COMMIT);
    expect(record.canonicalRefs.v3bExecutionAuthorization.scopeHash).toBe(V3B_SCOPE_HASH);
    expect(exists(record.canonicalRefs.v2ContractFreeze.path)).toBe(true);
    expect(exists(record.canonicalRefs.v3PureCoreFreeze.path)).toBe(true);
    expect(exists(record.canonicalRefs.v3bExecutionAuthorization.path)).toBe(true);
  });

  it("pins the merged Actionplan base as a distinct fact, never mislabeled as a canonicalRefs sourceCommit", () => {
    const record = readJson(RECORD);
    expect(record.canonicalRefs.actionplanBasePin.commit).toBe(ACTIONPLAN_BASE_COMMIT);
    expect(record.canonicalRefs.actionplanBasePin.kind).toBe("merged-base-not-authored-source");
  });

  it("carries the exact sorted allowedFiles set for this writer lease and fails closed on drift", async () => {
    const record = readJson(RECORD);
    expect(record.allowedFiles).toEqual(ALLOWED_FILES);
    expect([...record.allowedFiles].sort()).toEqual(record.allowedFiles);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.allowedFiles = [...ALLOWED_FILES, "src/extra-unpinned-file.mjs"];
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutated, v2Record, v3Record, v3bRecord }).errors,
    ).toContain("allowed-files-drift");
  });

  it("structurally proves no customer/CRM business table enters Kernel via kernelBusinessTablePolicy, not just a title/owner field", async () => {
    const record = readJson(RECORD);
    expect(record.kernelBusinessTablePolicy.customerCrmBusinessTableAllowed).toBe(false);
    expect(record.kernelBusinessTablePolicy.owner).toBe("APPLICATION");
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.kernelBusinessTablePolicy.customerCrmBusinessTableAllowed = true;
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutated, v2Record, v3Record, v3bRecord }).errors,
    ).toContain("kernel-business-table-policy-drift");
  });

  it("records Uvicorn and Hypercorn as deferred V5 server choices, never a V4 selection", () => {
    const record = readJson(RECORD);
    expect(record.frameworkIndependence.v5DeferredServerChoices).toEqual(["Uvicorn", "Hypercorn"]);
    expect(record.frameworkIndependence.v4ServerChoiceMade).toBe(false);
  });

  it("pins the Kernel PUBLIC base as a read-only fact basis, never a write", () => {
    const record = readJson(RECORD);
    expect(record.kernelBasePin.repository).toBe("metaframer-net/metaframer-kernel");
    expect(record.kernelBasePin.visibility).toBe("PUBLIC");
    expect(record.kernelBasePin.baseCommit).toBe(KERNEL_BASE_COMMIT);
    expect(record.kernelBasePin.accessMode).toBe("read-only-fact-basis");
    expect(record.kernelBasePin.writesThisRecord).toBe(false);
  });

  it("binds PreparedChangeSet intents to the existing UnitOfWork begin/body/commit/rollback contract without altering UoW policy", () => {
    const record = readJson(RECORD);
    expect(record.preparedChangeSetBinding.intents).toEqual(PREPARED_CHANGE_SET_INTENTS);
    expect(record.preparedChangeSetBinding.unitOfWorkContract.boundary).toEqual([
      "begin",
      "body",
      "commit",
      "rollback",
    ]);
    expect(record.preparedChangeSetBinding.unitOfWorkContract.policyUnchanged).toBe(true);
  });

  it("keeps businessPersistenceOwner=APPLICATION: no customer/CRM business table enters Kernel", () => {
    const record = readJson(RECORD);
    expect(record.businessPersistenceOwner).toBe("APPLICATION");
  });

  it("reuses the PostgreSQL16/Alembic Python substrate unchanged with no activation/readiness claim", () => {
    const record = readJson(RECORD);
    expect(record.substrate.engine).toBe("PostgreSQL16");
    expect(record.substrate.migrationTool).toBe("Alembic");
    expect(record.substrate.language).toBe("Python");
    expect(record.substrate.status).toBe("reused-unchanged");
    expect(record.substrate.activationClaim).toBe(false);
    expect(record.substrate.readinessClaim).toBe(false);
  });

  it("keeps the typed bridge gate ABSENT_CLOSED as a blocking prerequisite, with no direct/in-process bridge claim", () => {
    const record = readJson(RECORD);
    expect(record.typedBridge.owner).toBe("GENERATED_SDK_PACKAGE_FROM_KERNEL_CONTRACTS");
    expect(record.typedBridge.artifactStatus).toBe("ABSENT_CLOSED");
    expect(record.typedBridge.blockingPrerequisiteForV4Runtime).toBe(true);
    expect(record.typedBridge.directInProcessBridgeClaimed).toBe(false);
  });

  it("freezes the eventual atomic contract: one Postgres transaction, commit-only receipt, zero-duplicate replay, fail-closed RLS", () => {
    const record = readJson(RECORD);
    expect(record.atomicContract.transactionScope).toEqual([
      "customerWrite",
      "audit",
      "transactionalOutbox",
      "idempotency",
    ]);
    expect(record.atomicContract.transactionEngine).toBe("single-postgres-transaction");
    expect(record.atomicContract.commitReceipt.issuedAfter).toBe("successful-commit-only");
    expect(record.atomicContract.replay.sameIdempotencyKey).toBe("same-receipt");
    expect(record.atomicContract.replay.duplicateWrites).toBe("zero");
    expect(record.atomicContract.tenantContext.rlsFailureMode).toBe("fail-closed");
  });

  it("keeps persistence framework-independent: ASGI is V5-only, FastAPI is optional-adapter-never-base, Django is absent", () => {
    const record = readJson(RECORD);
    expect(record.frameworkIndependence.persistenceFrameworkIndependent).toBe(true);
    expect(record.frameworkIndependence.asgiScope).toBe("v5-delivery-only");
    expect(record.frameworkIndependence.fastapiRole).toBe(
      "optional-adapter-never-development-base",
    );
    expect(record.frameworkIndependence.djangoStatus).toBe("absent");
    expect(record.frameworkIndependence.frameworkChoiceMadeHere).toBe(false);
  });

  it("keeps runnableProduct false and capabilityDelta NONE, never a runnable product capability", () => {
    const record = readJson(RECORD);
    expect(record.runnableProduct).toBe(false);
    expect(record.capabilityDelta).toBe("NONE");
  });

  it("self-consistent scopeHash via the pure validator", async () => {
    const record = readJson(RECORD);
    const { computeScopeHash } = await load(VALIDATOR);
    expect(record.scopeHash).toBe(computeScopeHash(record));
  });

  it("accepts the record as-is via the fail-closed validator, cross-checked against V3 and V3B on disk", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const { accepted, errors } = evaluatePersistenceBoundaryFreeze({
      record,
      v2Record,
      v3Record,
      v3bRecord,
    });
    expect(errors, "unexpected-validator-errors").toEqual([]);
    expect(accepted).toBe(true);
  });

  it("fail-closed: rejects a widened runtime authorization (v4PersistenceImplementationAllowed) and a bridge-gate drift", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);

    const widenedV3 = clone(v3Record);
    widenedV3.prohibitions.v4PersistenceImplementationAllowed = true;
    expect(
      evaluatePersistenceBoundaryFreeze({ record, v2Record, v3Record: widenedV3, v3bRecord })
        .errors,
    ).toContain("v3-v4-persistence-implementation-allowed-not-closed-at-source");

    const widenedBridge = clone(record);
    widenedBridge.typedBridge.artifactStatus = "PRESENT_OPEN";
    expect(
      evaluatePersistenceBoundaryFreeze({ record: widenedBridge, v3Record, v3bRecord }).errors,
    ).toContain("bridge-gate-drift");
  });

  it("fail-closed: rejects businessPersistenceOwner drift and a Kernel business table claim", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.businessPersistenceOwner = "KERNEL";
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutated, v2Record, v3Record, v3bRecord }).errors,
    ).toContain("business-persistence-owner-drift");
  });

  it("fail-closed: rejects atomicity/receipt/replay/RLS drift", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.atomicContract.tenantContext.rlsFailureMode = "fail-open";
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutated, v2Record, v3Record, v3bRecord }).errors,
    ).toContain("atomic-contract-drift");
    const mutatedReplay = clone(record);
    mutatedReplay.atomicContract.replay.duplicateWrites = "possible";
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutatedReplay, v2Record, v3Record, v3bRecord })
        .errors,
    ).toContain("atomic-contract-drift");
  });

  it("fail-closed: rejects a framework-base drift (FastAPI promoted to development base)", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.frameworkIndependence.fastapiRole = "development-base";
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutated, v2Record, v3Record, v3bRecord }).errors,
    ).toContain("framework-base-drift");
  });

  it("fail-closed: rejects runnableProduct=true and a scopeHash mutated to no longer match its own scope", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutatedRunnable = clone(record);
    mutatedRunnable.runnableProduct = true;
    expect(
      evaluatePersistenceBoundaryFreeze({ record: mutatedRunnable, v2Record, v3Record, v3bRecord })
        .errors,
    ).toContain("runnable-product-drift");
    const mutatedHash = clone(record);
    mutatedHash.scopeHash = "0".repeat(64);
    const { accepted, errors } = evaluatePersistenceBoundaryFreeze({
      record: mutatedHash,
      v2Record,
      v3Record,
      v3bRecord,
    });
    expect(accepted).toBe(false);
    expect(errors).toContain("scope-hash-drift");
  });

  it("fail-closed: rejects mutated or wholly omitted V3/V3B source witnesses", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    for (const omitted of [undefined, null, "not-an-object"]) {
      expect(
        evaluatePersistenceBoundaryFreeze({ record, v2Record, v3Record: omitted, v3bRecord })
          .errors,
      ).toContain("v3-record-missing");
      expect(
        evaluatePersistenceBoundaryFreeze({ record, v2Record, v3Record, v3bRecord: omitted })
          .errors,
      ).toContain("v3b-record-missing");
    }
    const mutatedV3b = clone(v3bRecord);
    mutatedV3b.runnableProduct = true;
    expect(
      evaluatePersistenceBoundaryFreeze({ record, v2Record, v3Record, v3bRecord: mutatedV3b })
        .errors,
    ).toContain("v3b-runnable-product-not-closed-at-source");
  });

  it("fail-closed: rejects an unknown root key added to the record", async () => {
    const record = readJson(RECORD);
    const v2Record = readJson(V2_RECORD);
    const v3Record = readJson(V3_RECORD);
    const v3bRecord = readJson(V3B_RECORD);
    const { evaluatePersistenceBoundaryFreeze } = await load(VALIDATOR);
    const mutated = clone(record);
    mutated.extraUnknownKey = "surprise";
    const { accepted, errors } = evaluatePersistenceBoundaryFreeze({
      record: mutated,
      v2Record,
      v3Record,
      v3bRecord,
    });
    expect(accepted).toBe(false);
    expect(errors).toContain("record-root-drift");
  });
});
