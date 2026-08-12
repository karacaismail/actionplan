// The MetaFramer ASGI Core Profile decision validator. It is pure: it takes the decision record and
// the workspace manifest as values, reads no file, and returns every named reason they fail rather
// than only the first. The record is never its own authority either: the root key set, matrix rows,
// server set, closed lists, owned ports, inner-ring ban, evidence table, equality statement, owner-
// comprehension paragraphs, capability delta, MCP contract, non-goals, rollback pair, manifest
// pointer and platform stack are pinned HERE, so restating shape never passes and no binding field
// or binding SENTENCE drifts while the gate still accepts. Explanatory prose (`rule`, `reason`,
// `description`, `note`, `testHook`, `enforcementObligation` and `evidence.*`) is deliberately NOT
// frozen: each has a machine-readable twin, so it may be reworded freely but may never reverse that
// twin — which the prose-contradiction sweep refuses wherever in the record the reversal is written.
// `scope` is NOT in that unpinned list: every `scope` is pinned — the capability-policy and
// inner-ring scopes by exact value in POLICY_PINS, and the pointer scope inside the whole-object
// RECORD_MANIFEST_POINTER pin.
export const DECISION_REF = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
export const MANIFEST_REF = "src/data/workspace-manifest.json";
export const MANIFEST_POINTER_KEY = "kernelDeliveryBoundaryDecision";
export const APPLICABILITY = "metaframer-kernel-delivery-boundary";
const MANDATORY_KIND = "mandatory-server-framework-matrix";
const SUPPLEMENTAL_KIND = "supplemental-composition-contract";
// biome-ignore format: four mandatory server/framework rows then two supplemental composition contracts; closed set
export const SUPPORT_MATRIX = [
  ["metaframer-asgi-uvicorn", MANDATORY_KIND], ["metaframer-asgi-hypercorn", MANDATORY_KIND],
  ["fastapi-hosted-metaframer-uvicorn", MANDATORY_KIND], ["fastapi-hosted-metaframer-hypercorn", MANDATORY_KIND],
  ["metaframer-mounts-isolated-fastapi", SUPPLEMENTAL_KIND], ["fastapi-adapter-calls-single-action-pipeline", SUPPLEMENTAL_KIND],
];
export const MATRIX_IDS = SUPPORT_MATRIX.map(([id]) => id);
export const MANDATORY_MATRIX_IDS = SUPPORT_MATRIX.filter(([, k]) => k === MANDATORY_KIND).map(
  ([id]) => id,
);
// biome-ignore format: the nine business-outcome dimensions that must be identical across every mandatory row
export const OUTCOME_DIMENSIONS = ["domainDecision", "authorization", "tenantIsolation", "transaction", "databaseWrite", "outbox", "audit", "response", "errorTaxonomy"];
// biome-ignore format: Uvicorn is the default reference; Hypercorn an alternative, never a second semantic runtime
export const SERVER_ROLES = [["uvicorn", "default-reference"], ["hypercorn", "supported-conformance-alternative"]];
export const SERVER_IDS = SERVER_ROLES.map(([id]) => id);
// biome-ignore format: the four business decisions no transport may own
export const SERVER_DECISION_FIELDS = ["decidesAuthorization", "decidesTenantIsolation", "decidesTransaction", "decidesDatabaseWrite"];
// biome-ignore format: the packages Domain and Application may not import or type against
export const FORBIDDEN_INNER_RING_IMPORTS = ["fastapi", "starlette", "pydantic", "uvicorn", "hypercorn"];
// biome-ignore format: the seven Application/Domain ports MetaFramer owns, businessDecision included
export const METAFRAMER_OWNED_PORTS = ["authorization", "tenantIsolation", "businessDecision", "transaction", "databaseWrite", "outbox", "audit"];
export const PLAIN_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
// biome-ignore format: the record is a closed document: exactly these roots, sorted, nothing else
export const RECORD_ROOT_KEYS = [
  "actionPipeline", "applicability", "businessOutcomeDimensions", "canonicalKernelLanguageDecision", "capabilityDelta",
  "capabilityDeltaSadeTurkce", "capabilityPolicy", "coreProfile", "fastapi", "generatedAt", "id", "innerRingImportBan",
  "manifestPointer", "mcp", "nodeBaseline", "nonGoals", "outcomeEquality", "ownerComprehension", "ownership",
  "prohibitions", "rollback", "schemaVersion", "servers", "status", "supportMatrix", "technologyEvidence",
];
// Exact closed lists as [path, pinned members, tag]; drops, renames, inventions and duplicates are named.
// biome-ignore format: the closed-list table stays one row per list
export const LIST_PINS = [
  ["businessOutcomeDimensions", OUTCOME_DIMENSIONS, "outcome-dimension"], ["ownership.transportOnly", ["server", "framework"], "transport-only"],
  ["ownership.metaframerApplicationDomainPorts", METAFRAMER_OWNED_PORTS, "owned-port"], ["innerRingImportBan.rings", ["Domain", "Application"], "inner-ring"],
  ["innerRingImportBan.forbidden", FORBIDDEN_INNER_RING_IMPORTS, "inner-ring-ban-package"], ["ownerComprehension", PLAIN_FIELDS, "plain-field"],
];
// biome-ignore format: AP-OC1's seven evidence dimensions; a dimension without a record is not evidence
export const EVIDENCE_DIMENSIONS = ["populariteKanitDegil", "bagimsizUretimKullanimi", "aktifBakimVeGuvenlikYaniti",
  "performansVeOperasyonKaniti", "standartBirlikteCalisabilirlik", "saglayiciBagimsizligi", "cikisVeRollbackStratejisi"];
