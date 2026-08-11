import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// The canonical MetaFramer ASGI Core Profile decision record and its pure fail-closed validator.
// MetaFramer owns a mandatory ASGI 3 Core Profile and the public developer API; Uvicorn is the
// default reference, Hypercorn a conformance alternative, FastAPI an optional adapter host owning
// neither the public API nor Domain/Application semantics. Every business route enters ONE Action
// Pipeline, and the same CRM/HRMS form action must produce an identical business outcome across all
// four mandatory combinations. A binding field no drift row covers is unguarded, and BINDING_PATHS
// keeps the portable pin surface itself from quietly shrinking.
//
// A binding SENTENCE the portable validator cannot refuse is unguarded too, so the equality
// statement, the five owner-comprehension paragraphs, the plain-Turkish capability delta, the MCP
// future contract, the non-goal list, the rollback pair and the closed root key set are pinned IN
// THE VALIDATOR rather than only here: a static-test-only guard travels with this file, while the
// portable gate is what other packages can run. Deliberately NON-authoritative and therefore left
// unpinned: every `rule`, `reason`, `description`, `note`, `scope`, `testHook`, `enforcementObligation`
// and the per-technology `evidence.*` texts. Each explains rather than decides — free to be reworded,
// never to reverse that twin, which is what the prose-contradiction sweep refuses.
const ROOT = process.cwd();
const RECORD = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
const VALIDATOR = "tools/lib/kernel-asgi-core-profile.mjs";
const MANIFEST = "src/data/workspace-manifest.json";
const POINTER_KEY = "kernelDeliveryBoundaryDecision";
const APPLICABILITY = "metaframer-kernel-delivery-boundary";
// biome-ignore format: the frozen mandatory matrix ids stay compact for the shard budget
const MANDATORY = ["metaframer-asgi-uvicorn", "metaframer-asgi-hypercorn", "fastapi-hosted-metaframer-uvicorn", "fastapi-hosted-metaframer-hypercorn"];
// biome-ignore format: the supplemental composition contract ids stay compact for the shard budget
const SUPPLEMENTAL = ["metaframer-mounts-isolated-fastapi", "fastapi-adapter-calls-single-action-pipeline"];
// biome-ignore format: the nine outcome dimensions stay compact for the shard budget
const DIMENSIONS = ["domainDecision", "authorization", "tenantIsolation", "transaction", "databaseWrite", "outbox", "audit", "response", "errorTaxonomy"];
// biome-ignore format: the seven AP-OC1 evidence dimensions stay compact for the shard budget
const EVIDENCE = ["populariteKanitDegil", "bagimsizUretimKullanimi", "aktifBakimVeGuvenlikYaniti",
  "performansVeOperasyonKaniti", "standartBirlikteCalisabilirlik", "saglayiciBagimsizligi", "cikisVeRollbackStratejisi"];
const STATUSES = ["proven", "conditional", "experimental"];
const PLAIN_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
// biome-ignore format: the inner-ring ban, the owned ports, the untouched stack and the transport-only decisions
const INNER_RING_BAN = ["fastapi", "starlette", "pydantic", "uvicorn", "hypercorn"];
// biome-ignore format: the seven Application/Domain ports MetaFramer owns, businessDecision included
const OWNED_PORTS = ["authorization", "tenantIsolation", "businessDecision", "transaction", "databaseWrite", "outbox", "audit"];
// biome-ignore format: the untouched platform backend stack stays compact for the shard budget
const BACKEND_STACK = ["FastAPI", "GraphQL", "PostgreSQL", "SQLAlchemy 2.0", "SQLModel", "Alembic"];
// biome-ignore format: the four business decisions no transport may own stay compact
const SERVER_DECISIONS = ["decidesAuthorization", "decidesTenantIsolation", "decidesTransaction", "decidesDatabaseWrite"];
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["actionPipeline", "applicability", "businessOutcomeDimensions", "canonicalKernelLanguageDecision", "capabilityDelta",
  "capabilityDeltaSadeTurkce", "capabilityPolicy", "coreProfile", "fastapi", "generatedAt", "id", "innerRingImportBan",
  "manifestPointer", "mcp", "nodeBaseline", "nonGoals", "outcomeEquality", "ownerComprehension", "ownership",
  "prohibitions", "rollback", "schemaVersion", "servers", "status", "supportMatrix", "technologyEvidence"];
