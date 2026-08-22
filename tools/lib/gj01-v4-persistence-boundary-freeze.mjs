import { createHash } from "node:crypto";

// GJ01 V4A Persistence Boundary Freeze validator. Pure: takes records as values, reads no file.
// Reference-only decision-freeze record. No runtime code, no adapter/SDK generation, no
// framework selection. V2, V3 and V3B are mandatory source witnesses (omission fails closed).
export const RECORD_REF = "reports/gj01-v4-persistence-boundary-freeze-2026-08-22.json";
export const RECORD_APPLICABILITY =
  "actionplan-kernel-governance-gj01-v4-persistence-boundary-freeze";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v4-persistence-boundary-freeze-2026-08-22";
export const GENERATED_AT = "2026-08-22";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["allowedFiles", "atomicContract", "businessPersistenceOwner", "canonicalRefs", "capabilityDelta", "frameworkIndependence", "generatedAt", "id", "kernelBasePin", "kernelBusinessTablePolicy", "nonGoals", "preparedChangeSetBinding", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "substrate", "typedBridge"];

// biome-ignore format: closed sorted allowed-files set for this writer lease; a quietly added/dropped path is a diff
export const ALLOWED_FILES = ["reports/gj01-v4-persistence-boundary-freeze-2026-08-22.json", "tests/gj01V4PersistenceBoundaryFreeze.test.ts", "tools/lib/gj01-v4-persistence-boundary-freeze.mjs"];

export const V2_PATH = "reports/gj01-v2-contract-freeze-2026-08-22.json";
export const V2_SOURCE_COMMIT = "28025fa9efaa09b625bb9e04d5b0d67a4488c8e8";
export const V2_SCOPE_HASH = "66e727aec3cf78f67312df1e2a04fd03f8a89103b0d259eb69aca530df127771";

export const V3_PATH = "reports/gj01-v3-pure-core-freeze-2026-08-22.json";
export const V3_SOURCE_COMMIT = "0ea17838c345f088066e3a457a9c2b0e277c8a3d";
export const V3_SCOPE_HASH = "e9334669f2ee73a5b8ca670dae2e91af68c904ad5eb2bf9c42e51b889a71d909";

export const V3B_PATH = "reports/gj01-v3b-execution-authorization-2026-08-22.json";
export const V3B_SOURCE_COMMIT = "75202acfb7b2e1cc238e8ddb884cf40a4b1a2010";
export const V3B_SCOPE_HASH = "a86ad31d8b6a7b1c9f69be0a909fbc9dde1d4d1bd671bae57760c68aa71ca3d1";

export const ACTIONPLAN_BASE_COMMIT = "72a6f76c612d474e3765f1ff5920df76b2f786f2";

export const CANONICAL_REFS_PIN = {
  v2ContractFreeze: {
    path: V2_PATH,
    sourceCommit: V2_SOURCE_COMMIT,
    scopeHash: V2_SCOPE_HASH,
    status: "consumed-by-reference",
  },
  v3PureCoreFreeze: {
    path: V3_PATH,
    sourceCommit: V3_SOURCE_COMMIT,
    scopeHash: V3_SCOPE_HASH,
    status: "consumed-by-reference",
  },
  v3bExecutionAuthorization: {
    path: V3B_PATH,
    sourceCommit: V3B_SOURCE_COMMIT,
    scopeHash: V3B_SCOPE_HASH,
    status: "consumed-by-reference",
  },
  actionplanBasePin: {
    commit: ACTIONPLAN_BASE_COMMIT,
    kind: "merged-base-not-authored-source",
  },
};

export const KERNEL_REPOSITORY = "metaframer-net/metaframer-kernel";
export const KERNEL_VISIBILITY = "PUBLIC";
export const KERNEL_BASE_COMMIT = "359389c4d8438b2e6624ca30e9350240bfc2a80e";
export const KERNEL_BASE_PIN = {
  repository: KERNEL_REPOSITORY,
  visibility: KERNEL_VISIBILITY,
  baseCommit: KERNEL_BASE_COMMIT,
  accessMode: "read-only-fact-basis",
  writesThisRecord: false,
};

export const KERNEL_BUSINESS_TABLE_POLICY = {
  customerCrmBusinessTableAllowed: false,
  owner: "APPLICATION",
};

export const PREPARED_CHANGE_SET_INTENTS = [
  "customer",
  "audit",
  "transactionalOutbox",
  "idempotency",
];
export const PREPARED_CHANGE_SET_BINDING = {
  intents: PREPARED_CHANGE_SET_INTENTS,
  unitOfWorkContract: {
    boundary: ["begin", "body", "commit", "rollback"],
    policyUnchanged: true,
  },
};

export const ATOMIC_CONTRACT = {
  transactionScope: ["customerWrite", "audit", "transactionalOutbox", "idempotency"],
  transactionEngine: "single-postgres-transaction",
  commitReceipt: { issuedAfter: "successful-commit-only" },
  replay: { sameIdempotencyKey: "same-receipt", duplicateWrites: "zero" },
  tenantContext: { rlsFailureMode: "fail-closed" },
};

export const FRAMEWORK_INDEPENDENCE = {
  persistenceFrameworkIndependent: true,
  asgiScope: "v5-delivery-only",
  fastapiRole: "optional-adapter-never-development-base",
  djangoStatus: "absent",
  frameworkChoiceMadeHere: false,
  v5DeferredServerChoices: ["Uvicorn", "Hypercorn"],
  v4ServerChoiceMade: false,
};

