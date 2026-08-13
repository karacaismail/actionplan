import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// The canonical MetaFramer ASGI Core Profile decision record and its pure fail-closed validator.
// MetaFramer owns a mandatory ASGI 3 Core Profile and the public developer API; Uvicorn is the
// default reference, Hypercorn a conformance alternative, FastAPI an optional adapter host owning
// neither the public API nor Domain/Application semantics. Every business route enters ONE Action
// Pipeline, and the same CRM/HRMS form action must produce an identical business outcome across all
// four mandatory combinations. The validator is judged by its rejections: a positive control proves
// the clean record is accepted, and every drift below moves exactly one pinned path and names the
// rejection it must earn. A binding field that no drift row covers is an unguarded field.
const ROOT = process.cwd();
const RECORD = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
const VALIDATOR = "tools/lib/kernel-asgi-core-profile.mjs";
const MANIFEST = "src/data/workspace-manifest.json";
const POINTER_KEY = "kernelDeliveryBoundaryDecision";
const APPLICABILITY = "metaframer-kernel-delivery-boundary";
// The four mandatory rows and two supplemental contracts, the nine outcome dimensions, AP-OC1's
// seven evidence dimensions and five plain fields, the inner-ring ban, the seven ports MetaFramer
// owns, the honest status labels and the untouched platform backend stack.
// biome-ignore format: the frozen mandatory matrix ids stay compact for the shard budget
const MANDATORY = ["metaframer-asgi-uvicorn", "metaframer-asgi-hypercorn", "fastapi-hosted-metaframer-uvicorn", "fastapi-hosted-metaframer-hypercorn"];
// biome-ignore format: the supplemental composition contract ids stay compact for the shard budget
const SUPPLEMENTAL = ["metaframer-mounts-isolated-fastapi", "fastapi-adapter-calls-single-action-pipeline"];
// biome-ignore format: the nine outcome dimensions stay compact for the shard budget
const DIMENSIONS = ["domainDecision", "authorization", "tenantIsolation", "transaction", "databaseWrite", "outbox", "audit", "response", "errorTaxonomy"];
// biome-ignore format: the seven AP-OC1 evidence dimensions stay compact for the shard budget
const EVIDENCE = ["populariteKanitDegil", "bagimsizUretimKullanimi", "aktifBakimVeGuvenlikYaniti", "performansVeOperasyonKaniti", "standartBirlikteCalisabilirlik", "saglayiciBagimsizligi", "cikisVeRollbackStratejisi"];
const STATUSES = ["proven", "conditional", "experimental"];
const PLAIN_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
// biome-ignore format: the inner-ring import/type ban stays compact for the shard budget
const INNER_RING_BAN = ["fastapi", "starlette", "pydantic", "uvicorn", "hypercorn"];
// biome-ignore format: the seven Application/Domain ports MetaFramer owns, businessDecision included
const OWNED_PORTS = ["authorization", "tenantIsolation", "businessDecision", "transaction", "databaseWrite", "outbox", "audit"];
// biome-ignore format: the untouched platform backend stack stays compact for the shard budget
const BACKEND_STACK = ["FastAPI", "GraphQL", "PostgreSQL", "SQLAlchemy 2.0", "SQLModel", "Alembic"];
// biome-ignore format: the four business decisions no transport may own stay compact
const SERVER_DECISIONS = ["decidesAuthorization", "decidesTenantIsolation", "decidesTransaction", "decidesDatabaseWrite"];
// The equality invariant is normative prose, not decoration: these phrases carry its meaning, and
// an inverted sentence that keeps the tokens but licenses divergence must still be rejected.
// biome-ignore format: the phrases that make the CRM/HRMS invariant mean identical outcomes
const EQUALITY_PHRASES = ["CRM", "HRMS", "identical business outcome", "architecture defect", "not a documented difference"];
// biome-ignore format: the reviewer's inverted sentence: three tokens intact, the meaning reversed
const INVERTED = "A CRM or HRMS form action may legitimately differ between Uvicorn and Hypercorn; only a total outage is an architecture defect, not a documented difference.";
// The pinned decision shape, path by path: ownership, sub-spec family and ceiling, single pipeline,
// composition, capability policy, inner-ring ban, frozen Node baseline, open language decision.
// biome-ignore format: the pinned record shape table stays compact for the shard budget
const SHAPE_CONTRACT: Array<[string, unknown]> = [["schemaVersion", "1.0.0"], ["id", "kernel-asgi-core-profile-decision-2026-08-11"], ["generatedAt", "2026-08-11"], ["applicability", APPLICABILITY], ["status", "decision-recorded-no-runtime-implementation"], ["coreProfile.spec", "ASGI 3"], ["coreProfile.mandatory", true], ["coreProfile.owner", "metaframer"], ["coreProfile.ownsPublicDeveloperApi", true], ["coreProfile.ownsDeliveryContract", true], ["coreProfile.subSpec.family", "ASGI HTTP/WebSocket"], ["coreProfile.subSpec.maxSupportedVersion", "2.5"], ["coreProfile.subSpec.negotiated", "capability-negotiated"], ["coreProfile.subSpec.assumeUndeclaredOptionalCapability", false], ["servers.0.id", "uvicorn"], ["servers.0.role", "default-reference"], ["servers.0.isDefaultReference", true], ["servers.0.secondSemanticRuntime", false], ["servers.1.id", "hypercorn"], ["servers.1.role", "supported-conformance-alternative"], ["servers.1.isDefaultReference", false], ["servers.1.secondSemanticRuntime", false], ["ownership.transportOnly", ["server", "framework"]], ["ownership.metaframerApplicationDomainPorts", OWNED_PORTS], ["fastapi.role", "supported-optional-adapter-host"], ["fastapi.requiredKernelDependency", false], ["fastapi.ownsPublicDeveloperApi", false], ["fastapi.ownsDomainSemantics", false], ["fastapi.ownsApplicationSemantics", false], ["fastapi.mayHostOrMountMetaFramer", true], ["fastapi.mayBeMountedIsolatedByMetaFramer", true], ["fastapi.adapterMayCallSingleActionPipeline", true]];
// biome-ignore format: the pinned claim and policy table stays compact for the shard budget
const SHAPE_CLAIMS: Array<[string, unknown]> = [["actionPipeline.id", "metaframer-action-pipeline"],["actionPipeline.single", true], ["actionPipeline.everyBusinessRouteCallsIt", true], ["actionPipeline.alternateBusinessPathAllowed", false], ["businessOutcomeDimensions", DIMENSIONS], ["outcomeEquality.appliesTo", MANDATORY], ["outcomeEquality.assertion", "identical"], ["outcomeEquality.divergenceIsArchitectureDefect", true], ["capabilityPolicy.optionalCapabilityAbsent.fallback", "deterministic-standard-fallback"], ["capabilityPolicy.optionalCapabilityAbsent.changesBusinessOutcome", false], ["capabilityPolicy.requiredTransportCapabilityAbsent.disposition", "fail-closed-startup-disable-least-scope"], ["capabilityPolicy.requiredTransportCapabilityAbsent.scope", "least-scope-endpoint-service-or-module"], ["capabilityPolicy.requiredTransportCapabilityAbsent.explicitConfigurationError", true], ["capabilityPolicy.requiredTransportCapabilityAbsent.requestTimeRandomRejection", false], ["innerRingImportBan.rings", ["Domain", "Application"]], ["innerRingImportBan.forbidden", INNER_RING_BAN], ["innerRingImportBan.scope", "imports and types alike"], ["innerRingImportBan.enforcementStatus", "contract-only-not-yet-build-enforced"], ["innerRingImportBan.declaredInnerRingDependencies", []], ["nodeBaseline.role", "frozen-conformance-reference"], ["nodeBaseline.parityProved", false], ["nodeBaseline.cutoverPerformed", false], ["nodeBaseline.sourceExtractionPerformed", false], ["canonicalKernelLanguageDecision.status", "out-of-scope-not-set-by-this-record"], ["canonicalKernelLanguageDecision.oldS2DecisionAccepted", false], ["mcp.status", "N/A-no-current-consumer"], ["mcp.currentConsumerExists", false], ["mcp.configCreatedByThisRecord", false], ["capabilityDelta", "NONE"], ["rollback.owner", "codex-master"], ["rollback.runtimeDataImpact", "none"]];
// One adversarial drift per row: [target document, dotted path, drifted value, named rejection(s)].
// A row is satisfied only when the pure validator returns every reason it names AND refuses the
// record; the pure validator, not the static shape table, is the portable gate under test.
type Drift = [string, string, unknown, string | string[]];
// biome-ignore format: matrix rows, sub-spec identity and the two transport-only servers
const MATRIX_DRIFTS: Drift[] = [["d", "supportMatrix.1.id", "metaframer-asgi-daphne", ["unknown-matrix-entry:metaframer-asgi-daphne", "missing-matrix-entry:metaframer-asgi-hypercorn"]], ["d", "supportMatrix.4.classification", "mandatory-server-framework-matrix", "matrix-classification-drift:metaframer-mounts-isolated-fastapi"], ["d", "supportMatrix.0.conformanceRequired", false, "matrix-conformance-not-required:metaframer-asgi-uvicorn"], ["d", "applicability", "platform-backend-stack", "applicability-drift"], ["d", "status", "runtime-implemented", "record-status-drift"], ["d", "coreProfile.subSpec.family", "ASGI HTTP only", "sub-spec-family-drift"], ["d", "coreProfile.subSpec.maxSupportedVersion", "3.0", "sub-spec-negotiation-drift"], ["d", "coreProfile.subSpec.assumeUndeclaredOptionalCapability", true, "undeclared-optional-capability-assumed"], ["d", "coreProfile.ownsPublicDeveloperApi", false, "core-profile-not-owner"], ["d", "servers.0.decidesAuthorization", true, "server-owns-business-decision:uvicorn:decidesAuthorization"], ["d", "servers.1.decidesTransaction", true, "server-owns-business-decision:hypercorn:decidesTransaction"], ["d", "servers.0.semanticBranchingOnServerName", true, "server-name-semantic-branching:uvicorn"], ["d", "servers.1.role", "default-reference", "server-role-drift:hypercorn"], ["d", "servers.1.isDefaultReference", true, "server-default-drift:hypercorn"], ["d", "servers.1.secondSemanticRuntime", true, "second-semantic-runtime:hypercorn"]];
// biome-ignore format: ownership of the public API, the owned ports and the one Action Pipeline
const OWNERSHIP_DRIFTS: Drift[] = [["d", "fastapi.requiredKernelDependency", true, "fastapi-required-kernel-dependency"], ["d", "fastapi.ownsPublicDeveloperApi", true, "fastapi-owns-public-developer-api"], ["d", "fastapi.ownsDomainSemantics", true, "fastapi-owns-domain-semantics"], ["d", "fastapi.ownsApplicationSemantics", true, "fastapi-owns-application-semantics"], ["d", "fastapi.mayHostOrMountMetaFramer", false, "fastapi-composition-drift:mayHostOrMountMetaFramer"], ["d", "fastapi.mayBeMountedIsolatedByMetaFramer", false, "fastapi-composition-drift:mayBeMountedIsolatedByMetaFramer"], ["d", "fastapi.adapterMayCallSingleActionPipeline", false, "fastapi-composition-drift:adapterMayCallSingleActionPipeline"], ["d", "ownership.transportOnly.2", "authorization", ["unknown-transport-only:authorization", "transport-only-count-drift"]], ["d", "ownership.metaframerApplicationDomainPorts.2", "response", ["missing-owned-port:businessDecision", "unknown-owned-port:response"]], ["d", "actionPipeline.id", "fastapi-router", "action-pipeline-id-drift"], ["d", "actionPipeline.single", false, "action-pipeline-not-single"], ["d", "actionPipeline.everyBusinessRouteCallsIt", false, "action-pipeline-not-single"], ["d", "actionPipeline.alternateBusinessPathAllowed", true, "alternate-business-path-allowed"]];
// biome-ignore format: the equality invariant, the capability policy and the inner-ring ban
const EQUALITY_DRIFTS: Drift[] = [["d", "outcomeEquality.assertion", "best-effort", "outcome-equality-assertion-drift"], ["d", "outcomeEquality.divergenceIsArchitectureDefect", false, "outcome-divergence-not-a-defect"], ["d", "outcomeEquality.appliesTo.3", "metaframer-asgi-uvicorn", "outcome-equality-scope-drift"], ["d", "outcomeEquality.statement", INVERTED, ["equality-divergence-permitted", "equality-statement-weakened:identical business outcome"]], ["d", "businessOutcomeDimensions.5", "latency", ["missing-outcome-dimension:outbox", "unknown-outcome-dimension:latency"]], ["d", "capabilityPolicy.optionalCapabilityAbsent.fallback", "server-specific", "optional-capability-fallback-drift"], ["d", "capabilityPolicy.optionalCapabilityAbsent.changesBusinessOutcome", true, "fallback-changes-business-outcome"], ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.disposition", "reject-requests-at-runtime", "required-capability-disposition-drift"], ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.scope", "whole-application", "required-capability-scope-drift"], ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.explicitConfigurationError", false, "required-capability-error-not-explicit"], ["d", "capabilityPolicy.requiredTransportCapabilityAbsent.requestTimeRandomRejection", true, "request-time-random-rejection"], ["d", "innerRingImportBan.rings.1", "Delivery", ["missing-inner-ring:Application", "unknown-inner-ring:Delivery"]], ["d", "innerRingImportBan.forbidden.3", "flask", ["missing-inner-ring-ban-package:uvicorn", "unknown-inner-ring-ban-package:flask"]], ["d", "innerRingImportBan.scope", "imports only", "inner-ring-ban-scope-drift"], ["d", "innerRingImportBan.enforcementStatus", "build-enforced", "inner-ring-enforcement-overclaimed"], ["d", "innerRingImportBan.declaredInnerRingDependencies", ["pydantic"], "forbidden-inner-ring-dependency:pydantic"]];
// biome-ignore format: every downstream claim this record refuses to make
const CLAIM_DRIFTS: Drift[] = [["d", "prohibitions.permanentDualRuntime", true, "permanent-dual-runtime"], ["d", "prohibitions.dualWrite", true, "dual-write"], ["d", "prohibitions.serverNameSemanticBranching", true, "server-name-semantic-branching:policy"], ["d", "prohibitions.readinessClaimed", true, "readiness-claimed"], ["d", "prohibitions.appBuildable", true, "app-buildable-claimed"], ["d", "prohibitions.releaseAllowed", true, "release-claimed"], ["d", "prohibitions.deployAllowed", true, "deploy-claimed"], ["d", "prohibitions.runtimeImplementationAuthorizedByThisRecord", true, "runtime-implementation-claimed"], ["d", "nodeBaseline.role", "live-runtime", "node-baseline-role-drift"], ["d", "nodeBaseline.parityProved", true, "parity-claimed"], ["d", "nodeBaseline.sourceExtractionPerformed", true, "source-extraction-claimed"], ["d", "nodeBaseline.cutoverPerformed", true, "cutover-claimed"], ["d", "canonicalKernelLanguageDecision.status", "python-selected", "canonical-kernel-language-claimed"], ["d", "canonicalKernelLanguageDecision.oldS2DecisionAccepted", true, "old-s2-decision-claimed-accepted"], ["d", "mcp.status", "active", "mcp-status-drift"], ["d", "mcp.currentConsumerExists", true, "mcp-current-consumer-claimed"], ["d", "mcp.configCreatedByThisRecord", true, "mcp-config-invented"], ["d", "capabilityDelta", "runtime-enabled", "capability-delta-drift"], ["d", "rollback.owner", "claude-worker", "rollback-owner-drift"], ["d", "rollback.runtimeDataImpact", "migrated", "rollback-data-impact-drift"], ["d", "ownerComprehension.simdi", "", "plain-field-empty:simdi"], ["d", "ownerComprehension.extra", "x", ["unknown-plain-field:extra", "plain-field-count-drift"]], ["d", "ownerComprehension", { once: "x", simdiki: "x", fark: "x", kullaniciYolculugu: "x", kalanEngel: "x" }, ["missing-plain-field:simdi", "unknown-plain-field:simdiki", "plain-field-empty:simdi"]]];
// biome-ignore format: AP-OC1 evidence: a closed technology set, honest labels, pinned gaps, real sources
const EVIDENCE_DRIFTS: Drift[] = [["d", "technologyEvidence.granian", { role: "invented", evidenceStatus: "proven", globalScaleClaim: true, popularityUsedAsEvidence: true, missingEvidence: [], officialSources: ["https://example.com/blog"], evidence: {} }, "unknown-technology-evidence:granian"], ["d", "technologyEvidence.uvicorn", undefined, "missing-technology-evidence:uvicorn"], ["d", "technologyEvidence.hypercorn.evidence.performansVeOperasyonKaniti", "", "missing-evidence-dimension:hypercorn:performansVeOperasyonKaniti"], ["d", "technologyEvidence.fastapi.popularityUsedAsEvidence", true, "popularity-only-evidence:fastapi"], ["d", "technologyEvidence.uvicorn.globalScaleClaim", true, "unsupported-global-scale-claim:uvicorn"], ["d", "technologyEvidence.uvicorn.evidenceStatus", "proven", "unproven-status-claimed:uvicorn"], ["d", "technologyEvidence.asgi.evidenceStatus", "battle-tested", "evidence-status-drift:asgi"], ["d", "technologyEvidence.asgi.missingEvidence", ["saglayiciBagimsizligi"], "missing-evidence-list-drift:asgi"], ["d", "technologyEvidence.fastapi.missingEvidence", ["yok"], ["unknown-missing-evidence-dimension:fastapi:yok", "missing-evidence-list-drift:fastapi"]], ["d", "technologyEvidence.asgi.exitPath.boundary", "", "missing-exit-path:asgi"], ["d", "technologyEvidence.hypercorn.exitPath.rollbackExperimentRequiredBeforeRuntimeAdoption", false, "missing-exit-path:hypercorn"], ["d", "technologyEvidence.fastapi.officialSources.2", "https://example.com/fastapi", "non-official-source:fastapi:https://example.com/fastapi"], ["d", "technologyEvidence.asgi.officialSources", ["https://asgi.readthedocs.io/en/latest/specs/main.html"], "missing-official-source:asgi:https://asgi.readthedocs.io/en/latest/specs/www.html"]];
// biome-ignore format: the minimal scoped manifest pointer and the platform stack it may not rewrite
const MANIFEST_DRIFTS: Drift[] = [["m", POINTER_KEY, undefined, "manifest-pointer-missing"], ["m", `${POINTER_KEY}.decisionRef`, "reports/other-decision.json", "manifest-pointer-drift:decisionRef"], ["m", `${POINTER_KEY}.applicability`, "platform-backend-stack", "manifest-pointer-drift:applicability"], ["m", `${POINTER_KEY}.runtimeImplementedByThisRecord`, true, "manifest-pointer-drift:runtimeImplementedByThisRecord"], ["m", `${POINTER_KEY}.changesCurrentPlatformStack`, true, "manifest-pointer-drift:changesCurrentPlatformStack"], ["m", `${POINTER_KEY}.runtimeReady`, true, "manifest-pointer-unknown-field:runtimeReady"], ["m", "workspaces.0.stack.backend", ["MetaFramer ASGI"], "platform-backend-stack-mutated"], ["d", "manifestPointer.key", "somethingElse", "manifest-pointer-drift:record"]];
// biome-ignore format: the whole adversarial surface, evaluated in one sweep
const DRIFTS: Drift[] = [...MATRIX_DRIFTS, ...OWNERSHIP_DRIFTS, ...EQUALITY_DRIFTS, ...CLAIM_DRIFTS, ...EVIDENCE_DRIFTS, ...MANIFEST_DRIFTS];
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the record, the manifest and the shipped pure JavaScript validator are untyped.
const at = (root: any, dotted: string) => dotted.split(".").reduce((v: any, k) => v?.[k], root);
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
  keys.reduce((v: any, k) => v[k], root)[last] = value;
};