// Every binding path the portable validator must pin by exact value: asserting the pin surface itself
// catches a pin quietly dropped from the gate other packages run.
// biome-ignore format: the binding pin surface stays compact for the shard budget
const BINDING_PATHS = [
  "schemaVersion", "id", "generatedAt", "applicability", "status", "coreProfile.spec", "coreProfile.mandatory",
  "coreProfile.owner", "coreProfile.ownsPublicDeveloperApi", "coreProfile.ownsDeliveryContract", "coreProfile.subSpec.family",
  "coreProfile.subSpec.maxSupportedVersion", "coreProfile.subSpec.negotiated", "coreProfile.subSpec.assumeUndeclaredOptionalCapability",
  "fastapi.role", "fastapi.requiredKernelDependency", "fastapi.ownsPublicDeveloperApi", "fastapi.ownsDomainSemantics",
  "fastapi.ownsApplicationSemantics", "fastapi.mayHostOrMountMetaFramer", "fastapi.mayBeMountedIsolatedByMetaFramer",
  "fastapi.adapterMayCallSingleActionPipeline", "actionPipeline.id", "actionPipeline.single", "actionPipeline.everyBusinessRouteCallsIt",
  "actionPipeline.alternateBusinessPathAllowed", "outcomeEquality.assertion", "outcomeEquality.divergenceIsArchitectureDefect",
  "outcomeEquality.statement", "capabilityPolicy.optionalCapabilityAbsent.fallback", "capabilityPolicy.optionalCapabilityAbsent.changesBusinessOutcome",
  "capabilityPolicy.requiredTransportCapabilityAbsent.disposition", "capabilityPolicy.requiredTransportCapabilityAbsent.scope",
  "capabilityPolicy.requiredTransportCapabilityAbsent.explicitConfigurationError", "capabilityPolicy.requiredTransportCapabilityAbsent.requestTimeRandomRejection",
  "innerRingImportBan.scope", "innerRingImportBan.enforcementStatus", "prohibitions.permanentDualRuntime", "prohibitions.dualWrite",
  "prohibitions.serverNameSemanticBranching", "prohibitions.readinessClaimed", "prohibitions.appBuildable", "prohibitions.releaseAllowed",
  "prohibitions.deployAllowed", "prohibitions.runtimeImplementationAuthorizedByThisRecord", "nodeBaseline.role", "nodeBaseline.parityProved",
  "nodeBaseline.sourceExtractionPerformed", "nodeBaseline.cutoverPerformed", "canonicalKernelLanguageDecision.status",
  "canonicalKernelLanguageDecision.oldS2DecisionAccepted", "mcp.status", "mcp.currentConsumerExists", "mcp.configCreatedByThisRecord",
  "mcp.futureContract", "capabilityDelta", "capabilityDeltaSadeTurkce", "rollback.owner", "rollback.runtimeDataImpact",
  "rollback.trigger", "rollback.action", ...PLAIN_FIELDS.map((f) => `ownerComprehension.${f}`),
];
// INVERTED and APPENDED are the two equality forgeries: both keep every token, one reversing the
// meaning and one appending an escape hatch to it.
// biome-ignore format: the phrases that make the CRM/HRMS invariant mean identical outcomes
const EQUALITY_PHRASES = ["CRM", "HRMS", "identical business outcome", "architecture defect", "not a documented difference"];
// biome-ignore format: the reviewer's inverted sentence: three tokens intact, the meaning reversed
const INVERTED = "A CRM or HRMS form action may legitimately differ between Uvicorn and Hypercorn; only a total outage is an architecture defect, not a documented difference.";
const APPENDED = " In practice outcomes are permitted to vary by server.";
// MISLEADING is a long, fluent owner paragraph with no dishonest marker, so a length-only gate takes
// it and only the pinned canonical text refuses it.
const MISLEADING =
  "Bu aşamada tüm mimari sorular kapandı ve sistem sahaya alınmaya uygun duruma getirildi.";
