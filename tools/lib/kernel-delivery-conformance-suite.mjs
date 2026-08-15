// The MetaFramer Delivery conformance-suite CONTRACT validator. It is pure: it takes the contract,
// the upstream ASGI Core Profile decision and the workspace manifest as values, reads no file and
// touches no process, network or environment, and it returns every named reason they fail rather
// than only the first. The contract owns NO list of its own: the four mandatory combinations and the
// nine business-outcome dimensions are DERIVED from the decision here, so a second hard-coded grid
// never becomes a second authority. The suite has not run, so a cell state, execution, evidence or
// result that belongs to a run — and prose that claims one — is refused by name rather than recorded.
export const CONTRACT_REF = "reports/kernel-delivery-conformance-suite-contract-2026-08-15.json";
export const DECISION_REF = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
export const MANIFEST_REF = "src/data/workspace-manifest.json";
export const MANIFEST_POINTER_KEY = "kernelDeliveryConformanceSuiteContract";
export const APPLICABILITY = "metaframer-kernel-delivery-boundary";
// The only two states a not-yet-run cell may carry; anything else is a result the suite never produced.
export const OPEN_CELL_STATE = "OPEN";
export const PLANNED_CELL_EXECUTION = "planned-not-executed";
// Combination and dimension are joined by a separator neither contains, so a named rejection always
// resolves back to exactly one cell of the grid.
export const CELL_SEPARATOR = "::";
export const MANDATORY_COMBINATION_COUNT = 4;
export const OUTCOME_DIMENSION_COUNT = 9;
export const EXPECTED_CELL_COUNT = MANDATORY_COMBINATION_COUNT * OUTCOME_DIMENSION_COUNT;
export const PLAIN_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
// A plain-language field this short is a stub, not a report the owner can read.
export const PLAIN_FIELD_MIN_LENGTH = 40;
// The honesty vocabulary: the owner paragraphs must SAY, in plain Turkish, that the suite has not
// run. "çalıştırılmadı" is deliberately not a prefix of any claim-of-execution wording below.
export const NOT_RUN_MARKERS = ["henüz çalıştırılmadı"];
// biome-ignore format: the closed contract root key set, sorted; the record is a closed document
export const RECORD_ROOT_KEYS = [
  "applicability", "authority", "capabilityDelta", "capabilityDeltaSadeTurkce", "coverage",
  "generatedAt", "id", "manifestPointer", "nonGoals", "ownerComprehension", "prohibitions",
  "rollback", "schemaVersion", "status", "suiteExecution", "upstreamDecisionRef",
];
// biome-ignore format: pinned EXACTLY; a drifted, empty or reversed statement is a second authority
export const AUTHORITY_STATEMENT = "This contract PROJECTS the coverage grid of the upstream ASGI Core Profile decision and owns no list of its own. The four mandatory combinations and the nine business-outcome dimensions are derived from that record at evaluation time, so this contract is never a second independent authority over them and a drifted upstream list invalidates this projection instead of overriding it.";
// biome-ignore format: pinned EXACTLY; the reversed sentence is the capability claim the owner reads
export const CAPABILITY_DELTA_SADE_TURKCE = "Bu paket çalışan üründe yeni bir yetenek açmadı; yalnız gelecekteki uyumluluk süitinin kapsamını yazılı ve denetlenebilir hâle getirdi. Kullanıcı ekranında bugün hiçbir şey değişmez.";
// biome-ignore format: the two upstream axes the projection is read from, as one closed object
export const COVERAGE_DERIVED_FROM = { combinations: `${DECISION_REF}#outcomeEquality.appliesTo`, dimensions: `${DECISION_REF}#businessOutcomeDimensions` };
// biome-ignore format: the exact evidence a future result is bought with, in order
export const REQUIRED_EVIDENCE_BEFORE_RESULT = ["ci-run-url", "test-log"];
// biome-ignore format: one required-text path per entry, sorted; none of them may be empty
export const REQUIRED_TEXT_PATHS = ["authority.statement", "rollback.action", "rollback.trigger", "suiteExecution.note"];
// biome-ignore format: fields that must be exactly one value, as [path, value, rejection]
export const IDENTITY_PINS = [
  ["authority.upstreamOwner", DECISION_REF, "authority-upstream-owner-drift"],
  ["authority.combinationsSource", "outcomeEquality.appliesTo", "authority-combinations-source-drift"],
  ["authority.dimensionsSource", "businessOutcomeDimensions", "authority-dimensions-source-drift"],
  ["authority.statement", AUTHORITY_STATEMENT, "authority-statement-drift"],
  ["capabilityDeltaSadeTurkce", CAPABILITY_DELTA_SADE_TURKCE, "capability-delta-sade-turkce-drift"],
  ["schemaVersion", "1.0.0", "record-schema-version-drift"],
  ["id", "kernel-delivery-conformance-suite-contract-2026-08-15", "record-id-drift"],
  ["generatedAt", "2026-08-15", "record-generated-at-drift"],
  ["applicability", APPLICABILITY, "applicability-drift"],
  ["status", "contract-recorded-suite-not-executed", "record-status-drift"],
  ["capabilityDelta", "NONE", "capability-delta-drift"],
  ["rollback.owner", "codex-master", "rollback-owner-drift"],
  ["rollback.runtimeDataImpact", "none", "rollback-data-impact-drift"],
];
// biome-ignore format: the suite itself has not run, one refused execution claim per line
export const SUITE_EXECUTION_PINS = [
  ["executed", false, "suite-execution-claimed"], ["passClaimed", false, "suite-pass-claimed"],
  ["greenClaimed", false, "suite-green-claimed"],
  ["evidenceRequiredBeforeResult", true, "suite-evidence-requirement-waived"],
];
// biome-ignore format: every downstream claim this contract refuses, as [path, rejection]; each must be exactly false
export const REFUSED_CLAIM_PINS = [
  ["prohibitions.runtimeImplementedByThisRecord", "runtime-implementation-claimed"],
  ["prohibitions.readinessClaimed", "readiness-claimed"],
  ["prohibitions.releaseAllowed", "release-claimed"],
  ["prohibitions.deployAllowed", "deploy-claimed"],
  ["prohibitions.sdkReady", "sdk-ready-claimed"],
  ["prohibitions.appBuildable", "app-buildable-claimed"],
  ["prohibitions.canonicalKernelLanguageSelected", "canonical-kernel-language-claimed"],
  ["prohibitions.nodeCutoverPerformed", "node-cutover-claimed"],
  ["prohibitions.innerRingImportBanBuildEnforced", "inner-ring-enforcement-claimed"],
  ["prohibitions.mcpSurfaceExists", "mcp-surface-claimed"],
];
// Every nested container is closed too, by its exact current key set: a pinned flag that says false
// is worth nothing while an unknown SIBLING beside it says the opposite, so an unpinned field is a
// named rejection rather than an accepted claim. The ten prohibition keys are read off the refused
// claims above so this file never carries that list twice.
// biome-ignore format: one sorted closed key set per container
export const COVERAGE_KEYS = ["cellCount", "cells", "combinationCount", "derivedFrom", "dimensionCount"];
// biome-ignore format: the projected cell carries exactly its grid identity and its not-yet-run state
export const CONFORMANCE_CELL_KEYS = ["combinationId", "dimension", "evidence", "execution", "result", "state"];
// biome-ignore format: the execution block, including the evidence a future result must carry first
export const SUITE_EXECUTION_KEYS = ["evidenceRequiredBeforeResult", "executed", "greenClaimed", "note", "passClaimed", "requiredEvidenceBeforeResult"];
// biome-ignore format: the block that names the upstream owner instead of becoming a second one
export const AUTHORITY_KEYS = ["combinationsSource", "dimensionsSource", "secondIndependentAuthority", "statement", "upstreamOwner"];
// biome-ignore format: the rollback block; no approval or readiness field belongs in it
export const ROLLBACK_KEYS = ["action", "owner", "runtimeDataImpact", "trigger"];
export const PROHIBITION_KEYS = REFUSED_CLAIM_PINS.map(([path]) => path.split(".")[1]);
// The record's OWN copy of the pointer, pinned as one exact closed object and symmetric with the
// manifest side: a record that contradicts the manifest is refused even when the manifest is honest.
export const RECORD_MANIFEST_POINTER = {
  file: MANIFEST_REF,
  key: MANIFEST_POINTER_KEY,
  applicability: APPLICABILITY,
  changesCurrentPlatformStack: false,
  runtimeImplementedByThisRecord: false,
  scope:
    "one minimal root-level scoped pointer; no workspace, stack or command list is rewritten by " +
    "this package",
};
// biome-ignore format: the manifest-side pointer, closed except for the human note
export const MANIFEST_POINTER_PINS = [
  ["contractRef", CONTRACT_REF], ["applicability", APPLICABILITY],
  ["changesCurrentPlatformStack", false], ["runtimeImplementedByThisRecord", false],
];
// Prose that reverses a machine-readable pin this contract carries, refused wherever it is written.
// Turkish markers carry no \b: JavaScript word boundaries are ASCII-only and never fire on "süit".
// biome-ignore format: the contradiction table stays one row per reversal
export const PROSE_CONTRADICTIONS = [
  [/çalıştırıld/i, "prose-claims-suite-executed"], [/\bsuite\s+(was\s+)?executed\b/i, "prose-claims-suite-executed"],
  [/yeşil\s+geçti/i, "prose-claims-suite-executed"], [/\ball\s+(\d+\s+)?cells\s+(are\s+|were\s+)?(pass|passed|passing|green)\b/i, "prose-claims-suite-executed"],
  [/ürün\s+hazır/i, "prose-claims-readiness"], [/\b(production|release|deploy)[-\s]ready\b/i, "prose-claims-readiness"],
  [/hiçbir\s+engel\s+kalmad/i, "prose-claims-no-blocker"], [/form\s+çalışıyor/i, "prose-claims-form-runs"],
];
const isObject = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const isText = (value) => typeof value === "string" && value.trim().length > 0;
const at = (root, path) => path.split(".").reduce((value, key) => value?.[key], root);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sortedEntries = (value) => Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1));
// JSON carries no key order, so a whole object is compared over SORTED entries: a reordered pointer
// is the same pointer, while a missing, extra, retyped or reworded field is a different object.
const sameObject = (got, pinned) =>
  isObject(got) && same(sortedEntries(got), sortedEntries(pinned));
