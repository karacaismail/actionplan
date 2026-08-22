import { createHash } from "node:crypto";

// GJ01 V3B Execution Authorization validator. Pure: takes the record as a value, reads no file.
// Supersedes ONLY V3A's runtimeCodeAllowed/executablePipelineAllowed, exact-files-only, for one
// exact Kernel package pinned by a path-set hash. v3aRecord is a mandatory source witness.
export const RECORD_REF = "reports/gj01-v3b-execution-authorization-2026-08-22.json";
export const RECORD_APPLICABILITY = "actionplan-kernel-governance-gj01-v3b-execution-authorization";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v3b-execution-authorization-2026-08-22";
export const GENERATED_AT = "2026-08-22";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["canonicalRefs", "capabilityDelta", "generatedAt", "id", "kernelPackage", "nonGoals", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "supersedes"];

export const V3A_PATH = "reports/gj01-v3-pure-core-freeze-2026-08-22.json";
export const V3A_SOURCE_COMMIT = "0ea17838c345f088066e3a457a9c2b0e277c8a3d";
export const V3A_SCOPE_HASH = "e9334669f2ee73a5b8ca670dae2e91af68c904ad5eb2bf9c42e51b889a71d909";
export const CANONICAL_REFS_PIN = {
  v3aFreeze: {
    path: V3A_PATH,
    sourceCommit: V3A_SOURCE_COMMIT,
    scopeHash: V3A_SCOPE_HASH,
    status: "consumed-by-reference",
  },
};

export const KERNEL_REPOSITORY = "metaframer-net/metaframer-kernel";
export const KERNEL_VISIBILITY = "PUBLIC";
export const KERNEL_BASE_COMMIT = "8c2e5f0acf52338d2617547fad6585dd459b75f4";
// biome-ignore format: closed sorted Kernel file set; a quietly added/dropped/reordered file is a diff
export const KERNEL_FILES = ["CHANGELOG.md", "planning/gj01-v3b-pure-core-pipeline.json", "src/application/create-customer-pipeline.mjs", "tests/kernel-create-customer-pipeline.test.mjs", "tests/repository-boundary.test.mjs"];
export const KERNEL_FILE_SET_HASH =
  "4ebef319dd15083e928154b88ff7ff79112ff935b5ba1dfe114927233f0b1ad0";
export const KERNEL_FILE_SET_HASH_KIND = "path-set-hash-not-content-hash";
export const KERNEL_PACKAGE_PIN = {
  repository: KERNEL_REPOSITORY,
  visibility: KERNEL_VISIBILITY,
  baseCommit: KERNEL_BASE_COMMIT,
  files: KERNEL_FILES,
  fileSetHash: KERNEL_FILE_SET_HASH,
  fileSetHashKind: KERNEL_FILE_SET_HASH_KIND,
};

export function computeKernelFileSetHash(files) {
  return createHash("sha256").update(JSON.stringify(files)).digest("hex");
}

// biome-ignore format: closed standard-refs set; a quietly added/dropped ref is a diff
export const STANDARD_REFS = ["kernel-delivery-boundary", "quality-gates", "short-code"];

export const LIFTED_PROHIBITION_POINTERS = [
  "/prohibitions/runtimeCodeAllowed",
  "/prohibitions/executablePipelineAllowed",
];
export const SUPERSEDES_PIN = {
  source: "v3aFreeze",
  lifted: LIFTED_PROHIBITION_POINTERS.map((prohibitionPointer) => ({
    prohibitionPointer,
    from: false,
    to: true,
    qualifier: "exact-files-only",
    scope: "kernelPackage",
  })),
  allOtherProhibitionsRemainClosed: true,
};

// biome-ignore format: closed indexed non-goal lines; a quietly reordered/dropped line is a diff
export const NON_GOALS = ["no V3-complete claim", "no V4 PostgreSQL/RLS/UoW/commit/audit/outbox/persistence/receipt implementation", "no V5+ ASGI/Uvicorn/Hypercorn runtime", "no SDK artifact generation", "no UI design", "no second journey", "no release/deploy", "no product readiness claim", "no platform product code", "no V1 edits", "no V2 edits", "no V3A edits", "no Actionplan runtime code", "no Kernel byte outside the listed exact file set", "no authorization-record Git mutation", "FastAPI is never the development base", "Django is deleted/absent — no carry-over"];

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
    canonicalRefs: doc.canonicalRefs,
    kernelPackage: doc.kernelPackage,
    supersedes: doc.supersedes,
    nonGoals: doc.nonGoals,
    standardRefs: doc.standardRefs,
    capabilityDelta: doc.capabilityDelta,
    runnableProduct: doc.runnableProduct,
  });
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function evaluateExecutionAuthorization({ record, v3aRecord } = {}) {
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

  eq(doc.canonicalRefs, CANONICAL_REFS_PIN, "canonical-refs");
  eq(doc.kernelPackage, KERNEL_PACKAGE_PIN, "kernel-package");
  if (computeKernelFileSetHash(KERNEL_FILES) !== KERNEL_FILE_SET_HASH) add("kernel-hash-drift");
  eq(doc.supersedes, SUPERSEDES_PIN, "supersedes");
  eq(doc.standardRefs, STANDARD_REFS, "standard-refs");
  eq(doc.nonGoals, NON_GOALS, "non-goals");

  if (doc.capabilityDelta !== "authorization-only") add("capability-delta-drift");
  if (doc.runnableProduct !== false) add("runnable-product-drift");

  if (doc.scopeHash !== computeScopeHash(doc)) add("scope-hash-drift");

  if (v3aRecord === null || v3aRecord === undefined || typeof v3aRecord !== "object") {
    add("v3a-record-missing");
  } else {
    if (v3aRecord.scopeHash !== V3A_SCOPE_HASH) add("v3a-scope-hash-pin-mismatch");
    if (v3aRecord?.prohibitions?.runtimeCodeAllowed !== false)
      add("v3a-runtime-code-allowed-not-closed-at-source");
    if (v3aRecord?.prohibitions?.executablePipelineAllowed !== false)
      add("v3a-executable-pipeline-allowed-not-closed-at-source");
  }

  return { errors, accepted: errors.length === 0 };
}