export const SUBSTRATE = {
  engine: "PostgreSQL16",
  migrationTool: "Alembic",
  language: "Python",
  status: "reused-unchanged",
  activationClaim: false,
  readinessClaim: false,
};

export const TYPED_BRIDGE = {
  owner: "GENERATED_SDK_PACKAGE_FROM_KERNEL_CONTRACTS",
  artifactStatus: "ABSENT_CLOSED",
  blockingPrerequisiteForV4Runtime: true,
  directInProcessBridgeClaimed: false,
};

// biome-ignore format: closed standard-refs set; a quietly added/dropped ref is a diff
export const STANDARD_REFS = ["architecture", "kernel-delivery-boundary", "quality-gates", "short-code"];

// biome-ignore format: closed indexed non-goal lines; a quietly reordered/dropped line is a diff
export const NON_GOALS = ["no Kernel repo bytes", "no runtime/product code", "no SDK bridge implementation", "no database migration", "no FastAPI/Django development base", "no ASGI server choice in V4", "no Git mutation", "no V1/V2/V3/V3B edits", "no platform product code", "no product readiness claim"];

const sortKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeys(value[k])]),
    );
  return value;
};

export function computeScopeHash(record) {
  const doc = record ?? {};
  const scope = sortKeys({
    allowedFiles: doc.allowedFiles,
    atomicContract: doc.atomicContract,
    businessPersistenceOwner: doc.businessPersistenceOwner,
    canonicalRefs: doc.canonicalRefs,
    capabilityDelta: doc.capabilityDelta,
    frameworkIndependence: doc.frameworkIndependence,
    kernelBasePin: doc.kernelBasePin,
    kernelBusinessTablePolicy: doc.kernelBusinessTablePolicy,
    nonGoals: doc.nonGoals,
    preparedChangeSetBinding: doc.preparedChangeSetBinding,
    runnableProduct: doc.runnableProduct,
    standardRefs: doc.standardRefs,
    substrate: doc.substrate,
    typedBridge: doc.typedBridge,
  });
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function evaluatePersistenceBoundaryFreeze({ record, v2Record, v3Record, v3bRecord } = {}) {
  const errors = [];
  const doc = record ?? {};
  const add = (error) => {
    if (!errors.includes(error)) errors.push(error);
  };
  const eq = (got, pinned, tag) => {
    if (JSON.stringify(got) !== JSON.stringify(pinned)) add(`${tag}-drift`);
  };

  eq(Object.keys(doc).sort(), RECORD_ROOT_KEYS, "record-root");
  if (doc.schemaVersion !== SCHEMA_VERSION) add("schema-version-drift");
  if (doc.id !== RECORD_ID) add("id-drift");
  if (doc.generatedAt !== GENERATED_AT) add("generated-at-drift");
  if (doc.status !== STATUS) add("status-drift");
  if (doc.recordApplicability !== RECORD_APPLICABILITY) add("record-applicability-drift");

  eq(doc.allowedFiles, ALLOWED_FILES, "allowed-files");
  eq(doc.canonicalRefs, CANONICAL_REFS_PIN, "canonical-refs");
  eq(doc.kernelBasePin, KERNEL_BASE_PIN, "kernel-base-pin");
  eq(doc.kernelBusinessTablePolicy, KERNEL_BUSINESS_TABLE_POLICY, "kernel-business-table-policy");
  eq(doc.preparedChangeSetBinding, PREPARED_CHANGE_SET_BINDING, "prepared-change-set-binding");
  eq(doc.atomicContract, ATOMIC_CONTRACT, "atomic-contract");
  eq(doc.frameworkIndependence, FRAMEWORK_INDEPENDENCE, "framework-base");
  eq(doc.substrate, SUBSTRATE, "substrate");
  eq(doc.typedBridge, TYPED_BRIDGE, "bridge-gate");
  eq(doc.standardRefs, STANDARD_REFS, "standard-refs");
  eq(doc.nonGoals, NON_GOALS, "non-goals");

  if (doc.businessPersistenceOwner !== "APPLICATION") add("business-persistence-owner-drift");
  if (doc.capabilityDelta !== "NONE") add("capability-delta-drift");
  if (doc.runnableProduct !== false) add("runnable-product-drift");

  if (doc.scopeHash !== computeScopeHash(doc)) add("scope-hash-drift");

  if (v2Record === null || v2Record === undefined || typeof v2Record !== "object") {
    add("v2-record-missing");
  } else if (v2Record.scopeHash !== V2_SCOPE_HASH) {
    add("v2-scope-hash-pin-mismatch");
  }

  if (v3Record === null || v3Record === undefined || typeof v3Record !== "object") {
    add("v3-record-missing");
  } else {
    if (v3Record.scopeHash !== V3_SCOPE_HASH) add("v3-scope-hash-pin-mismatch");
    if (v3Record?.prohibitions?.v4PersistenceImplementationAllowed !== false)
      add("v3-v4-persistence-implementation-allowed-not-closed-at-source");
  }

  if (v3bRecord === null || v3bRecord === undefined || typeof v3bRecord !== "object") {
    add("v3b-record-missing");
  } else {
    if (v3bRecord.scopeHash !== V3B_SCOPE_HASH) add("v3b-scope-hash-pin-mismatch");
    if (v3bRecord.runnableProduct !== false) add("v3b-runnable-product-not-closed-at-source");
  }

  return { errors, accepted: errors.length === 0 };
}