const DISHONEST = "Artık hiçbir engel kalmadı; ürün hazır, form çalışıyor ve runtime tamamlandı.";
// DISHONEST carries the four claims this record may never make, so the prose sweep names each one.
type Drift = [string, string, unknown, string | string[]];
const DROP = Symbol("drop-key");
// biome-ignore format: record identity, matrix rows and sub-spec identity
const IDENTITY_DRIFTS: Drift[] = [
  ["d", "schemaVersion", "2.0.0", "record-schema-version-drift"], ["d", "id", "kernel-other-record", "record-id-drift"],
  ["d", "generatedAt", "2026-09-01", "record-generated-at-drift"], ["d", "applicability", "platform-backend-stack", "applicability-drift"],
  ["d", "status", "runtime-implemented", "record-status-drift"], ["d", "coreProfile.spec", "ASGI 2", "core-profile-drift"],
  ["d", "coreProfile.owner", "fastapi", "core-profile-drift"], ["d", "coreProfile.ownsDeliveryContract", false, "core-profile-not-owner"],
  ["d", "coreProfile.ownsPublicDeveloperApi", false, "core-profile-not-owner"],
  ["d", "coreProfile.subSpec.family", "ASGI HTTP only", "sub-spec-family-drift"],
  ["d", "coreProfile.subSpec.maxSupportedVersion", "3.0", "sub-spec-negotiation-drift"],
  ["d", "coreProfile.subSpec.negotiated", "always-on", "sub-spec-negotiation-drift"],
  ["d", "coreProfile.subSpec.assumeUndeclaredOptionalCapability", true, "undeclared-optional-capability-assumed"],
  ["d", "supportMatrix.1.id", "metaframer-asgi-daphne", ["unknown-matrix-entry:metaframer-asgi-daphne", "missing-matrix-entry:metaframer-asgi-hypercorn"]],
  ["d", "supportMatrix.4.classification", "mandatory-server-framework-matrix", "matrix-classification-drift:metaframer-mounts-isolated-fastapi"],
  ["d", "supportMatrix.0.conformanceRequired", false, "matrix-conformance-not-required:metaframer-asgi-uvicorn"],
];
// One drift per row: [target, dotted path, value, named rejection(s)]. A function value receives the
// current value, so a row can append, reorder, extend or shrink; DROP deletes the key outright.
// biome-ignore format: the closed server set and the transport-only obligations of each member
const SERVER_DRIFTS: Drift[] = [
  // biome-ignore lint/suspicious/noExplicitAny: the cloned server list is untyped JSON.
  ["d", "servers", (s: any[]) => [...s, { ...s[0], id: "daphne", role: "supported-conformance-alternative", isDefaultReference: false }], ["unknown-server:daphne", "server-count-drift"]],
  // biome-ignore lint/suspicious/noExplicitAny: the cloned server list is untyped JSON.
  ["d", "servers", (s: any[]) => [...s, { ...s[0] }], ["duplicate-server:uvicorn", "server-count-drift"]],
  // biome-ignore lint/suspicious/noExplicitAny: the cloned server list is untyped JSON.
  ["d", "servers", (s: any[]) => [s[0]], ["missing-server:hypercorn", "server-count-drift"]],
  // biome-ignore lint/suspicious/noExplicitAny: the cloned server list is untyped JSON.
  ["d", "servers", (s: any[]) => [s[1], s[0]], "server-order-drift"],
  ["d", "servers.1.id", "daphne", ["unknown-server:daphne", "missing-server:hypercorn"]],
  ["d", "servers.0.decidesAuthorization", true, "server-owns-business-decision:uvicorn:decidesAuthorization"],
  ["d", "servers.1.decidesTransaction", true, "server-owns-business-decision:hypercorn:decidesTransaction"],
  ["d", "servers.0.semanticBranchingOnServerName", true, "server-name-semantic-branching:uvicorn"],
  ["d", "servers.1.role", "default-reference", "server-role-drift:hypercorn"],
  ["d", "servers.1.isDefaultReference", true, "server-default-drift:hypercorn"],
  ["d", "servers.1.secondSemanticRuntime", true, "second-semantic-runtime:hypercorn"],
];
// biome-ignore format: ownership of the public API, the owned ports and the one Action Pipeline
const OWNERSHIP_DRIFTS: Drift[] = [
  ["d", "fastapi.role", "required-kernel-host", "fastapi-role-drift"], ["d", "fastapi.requiredKernelDependency", true, "fastapi-required-kernel-dependency"],
  ["d", "fastapi.ownsPublicDeveloperApi", true, "fastapi-owns-public-developer-api"], ["d", "fastapi.ownsDomainSemantics", true, "fastapi-owns-domain-semantics"],
  ["d", "fastapi.ownsApplicationSemantics", true, "fastapi-owns-application-semantics"],
  ["d", "fastapi.mayHostOrMountMetaFramer", false, "fastapi-composition-drift:mayHostOrMountMetaFramer"],
  ["d", "fastapi.mayBeMountedIsolatedByMetaFramer", false, "fastapi-composition-drift:mayBeMountedIsolatedByMetaFramer"],
  ["d", "fastapi.adapterMayCallSingleActionPipeline", false, "fastapi-composition-drift:adapterMayCallSingleActionPipeline"],
  ["d", "ownership.transportOnly.2", "authorization", ["unknown-transport-only:authorization", "transport-only-count-drift"]],
  ["d", "ownership.metaframerApplicationDomainPorts.2", "response", ["missing-owned-port:businessDecision", "unknown-owned-port:response"]],
  ["d", "actionPipeline.id", "fastapi-router", "action-pipeline-id-drift"], ["d", "actionPipeline.single", false, "action-pipeline-not-single"],
  ["d", "actionPipeline.everyBusinessRouteCallsIt", false, "action-pipeline-not-single"],
  ["d", "actionPipeline.alternateBusinessPathAllowed", true, "alternate-business-path-allowed"],
];
// biome-ignore format: the equality invariant, the capability policy and the inner-ring ban
const EQUALITY_DRIFTS: Drift[] = [
  ["d", "outcomeEquality.assertion", "best-effort", "outcome-equality-assertion-drift"],
  ["d", "outcomeEquality.divergenceIsArchitectureDefect", false, "outcome-divergence-not-a-defect"],
  ["d", "outcomeEquality.appliesTo.3", "metaframer-asgi-uvicorn", "outcome-equality-scope-drift"],
  ["d", "outcomeEquality.statement", INVERTED, ["equality-divergence-permitted", "equality-statement-weakened:identical business outcome", "outcome-equality-statement-drift"]],
  ["d", "outcomeEquality.statement", (s: string) => `${s}${APPENDED}`, "outcome-equality-statement-drift"],
  ["d", "businessOutcomeDimensions.5", "latency", ["missing-outcome-dimension:outbox", "unknown-outcome-dimension:latency"]],
  ["d", "capabilityPolicy.optionalCapabilityAbsent.fallback", "server-specific", "optional-capability-fallback-drift"],
  ["d", "capabilityPolicy.optionalCapabilityAbsent.changesBusinessOutcome", true, "fallback-changes-business-outcome"],
  ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.disposition", "reject-requests-at-runtime", "required-capability-disposition-drift"],
  ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.scope", "whole-application", "required-capability-scope-drift"],
  ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.explicitConfigurationError", false, "required-capability-error-not-explicit"],
  ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.requestTimeRandomRejection", true, "request-time-random-rejection"],
  ["d", "innerRingImportBan.rings.1", "Delivery", ["missing-inner-ring:Application", "unknown-inner-ring:Delivery"]],
  ["d", "innerRingImportBan.forbidden.3", "flask", ["missing-inner-ring-ban-package:uvicorn", "unknown-inner-ring-ban-package:flask"]],
  ["d", "innerRingImportBan.scope", "imports only", "inner-ring-ban-scope-drift"],
  ["d", "innerRingImportBan.enforcementStatus", "build-enforced", "inner-ring-enforcement-overclaimed"],
  ["d", "innerRingImportBan.declaredInnerRingDependencies", ["pydantic"], "forbidden-inner-ring-dependency:pydantic"],
];
// biome-ignore format: every downstream claim this record refuses to make
const CLAIM_DRIFTS: Drift[] = [
  ["d", "prohibitions.permanentDualRuntime", true, "permanent-dual-runtime"], ["d", "prohibitions.dualWrite", true, "dual-write"],
  ["d", "prohibitions.serverNameSemanticBranching", true, "server-name-semantic-branching:policy"],
  ["d", "prohibitions.readinessClaimed", true, "readiness-claimed"], ["d", "prohibitions.appBuildable", true, "app-buildable-claimed"],
  ["d", "prohibitions.releaseAllowed", true, "release-claimed"], ["d", "prohibitions.deployAllowed", true, "deploy-claimed"],
  ["d", "prohibitions.runtimeImplementationAuthorizedByThisRecord", true, "runtime-implementation-claimed"],
  ["d", "nodeBaseline.role", "live-runtime", "node-baseline-role-drift"], ["d", "nodeBaseline.parityProved", true, "parity-claimed"],
  ["d", "nodeBaseline.sourceExtractionPerformed", true, "source-extraction-claimed"], ["d", "nodeBaseline.cutoverPerformed", true, "cutover-claimed"],
  ["d", "canonicalKernelLanguageDecision.status", "python-selected", "canonical-kernel-language-claimed"],
  ["d", "canonicalKernelLanguageDecision.oldS2DecisionAccepted", true, "old-s2-decision-claimed-accepted"],
  ["d", "mcp.status", "active", "mcp-status-drift"], ["d", "mcp.currentConsumerExists", true, "mcp-current-consumer-claimed"],
  ["d", "mcp.configCreatedByThisRecord", true, "mcp-config-invented"], ["d", "capabilityDelta", "runtime-enabled", "capability-delta-drift"],
  ["d", "rollback.owner", "claude-worker", "rollback-owner-drift"], ["d", "rollback.runtimeDataImpact", "migrated", "rollback-data-impact-drift"],
  ["d", "ownerComprehension.simdi", "", ["plain-field-empty:simdi", "plain-field-drift:simdi"]],
  ["d", "ownerComprehension.extra", "x", ["unknown-plain-field:extra", "plain-field-count-drift"]],
  ["d", "ownerComprehension", { once: "x", simdiki: "x", fark: "x", kullaniciYolculugu: "x", kalanEngel: "x" }, ["missing-plain-field:simdi", "unknown-plain-field:simdiki", "plain-field-empty:simdi"]],
];
// The server list is a closed two-member set in pinned canonical order; position is never semantic.
// biome-ignore format: the honest-narration surface: pinned text, closed lists, closed root keys
const NARRATION_DRIFTS: Drift[] = [
  ["d", "ownerComprehension.once", MISLEADING, "plain-field-drift:once"], ["d", "ownerComprehension.simdi", MISLEADING, "plain-field-drift:simdi"],
  ["d", "ownerComprehension.fark", MISLEADING, "plain-field-drift:fark"],
  ["d", "ownerComprehension.kullaniciYolculugu", MISLEADING, "plain-field-drift:kullaniciYolculugu"],
  ["d", "ownerComprehension.kalanEngel", DISHONEST, ["plain-field-drift:kalanEngel", "prose-claims-no-blocker", "prose-claims-readiness", "prose-claims-form-runs", "prose-claims-runtime-complete"]],
  ["d", "capabilityDeltaSadeTurkce", "Bu paket ürün yeteneğini açtı ve kullanıcı ekranında yeni özellikler görünür.", "capability-delta-sade-turkce-drift"],
  ["d", "mcp.futureContract", "a future MCP surface owns its own business path and may bypass the Action Pipeline", "mcp-future-contract-drift"],
  ["d", "nonGoals.0", "runtime implementation, readiness and release are authorised by this record", "non-goal-drift:0"],
  ["d", "nonGoals.7", "do not push to git", "non-goal-drift:7"],
  ["d", "nonGoals", (g: string[]) => g.slice(1), ["non-goal-drift:0", "non-goal-count-drift"]],
  ["d", "nonGoals", (g: string[]) => [...g, "do not forget to celebrate"], "non-goal-count-drift"],
  ["d", "rollback.trigger", "", "rollback-trigger-drift"], ["d", "rollback.action", "leave the drift in place and carry on", "rollback-action-drift"],
  ["d", "extraRoot", "x", ["unknown-record-root:extraRoot", "record-root-count-drift"]],
  ["d", "nonGoals", DROP, ["missing-record-root:nonGoals", "record-root-count-drift"]],
];
// Non-authoritative prose may be reworded freely, but it may not reverse its machine-readable twin.
// biome-ignore format: explanatory prose that contradicts the pin it explains
const PROSE_DRIFTS: Drift[] = [
  ["d", "capabilityPolicy.optionalCapabilityAbsent.rule", "when an optional capability is absent outcomes may legitimately differ between servers", "equality-divergence-permitted"],
  ["d", "nodeBaseline.rule", "parity is proved, so the Node reference is no longer frozen", "prose-claims-parity"],
  ["d", "servers.0.reason", "the platform is production-ready on this server", "prose-claims-readiness"],
  ["d", "actionPipeline.rule", "the runtime is complete and every route is live", "prose-claims-runtime-complete"],
  ["d", "supportMatrix.0.description", "form çalışıyor, bu satır artık canlı", "prose-claims-form-runs"],
];
// biome-ignore format: AP-OC1 evidence: a closed technology set, honest labels, pinned gaps, real sources
const EVIDENCE_DRIFTS: Drift[] = [
  ["d", "technologyEvidence.granian", { role: "invented", evidenceStatus: "proven", globalScaleClaim: true, popularityUsedAsEvidence: true, missingEvidence: [], officialSources: ["https://example.com/blog"], evidence: {} }, "unknown-technology-evidence:granian"],
  ["d", "technologyEvidence.uvicorn", undefined, "missing-technology-evidence:uvicorn"],
  ["d", "technologyEvidence.hypercorn.evidence.performansVeOperasyonKaniti", "", "missing-evidence-dimension:hypercorn:performansVeOperasyonKaniti"],
  ["d", "technologyEvidence.fastapi.popularityUsedAsEvidence", true, "popularity-only-evidence:fastapi"],
  ["d", "technologyEvidence.uvicorn.globalScaleClaim", true, "unsupported-global-scale-claim:uvicorn"],
  ["d", "technologyEvidence.uvicorn.evidenceStatus", "proven", "unproven-status-claimed:uvicorn"],
  ["d", "technologyEvidence.asgi.evidenceStatus", "battle-tested", "evidence-status-drift:asgi"],
  ["d", "technologyEvidence.asgi.missingEvidence", ["saglayiciBagimsizligi"], "missing-evidence-list-drift:asgi"],
  ["d", "technologyEvidence.fastapi.missingEvidence", ["yok"], ["unknown-missing-evidence-dimension:fastapi:yok", "missing-evidence-list-drift:fastapi"]],
  ["d", "technologyEvidence.asgi.exitPath.boundary", "", "missing-exit-path:asgi"],
  ["d", "technologyEvidence.hypercorn.exitPath.rollbackExperimentRequiredBeforeRuntimeAdoption", false, "missing-exit-path:hypercorn"],
  ["d", "technologyEvidence.fastapi.officialSources.2", "https://example.com/fastapi", "non-official-source:fastapi:https://example.com/fastapi"],
  ["d", "technologyEvidence.asgi.officialSources", ["https://asgi.readthedocs.io/en/latest/specs/main.html"], "missing-official-source:asgi:https://asgi.readthedocs.io/en/latest/specs/www.html"],
];
// biome-ignore format: the minimal scoped manifest pointer and the platform stack it may not rewrite
const MANIFEST_DRIFTS: Drift[] = [
  ["m", POINTER_KEY, undefined, "manifest-pointer-missing"],
  ["m", `${POINTER_KEY}.decisionRef`, "reports/other-decision.json", "manifest-pointer-drift:decisionRef"],
  ["m", `${POINTER_KEY}.applicability`, "platform-backend-stack", "manifest-pointer-drift:applicability"],
  ["m", `${POINTER_KEY}.runtimeImplementedByThisRecord`, true, "manifest-pointer-drift:runtimeImplementedByThisRecord"],
  ["m", `${POINTER_KEY}.changesCurrentPlatformStack`, true, "manifest-pointer-drift:changesCurrentPlatformStack"],
  ["m", `${POINTER_KEY}.runtimeReady`, true, "manifest-pointer-unknown-field:runtimeReady"],
  ["m", "workspaces.0.stack.backend", ["MetaFramer ASGI"], "platform-backend-stack-mutated"],
  ["d", "manifestPointer.key", "somethingElse", "manifest-pointer-drift:record"],
];
// biome-ignore format: the whole adversarial surface, evaluated in one sweep
const DRIFTS: Drift[] = [...IDENTITY_DRIFTS, ...SERVER_DRIFTS, ...OWNERSHIP_DRIFTS, ...EQUALITY_DRIFTS, ...CLAIM_DRIFTS, ...NARRATION_DRIFTS, ...PROSE_DRIFTS, ...EVIDENCE_DRIFTS, ...MANIFEST_DRIFTS];
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));
// biome-ignore lint/suspicious/noExplicitAny: one dotted path of untyped JSON is moved per drift.
const setAt = (root: any, dotted: string, value: unknown) => {
  const keys = dotted.split(".");
  const last = keys.pop() as string;
  // biome-ignore lint/suspicious/noExplicitAny: the parent of the drifted key is untyped JSON.
  const parent = keys.reduce((v: any, k) => v[k], root);
  const next =
    typeof value === "function" ? (value as (c: unknown) => unknown)(parent[last]) : value;
  if (next === DROP) delete parent[last];
  else parent[last] = next;
};