export const EVIDENCE_STATUSES = ["proven", "conditional", "experimental"];
// Each technology's admitted gap list, pinned so an honest list cannot be shortened or falsified.
const TRANSPORT_GAPS = ["bagimsizUretimKullanimi", "performansVeOperasyonKaniti"];
// biome-ignore format: the pinned gap table stays one line
export const MISSING_EVIDENCE = { asgi: TRANSPORT_GAPS, uvicorn: TRANSPORT_GAPS, hypercorn: TRANSPORT_GAPS, fastapi: ["performansVeOperasyonKaniti"] };
// biome-ignore format: official primary sources only; a blog, a benchmark post or a star count is not admissible
export const OFFICIAL_SOURCES = {
  asgi: ["https://asgi.readthedocs.io/en/latest/specs/main.html", "https://asgi.readthedocs.io/en/latest/specs/www.html"],
  uvicorn: ["https://www.uvicorn.org/concepts/asgi/", "https://www.uvicorn.org/deployment/", "https://github.com/encode/uvicorn/releases"],
  hypercorn: ["https://hypercorn.readthedocs.io/en/latest/index.html", "https://hypercorn.readthedocs.io/en/latest/discussion/http2.html",
    "https://github.com/pgjones/hypercorn/releases"],
  fastapi: ["https://fastapi.tiangolo.com/", "https://github.com/fastapi/fastapi/releases"],
};
// biome-ignore format: the equality invariant is normative prose, not decoration: these phrases carry its meaning
export const EQUALITY_PHRASES = ["CRM", "HRMS", "identical business outcome", "architecture defect", "not a documented difference"];
// The binding sentences: a phrase list cannot hold them, so the canonical text itself is pinned.
export const EQUALITY_STATEMENT =
  "The same CRM or HRMS form action must produce the identical business outcome across all four " +
  "mandatory combinations, dimension by dimension. Uvicorn accepting the transport while Hypercorn " +
  "rejects the business transaction is an architecture defect, not a documented difference.";
export const CAPABILITY_DELTA_SADE_TURKCE =
  "Bu paket çalışan üründe yeni bir şey açmadı; yalnız kuralı, sözleşmeyi ve kanıtı yazılı ve " +
  "denetlenebilir hâle getirdi. Kullanıcı ekranında bugün hiçbir şey değişmez.";
export const MCP_FUTURE_CONTRACT =
  "a future MCP surface is a transport consumer at the Delivery boundary: it calls the same single " +
  "MetaFramer Action Pipeline, decides nothing, holds no invariant and is bound by this same " +
  "conformance matrix";