// A closed list, named member by member: dropped, invented and count drift stay distinct reasons.
const closed = (got, pinned, tag, add) => {
  for (const item of pinned) if (!got.includes(item)) add(`missing-${tag}:${item}`);
  for (const item of got) if (!pinned.includes(item)) add(`unknown-${tag}:${item}`);
  if (got.length !== pinned.length) add(`${tag}-count-drift`);
};
// The same closure over a nested container, where an unreadable container is its own named reason.
const closedObject = (value, pinned, tag, add) => {
  if (!isObject(value)) add(`${tag}-unreadable`);
  else closed(Object.keys(value), pinned, tag, add);
};
export const cellKey = (combinationId, dimension) =>
  `${combinationId}${CELL_SEPARATOR}${dimension}`;
// Every string anywhere in the record, so a reversal cannot hide in an unpinned corner of it.
const allStrings = (node, out = []) => {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const item of node) allStrings(item, out);
  else if (isObject(node)) for (const value of Object.values(node)) allStrings(value, out);
  return out;
};

// The mandatory grid, PROJECTED from the upstream decision: the combinations the outcome-equality
// invariant applies to, crossed with the decision's own business-outcome dimensions. A decision this
// cannot read yields no cells rather than an exception, and never an invented one.
// The two upstream axes the grid and its counts are both read from, or null when unreadable.
const deriveAxes = (decision) => {
  const combinations = decision?.outcomeEquality?.appliesTo;
  const dimensions = decision?.businessOutcomeDimensions;
  if (!Array.isArray(combinations) || !Array.isArray(dimensions)) return null;
  if (!combinations.every(isText) || !dimensions.every(isText)) return null;
  return { combinations, dimensions };
};