describe("MetaFramer ASGI Core Profile decision record", () => {
  it("binds the ASGI 3 Core Profile, the six-row matrix and the nine outcome dimensions", () => {
    expect(exists(RECORD), `asgi-core-profile-record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    // The record is closed: exactly these roots, so a quietly added field is a diff.
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    // Servers transport only: neither may own a business decision or branch on its own name.
    for (const server of record.servers) {
      // biome-ignore format: every business decision a transport claims is named field by field
      for (const field of SERVER_DECISIONS) expect(server[field], `server-owns-business-decision:${server.id}:${field}`).toBe(false);
      // biome-ignore format: reading the server name into a semantic branch is refused
      expect(server.semanticBranchingOnServerName, `server-name-branching:${server.id}`).toBe(false);
    }
    // Exactly six rows in this order: four mandatory, two supplemental, none exempt from conformance.
    // biome-ignore format: the matrix id sweep stays one expression
    expect(record.supportMatrix.map((row: { id: string }) => row.id)).toEqual([...MANDATORY, ...SUPPLEMENTAL]);
    // biome-ignore format: the mandatory/supplemental classification split stays compact
    const kinds = [...MANDATORY.map(() => "mandatory-server-framework-matrix"), ...SUPPLEMENTAL.map(() => "supplemental-composition-contract")];
    // biome-ignore format: the classification sweep stays one expression
    expect(record.supportMatrix.map((row: { classification: string }) => row.classification)).toEqual(kinds);
    // biome-ignore format: every row is conformance-required, none is decorative
    expect(record.supportMatrix.every((row: { conformanceRequired: boolean }) => row.conformanceRequired)).toBe(true);
    // biome-ignore format: each phrase that carries the invariant's meaning is named individually
    for (const phrase of EQUALITY_PHRASES) expect(record.outcomeEquality.statement, `equality-invariant-missing:${phrase}`).toContain(phrase);
    // biome-ignore format: the inverted control keeps the very tokens a token-only gate accepted
    for (const token of ["CRM", "HRMS", "architecture defect"]) expect(INVERTED, `inverted-control-weak:${token}`).toContain(token);
    // biome-ignore format: the appended control keeps every phrase intact and adds the escape hatch
    for (const phrase of EQUALITY_PHRASES) expect(`${record.outcomeEquality.statement}${APPENDED}`, `appended-control-weak:${phrase}`).toContain(phrase);
  });

  it("claims nothing downstream and carries the five AP-OC1 plain-language fields", () => {
    expect(exists(RECORD), `asgi-core-profile-record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    // The claim set is closed: a new flag here is a diff rather than a silent addition.
    // biome-ignore format: the closed prohibition set stays one flag per line
    expect(record.prohibitions).toEqual({
      permanentDualRuntime: false, dualWrite: false, serverNameSemanticBranching: false, readinessClaimed: false,
      appBuildable: false, releaseAllowed: false, deployAllowed: false, runtimeImplementationAuthorizedByThisRecord: false,
    });
    // AP-OC1: exactly five plain-language fields, none a stub. Length is a floor, never the guard:
    expect(Object.keys(record.ownerComprehension).sort()).toEqual([...PLAIN_FIELDS].sort());
    // biome-ignore format: an empty or stub plain-language field is not a report
    for (const field of PLAIN_FIELDS) expect(record.ownerComprehension[field]?.length ?? 0, `plain-field-empty:${field}`).toBeGreaterThan(40);
    expect(MISLEADING.length, "misleading-control-too-short").toBeGreaterThan(40);
    // biome-ignore format: the journey is concrete, honest about today and forward-looking
    for (const token of ["CRM", "HRMS", "henüz", "eşitlik sözleşmesi"]) expect(record.ownerComprehension.kullaniciYolculugu, `journey-missing:${token}`).toContain(token);
    // The record's own delta, MCP contract and non-goals are not restated here: the validator pins
    // them exactly, and the pinned text is proved honest against the drift sweep below.
    // Every technology admits its gaps by AP-OC1 dimension name, and none is labelled beyond honesty.
    for (const tech of Object.keys(record.technologyEvidence)) {
      const entry = record.technologyEvidence[tech];
      expect(STATUSES, `evidence-status-dishonest:${tech}`).toContain(entry.evidenceStatus);
      // biome-ignore format: a gap list is a list of real evidence dimensions, never a decorative token
      for (const gap of entry.missingEvidence) expect(EVIDENCE, `gap-not-a-dimension:${tech}:${gap}`).toContain(gap);
    }
  });

  it("fails closed on identity, ownership, outcome, narration, evidence and manifest drift", async () => {
    expect(exists(RECORD), `asgi-core-profile-record-missing:${RECORD}`).toBe(true);
    expect(exists(VALIDATOR), `asgi-core-profile-validator-missing:${VALIDATOR}`).toBe(true);
    const decision = readJson(RECORD);
    const manifest = readJson(MANIFEST);
    // biome-ignore format: the validator's pinned surface stays one group per line
    const {
      evaluateAsgiCoreProfileDecision, FALSE_PINS, VALUE_PINS, MATRIX_IDS, SERVER_IDS, RECORD_ROOT_KEYS,
      OUTCOME_DIMENSIONS, FORBIDDEN_INNER_RING_IMPORTS, METAFRAMER_OWNED_PORTS, EVIDENCE_DIMENSIONS,
      EVIDENCE_STATUSES, MISSING_EVIDENCE, OFFICIAL_SOURCES, NON_GOALS, OWNER_COMPREHENSION,
      CAPABILITY_DELTA_SADE_TURKCE, MCP_FUTURE_CONTRACT,
    } = await load(VALIDATOR);
    // The positive control: without it, a validator that rejects everything would look correct.
    const clean = evaluateAsgiCoreProfileDecision({ decision, manifest });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    // One drift per row: clone, move exactly one pinned path, re-evaluate.
    // biome-ignore format: the single-drift harness stays one statement per step
    const evaluate = (target: string, dotted: string, value: unknown) => {
      const [d, m] = [clone(decision), clone(manifest)];
      setAt(target === "m" ? m : d, dotted, value);
      return evaluateAsgiCoreProfileDecision({ decision: d, manifest: m });
    };
    // Every drift must earn every reason it names AND be refused; unguarded rows are reported by name.
    // biome-ignore format: the adversarial sweep stays one clause per line
    const unguarded = DRIFTS.filter(([target, dotted, value, reasons]) => {
      const result = evaluate(target, dotted, value);
      return result.accepted || [reasons].flat().some((reason) => !result.errors.includes(reason));
    }).map(([, dotted, , reasons]) => `${dotted} => ${[reasons].flat().join(" + ")}`);
    expect(unguarded, "fail-closed-drift-unguarded").toEqual([]);
    // A "proven" relabel is not a waiver: it is refused for the gap it hides and the rollback it drops.
    const relabelled = clone(decision);
    relabelled.technologyEvidence.uvicorn.evidenceStatus = "proven";
    relabelled.technologyEvidence.uvicorn.exitPath.rollbackExperimentRequiredBeforeRuntimeAdoption = false;
    const relabelledErrors = evaluateAsgiCoreProfileDecision({
      decision: relabelled,
      manifest,
    }).errors;
    // biome-ignore format: the compound relabel earns both rejections at once
    expect(relabelledErrors, "status-relabel-waives-rollback").toEqual(expect.arrayContaining(["unproven-status-claimed:uvicorn", "missing-exit-path:uvicorn"]));
    // The harness is not rejecting everything on its own: an unmutated evaluation still accepts.
    expect(evaluate("d", "schemaVersion", "1.0.0").errors, "harness-rejects-clean").toEqual([]);
    // The validator pins the contract itself, so the record cannot vouch for its own shape.
    // biome-ignore format: the pinned path surface is compared against the binding path list
    const pinned = [...FALSE_PINS.map(([p]: [string]) => p), ...VALUE_PINS.map(([p]: [string]) => p)];
    expect(pinned, "binding-path-unpinned").toEqual(expect.arrayContaining(BINDING_PATHS));
    expect(MATRIX_IDS).toEqual([...MANDATORY, ...SUPPLEMENTAL]);
    expect(OUTCOME_DIMENSIONS).toEqual(DIMENSIONS);
    expect(FORBIDDEN_INNER_RING_IMPORTS).toEqual(INNER_RING_BAN);
    expect(METAFRAMER_OWNED_PORTS).toEqual(OWNED_PORTS);
    expect(EVIDENCE_DIMENSIONS).toEqual(EVIDENCE);
    expect(EVIDENCE_STATUSES).toEqual(STATUSES);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    expect(SERVER_IDS).toEqual(["uvicorn", "hypercorn"]);
    // The pinned narration is the honest one, so pinning cannot be used to freeze a dishonest text.
    expect(CAPABILITY_DELTA_SADE_TURKCE, "pinned-delta-not-honest").toContain(
      "yeni bir şey açmadı",
    );
    expect(OWNER_COMPREHENSION.kullaniciYolculugu, "pinned-journey-not-honest").toContain("henüz");
    expect(MCP_FUTURE_CONTRACT, "pinned-mcp-not-pipeline-bound").toMatch(/Action Pipeline/);
    // biome-ignore format: the pinned non-goals still forbid the runtime, readiness and Git claims
    for (const token of [/runtime/i, /readiness/i, /commit, push/i]) expect(NON_GOALS.some((line: string) => token.test(line)), `pinned-non-goal-missing:${token}`).toBe(true);
    // Each technology records seven dimensions against pinned official sources and a pinned gap list.
    for (const [tech, sources] of Object.entries(OFFICIAL_SOURCES as Record<string, string[]>)) {
      // biome-ignore format: the per-technology official source set is pinned, not merely present
      expect(decision.technologyEvidence[tech].officialSources, `official-source-drift:${tech}`).toEqual(sources);
      // biome-ignore format: no evidence dimension is skipped
      expect(Object.keys(decision.technologyEvidence[tech].evidence).sort(), `evidence-dimension-drift:${tech}`).toEqual([...EVIDENCE].sort());
      // biome-ignore format: the validator's pinned gap list is the record's own, member for member
      expect(decision.technologyEvidence[tech].missingEvidence, `missing-evidence-pin-drift:${tech}`).toEqual(MISSING_EVIDENCE[tech]);
      // biome-ignore format: popularity is never the basis and an unproven scale claim is refused
      expect(decision.technologyEvidence[tech], `evidence-label-drift:${tech}`).toMatchObject({ popularityUsedAsEvidence: false, globalScaleClaim: false });
    }
    // The pointer is minimal, scoped and honest on both sides; the backend stack is what it found.
    // biome-ignore format: the minimal scoped manifest pointer stays compact for the shard budget
    expect(manifest[POINTER_KEY]).toMatchObject({ decisionRef: RECORD, applicability: APPLICABILITY, changesCurrentPlatformStack: false, runtimeImplementedByThisRecord: false });
    // biome-ignore format: the record and the manifest name the same pointer from both sides
    expect(decision.manifestPointer).toMatchObject({ file: MANIFEST, key: POINTER_KEY, applicability: APPLICABILITY });
    // biome-ignore format: the untouched platform backend stack is asserted directly as well
    expect(manifest.workspaces.find((w: { id: string }) => w.id === "platform").stack.backend, "platform-backend-stack-mutated").toEqual(BACKEND_STACK);
  });
});