export const ROLLBACK_TRIGGER =
  "the support matrix, an ownership pin, the nine outcome dimensions, the capability policy, the " +
  "inner-ring ban, the evidence labels or the manifest pointer drifts from this record";
export const ROLLBACK_ACTION =
  "revert this record, its validator, its test and the single manifest pointer as one logical shard; " +
  "nothing else depends on them and no generated node, authority chain or sealed record was touched";
export const OWNER_COMPREHENSION = {
  once:
    "Önce yazılı ve denetlenebilir tek bir sözleşme yoktu: MetaFramer'ın hangi taşıma katmanına ait " +
    "olduğu, FastAPI'nin zorunlu mu isteğe bağlı mı olduğu ve aynı CRM veya HRMS form eyleminin " +
    "farklı sunucularda aynı sonucu verip vermeyeceği garanti altında değildi.",
  simdi:
    "Şimdi ASGI 3 Core Profile'ın MetaFramer'a ait olduğu, Uvicorn'un varsayılan referans, " +
    "Hypercorn'un uyumluluk alternatifi ve FastAPI'nin isteğe bağlı adaptör konağı olduğu; her iş " +
    "yolunun tek MetaFramer Action Pipeline'ını çağırdığı ve dört zorunlu kombinasyonun dokuz iş " +
    "sonucu boyutunda aynı olması gerektiği yazılı ve makineyle denetlenebilir.",
  fark:
    "Bir önceki aşamaya göre gerçek fark, bu kararın konuşma ve dağınık metin olmaktan çıkıp " +
    "fail-closed bir doğrulayıcıya bağlanmasıdır; çalışan üründe yeni bir yetenek açılmadı.",
  kullaniciYolculugu:
    "Bu paket bir CRM veya HRMS formunu henüz çalışır hâle getirmez; kaydettiği şey gelecekteki " +
    "eşitlik sözleşmesidir. Kullanıcı formu gönderdiğinde istek yetkilendirildi mi, işlendi mi ve her " +
    "seferinde aynı şekilde mi kaydedildi sorusunun cevabı, sunucu Uvicorn da olsa Hypercorn da olsa, " +
    "FastAPI ile barındırılsa da barındırılmasa da aynı olmak zorundadır.",
  kalanEngel:
    "Delivery halkası hâlâ kapalıdır ve bu kayıt onu açmaz; runtime implementasyonu başlamamıştır, iç " +
    "halka import yasağı bugün derleme ile zorlanamaz, dört kombinasyonlu uyumluluk süiti ayrı bir " +
    "pakettir ve kanonik kernel dili kararı açık kalır.",
};
// The non-goal list is ordered and closed: dropping, adding, renaming or reversing a line is named.
export const NON_GOALS = [
  "do not read this record as runtime implementation, readiness, release, deploy, app-buildable or " +
    "production authorisation; it authorises governance, projection and test planning only",
  "do not read it as accepting the open P01-W1 S2 language decision or as selecting a canonical " +
    "kernel language",
  "do not make Hypercorn the default or a second semantic runtime, and do not make FastAPI a " +
    "required kernel dependency or the owner of the public developer API, Domain or Application " +
    "semantics",
  "do not branch business semantics on a server name, permit a permanent dual runtime or a dual " +
    "write, or let an optional-capability fallback change a business outcome",
  "do not extract source from, prove parity against, cut over from or unfreeze the Node conformance reference",
  "do not invent an MCP config, server, tool or consumer; none exists today and the word alone is " +
    "not a reason to create one",
  "do not rewrite the current platform backend stack, any generated node, any sealed authority or " +
    "promotion record, or any historical decision",
  "do not stage, commit, push, tag, merge or otherwise mutate Git from this shard",
];
// Each pattern reverses a pin this record carries, and is refused wherever in the record it appears.
// Turkish markers carry no \b: JavaScript word boundaries are ASCII-only and never fire on "ürün".
// biome-ignore format: the contradiction table stays one row per reversal
export const PROSE_CONTRADICTIONS = [
  [/\b(may|can|could|might|would)\s+(?!not\b|never\b)(\w+\s+)?(differ|diverge|vary)\b/i, "equality-divergence-permitted"],
  [/\blegitimately\s+(differ|diverge|vary)\b/i, "equality-divergence-permitted"],
  [/\bdivergence\s+is\s+(acceptable|allowed|permitted|expected|tolerated)\b/i, "equality-divergence-permitted"],
  [/\b(runtime|implementation)\s+(is\s+)?(complete|completed|finished|done)\b/i, "prose-claims-runtime-complete"],
  [/runtime\s+tamamland/i, "prose-claims-runtime-complete"], [/\b(production|release|deploy)[-\s]ready\b/i, "prose-claims-readiness"],
  [/ürün\s+hazır/i, "prose-claims-readiness"], [/hiçbir\s+engel\s+kalmad/i, "prose-claims-no-blocker"],
  [/form\s+çalışıyor/i, "prose-claims-form-runs"], [/\bparity\s+(is\s+)?(proved|proven)\b/i, "prose-claims-parity"],
];
// biome-ignore format: the current platform implementation stack this decision does not own and may not rewrite
export const PLATFORM_BACKEND_STACK = ["FastAPI", "GraphQL", "PostgreSQL", "SQLAlchemy 2.0", "SQLModel", "Alembic"];
// The record's OWN copy of the pointer, pinned as one exact closed object — symmetric with the four
// manifest-side fields and their unknown-key closure. A record side pinned on fewer fields lets the
// record contradict itself: the manifest still says the stack is untouched and no runtime landed
// while the record's own pointer claims both, and the owner reads the record, not the manifest.
export const RECORD_MANIFEST_POINTER = {
  file: MANIFEST_REF,
  key: MANIFEST_POINTER_KEY,
  applicability: APPLICABILITY,
  changesCurrentPlatformStack: false,
  runtimeImplementedByThisRecord: false,
  scope:
    "one minimal root-level scoped pointer; the platform workspace stack.backend list is not " +
    "rewritten by this package",
};
// biome-ignore format: fields that must be exactly false, as [path, rejection]; absent reads as "not false" and fails
export const FALSE_PINS = [
  ["coreProfile.subSpec.assumeUndeclaredOptionalCapability", "undeclared-optional-capability-assumed"],
  ["fastapi.requiredKernelDependency", "fastapi-required-kernel-dependency"], ["fastapi.ownsPublicDeveloperApi", "fastapi-owns-public-developer-api"],
  ["fastapi.ownsDomainSemantics", "fastapi-owns-domain-semantics"], ["fastapi.ownsApplicationSemantics", "fastapi-owns-application-semantics"],
  ["actionPipeline.alternateBusinessPathAllowed", "alternate-business-path-allowed"],
  ["capabilityPolicy.optionalCapabilityAbsent.changesBusinessOutcome", "fallback-changes-business-outcome"],
  ["capabilityPolicy.requiredTransportCapabilityAbsent.requestTimeRandomRejection", "request-time-random-rejection"],
  ["prohibitions.permanentDualRuntime", "permanent-dual-runtime"], ["prohibitions.dualWrite", "dual-write"],
  ["prohibitions.serverNameSemanticBranching", "server-name-semantic-branching:policy"], ["prohibitions.readinessClaimed", "readiness-claimed"],
  ["prohibitions.appBuildable", "app-buildable-claimed"], ["prohibitions.releaseAllowed", "release-claimed"],
  ["prohibitions.deployAllowed", "deploy-claimed"], ["prohibitions.runtimeImplementationAuthorizedByThisRecord", "runtime-implementation-claimed"],
  ["nodeBaseline.parityProved", "parity-claimed"], ["nodeBaseline.sourceExtractionPerformed", "source-extraction-claimed"],
  ["nodeBaseline.cutoverPerformed", "cutover-claimed"], ["canonicalKernelLanguageDecision.oldS2DecisionAccepted", "old-s2-decision-claimed-accepted"],
  ["mcp.currentConsumerExists", "mcp-current-consumer-claimed"], ["mcp.configCreatedByThisRecord", "mcp-config-invented"],
];
// biome-ignore format: fields that must equal one exact value, as [path, value, rejection]: record and profile identity
export const IDENTITY_PINS = [
  ["schemaVersion", "1.0.0", "record-schema-version-drift"], ["id", "kernel-asgi-core-profile-decision-2026-08-11", "record-id-drift"],
  ["generatedAt", "2026-08-11", "record-generated-at-drift"], ["applicability", APPLICABILITY, "applicability-drift"],
  ["status", "decision-recorded-no-runtime-implementation", "record-status-drift"], ["coreProfile.spec", "ASGI 3", "core-profile-drift"],
  ["coreProfile.mandatory", true, "core-profile-drift"], ["coreProfile.owner", "metaframer", "core-profile-drift"],
  ["coreProfile.ownsPublicDeveloperApi", true, "core-profile-not-owner"], ["coreProfile.ownsDeliveryContract", true, "core-profile-not-owner"],
  ["coreProfile.subSpec.family", "ASGI HTTP/WebSocket", "sub-spec-family-drift"],
  ["coreProfile.subSpec.maxSupportedVersion", "2.5", "sub-spec-negotiation-drift"],
  ["coreProfile.subSpec.negotiated", "capability-negotiated", "sub-spec-negotiation-drift"],
  ["fastapi.role", "supported-optional-adapter-host", "fastapi-role-drift"], ["actionPipeline.id", "metaframer-action-pipeline", "action-pipeline-id-drift"],
  ["actionPipeline.single", true, "action-pipeline-not-single"], ["actionPipeline.everyBusinessRouteCallsIt", true, "action-pipeline-not-single"],
];
// biome-ignore format: the pinned policy, composition and honesty table stays compact for the shard budget
export const POLICY_PINS = [
  ["fastapi.mayHostOrMountMetaFramer", true, "fastapi-composition-drift:mayHostOrMountMetaFramer"],
  ["fastapi.mayBeMountedIsolatedByMetaFramer", true, "fastapi-composition-drift:mayBeMountedIsolatedByMetaFramer"],
  ["fastapi.adapterMayCallSingleActionPipeline", true, "fastapi-composition-drift:adapterMayCallSingleActionPipeline"],
  ["outcomeEquality.assertion", "identical", "outcome-equality-assertion-drift"],
  ["outcomeEquality.divergenceIsArchitectureDefect", true, "outcome-divergence-not-a-defect"],
  ["capabilityPolicy.optionalCapabilityAbsent.fallback", "deterministic-standard-fallback", "optional-capability-fallback-drift"],
  ["capabilityPolicy.requiredTransportCapabilityAbsent.disposition", "fail-closed-startup-disable-least-scope", "required-capability-disposition-drift"],
  ["capabilityPolicy.requiredTransportCapabilityAbsent.scope", "least-scope-endpoint-service-or-module", "required-capability-scope-drift"],
  ["capabilityPolicy.requiredTransportCapabilityAbsent.explicitConfigurationError", true, "required-capability-error-not-explicit"],
  ["innerRingImportBan.scope", "imports and types alike", "inner-ring-ban-scope-drift"],
  ["innerRingImportBan.enforcementStatus", "contract-only-not-yet-build-enforced", "inner-ring-enforcement-overclaimed"],
  ["nodeBaseline.role", "frozen-conformance-reference", "node-baseline-role-drift"], ["mcp.status", "N/A-no-current-consumer", "mcp-status-drift"],
  ["canonicalKernelLanguageDecision.status", "out-of-scope-not-set-by-this-record", "canonical-kernel-language-claimed"],
  ["capabilityDelta", "NONE", "capability-delta-drift"], ["rollback.owner", "codex-master", "rollback-owner-drift"],
  ["rollback.runtimeDataImpact", "none", "rollback-data-impact-drift"],
];
// biome-ignore format: the binding sentences, pinned exactly, as [path, canonical text, rejection]
export const TEXT_PINS = [
  ["outcomeEquality.statement", EQUALITY_STATEMENT, "outcome-equality-statement-drift"],
  ["capabilityDeltaSadeTurkce", CAPABILITY_DELTA_SADE_TURKCE, "capability-delta-sade-turkce-drift"],
  ["mcp.futureContract", MCP_FUTURE_CONTRACT, "mcp-future-contract-drift"], ["rollback.trigger", ROLLBACK_TRIGGER, "rollback-trigger-drift"],
  ["rollback.action", ROLLBACK_ACTION, "rollback-action-drift"],
  ...PLAIN_FIELDS.map((f) => [`ownerComprehension.${f}`, OWNER_COMPREHENSION[f], `plain-field-drift:${f}`]),
];
export const VALUE_PINS = [...IDENTITY_PINS, ...POLICY_PINS, ...TEXT_PINS];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// JSON object semantics carry no key order, so a whole object is compared over SORTED entries: a
// reordered pointer is the same pointer and stays accepted, while a missing, extra, retyped or
// reworded field is a different object. A non-object — string, null, array of the same entries —
// is never equal to the pinned object, however equivalent it looks.
const sortedEntries = (value) => Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1));
const sameObject = (got, pinned) =>
  !!got &&
  typeof got === "object" &&
  !Array.isArray(got) &&
  same(sortedEntries(got), sortedEntries(pinned));
