import { createHash } from "node:crypto";

// GJ01 V0 Failure Archaeology validator. Pure: takes the record as a value, reads no file,
// returns every named reason it fails rather than only the first. It pins the Actionplan base
// SHA and the platform snapshot commit, closes the disposition rows to exactly
// reuse|archive|reject with a non-empty path/fact/carryOverMode per row, and computes a
// deterministic scopeHash over the closed scope. It never restates values owned by
// reports/gj01-roadmap-resolution-2026-08-21.json or the standards-applicability/short-code/
// ai-governance sourceCommit pointers it consumes by reference.
export const RECORD_REF = "reports/gj01-v0-failure-archaeology-2026-08-21.json";
export const APPLICABILITY = "actionplan-kernel-governance-gj01-v0-failure-archaeology";
export const ACTIONPLAN_SHA = "0b0a1e658bc722986d702fd55c285e6d79188d33";
export const PLATFORM_COMMIT = "930c09b4041fe91b5682806eb391b70745c007cd";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v0-failure-archaeology-2026-08-21";
export const GENERATED_AT = "2026-08-21";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "disposition", "generatedAt", "id", "nonGoals", "platformSnapshot", "prohibitions", "runnableProduct", "schemaVersion", "scopeHash", "status"];
export const MODE_VALUES = ["reuse", "archive", "reject"];
export const CANONICAL_REFS_PIN = {
  actionplanBase: { sha: ACTIONPLAN_SHA, status: "pinned" },
  roadmapResolution: {
    path: "reports/gj01-roadmap-resolution-2026-08-21.json",
    sourceCommit: "a77a1ab130a4289583fa5f2bdce4c64e97f763df",
    status: "consumed-by-reference",
  },
  standardsApplicability: {
    path: "src/data/standards-applicability.json",
    sourceCommit: "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d",
    status: "consumed-by-reference",
  },
  shortCode: {
    path: "src/data/standards/short-code.json",
    sourceCommit: "c81a57ade2188859fb55b259d7b93ca00378d30d",
    status: "consumed-by-reference",
  },
  aiGovernance: {
    path: "src/data/standards/ai-governance.json",
    sourceCommit: "6f5802089377e93f67adb977f5612fdd2a7b68d4",
    status: "consumed-by-reference",
  },
};
export const DISPOSITION_PIN = [
  {
    path: "legacy platform scaffold — health/ping surface (commit 930c09b)",
    fact: "930c09b provides only DB-less /healthz and GraphQL ping tests; no SQLAlchemy/Alembic/PostgreSQL persistence evidence",
    mode: "archive",
    carryOverMode: "ARCHIVE_EVIDENCE_ZERO_BYTE",
  },
  {
    path: "FastAPI+Strawberry+Uvicorn+httpx development base (commit 930c09b)",
    fact: "no mutation/persistence evidence beyond DB-less health/ping; not eligible as a development base",
    mode: "reject",
    carryOverMode: "REJECT_NO_CARRYOVER",
  },
  {
    path: "Django",
    fact: "absent/deleted in this workspace; no historical byte to carry over",
    mode: "reject",
    carryOverMode: "REJECT_ABSENT_DELETED_NO_CARRYOVER",
  },
  {
    path: "reports/gj01-roadmap-resolution-2026-08-21.json — ASGI Delivery boundary and V4 framework deferral",
    fact: "ActionGateway frozen, ASGI-only Delivery (Uvicorn reference, Hypercorn conformance, FastAPI optional adapter never development base), frameworkDecision DEFERRED_UNTIL_V4",
    mode: "reuse",
    carryOverMode: "REUSE_POINTER_ONLY_ZERO_BYTE",
  },
  {
    path: "legacy web/UI/infra horizontal scaffold",
    fact: "out-of-scope for GJ01-V0-FAILURE-ARCHAEOLOGY; not classified, read, or referenced beyond this row",
    mode: "archive",
    carryOverMode: "ARCHIVE_OUT_OF_SCOPE_NO_CARRYOVER",
  },
];
export const PROHIBITION_KEYS = [
  "gitCommitPushByThisRecord",
  "runtimeCodeAllowed",
  "releaseAllowed",
  "deployAllowed",
  "byteCarryOverAllowed",
  "frameworkSelectionByThisRecord",
];
export const NON_GOALS = [
  "no runtime/feature/release/deploy",
  "no Git commit/push/merge/branch",
  "no byte carry-over from any V0 artifact — reuse rows are pointer/concept only",
  "no re-litigating M7 roadmap resolution values — yalnız sourceCommit pointer",
  "no framework selection by this record — DEFERRED_UNTIL_V4 devam eder",
];
export const PLATFORM_SNAPSHOT_PIN = {
  commit: PLATFORM_COMMIT,
  filesChanged: 51,
  insertions: 4860,
  stack: ["FastAPI", "Strawberry", "Uvicorn", "httpx"],
  testedSurface: "DB_LESS_HEALTHZ_AND_GRAPHQL_PING_ONLY",
  persistenceEvidence: "ABSENT",
  workingTreeDirtyFiles: 11,
  workingTreeDirtyClassification: "BRANDING_UNTOUCHED",
};

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
    platformSnapshot: doc.platformSnapshot,
    disposition: doc.disposition,
    capabilityDelta: doc.capabilityDelta,
    runnableProduct: doc.runnableProduct,
  });
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function evaluateFailureArchaeology({ record } = {}) {
  const errors = [];
  const doc = record ?? {};
  const add = (error) => {
    if (!errors.includes(error)) errors.push(error);
  };
  const closed = (got, pinned, tag) => {
    for (const item of pinned) if (!got.includes(item)) add(`missing-${tag}:${item}`);
    for (const item of got) if (!pinned.includes(item)) add(`unknown-${tag}:${item}`);
    if (got.length !== pinned.length) add(`${tag}-count-drift`);
  };
  const eq = (got, pinned, tag) => {
    if (JSON.stringify(got) !== JSON.stringify(pinned)) add(`${tag}-drift`);
  };

  closed(Object.keys(doc).sort(), RECORD_ROOT_KEYS, "record-root");
  if (doc.schemaVersion !== SCHEMA_VERSION) add("schema-version-drift");
  if (doc.id !== RECORD_ID) add("id-drift");
  if (doc.generatedAt !== GENERATED_AT) add("generated-at-drift");
  if (doc.status !== STATUS) add("status-drift");
  if (doc.applicability !== APPLICABILITY) add("applicability-drift");
  eq(doc.canonicalRefs, CANONICAL_REFS_PIN, "canonical-refs");

  eq(doc.platformSnapshot, PLATFORM_SNAPSHOT_PIN, "platform-snapshot");

  if (doc.capabilityDelta !== "NONE") add("capability-delta-drift");
  if (doc.runnableProduct !== false) add("runnable-product-drift");

  const disposition = Array.isArray(doc.disposition) ? doc.disposition : [];
  if (disposition.length === 0) add("disposition-empty");
  disposition.forEach((row, i) => {
    if (!MODE_VALUES.includes(row?.mode)) add(`disposition-mode-invalid:${i}`);
    if (typeof row?.path !== "string" || row.path.length === 0)
      add(`disposition-path-invalid:${i}`);
    if (typeof row?.fact !== "string" || row.fact.length === 0)
      add(`disposition-fact-invalid:${i}`);
    if (typeof row?.carryOverMode !== "string" || row.carryOverMode.length === 0)
      add(`disposition-carryovermode-invalid:${i}`);
  });
  // Exact pin: rejects any reclassification (mode/carryOverMode/path/fact/order) that a
  // structural-only check above would miss, even when scopeHash is recomputed to match.
  eq(doc.disposition, DISPOSITION_PIN, "disposition-exact-pin");

  const prohibitions = doc.prohibitions ?? {};
  closed(Object.keys(prohibitions).sort(), [...PROHIBITION_KEYS].sort(), "prohibition");
  for (const key of PROHIBITION_KEYS)
    if (prohibitions[key] !== false) add(`prohibition-not-closed:${key}`);

  const nonGoals = doc.nonGoals ?? [];
  for (const [i, line] of NON_GOALS.entries()) if (nonGoals[i] !== line) add(`non-goal-drift:${i}`);
  if (nonGoals.length !== NON_GOALS.length) add("non-goal-count-drift");

  if (RECORD_ROOT_KEYS.includes("canonicalRefs") && doc.canonicalRefs) {
    if (doc.scopeHash !== computeScopeHash(doc)) add("scope-hash-drift");
  } else {
    add("scope-hash-drift");
  }

  return { errors, accepted: errors.length === 0 };
}