export function deriveMandatoryCells(decision) {
  const axes = deriveAxes(decision);
  if (!axes) return [];
  return axes.combinations.flatMap((combinationId) =>
    axes.dimensions.map((dimension) => ({ combinationId, dimension })),
  );
}

export function evaluateDeliveryConformanceSuiteContract(input) {
  const errors = [];
  const add = (error) => {
    if (!errors.includes(error)) errors.push(error);
  };
  const source = isObject(input) ? input : {};
  const record = isObject(source.contract) ? source.contract : null;
  const decision = isObject(source.decision) ? source.decision : null;
  const manifest = isObject(source.manifest) ? source.manifest : null;
  if (!record) add("contract-unreadable");
  if (!decision) add("upstream-decision-unreadable");
  if (!manifest) add("manifest-unreadable");
  const contract = record ?? {};
  if (record) {
    closed(Object.keys(contract), RECORD_ROOT_KEYS, "record-root", add);
    closedObject(contract.coverage, COVERAGE_KEYS, "coverage-field", add);
    closedObject(contract.suiteExecution, SUITE_EXECUTION_KEYS, "suite-execution-field", add);
    closedObject(contract.authority, AUTHORITY_KEYS, "authority-field", add);
    closedObject(contract.prohibitions, PROHIBITION_KEYS, "prohibition-field", add);
    closedObject(contract.rollback, ROLLBACK_KEYS, "rollback-field", add);
  }
  for (const [path, value, error] of IDENTITY_PINS) if (at(contract, path) !== value) add(error);
  // The contract names its upstream owner instead of becoming one.
  if (contract.upstreamDecisionRef !== DECISION_REF) add("upstream-decision-ref-drift");
  if (contract.authority?.secondIndependentAuthority !== false) add("second-authority-claimed");
  evaluateGrid(contract, decision, add);
  for (const [key, value, error] of SUITE_EXECUTION_PINS)
    if (contract.suiteExecution?.[key] !== value) add(error);
  // A self-attestation, a shortened list and an appended waiver are each a different evidence list,
  // the projection is read from exactly two axes, and a present-but-empty text is an absent contract.
  if (!same(contract.suiteExecution?.requiredEvidenceBeforeResult, REQUIRED_EVIDENCE_BEFORE_RESULT))
    add("suite-required-evidence-drift");
  if (!sameObject(contract.coverage?.derivedFrom, COVERAGE_DERIVED_FROM))
    add("coverage-derived-from-drift");
  for (const path of REQUIRED_TEXT_PATHS)
    if (!isText(at(contract, path))) add(`required-text-empty:${path}`);
  const nonGoals = contract.nonGoals;
  if (!Array.isArray(nonGoals) || nonGoals.length === 0 || !nonGoals.every(isText))
    add("non-goals-invalid");
  for (const [path, error] of REFUSED_CLAIM_PINS) if (at(contract, path) !== false) add(error);
  evaluateOwnerComprehension(contract, add);
  for (const text of allStrings(contract))
    for (const [pattern, error] of PROSE_CONTRADICTIONS) if (pattern.test(text)) add(error);
  if (!sameObject(contract.manifestPointer, RECORD_MANIFEST_POINTER))
    add("manifest-pointer-drift:record");
  evaluateManifestPointer(manifest, add);
  return { errors, accepted: errors.length === 0 };
}