const at = (root, path) => path.split(".").reduce((value, key) => value?.[key], root);
// Every string anywhere in the record, so a reversal cannot hide in an unpinned corner of it.
const allStrings = (node, out = []) => {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const item of node) allStrings(item, out);
  else if (node && typeof node === "object")
    for (const value of Object.values(node)) allStrings(value, out);
  return out;
};

export function evaluateAsgiCoreProfileDecision({ decision, manifest } = {}) {
  const errors = [];
  const record = decision ?? {};
  const add = (error) => {
    if (!errors.includes(error)) errors.push(error);
  };
  // A closed list, named member by member: dropped, invented and count drift stay distinct reasons.
  const closed = (got, pinned, tag) => {
    for (const item of pinned) if (!got.includes(item)) add(`missing-${tag}:${item}`);
    for (const item of got) if (!pinned.includes(item)) add(`unknown-${tag}:${item}`);
    if (got.length !== pinned.length) add(`${tag}-count-drift`);
  };
  // The document is closed before anything inside it is read, then every pinned path is checked.
  closed(Object.keys(record), RECORD_ROOT_KEYS, "record-root");
  for (const [path, error] of FALSE_PINS) if (at(record, path) !== false) add(error);
  for (const [path, value, error] of VALUE_PINS) if (at(record, path) !== value) add(error);
  for (const [path, pinned, tag] of LIST_PINS) {
    const raw = at(record, path);
    closed(Array.isArray(raw) ? raw : Object.keys(raw ?? {}), pinned, tag);
  }
  for (const f of PLAIN_FIELDS) if (!record.ownerComprehension?.[f]) add(`plain-field-empty:${f}`);
  // The non-goal list is ordered and closed; a shortened list drifts at the index it shifts from.
  const nonGoals = record.nonGoals ?? [];
  for (const [i, line] of NON_GOALS.entries()) if (nonGoals[i] !== line) add(`non-goal-drift:${i}`);
  if (nonGoals.length !== NON_GOALS.length) add("non-goal-count-drift");
  // Prose that reverses its own machine-readable twin, wherever in the record it is written.
  for (const text of allStrings(record))
    for (const [pattern, error] of PROSE_CONTRADICTIONS) if (pattern.test(text)) add(error);
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
  // Exactly the two transport-only servers, once each, in canonical order; position is never semantic.
  const servers = record.servers ?? [];
  const seen = new Set();
  for (const server of servers) {
    const known = SERVER_ROLES.find(([id]) => id === server?.id);
    if (!known) {
      add(`unknown-server:${server?.id}`);
      continue;
    }
    if (seen.has(server.id)) {
      add(`duplicate-server:${server.id}`);
      continue;
    }
    seen.add(server.id);
    if (server.role !== known[1]) add(`server-role-drift:${server.id}`);
    const isDefault = known[1] === "default-reference";
    if (server.isDefaultReference !== isDefault) add(`server-default-drift:${server.id}`);
    if (server.secondSemanticRuntime !== false) add(`second-semantic-runtime:${server.id}`);
    for (const field of SERVER_DECISION_FIELDS)
      if (server[field] !== false) add(`server-owns-business-decision:${server.id}:${field}`);
    if (server.semanticBranchingOnServerName !== false)
      add(`server-name-semantic-branching:${server.id}`);
  }
  for (const id of SERVER_IDS) if (!seen.has(id)) add(`missing-server:${id}`);
  if (servers.length !== SERVER_IDS.length) add("server-count-drift");
  else if (
    !same(
      servers.map((s) => s?.id),
      SERVER_IDS,
    )
  )
    add("server-order-drift");
  // The invariant must still MEAN identical outcomes across exactly the mandatory four.
  const statement = record.outcomeEquality?.statement ?? "";
  for (const phrase of EQUALITY_PHRASES)
    if (!statement.includes(phrase)) add(`equality-statement-weakened:${phrase}`);
  if (!same(record.outcomeEquality?.appliesTo, MANDATORY_MATRIX_IDS))
    add("outcome-equality-scope-drift");
  for (const pkg of record.innerRingImportBan?.declaredInnerRingDependencies ?? [])
    add(`forbidden-inner-ring-dependency:${pkg}`);
  // AP-OC1: a closed technology set, seven recorded dimensions, honest labels over pinned gaps.
  for (const tech of Object.keys(record.technologyEvidence ?? {}))
    if (!OFFICIAL_SOURCES[tech]) add(`unknown-technology-evidence:${tech}`);
  for (const [tech, sources] of Object.entries(OFFICIAL_SOURCES)) {
    const entry = record.technologyEvidence?.[tech];
    if (!entry) {
      add(`missing-technology-evidence:${tech}`);
      continue;
    }
    for (const dim of EVIDENCE_DIMENSIONS)
      if (!entry.evidence?.[dim]) add(`missing-evidence-dimension:${tech}:${dim}`);
    if (entry.popularityUsedAsEvidence !== false) add(`popularity-only-evidence:${tech}`);
    const missing = entry.missingEvidence ?? [];
    for (const dim of missing)
      if (!EVIDENCE_DIMENSIONS.includes(dim))
        add(`unknown-missing-evidence-dimension:${tech}:${dim}`);
    if (!same(missing, MISSING_EVIDENCE[tech])) add(`missing-evidence-list-drift:${tech}`);
    if (!EVIDENCE_STATUSES.includes(entry.evidenceStatus)) add(`evidence-status-drift:${tech}`);
    if (entry.evidenceStatus === "proven" && missing.length) add(`unproven-status-claimed:${tech}`);
    if (
      entry.globalScaleClaim === true &&
      (entry.evidenceStatus !== "proven" || missing.length > 0)
    )
      add(`unsupported-global-scale-claim:${tech}`);
    const exit = entry.exitPath ?? {};
    if (!exit.boundary || exit.rollbackExperimentRequiredBeforeRuntimeAdoption !== true)
      add(`missing-exit-path:${tech}`);
    const given = entry.officialSources ?? [];
    for (const url of given) if (!sources.includes(url)) add(`non-official-source:${tech}:${url}`);
    for (const url of sources)
      if (!given.includes(url)) add(`missing-official-source:${tech}:${url}`);
  }
  // The pointer is minimal, scoped and honest from both sides; the stack it does not own is untouched.
  const pointer = manifest?.[MANIFEST_POINTER_KEY];
  if (!pointer) add("manifest-pointer-missing");
  else {
    // biome-ignore format: the pinned pointer fields stay compact for the shard budget
    const expected = { decisionRef: DECISION_REF, applicability: APPLICABILITY, changesCurrentPlatformStack: false, runtimeImplementedByThisRecord: false };
    for (const [key, value] of Object.entries(expected))
      if (pointer[key] !== value) add(`manifest-pointer-drift:${key}`);
    for (const key of Object.keys(pointer))
      if (!(key in expected) && key !== "note") add(`manifest-pointer-unknown-field:${key}`);
  }
  // The record side is closed the same way and read whether or not the manifest side survives, so a
  // dropped manifest pointer can no longer hide a record that contradicts it.
  if (!sameObject(record.manifestPointer, RECORD_MANIFEST_POINTER))
    add("manifest-pointer-drift:record");
  const platform = (manifest?.workspaces ?? []).find((entry) => entry?.id === "platform");
  if (!same(platform?.stack?.backend, PLATFORM_BACKEND_STACK))
    add("platform-backend-stack-mutated");
  return { errors, accepted: errors.length === 0 };
}
