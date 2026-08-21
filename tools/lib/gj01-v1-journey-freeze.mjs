import { createHash } from "node:crypto";

// GJ01 V1 Journey Freeze validator. Pure: takes the record as a value, reads no file, returns
// every named reason it fails rather than only the first. It pins the Actionplan base SHA,
// closes the record to exactly one owner-visible journey (CreateCustomer@1) plus its explicit
// V2-V5+/UI/second-journey/SDK/release/FastAPI/Django non-goals, and computes a deterministic
// scopeHash over the closed scope. It never restates values owned by
// reports/gj01-roadmap-resolution-2026-08-21.json or
// reports/gj01-v0-failure-archaeology-2026-08-21.json, consumed only by sourceCommit pointer.
export const RECORD_REF = "reports/gj01-v1-journey-freeze-2026-08-22.json";
export const RECORD_APPLICABILITY = "actionplan-kernel-governance-gj01-v1-journey-freeze";
export const ACTIONPLAN_SHA = "f9e7b05151017e9649b4e226142ff5b347f65563";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v1-journey-freeze-2026-08-22";
export const GENERATED_AT = "2026-08-22";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "generatedAt", "id", "journey", "nonGoals", "prohibitions", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "waiver"];
export const OUTCOME_VALUES = ["ALLOW_COMMIT", "DENY", "INVALID", "CROSS_TENANT_DENY"];
export const STANDARDS_SOURCE_COMMIT = "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d";
export const STANDARD_REFS = [
  "architecture",
  "short-code",
  "authz-rbac-abac",
  "testing-strategy",
  "quality-gates",
  "kernel-delivery-boundary",
  "data-api-contract",
  "observability",
  "release-versioning",
];
export const APPLICABILITY_PIN = [
  { standard: "architecture", applies: true, reason: "V1 kaydı mimari sınır ve dosya/rol kapsamını doğrudan belirler", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "short-code", applies: true, reason: "canonicalRefs.roadmapResolution short-code sözleşmesini sourceCommit ile tüketir", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "authz-rbac-abac", applies: true, reason: "journey AUTHENTICATED_TENANT_SCOPED_ACTOR ve CROSS_TENANT_DENY outcome'unu donduruyor", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "testing-strategy", applies: true, reason: "test-first RED/GREEN akışı bu kaydı doğrulayan validator'ı yönetir", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "quality-gates", applies: true, reason: "fail-closed evaluateJourneyFreeze bu kaydın kabul kapısıdır", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "kernel-delivery-boundary", applies: true, reason: "prohibitions v2-v5+ implementasyon ve release/deploy sınırını kapatıyor", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "data-api-contract", applies: false, reason: "V2 kapsamı; bu kayıt hiçbir ActionSpec/error/event/retry/receipt şema şekli açmaz", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "observability", applies: false, reason: "V8 kapsamı; bu kayıtta runtimeCodeAllowed=false ve gözlemlenecek çalışan sistem yok", sourceCommit: STANDARDS_SOURCE_COMMIT },
  { standard: "release-versioning", applies: false, reason: "releaseAllowed=false ve deployAllowed=false; bu kayıtta release yok", sourceCommit: STANDARDS_SOURCE_COMMIT },
];
export const WAIVER_PIN = null;
export const CANONICAL_REFS_PIN = {
  actionplanBase: { sha: ACTIONPLAN_SHA, status: "pinned" },
  roadmapResolution: {
    path: "reports/gj01-roadmap-resolution-2026-08-21.json",
    sourceCommit: "a77a1ab130a4289583fa5f2bdce4c64e97f763df",
    status: "consumed-by-reference",
  },
  failureArchaeology: {
    path: "reports/gj01-v0-failure-archaeology-2026-08-21.json",
    sourceCommit: "8979ee03202ef3c167b19bda308522b801fcf4d0",
    status: "consumed-by-reference",
  },
};
export const JOURNEY_PIN = {
  id: "CreateCustomer@1",
  actor: "AUTHENTICATED_TENANT_SCOPED_ACTOR",
  steps: [
    "actor selects the tenant context",
    "actor submits a new-customer registration intent",
    "PDP decision and invariant evaluation determine the outcome",
    "an ALLOW_COMMIT outcome requires a single atomic commit and yields a CommitReceipt",
    "DENY, INVALID and CROSS_TENANT_DENY outcomes produce zero business write",
    "retrying the same intent never produces a duplicate customer",
  ],
  outcomes: OUTCOME_VALUES,
};
export const PROHIBITION_KEYS = [
  "gitCommitPushByThisRecord",
  "runtimeCodeAllowed",
  "releaseAllowed",
  "deployAllowed",
  "secondJourneyAllowed",
  "fastapiAsDevelopmentBaseAllowed",
  "djangoCarryOverAllowed",
  "v2SchemaOpeningAllowed",
  "v3CoreImplementationAllowed",
  "v4PersistenceImplementationAllowed",
  "v5RuntimeImplementationAllowed",
];
export const NON_GOALS = [
  "no V2 ActionSpec/error/event/retry/receipt schema shape",
  "no V3 framework-free core implementation",
  "no V4 PostgreSQL/RLS/audit/outbox implementation",
  "no V5+ ASGI/adapter/runtime",
  "no UI design",
  "no second journey",
  "no SDK artifact generation",
  "no release/deploy",
  "FastAPI is never the development base",
  "Django is deleted/absent — no carry-over",
];

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
    journey: doc.journey,
    prohibitions: doc.prohibitions,
    nonGoals: doc.nonGoals,
    standardRefs: doc.standardRefs,
    applicability: doc.applicability,
    waiver: doc.waiver,
    capabilityDelta: doc.capabilityDelta,
    runnableProduct: doc.runnableProduct,
  });
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function evaluateJourneyFreeze({ record } = {}) {
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
  if (doc.recordApplicability !== RECORD_APPLICABILITY) add("record-applicability-drift");
  eq(doc.canonicalRefs, CANONICAL_REFS_PIN, "canonical-refs");

  eq(doc.journey, JOURNEY_PIN, "journey-exact-pin");
  eq(doc.standardRefs, STANDARD_REFS, "standard-refs");
  eq(doc.applicability, APPLICABILITY_PIN, "applicability-matrix");
  if (doc.waiver !== WAIVER_PIN) add("waiver-not-null");

  if (doc.capabilityDelta !== "NONE") add("capability-delta-drift");
  if (doc.runnableProduct !== false) add("runnable-product-drift");

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