// The projected grid: exactly the derived cells, once each, all OPEN, planned, evidence-free and
// result-free. Drift in the upstream decision invalidates the stale projection, cell by named cell.
function evaluateGrid(contract, decision, add) {
  const derived = deriveMandatoryCells(decision);
  if (derived.length === 0) add("mandatory-grid-underivable");
  if (derived.length !== EXPECTED_CELL_COUNT) add("conformance-cell-count-drift");
  // The coverage COUNTS are derived from the same upstream axes as the cells, so metadata that
  // contradicts the projection is a lie by itself even while all the correct cells are still carried.
  const axes = deriveAxes(decision);
  const coverage = contract.coverage;
  if (coverage?.combinationCount !== (axes?.combinations.length ?? 0))
    add("coverage-combination-count-drift");
  if (coverage?.dimensionCount !== (axes?.dimensions.length ?? 0))
    add("coverage-dimension-count-drift");
  if (coverage?.cellCount !== derived.length) add("coverage-cell-count-metadata-drift");
  const expected = new Set(derived.map((cell) => cellKey(cell.combinationId, cell.dimension)));
  const cells = contract.coverage?.cells;
  if (!Array.isArray(cells)) {
    add("coverage-cells-unreadable");
    for (const key of expected) add(`missing-conformance-cell:${key}`);
    return;
  }
  if (cells.length !== derived.length) add("conformance-cell-count-drift");
  const seen = new Set();
  for (const [index, cell] of cells.entries()) {
    if (!isObject(cell) || !isText(cell.combinationId) || !isText(cell.dimension)) {
      add(`malformed-conformance-cell:${index}`);
      continue;
    }
    const key = cellKey(cell.combinationId, cell.dimension);
    if (!expected.has(key)) {
      add(`unknown-conformance-cell:${key}`);
      continue;
    }
    if (seen.has(key)) {
      add(`duplicate-conformance-cell:${key}`);
      continue;
    }
    seen.add(key);
    // The cell is a closed container too: an unknown sibling beside its OPEN state is refused by
    // the cell it sits in AND the field it invented, whether that happens once or in all 36 cells.
    closed(Object.keys(cell), CONFORMANCE_CELL_KEYS, `conformance-cell-field:${key}`, add);
    if (cell.state !== OPEN_CELL_STATE) add(`cell-state-drift:${key}`);
    if (cell.execution !== PLANNED_CELL_EXECUTION) add(`cell-execution-drift:${key}`);
    if (!Array.isArray(cell.evidence) || cell.evidence.length !== 0)
      add(`cell-evidence-claimed:${key}`);
    if (cell.result !== null) add(`cell-result-claimed:${key}`);
  }
  for (const key of expected) if (!seen.has(key)) add(`missing-conformance-cell:${key}`);
}

