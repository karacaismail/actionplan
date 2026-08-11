// The MetaFramer ASGI Core Profile decision validator. It is pure: it takes the decision record and
// the workspace manifest as values, reads no file, and returns every named reason they fail rather
// than only the first. The record is never its own authority either — the six matrix rows, server
// roles, nine outcome dimensions, seven MetaFramer-owned ports, inner-ring ban, seven AP-OC1
// evidence dimensions, honest status labels, pinned gap lists, official sources, the normative
// equality invariant and the untouched platform stack are pinned HERE, so restating shape never
// passes and no binding field drifts while the gate still accepts.
export const DECISION_REF = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
export const MANIFEST_REF = "src/data/workspace-manifest.json";
export const MANIFEST_POINTER_KEY = "kernelDeliveryBoundaryDecision";
export const APPLICABILITY = "metaframer-kernel-delivery-boundary";
// biome-ignore format: four mandatory server/framework rows then two supplemental composition contracts; closed set
export const SUPPORT_MATRIX = [["metaframer-asgi-uvicorn", "mandatory-server-framework-matrix"], ["metaframer-asgi-hypercorn", "mandatory-server-framework-matrix"], ["fastapi-hosted-metaframer-uvicorn", "mandatory-server-framework-matrix"], ["fastapi-hosted-metaframer-hypercorn", "mandatory-server-framework-matrix"], ["metaframer-mounts-isolated-fastapi", "supplemental-composition-contract"], ["fastapi-adapter-calls-single-action-pipeline", "supplemental-composition-contract"]];
export const MATRIX_IDS = SUPPORT_MATRIX.map(([id]) => id);
// biome-ignore format: the mandatory subset the outcome-equality invariant must span, exactly
export const MANDATORY_MATRIX_IDS = SUPPORT_MATRIX.filter(([, kind]) => kind === "mandatory-server-framework-matrix").map(([id]) => id);
// biome-ignore format: the nine business-outcome dimensions that must be identical across every mandatory row
export const OUTCOME_DIMENSIONS = ["domainDecision", "authorization", "tenantIsolation", "transaction", "databaseWrite", "outbox", "audit", "response", "errorTaxonomy"];
// biome-ignore format: Uvicorn is the default reference; Hypercorn an alternative, never a second semantic runtime
export const SERVER_ROLES = [["uvicorn", "default-reference"], ["hypercorn", "supported-conformance-alternative"]];
// biome-ignore format: the four business decisions no transport may own
export const SERVER_DECISION_FIELDS = ["decidesAuthorization", "decidesTenantIsolation", "decidesTransaction", "decidesDatabaseWrite"];
// biome-ignore format: the packages Domain and Application may not import or type against
export const FORBIDDEN_INNER_RING_IMPORTS = ["fastapi", "starlette", "pydantic", "uvicorn", "hypercorn"];
// biome-ignore format: the seven Application/Domain ports MetaFramer owns, businessDecision included
export const METAFRAMER_OWNED_PORTS = ["authorization", "tenantIsolation", "businessDecision", "transaction", "databaseWrite", "outbox", "audit"];
export const PLAIN_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
// biome-ignore format: exact closed lists (array members, or an object's key set), as [path, pinned members, tag]; a dropped, renamed, invented or duplicated member is named by its own tag, so no closed list is widened, narrowed or padded in silence
export const LIST_PINS = [["businessOutcomeDimensions", OUTCOME_DIMENSIONS, "outcome-dimension"], ["ownership.transportOnly", ["server", "framework"], "transport-only"], ["ownership.metaframerApplicationDomainPorts", METAFRAMER_OWNED_PORTS, "owned-port"], ["innerRingImportBan.rings", ["Domain", "Application"], "inner-ring"], ["innerRingImportBan.forbidden", FORBIDDEN_INNER_RING_IMPORTS, "inner-ring-ban-package"], ["ownerComprehension", PLAIN_FIELDS, "plain-field"]];
// biome-ignore format: AP-OC1's seven evidence dimensions; a dimension without a record is not evidence
export const EVIDENCE_DIMENSIONS = ["populariteKanitDegil", "bagimsizUretimKullanimi", "aktifBakimVeGuvenlikYaniti", "performansVeOperasyonKaniti", "standartBirlikteCalisabilirlik", "saglayiciBagimsizligi", "cikisVeRollbackStratejisi"];
export const EVIDENCE_STATUSES = ["proven", "conditional", "experimental"];
// biome-ignore format: each technology's admitted gap list, pinned so an honest list cannot be falsified into a shorter or a wrong-dimension one
export const MISSING_EVIDENCE = { asgi: ["bagimsizUretimKullanimi", "performansVeOperasyonKaniti"], uvicorn: ["bagimsizUretimKullanimi", "performansVeOperasyonKaniti"], hypercorn: ["bagimsizUretimKullanimi", "performansVeOperasyonKaniti"], fastapi: ["performansVeOperasyonKaniti"] };
// biome-ignore format: official primary sources only; a blog, a benchmark post or a star count is not admissible
export const OFFICIAL_SOURCES = { asgi: ["https://asgi.readthedocs.io/en/latest/specs/main.html", "https://asgi.readthedocs.io/en/latest/specs/www.html"], uvicorn: ["https://www.uvicorn.org/concepts/asgi/", "https://www.uvicorn.org/deployment/", "https://github.com/encode/uvicorn/releases"], hypercorn: ["https://hypercorn.readthedocs.io/en/latest/index.html", "https://hypercorn.readthedocs.io/en/latest/discussion/http2.html", "https://github.com/pgjones/hypercorn/releases"], fastapi: ["https://fastapi.tiangolo.com/", "https://github.com/fastapi/fastapi/releases"] };
// biome-ignore format: the equality invariant is normative prose, not decoration: these phrases carry its meaning
export const EQUALITY_PHRASES = ["CRM", "HRMS", "identical business outcome", "architecture defect", "not a documented difference"];
// biome-ignore format: prose licensing divergence is refused even when the CRM, HRMS and architecture-defect tokens all survive the rewrite
export const DIVERGENCE_PERMITTED = /\b(may|can|could|might|would)\s+(?!not\b|never\b)(\w+\s+)?(differ|diverge|vary)\b|\blegitimately\s+(differ|diverge|vary)\b|\bdivergence\s+is\s+(acceptable|allowed|permitted|expected|tolerated)\b/i;
// biome-ignore format: the current platform implementation stack this decision does not own and may not rewrite
export const PLATFORM_BACKEND_STACK = ["FastAPI", "GraphQL", "PostgreSQL", "SQLAlchemy 2.0", "SQLModel", "Alembic"];
// biome-ignore format: fields that must be exactly false, as [path, rejection]; absent reads as "not false" and fails
export const FALSE_PINS = [["coreProfile.subSpec.assumeUndeclaredOptionalCapability", "undeclared-optional-capability-assumed"], ["fastapi.requiredKernelDependency", "fastapi-required-kernel-dependency"], ["fastapi.ownsPublicDeveloperApi", "fastapi-owns-public-developer-api"], ["fastapi.ownsDomainSemantics", "fastapi-owns-domain-semantics"], ["fastapi.ownsApplicationSemantics", "fastapi-owns-application-semantics"], ["actionPipeline.alternateBusinessPathAllowed", "alternate-business-path-allowed"], ["capabilityPolicy.optionalCapabilityAbsent.changesBusinessOutcome", "fallback-changes-business-outcome"], ["capabilityPolicy.requiredTransportCapabilityAbsent.requestTimeRandomRejection", "request-time-random-rejection"], ["prohibitions.permanentDualRuntime", "permanent-dual-runtime"], ["prohibitions.dualWrite", "dual-write"], ["prohibitions.serverNameSemanticBranching", "server-name-semantic-branching:policy"], ["prohibitions.readinessClaimed", "readiness-claimed"], ["prohibitions.appBuildable", "app-buildable-claimed"], ["prohibitions.releaseAllowed", "release-claimed"], ["prohibitions.deployAllowed", "deploy-claimed"], ["prohibitions.runtimeImplementationAuthorizedByThisRecord", "runtime-implementation-claimed"], ["nodeBaseline.parityProved", "parity-claimed"], ["nodeBaseline.sourceExtractionPerformed", "source-extraction-claimed"], ["nodeBaseline.cutoverPerformed", "cutover-claimed"], ["canonicalKernelLanguageDecision.oldS2DecisionAccepted", "old-s2-decision-claimed-accepted"], ["mcp.currentConsumerExists", "mcp-current-consumer-claimed"], ["mcp.configCreatedByThisRecord", "mcp-config-invented"]];
// biome-ignore format: fields that must equal one exact value, as [path, value, rejection]: profile identity and ownership
export const IDENTITY_PINS = [["applicability", APPLICABILITY, "applicability-drift"], ["status", "decision-recorded-no-runtime-implementation", "record-status-drift"], ["coreProfile.spec", "ASGI 3", "core-profile-drift"], ["coreProfile.mandatory", true, "core-profile-drift"], ["coreProfile.owner", "metaframer", "core-profile-drift"], ["coreProfile.ownsPublicDeveloperApi", true, "core-profile-not-owner"], ["coreProfile.ownsDeliveryContract", true, "core-profile-not-owner"], ["coreProfile.subSpec.family", "ASGI HTTP/WebSocket", "sub-spec-family-drift"], ["coreProfile.subSpec.maxSupportedVersion", "2.5", "sub-spec-negotiation-drift"], ["coreProfile.subSpec.negotiated", "capability-negotiated", "sub-spec-negotiation-drift"], ["fastapi.role", "supported-optional-adapter-host", "fastapi-role-drift"], ["actionPipeline.id", "metaframer-action-pipeline", "action-pipeline-id-drift"], ["actionPipeline.single", true, "action-pipeline-not-single"], ["actionPipeline.everyBusinessRouteCallsIt", true, "action-pipeline-not-single"]];
// biome-ignore format: the pinned policy, composition and honesty table stays compact for the shard budget
export const POLICY_PINS = [["fastapi.mayHostOrMountMetaFramer", true, "fastapi-composition-drift:mayHostOrMountMetaFramer"], ["fastapi.mayBeMountedIsolatedByMetaFramer", true, "fastapi-composition-drift:mayBeMountedIsolatedByMetaFramer"], ["fastapi.adapterMayCallSingleActionPipeline", true, "fastapi-composition-drift:adapterMayCallSingleActionPipeline"], ["outcomeEquality.assertion", "identical", "outcome-equality-assertion-drift"], ["outcomeEquality.divergenceIsArchitectureDefect", true, "outcome-divergence-not-a-defect"], ["capabilityPolicy.optionalCapabilityAbsent.fallback", "deterministic-standard-fallback", "optional-capability-fallback-drift"], ["capabilityPolicy.requiredTransportCapabilityAbsent.disposition", "fail-closed-startup-disable-least-scope", "required-capability-disposition-drift"], ["capabilityPolicy.requiredTransportCapabilityAbsent.scope", "least-scope-endpoint-service-or-module", "required-capability-scope-drift"], ["capabilityPolicy.requiredTransportCapabilityAbsent.explicitConfigurationError", true, "required-capability-error-not-explicit"], ["innerRingImportBan.scope", "imports and types alike", "inner-ring-ban-scope-drift"], ["innerRingImportBan.enforcementStatus", "contract-only-not-yet-build-enforced", "inner-ring-enforcement-overclaimed"], ["nodeBaseline.role", "frozen-conformance-reference", "node-baseline-role-drift"], ["canonicalKernelLanguageDecision.status", "out-of-scope-not-set-by-this-record", "canonical-kernel-language-claimed"], ["mcp.status", "N/A-no-current-consumer", "mcp-status-drift"], ["capabilityDelta", "NONE", "capability-delta-drift"], ["rollback.owner", "codex-master", "rollback-owner-drift"], ["rollback.runtimeDataImpact", "none", "rollback-data-impact-drift"]];
export const VALUE_PINS = [...IDENTITY_PINS, ...POLICY_PINS];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const at = (root, path) => path.split(".").reduce((value, key) => value?.[key], root);