describe("MetaFramer ASGI Core Profile decision record", () => {
  it("binds the ASGI 3 Core Profile, the six-row matrix and the nine outcome dimensions", () => {
    expect(exists(RECORD), `asgi-core-profile-record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    // The record is closed: exactly these roots, so a quietly added field is a diff.
    // biome-ignore format: the closed record root key set stays compact for the shard budget
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(["actionPipeline", "applicability", "businessOutcomeDimensions", "canonicalKernelLanguageDecision", "capabilityDelta", "capabilityDeltaSadeTurkce", "capabilityPolicy", "coreProfile", "fastapi", "generatedAt", "id", "innerRingImportBan", "manifestPointer", "mcp", "nodeBaseline", "nonGoals", "outcomeEquality", "ownerComprehension", "ownership", "prohibitions", "rollback", "schemaVersion", "servers", "status", "supportMatrix", "technologyEvidence"]);
    // biome-ignore format: every pinned path at once, each drift named by its own dotted path
    for (const [dotted, value] of [...SHAPE_CONTRACT, ...SHAPE_CLAIMS]) expect(at(record, dotted), `record-shape-drift:${dotted}`).toEqual(value);
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
    expect(record.supportMatrix.map((row: { classification: string }) => row.classification)).toEqual([...MANDATORY.map(() => "mandatory-server-framework-matrix"), ...SUPPLEMENTAL.map(() => "supplemental-composition-contract")]);
    // biome-ignore format: every row is conformance-required, none is decorative
    expect(record.supportMatrix.every((row: { conformanceRequired: boolean }) => row.conformanceRequired)).toBe(true);
    // The equality invariant is normative prose: it must still MEAN identical outcomes. Tokens alone
    // are not the contract, so the inverted sentence that keeps them is checked too.
    // biome-ignore format: each phrase that carries the invariant's meaning is named individually
    for (const phrase of EQUALITY_PHRASES) expect(record.outcomeEquality.statement, `equality-invariant-missing:${phrase}`).toContain(phrase);
    // biome-ignore format: the inverted control keeps the very tokens a token-only gate accepted
    for (const token of ["CRM", "HRMS", "architecture defect"]) expect(INVERTED, `inverted-control-weak:${token}`).toContain(token);
  });

  it("claims nothing downstream and carries the five AP-OC1 plain-language fields", () => {
    expect(exists(RECORD), `asgi-core-profile-record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    // The claim set is closed: a new flag here is a diff rather than a silent addition.
    // biome-ignore format: the closed prohibition set stays compact for the shard budget
    expect(record.prohibitions).toEqual({ permanentDualRuntime: false, dualWrite: false, serverNameSemanticBranching: false, readinessClaimed: false, appBuildable: false, releaseAllowed: false, deployAllowed: false, runtimeImplementationAuthorizedByThisRecord: false });
    expect(record.mcp.futureContract).toMatch(/Action Pipeline/);
    // AP-OC1: exactly five plain-language fields, none a stub; the journey states plainly that no
    // CRM/HRMS form runs yet and defines the future equality contract.
    expect(Object.keys(record.ownerComprehension).sort()).toEqual([...PLAIN_FIELDS].sort());
    // biome-ignore format: an empty or stub plain-language field is not a report
    for (const field of PLAIN_FIELDS) expect(record.ownerComprehension[field]?.length ?? 0, `plain-field-empty:${field}`).toBeGreaterThan(40);
    // biome-ignore format: the journey is concrete, honest about today and forward-looking
    for (const token of ["CRM", "HRMS", "henüz", "eşitlik sözleşmesi"]) expect(record.ownerComprehension.kullaniciYolculugu, `journey-missing:${token}`).toContain(token);
    expect(record.capabilityDeltaSadeTurkce).toContain("yeni bir şey açmadı");
    expect(record.nonGoals.some((line: string) => /runtime/i.test(line))).toBe(true);
    // Every technology admits its gaps by AP-OC1 dimension name, and none is labelled beyond honesty.
    // biome-ignore format: an unproven technology names what is missing rather than rounding up
    for (const tech of Object.keys(record.technologyEvidence)) expect(STATUSES, `evidence-status-dishonest:${tech}`).toContain(record.technologyEvidence[tech].evidenceStatus);
    // biome-ignore format: a gap list is a list of real evidence dimensions, never a decorative token
    for (const tech of Object.keys(record.technologyEvidence)) for (const gap of record.technologyEvidence[tech].missingEvidence) expect(EVIDENCE, `gap-not-a-dimension:${tech}:${gap}`).toContain(gap);
  });

  it("fails closed on ownership, outcome, capability, evidence and manifest drift", async () => {
    expect(exists(RECORD), `asgi-core-profile-record-missing:${RECORD}`).toBe(true);
    expect(exists(VALIDATOR), `asgi-core-profile-validator-missing:${VALIDATOR}`).toBe(true);
    const decision = readJson(RECORD);
    const manifest = readJson(MANIFEST);
    // biome-ignore format: the validator's pinned surface stays compact for the shard budget
    const { evaluateAsgiCoreProfileDecision, MATRIX_IDS, OUTCOME_DIMENSIONS, FORBIDDEN_INNER_RING_IMPORTS, METAFRAMER_OWNED_PORTS, EVIDENCE_DIMENSIONS, EVIDENCE_STATUSES, MISSING_EVIDENCE, OFFICIAL_SOURCES } = await load(VALIDATOR);
    // The positive control: without it, a validator that rejects everything would look correct.
    const clean = evaluateAsgiCoreProfileDecision({ decision, manifest });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    // biome-ignore format: one drift per row: clone, move exactly one pinned path, re-evaluate
    const evaluate = (target: string, dotted: string, value: unknown) => { const [d, m] = [clone(decision), clone(manifest)]; setAt(target === "m" ? m : d, dotted, value); return evaluateAsgiCoreProfileDecision({ decision: d, manifest: m }); };
    // Every drift must earn every reason it names AND be refused. Unguarded paths are reported
    // together, so a gap in the pinned surface is named rather than hidden behind the first failure.
    // biome-ignore format: the whole adversarial sweep stays one expression
    const unguarded = DRIFTS.filter(([target, dotted, value, reasons]) => { const result = evaluate(target, dotted, value); return result.accepted || [reasons].flat().some((reason) => !result.errors.includes(reason)); }).map(([, dotted]) => dotted);
    expect(unguarded, "fail-closed-drift-unguarded").toEqual([]);
    // A "proven" relabel is not a waiver: it is refused for the gap it hides and for the rollback
    // experiment it tries to drop, in the same evaluation.
    const relabelled = clone(decision);
    relabelled.technologyEvidence.uvicorn.evidenceStatus = "proven";
    relabelled.technologyEvidence.uvicorn.exitPath.rollbackExperimentRequiredBeforeRuntimeAdoption = false;
    // biome-ignore format: the compound relabel earns both rejections at once
    expect(evaluateAsgiCoreProfileDecision({ decision: relabelled, manifest }).errors, "status-relabel-waives-rollback").toEqual(expect.arrayContaining(["unproven-status-claimed:uvicorn", "missing-exit-path:uvicorn"]));
    // The harness is not rejecting everything on its own: an unmutated evaluation still accepts.
    expect(evaluate("d", "schemaVersion", "1.0.0").errors, "harness-rejects-clean").toEqual([]);
    // The validator pins the contract itself, so the record cannot vouch for its own shape.
    expect(MATRIX_IDS).toEqual([...MANDATORY, ...SUPPLEMENTAL]);
    expect(OUTCOME_DIMENSIONS).toEqual(DIMENSIONS);
    expect(FORBIDDEN_INNER_RING_IMPORTS).toEqual(INNER_RING_BAN);
    expect(METAFRAMER_OWNED_PORTS).toEqual(OWNED_PORTS);
    expect(EVIDENCE_DIMENSIONS).toEqual(EVIDENCE);
    expect(EVIDENCE_STATUSES).toEqual(STATUSES);
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
