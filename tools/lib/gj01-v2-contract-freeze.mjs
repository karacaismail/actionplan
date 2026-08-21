import { createHash } from "node:crypto";

// GJ01 V2 Contract Freeze validator. Pure: takes the record as a value, reads no file, returns
// every named reason it fails rather than only the first. It pins the Actionplan base SHA,
// closes the record to exactly the framework-independent field-name and invariant shapes for
// CreateCustomer@1 (ActionSpec fields, the closed outcome set, a non-leaking error envelope,
// retry-same-idempotency-key-only, a transactional-outbox event envelope, CommitReceipt proof
// fields) plus its explicit no-executable-types/validation-library, V3/V4/V5+, UI, second-journey,
// SDK, release, FastAPI/Django, platform-product-code and V1-edits non-goals, and computes a
// deterministic scopeHash over the closed scope. It never restates values owned by
// reports/gj01-v1-journey-freeze-2026-08-22.json, consumed only by sourceCommit pointer.
export const RECORD_REF = "reports/gj01-v2-contract-freeze-2026-08-22.json";
export const RECORD_APPLICABILITY = "actionplan-kernel-governance-gj01-v2-contract-freeze";
export const ACTIONPLAN_SHA = "2105b0866e814622bd7cc346d06af33b97289105";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v2-contract-freeze-2026-08-22";
export const GENERATED_AT = "2026-08-22";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "contract", "generatedAt", "id", "nonGoals", "prohibitions", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "waiver"];
export const OUTCOME_VALUES = ["ALLOW_COMMIT", "DENY", "INVALID", "CROSS_TENANT_DENY"];
export const ACTION_SPEC_FIELDS = ["requestId", "actorId", "tenantId", "payload", "idempotencyKey"];
export const PAYLOAD_KIND = "CreateCustomerPayload";
export const STANDARDS_SOURCE_COMMIT = "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d";
export const JOURNEY_FREEZE_SOURCE_COMMIT = "2105b0866e814622bd7cc346d06af33b97289105";
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
  {
    standard: "architecture",
    applies: true,
    reason: "V2 kaydı framework-bağımsız alan-adı ve invariant şeklini doğrudan belirler",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "short-code",
    applies: true,
    reason: "canonicalRefs.journeyFreeze short-code sözleşmesini sourceCommit ile tüketir",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "authz-rbac-abac",
    applies: true,
    reason: "contract.outcomes CROSS_TENANT_DENY şeklini dondurur",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "testing-strategy",
    applies: true,
    reason: "test-first RED/GREEN akışı bu kaydı doğrulayan validator'ı yönetir",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "quality-gates",
    applies: true,
    reason: "fail-closed evaluateContractFreeze bu kaydın kabul kapısıdır",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "kernel-delivery-boundary",
    applies: true,
    reason: "prohibitions v3-v5+ implementasyon ve release/deploy sınırını kapatıyor",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "data-api-contract",
    applies: true,
    reason: "contract ActionSpec/error/event/retry/receipt alan-adı şeklini bu kayıt dondurur",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "observability",
    applies: false,
    reason: "V8 kapsamı; bu kayıtta runtimeCodeAllowed=false ve gözlemlenecek çalışan sistem yok",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "release-versioning",
    applies: false,
    reason: "releaseAllowed=false ve deployAllowed=false; bu kayıtta release yok",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
];
export const WAIVER_PIN = null;
export const CANONICAL_REFS_PIN = {
  actionplanBase: { sha: ACTIONPLAN_SHA, status: "pinned" },
  journeyFreeze: {
    path: "reports/gj01-v1-journey-freeze-2026-08-22.json",
    sourceCommit: JOURNEY_FREEZE_SOURCE_COMMIT,
    status: "consumed-by-reference",
  },
};
export const CONTRACT_PIN = {
  journeyId: "CreateCustomer@1",
  actionSpecFields: ACTION_SPEC_FIELDS,
  payloadKind: PAYLOAD_KIND,
  outcomes: OUTCOME_VALUES,
  errorEnvelope: {
    nonLeaking: true,
    fields: ["code", "message", "requestId", "retryable"],
  },
  retryPolicy: {
    sameIdempotencyKeyOnly: true,
    noReceiptTransientFailure: "retryable-same-key-only",
    closedActionOutcomes: "terminal-no-automatic-retry",
  },
  eventEnvelope: {
    kind: "transactional-outbox",
    fields: [
      "eventId",
      "eventType",
      "requestId",
      "tenantId",
      "actorId",
      "resourceId",
      "idempotencyKey",
      "occurredAt",
      "payload",
    ],
  },
  commitReceipt: {
    fields: [
      "requestId",
      "tenantId",
      "resourceId",
      "outcome",
      "committedAt",
      "auditId",
      "outboxEventIds",
      "idempotencyKey",
    ],
  },
};
export const PROHIBITION_KEYS = [
  "gitCommitPushByThisRecord",
  "runtimeCodeAllowed",
  "releaseAllowed",
  "deployAllowed",
  "secondJourneyAllowed",
  "fastapiAsDevelopmentBaseAllowed",
  "djangoCarryOverAllowed",
  "executableTypesLibraryAllowed",
  "validationLibraryAllowed",
  "v3CoreImplementationAllowed",
  "v4PersistenceImplementationAllowed",
  "v5RuntimeImplementationAllowed",
  "uiDesignAllowed",
  "sdkGenerationAllowed",
  "platformProductCodeAllowed",
  "v1EditsAllowed",
];
export const NON_GOALS = [
  "no executable types/validation library",
  "no V3 framework-free core implementation",
  "no V4 PostgreSQL/RLS/audit/outbox implementation",
  "no V5+ ASGI/adapter/runtime",
  "no UI design",
  "no second journey",
  "no SDK artifact generation",
  "no release/deploy",
  "no platform product code",
  "no V1 edits",
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
    contract: doc.contract,
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

export function evaluateContractFreeze({ record } = {}) {
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

  eq(doc.contract, CONTRACT_PIN, "contract-exact-pin");
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