export function evaluateAsgiCoreProfileDecision({ decision, manifest } = {}) {
  const errors = [];
  const record = decision ?? {};
  const add = (error) => {
    if (!errors.includes(error)) errors.push(error);
  };
  // Ownership, sub-spec family and ceiling, single pipeline, composition, capability disposition,
  // inner-ring honesty, rollback owner and every downstream claim, pinned path by path.
  // biome-ignore format: the two pin sweeps stay one expression each
  for (const [path, error] of FALSE_PINS) if (at(record, path) !== false) add(error);
  // biome-ignore format: the two pin sweeps stay one expression each
  for (const [path, value, error] of VALUE_PINS) if (at(record, path) !== value) add(error);
  // biome-ignore format: every closed list at once; dropped, renamed, invented and duplicated members are named
  for (const [path, pinned, tag] of LIST_PINS) { const raw = at(record, path); const got = Array.isArray(raw) ? raw : Object.keys(raw ?? {}); for (const item of pinned) if (!got.includes(item)) add(`missing-${tag}:${item}`); for (const item of got) if (!pinned.includes(item)) add(`unknown-${tag}:${item}`); if (got.length !== pinned.length) add(`${tag}-count-drift`); }
  for (const f of PLAIN_FIELDS) if (!record.ownerComprehension?.[f]) add(`plain-field-empty:${f}`);

  // Exactly the six frozen rows: none unknown, missing, doubled, reclassified or exempt.
  const rows = new Map();
  for (const row of record.supportMatrix ?? []) {
    const known = SUPPORT_MATRIX.find(([id]) => id === row?.id);
    if (!known) add(`unknown-matrix-entry:${row?.id}`);
    else if (rows.has(row.id)) add(`duplicate-matrix-entry:${row.id}`);
    else {
      rows.set(row.id, row);
      if (row.classification !== known[1]) add(`matrix-classification-drift:${row.id}`);
      if (row.conformanceRequired !== true) add(`matrix-conformance-not-required:${row.id}`);
    }
  }
  for (const id of MATRIX_IDS) if (!rows.has(id)) add(`missing-matrix-entry:${id}`);

  // Servers transport only: no business decision, no second runtime, no server-name branching.
  for (const [id, role] of SERVER_ROLES) {
    const server = (record.servers ?? []).find((entry) => entry?.id === id);
    if (!server) {
      add(`missing-server:${id}`);
      continue;
    }
    if (server.role !== role) add(`server-role-drift:${id}`);
    // biome-ignore format: exactly one server is the default reference
    if (server.isDefaultReference !== (role === "default-reference")) add(`server-default-drift:${id}`);
    if (server.secondSemanticRuntime !== false) add(`second-semantic-runtime:${id}`);
    // biome-ignore format: every business decision a transport claims is named field by field
    for (const field of SERVER_DECISION_FIELDS) if (server[field] !== false) add(`server-owns-business-decision:${id}:${field}`);
    // biome-ignore format: reading the server name into a semantic branch is refused
    if (server.semanticBranchingOnServerName !== false) add(`server-name-semantic-branching:${id}`);
  }

  // The invariant must still MEAN identical outcomes across exactly the mandatory four, and no
  // inner-ring dependency may be declared against the ban.
  const statement = record.outcomeEquality?.statement ?? "";
  // biome-ignore format: each phrase that carries the invariant's meaning is named individually
  for (const phrase of EQUALITY_PHRASES) if (!statement.includes(phrase)) add(`equality-statement-weakened:${phrase}`);
  if (DIVERGENCE_PERMITTED.test(statement)) add("equality-divergence-permitted");
  // biome-ignore format: the equality scope is compared against the pinned mandatory four
  if (!same(record.outcomeEquality?.appliesTo, MANDATORY_MATRIX_IDS)) add("outcome-equality-scope-drift");
  // biome-ignore format: a declared inner-ring dependency is refused by name
  for (const pkg of record.innerRingImportBan?.declaredInnerRingDependencies ?? []) add(`forbidden-inner-ring-dependency:${pkg}`);

  // AP-OC1: a closed technology set, seven recorded dimensions, honest labels over pinned gaps, no
  // popularity basis, no invented scale claim, and an exit path no relabel can waive.
  // biome-ignore format: an unaudited technology may not be smuggled into the evidence table
  for (const tech of Object.keys(record.technologyEvidence ?? {})) if (!OFFICIAL_SOURCES[tech]) add(`unknown-technology-evidence:${tech}`);
  for (const [tech, sources] of Object.entries(OFFICIAL_SOURCES)) {
    const entry = record.technologyEvidence?.[tech];
    if (!entry) {
      add(`missing-technology-evidence:${tech}`);
      continue;
    }
    // biome-ignore format: an empty or absent dimension is not a record of that dimension
    for (const dim of EVIDENCE_DIMENSIONS) if (!entry.evidence?.[dim]) add(`missing-evidence-dimension:${tech}:${dim}`);
    if (entry.popularityUsedAsEvidence !== false) add(`popularity-only-evidence:${tech}`);
    const missing = entry.missingEvidence ?? [];
    // biome-ignore format: the admitted gap is checked member by member and against its pinned list
    for (const dim of missing) if (!EVIDENCE_DIMENSIONS.includes(dim)) add(`unknown-missing-evidence-dimension:${tech}:${dim}`);
    if (!same(missing, MISSING_EVIDENCE[tech])) add(`missing-evidence-list-drift:${tech}`);
    // biome-ignore format: only three labels are honest, and "proven" over a named gap is not one of them
    if (!EVIDENCE_STATUSES.includes(entry.evidenceStatus)) add(`evidence-status-drift:${tech}`);
    if (entry.evidenceStatus === "proven" && missing.length) add(`unproven-status-claimed:${tech}`);
    // biome-ignore format: a global-scale claim survives only when it is proven and nothing is missing
    if (entry.globalScaleClaim === true && (entry.evidenceStatus !== "proven" || missing.length > 0)) add(`unsupported-global-scale-claim:${tech}`);
    const exit = entry.exitPath ?? {};
    // biome-ignore format: no status relabel waives the rollback experiment, and the boundary is named
    if (!exit.boundary || exit.rollbackExperimentRequiredBeforeRuntimeAdoption !== true) add(`missing-exit-path:${tech}`);
    const given = entry.officialSources ?? [];
    // biome-ignore format: anything outside the pinned official set is named with its URL
    for (const url of given) if (!sources.includes(url)) add(`non-official-source:${tech}:${url}`);
    // biome-ignore format: quietly dropping a pinned official source is drift too
    for (const url of sources) if (!given.includes(url)) add(`missing-official-source:${tech}:${url}`);
  }

  // The pointer is minimal, scoped and honest from both sides; the stack it does not own is untouched.
  const pointer = manifest?.[MANIFEST_POINTER_KEY];
  if (!pointer) add("manifest-pointer-missing");
  else {
    // biome-ignore format: the pinned pointer fields stay compact for the shard budget
    const expected = { decisionRef: DECISION_REF, applicability: APPLICABILITY, changesCurrentPlatformStack: false, runtimeImplementedByThisRecord: false };
    // biome-ignore format: each drifted pointer field is named individually
    for (const [key, value] of Object.entries(expected)) if (pointer[key] !== value) add(`manifest-pointer-drift:${key}`);
    // biome-ignore format: the pointer stays minimal: no field beyond the pinned four and its note
    for (const key of Object.keys(pointer)) if (!(key in expected) && key !== "note") add(`manifest-pointer-unknown-field:${key}`);
    const declared = record.manifestPointer ?? {};
    // biome-ignore format: the record must point at the same file, key and scope the manifest carries
    if (declared.file !== MANIFEST_REF || declared.key !== MANIFEST_POINTER_KEY || declared.applicability !== APPLICABILITY) add("manifest-pointer-drift:record");
  }
  const platform = (manifest?.workspaces ?? []).find((entry) => entry?.id === "platform");
  // biome-ignore format: rewriting the current platform backend stack is refused here
  if (!same(platform?.stack?.backend, PLATFORM_BACKEND_STACK)) add("platform-backend-stack-mutated");

  return { errors, accepted: errors.length === 0 };
}
