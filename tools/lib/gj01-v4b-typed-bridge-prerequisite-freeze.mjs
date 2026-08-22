import { createHash } from "node:crypto";

// GJ01 V4B Typed Bridge Prerequisite Freeze validator. Pure: takes records as values, reads no
// file. Reference-only decision-freeze record closing only the typed bridge / generated SDK
// prerequisite boundary after V4A. No runtime code, no SDK generation, no framework selection.
// V4A is a mandatory source witness (omission fails closed).
export const RECORD_REF = "reports/gj01-v4b-typed-bridge-prerequisite-freeze-2026-08-22.json";
export const RECORD_APPLICABILITY =
  "actionplan-kernel-governance-gj01-v4b-typed-bridge-prerequisite-freeze";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v4b-typed-bridge-prerequisite-freeze-2026-08-22";
export const GENERATED_AT = "2026-08-22";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["allowedFiles", "businessPersistenceOwner", "canonicalRefs", "capabilityDelta", "frameworkIndependence", "generatedAt", "id", "kernelBasePin", "kernelBusinessTablePolicy", "nonGoals", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "typedBridge"];

// biome-ignore format: closed sorted allowed-files set for this writer lease; a quietly added/dropped path is a diff
export const ALLOWED_FILES = ["reports/gj01-v4b-typed-bridge-prerequisite-freeze-2026-08-22.json", "tests/gj01V4BTypedBridgePrerequisiteFreeze.test.ts", "tools/lib/gj01-v4b-typed-bridge-prerequisite-freeze.mjs"];

export const V4A_PATH = "reports/gj01-v4-persistence-boundary-freeze-2026-08-22.json";
export const V4A_SOURCE_COMMIT = "9f562e51f810c837bcc6db1dc9039d22067d7574";
export const V4A_SCOPE_HASH = "c2d34b85fab01d47505ae2eb330e7a79ca16a6d4c8fa7610bebcd400cb3427cc";

export const ACTIONPLAN_BASE_COMMIT = "9f562e51f810c837bcc6db1dc9039d22067d7574";

export const CANONICAL_REFS_PIN = {
  v4PersistenceBoundaryFreeze: {
    path: V4A_PATH,
    sourceCommit: V4A_SOURCE_COMMIT,
    scopeHash: V4A_SCOPE_HASH,
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

export const FRAMEWORK_INDEPENDENCE = {
  persistenceFrameworkIndependent: true,
  asgiScope: "v5-delivery-only",
  fastapiRole: "optional-adapter-never-development-base",
  djangoStatus: "absent",
  frameworkChoiceMadeHere: false,
  v5DeferredServerChoices: ["Uvicorn", "Hypercorn"],
  v4ServerChoiceMade: false,
};

export const TYPED_BRIDGE = {
  owner: "GENERATED_SDK_PACKAGE_FROM_KERNEL_CONTRACTS",
  artifactStatus: "ABSENT_CLOSED",
  generatedSdkPackageStatus: "ABSENT_CLOSED",
  directInProcessBridgeClaimed: false,
  runtimeBridgeClaimed: false,
  blockingPrerequisiteForV4Runtime: true,
};

// biome-ignore format: closed standard-refs set; a quietly added/dropped ref is a diff
export const STANDARD_REFS = ["architecture", "kernel-delivery-boundary", "quality-gates", "short-code"];

// biome-ignore format: closed indexed non-goal lines; a quietly reordered/dropped line is a diff
export const NON_GOALS = ["no Kernel repo bytes", "no SDK generation", "no runtime bridge code", "no ASGI/Uvicorn/Hypercorn/FastAPI adapter implementation", "no PostgreSQL schema/migration", "no CRM table", "no product readiness claim", "no V1/V2/V3/V3B/V4A edits"];

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
    businessPersistenceOwner: doc.businessPersistenceOwner,
    canonicalRefs: doc.canonicalRefs,
    capabilityDelta: doc.capabilityDelta,
    frameworkIndependence: doc.frameworkIndependence,
    kernelBasePin: doc.kernelBasePin,
    kernelBusinessTablePolicy: doc.kernelBusinessTablePolicy,
    nonGoals: doc.nonGoals,
    runnableProduct: doc.runnableProduct,
    standardRefs: doc.standardRefs,
    typedBridge: doc.typedBridge,
  });
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function evaluateTypedBridgePrerequisiteFreeze({ record, v4aRecord } = {}) {
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
  eq(doc.frameworkIndependence, FRAMEWORK_INDEPENDENCE, "framework-base");
  eq(doc.typedBridge, TYPED_BRIDGE, "bridge-gate");
  eq(doc.standardRefs, STANDARD_REFS, "standard-refs");
  eq(doc.nonGoals, NON_GOALS, "non-goals");

  if (doc.businessPersistenceOwner !== "APPLICATION") add("business-persistence-owner-drift");
  if (doc.capabilityDelta !== "NONE") add("capability-delta-drift");
  if (doc.runnableProduct !== false) add("runnable-product-drift");

  if (doc.scopeHash !== computeScopeHash(doc)) add("scope-hash-drift");

  if (v4aRecord === null || v4aRecord === undefined || typeof v4aRecord !== "object") {
    add("v4a-record-missing");
  } else {
    if (v4aRecord.scopeHash !== V4A_SCOPE_HASH) add("v4a-scope-hash-pin-mismatch");
    if (v4aRecord?.typedBridge?.artifactStatus !== "ABSENT_CLOSED")
      add("v4a-typed-bridge-artifact-status-not-closed-at-source");
    if (v4aRecord?.businessPersistenceOwner !== "APPLICATION")
      add("v4a-business-persistence-owner-not-closed-at-source");
  }

  return { errors, accepted: errors.length === 0 };
}