// AP-OC1: exactly five plain-language fields, none a stub, and at least one of them SAYING in plain
// Turkish that the suite has not run. An honest field set that omits that sentence is still refused.
function evaluateOwnerComprehension(contract, add) {
  const owner = isObject(contract.ownerComprehension) ? contract.ownerComprehension : {};
  closed(Object.keys(owner), PLAIN_FIELDS, "plain-field", add);
  for (const field of PLAIN_FIELDS)
    if (!isText(owner[field]) || owner[field].trim().length <= PLAIN_FIELD_MIN_LENGTH)
      add(`plain-field-empty:${field}`);
  const text = PLAIN_FIELDS.map((field) => owner[field])
    .filter(isText)
    .join(" ");
  if (!NOT_RUN_MARKERS.some((marker) => text.includes(marker)))
    add("owner-comprehension-omits-not-run");
}

// The manifest side stays one minimal, closed, honest pointer: no unknown field, no stack change and
// no runtime claim. Only the human `note` is unpinned, and it is swept for prose reversals elsewhere.
function evaluateManifestPointer(manifest, add) {
  const pointer = manifest?.[MANIFEST_POINTER_KEY];
  if (!isObject(pointer)) {
    add("manifest-pointer-missing");
    return;
  }
  for (const [key, value] of MANIFEST_POINTER_PINS)
    if (pointer[key] !== value) add(`manifest-pointer-drift:${key}`);
  const known = MANIFEST_POINTER_PINS.map(([key]) => key);
  for (const key of Object.keys(pointer))
    if (!known.includes(key) && key !== "note") add(`manifest-pointer-unknown-field:${key}`);
  for (const [pattern, error] of PROSE_CONTRADICTIONS)
    if (typeof pointer.note === "string" && pattern.test(pointer.note)) add(error);
}
