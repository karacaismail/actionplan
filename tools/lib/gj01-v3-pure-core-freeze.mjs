import { createHash } from "node:crypto";

// GJ01 V3 Pure Core Shape Freeze validator. Pure: takes the record as a value, reads no file.
// Closes the framework-independent V3 pipeline shape for CreateCustomer@1 — the ordered stage
// sequence, the pending PreparedChangeSet shape (application-owned customer/audit/
// transactional-outbox/idempotency intents, no CommitReceipt/committedAt/auditId/
// outboxEventIds), and the failure-outcome zero-write shape — both outcomes consumed from V2
// by closed JSON Pointer only, never by copying V2's literal values. Never restates values
// owned by the V1/V2 freeze reports, consumed only by sourceCommit and JSON Pointer.
export const RECORD_REF = "reports/gj01-v3-pure-core-freeze-2026-08-22.json";
export const RECORD_APPLICABILITY = "actionplan-kernel-governance-gj01-v3-pure-core-freeze";
export const ACTIONPLAN_SHA = "28025fa9efaa09b625bb9e04d5b0d67a4488c8e8";
export const SCHEMA_VERSION = "1.0.0";
export const RECORD_ID = "gj01-v3-pure-core-freeze-2026-08-22";
export const GENERATED_AT = "2026-08-22";
export const STATUS = "effective";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["applicability", "canonicalRefs", "capabilityDelta", "contract", "generatedAt", "id", "nonGoals", "prohibitions", "recordApplicability", "runnableProduct", "schemaVersion", "scopeHash", "standardRefs", "status", "waiver"];
// biome-ignore format: closed ordered stage sequence; a quietly added/dropped/reordered stage is a diff
export const PIPELINE_STAGES = ["actionSpecShapeCheck", "identityTenantGuard", "policyDecisionEvaluation", "invariantEvaluation", "idempotencyIntentResolution", "outcomeProjection", "preparedChangeSetProjection", "errorEnvelopeProjection"];
export const PREPARED_CHANGE_SET_INTENTS = [
  "customer",
  "audit",
  "transactionalOutbox",
  "idempotency",
];
export const STANDARDS_SOURCE_COMMIT = "bf5ae0fe6c1fd4059aa7aacd7eadd81bffd45d5d";
export const JOURNEY_FREEZE_SOURCE_COMMIT = "2105b0866e814622bd7cc346d06af33b97289105";
export const CONTRACT_FREEZE_SOURCE_COMMIT = "28025fa9efaa09b625bb9e04d5b0d67a4488c8e8";
// biome-ignore format: closed standard-refs set; a quietly added/dropped ref is a diff
export const STANDARD_REFS = ["architecture", "short-code", "authz-rbac-abac", "testing-strategy", "quality-gates", "kernel-delivery-boundary", "data-api-contract", "observability", "release-versioning"];
export const APPLICABILITY_PIN = [
  {
    standard: "architecture",
    applies: true,
    reason: "V3 kaydı framework-bağımsız kapalı pipeline aşama sırasını doğrudan belirler",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "short-code",
    applies: true,
    reason:
      "canonicalRefs journeyFreeze/contractFreeze short-code sözleşmesini sourceCommit ile tüketir",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "authz-rbac-abac",
    applies: true,
    reason:
      "nonAllowOutcomes V2'nin kapalı failure-outcome/errorEnvelope pointer'larını literal kopyalamadan dondurur",
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
    reason: "fail-closed evaluatePureCoreFreeze bu kaydın kabul kapısıdır",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "kernel-delivery-boundary",
    applies: true,
    reason:
      "prohibitions v3-tamamlandı, v4/v5+ implementasyon ve release/deploy sınırını kapatıyor",
    sourceCommit: STANDARDS_SOURCE_COMMIT,
  },
  {
    standard: "data-api-contract",
    applies: true,
    reason: "contract.allowOutcome.preparedChangeSet pending şeklini bu kayıt dondurur",
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
  contractFreeze: {
    path: "reports/gj01-v2-contract-freeze-2026-08-22.json",
    sourceCommit: CONTRACT_FREEZE_SOURCE_COMMIT,
    status: "consumed-by-reference",
  },
};
export const SUCCESS_OUTCOME_POINTER = "/contract/outcomes/0";
export const FAILURE_OUTCOME_POINTERS = [
  "/contract/outcomes/1",
  "/contract/outcomes/2",
  "/contract/outcomes/3",
];
export const ERROR_ENVELOPE_POINTER = "/contract/errorEnvelope";
export const CONTRACT_PIN = {
  journeyId: "CreateCustomer@1",
  pipelineStages: PIPELINE_STAGES,
  allowOutcome: {
    outcomePointer: { source: "contractFreeze", pointer: SUCCESS_OUTCOME_POINTER },
    preparedChangeSet: {
      persistenceState: "pending",
      deterministic: true,
      intentOwnership: "application-owned",
      intents: PREPARED_CHANGE_SET_INTENTS,
    },
  },
  nonAllowOutcomes: {
    outcomePointers: { source: "contractFreeze", pointers: FAILURE_OUTCOME_POINTERS },
    errorEnvelopePointer: { source: "contractFreeze", pointer: ERROR_ENVELOPE_POINTER },
    writeIntent: "zero-write",
  },
};
// biome-ignore format: closed prohibition key set; a quietly added/dropped key is a diff
export const PROHIBITION_KEYS = ["gitCommitPushByThisRecord", "runtimeCodeAllowed", "executablePipelineAllowed", "v3CompleteClaimAllowed", "v4PersistenceImplementationAllowed", "v5RuntimeImplementationAllowed", "fastapiAsDevelopmentBaseAllowed", "djangoCarryOverAllowed", "uiDesignAllowed", "sdkGenerationAllowed", "secondJourneyAllowed", "releaseAllowed", "deployAllowed", "productReadinessAllowed", "platformProductCodeAllowed", "v1EditsAllowed", "v2EditsAllowed"];
// biome-ignore format: closed indexed non-goal lines; a quietly reordered/dropped line is a diff
export const NON_GOALS = ["no executable pipeline", "no V3-complete claim", "no V4 PostgreSQL/RLS/UoW/commit/audit/outbox/persistence/receipt implementation", "no V5+ ASGI/Uvicorn/Hypercorn runtime", "no UI design", "no SDK artifact generation", "no second journey", "no release/deploy", "no product readiness claim", "no platform product code", "no V1 edits", "no V2 edits", "FastAPI is never the development base", "Django is deleted/absent — no carry-over"];

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

export function evaluatePureCoreFreeze({ record } = {}) {
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

  const contract = doc.contract ?? {};
  eq(contract.pipelineStages, PIPELINE_STAGES, "pipeline-stages");

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
