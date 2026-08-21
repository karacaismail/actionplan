import { createHash } from "node:crypto";

// GJ01 Roadmap Resolution validator. Pure: takes the record as a value, reads no file, returns
// every named reason it fails rather than only the first. It pins the Actionplan/Kernel base
// SHAs, the src/data/standards-applicability.json sourceCommit pointer, the frozen ActionGateway
// signature, businessPersistenceOwner/typedBridge ownership, the ASGI-only Delivery/HTTP
// decision, the framework deferral, the legacy-platform/Django no-carryover classification, the
// stale PKG14-19 branch disposition, the first feature package selection and a deterministic
// scopeHash over that closed scope. It never restates standards-applicability's own values.
export const RECORD_REF = "reports/gj01-roadmap-resolution-2026-08-21.json";
export const APPLICABILITY = "actionplan-kernel-governance-gj01-roadmap-resolution";
export const ACTIONPLAN_SHA = "c34ab04ac3a0846ee29386ad495a68efd99891d5";
export const KERNEL_SHA = "8c2e5f0acf52338d2617547fad6585dd459b75f4";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["actionGateway", "applicability", "businessPersistenceOwner", "canonicalRefs", "frameworkDecision", "generatedAt", "httpDelivery", "id", "legacyPlatform", "nonGoals", "prohibitions", "roadmap", "schemaVersion", "scopeHash", "staleBranches", "status", "typedBridge"];
export const PROHIBITION_KEYS = ["gitCommitPushByThisRecord", "runtimeCodeAllowed", "releaseAllowed", "deployAllowed", "pkg14_19CarryOverAllowed", "djangoCarryOverAllowed", "frameworkSelectionBeforeV4"];
export const NON_GOALS = [
  "no runtime/feature/release/deploy",
  "no Git commit/push/merge/branch",
  "no PKG14-19 carry-over — yalnız historical no-carryover kaydı",
  "no Django carry-over — silinmiş/absent kabul edilir",
  "no framework selection before V4 — DEFERRED_UNTIL_V4",
  "no standards-applicability value duplication — yalnız sourceCommit pointer",
];
export const ACTION_GATEWAY_PIN = {
  signature: "ActionGateway.execute(ActionSpec) -> ActionOutcome | CommitReceipt",
  status: "FROZEN",
};
export const TYPED_BRIDGE_PIN = {
  owner: "GENERATED_SDK_PACKAGE_FROM_KERNEL_CONTRACTS",
  artifactStatus: "ABSENT_CLOSED",
};
export const HTTP_DELIVERY_PIN = {
  transport: "ASGI",
  scope: "DELIVERY_ONLY",
  referenceServer: "UVICORN_DEFAULT",
  conformanceServer: "HYPERCORN_CONFORMANCE",
  fastapiRole: "OPTIONAL_ADAPTER_NEVER_DEVELOPMENT_BASE",
};
export const LEGACY_PLATFORM_PIN = {
  dirtyRootClassification: "ARCHIVE_EVIDENCE",
  djangoStatus: "DELETED_ABSENT_NO_CARRYOVER",
};
export const STALE_BRANCHES_PIN = { range: "PKG14-PKG19", base: "60568", status: "HISTORICAL_NO_CARRYOVER" };
export const ROADMAP_PIN = {
  firstFeaturePackage: "GJ01-V0-FAILURE-ARCHAEOLOGY",
  resolvedFromLiveEvidence: true,
  capabilityDelta: "NONE",
};

const sortKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  return value;
};

export function computeScopeHash(record) {
  const doc = record ?? {};
  const scope = sortKeys({
    canonicalRefs: doc.canonicalRefs,
    actionGateway: doc.actionGateway,
    businessPersistenceOwner: doc.businessPersistenceOwner,
    typedBridge: doc.typedBridge,
    frameworkDecision: doc.frameworkDecision,
    httpDelivery: doc.httpDelivery,
    legacyPlatform: doc.legacyPlatform,
    staleBranches: doc.staleBranches,
    roadmap: doc.roadmap,
  });
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function evaluateRoadmapResolution({ record } = {}) {
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
  if (doc.applicability !== APPLICABILITY) add("applicability-drift");
  if (doc.canonicalRefs?.actionplanBase?.sha !== ACTIONPLAN_SHA) add("actionplan-pin-drift");
  if (doc.canonicalRefs?.kernelBase?.sha !== KERNEL_SHA) add("kernel-pin-drift");
  if (!/^[0-9a-f]{40}$/.test(doc.canonicalRefs?.standardsApplicability?.sourceCommit ?? "")) add("standards-applicability-source-commit-invalid");
  if (doc.canonicalRefs?.standardsApplicability?.path !== "src/data/standards-applicability.json") add("standards-applicability-path-drift");

  eq(doc.actionGateway, ACTION_GATEWAY_PIN, "action-gateway");
  if (doc.businessPersistenceOwner !== "APPLICATION") add("business-persistence-owner-drift");
  eq(doc.typedBridge, TYPED_BRIDGE_PIN, "typed-bridge");
  if (doc.frameworkDecision !== "DEFERRED_UNTIL_V4") add("framework-decision-drift");
  eq(doc.httpDelivery, HTTP_DELIVERY_PIN, "http-delivery");
  eq(doc.legacyPlatform, LEGACY_PLATFORM_PIN, "legacy-platform");
  eq(doc.staleBranches, STALE_BRANCHES_PIN, "stale-branches");
  eq(doc.roadmap, ROADMAP_PIN, "roadmap");

  const prohibitions = doc.prohibitions ?? {};
  closed(Object.keys(prohibitions).sort(), [...PROHIBITION_KEYS].sort(), "prohibition");
  for (const key of PROHIBITION_KEYS) if (prohibitions[key] !== false) add(`prohibition-not-closed:${key}`);

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
