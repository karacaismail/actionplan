import { createHash } from "node:crypto";

export const PRE_D01_SOURCE_COMMIT = "09f0a1fb52d4141092add22a54df1a6204c155a4";
export const PRE_D01_EXPECTED_NODE_COUNT = 617;
export const PRE_D01_NODE_SET_SHA256 =
  "c87a7e67763454dec4fde4243e01e2a108a64a3b6c5cfd33b86e28dbc3daf6be";
export const PRE_D01_PROTECTED_PROJECTION_SHA256 =
  "598e39b8600b5ee78fa763e42cd7b80f3626e47c5d91860b338ee474c9ddd136";
export const D01_APPROVED_MAPPING_SHA256 =
  "2e5ce4b1c96446b6ca1f0e42cdc5225c4f36ac9551056fec31147b1febc332b0";
export const D01_APPROVED_ID_SET_SHA256 =
  "dd797dbf38594e77c8171a776d0eef1b681e0dfb7302b22b17e62526f950431d";
export const D01_NORMALIZED_SELECTION_SHA256 =
  "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";

const AUTHORITY_BOUNDARY = {
  actionplanWriter: "codex-governance-only",
  kernelWriter: "claude-only-fail-closed",
  claudeAuthGate: {
    loggedIn: true,
    authMethod: "claude.ai",
    apiProvider: "firstParty",
    subscriptionType: "max",
    perInvocation: true,
    cachedEvidenceAllowed: false,
  },
  platformProductWriter: "human-developer-only",
  gitExecutor: "codex",
  codeStartAllowed: false,
  runtimeCodeAllowed: false,
  releaseAllowed: false,
  deployAllowed: false,
  verdict: "NO-GO",
};

const sha256 = (bytes) => createHash("sha256").update(bytes, "utf8").digest("hex");
const binaryCompare = (left, right) =>
  Buffer.compare(Buffer.from(String(left), "utf8"), Buffer.from(String(right), "utf8"));
const sorted = (values) => [...values].sort(binaryCompare);
const uniqueSorted = (values) => sorted([...new Set(values)]);
const lineHash = (values) => sha256(`${values.join("\n")}\n`);
const sameSet = (left, right) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const exactObject = (actual, expected) =>
  actual !== null &&
  typeof actual === "object" &&
  !Array.isArray(actual) &&
  sameSet(sorted(Object.keys(actual)), sorted(Object.keys(expected))) &&
  Object.entries(expected).every(([key, value]) =>
    value !== null && typeof value === "object"
      ? exactObject(actual[key], value)
      : actual[key] === value,
  );

export const nodeIdSetSha256 = (ids) => lineHash(uniqueSorted(ids));
export const approvedMappingSha256 = (ledger) =>
  lineHash(
    sorted(
      ledger.map(
        (row) => `${String(row?.parentId ?? "")}\t${String(row?.selectedDescendantId ?? "")}`,
      ),
    ),
  );
export const approvedIdSetSha256 = (ledger) =>
  lineHash(sorted(ledger.map((row) => String(row?.selectedDescendantId ?? ""))));

const relation = (value) => (Array.isArray(value) ? sorted(value) : []);
const protectedRecord = (node) => ({
  id: node?.id ?? null,
  level: node?.level ?? null,
  parentId: node?.parentId ?? null,
  owner: node?.owner ?? null,
  artifactKind: node?.artifactKind ?? null,
  dependsOn: relation(node?.dependsOn),
  blocks: relation(node?.blocks),
  related: relation(node?.related),
});

export const protectedProjectionSha256 = (records) => {
  const lines = [...records]
    .sort((left, right) => binaryCompare(left?.node?.id, right?.node?.id))
    .map(({ node }) => JSON.stringify(protectedRecord(node)));
  return sha256(`${lines.join("\n")}\n`);
};

export function validateKernelNodeUniverse({ records = [], handoff = {} }) {
  const errors = [];
  const ledger = Array.isArray(handoff.ledger) ? handoff.ledger : [];
  const selectedIds = ledger.map((row) => String(row?.selectedDescendantId ?? ""));
  const approvedIds = uniqueSorted(selectedIds);
  const approvedSet = new Set(approvedIds);
  const appliedIds = uniqueSorted(
    ledger
      .filter((row) => row?.applicationStatus === "applied")
      .map((row) => String(row.selectedDescendantId)),
  );
  const nodeIds = records.map(({ node }) => String(node?.id ?? ""));
  const nodeIdCounts = new Map();
  const liveById = new Map();

  for (const { filename, node } of records) {
    const id = String(node?.id ?? "");
    nodeIdCounts.set(id, (nodeIdCounts.get(id) ?? 0) + 1);
    liveById.set(id, node);
    if (filename !== `${id}.json`) errors.push(`filename-id-drift:${filename}:${id}`);
    for (const key of ["dependsOn", "blocks", "related"])
      if (
        Object.hasOwn(node ?? {}, key) &&
        (!Array.isArray(node[key]) || node[key].some((value) => typeof value !== "string"))
      )
        errors.push(`invalid-protected-relation:${id}:${key}`);
  }
  for (const [id, count] of nodeIdCounts)
    if (count > 1) errors.push(`duplicate-canonical-id:${id}`);
  for (const id of selectedIds)
    if (selectedIds.filter((candidate) => candidate === id).length > 1)
      errors.push(`duplicate-selected-id:${id}`);

  if (ledger.length !== 33 || approvedIds.length !== 33)
    errors.push(`approved-ledger-count-drift:rows=${ledger.length}:ids=${approvedIds.length}`);
  const mappingDigest = approvedMappingSha256(ledger);
  const idSetDigest = approvedIdSetSha256(ledger);
  if (mappingDigest !== D01_APPROVED_MAPPING_SHA256) errors.push("approved-mapping-digest-drift");
  if (idSetDigest !== D01_APPROVED_ID_SET_SHA256) errors.push("approved-id-set-digest-drift");

  const provenance = handoff.provenance ?? {};
  const source = provenance.source ?? {};
  const approval = provenance.approval ?? {};
  const baseline = handoff.measurement?.preD01Baseline ?? {};
  if (source.sourceCommit !== PRE_D01_SOURCE_COMMIT) errors.push("baseline-source-commit-drift");
  if (baseline.expectedNodeCount !== PRE_D01_EXPECTED_NODE_COUNT)
    errors.push("baseline-count-evidence-drift");
  if (baseline.nodeSetSha256 !== PRE_D01_NODE_SET_SHA256) errors.push("baseline-id-evidence-drift");
  if (baseline.protectedProjectionSha256 !== PRE_D01_PROTECTED_PROJECTION_SHA256)
    errors.push("baseline-projection-evidence-drift");
  if (approval.approvedMappingSha256 !== D01_APPROVED_MAPPING_SHA256)
    errors.push("approved-mapping-evidence-drift");
  if (approval.approvedIdSetSha256 !== D01_APPROVED_ID_SET_SHA256)
    errors.push("approved-id-set-evidence-drift");
  if (approval.gateId !== "GATE-01") errors.push("approval-gate-id-drift");
  if (approval.authority !== "user-admin") errors.push("approval-authority-drift");
  if (approval.normalizedSelectionSha256 !== D01_NORMALIZED_SELECTION_SHA256)
    errors.push("approval-normalized-selection-digest-drift");

  for (const row of ledger) {
    const id = String(row?.selectedDescendantId ?? "");
    const status = row?.applicationStatus;
    const live = liveById.get(id);
    if (!["pending", "applied"].includes(status))
      errors.push(`unknown-application-status:${row?.parentId}:${status}`);
    if (status === "pending" && live) errors.push(`pending-node-present:${id}`);
    if (status === "applied" && !live) errors.push(`applied-node-missing:${id}`);
    if (status === "applied" && live?.parentId !== row?.parentId)
      errors.push(`applied-node-parent-drift:${id}`);
    if (status === "applied" && live?.level !== "archetype")
      errors.push(`applied-node-level-drift:${id}`);
  }

  const actualApprovedIds = uniqueSorted(nodeIds.filter((id) => approvedSet.has(id)));
  if (!sameSet(actualApprovedIds, appliedIds)) errors.push("live-applied-set-drift");
  const baselineRecords = records.filter(({ node }) => !approvedSet.has(String(node?.id ?? "")));
  const baselineRecordCount = baselineRecords.length;
  const baselineNodeSetSha256 = nodeIdSetSha256(
    baselineRecords.map(({ node }) => String(node?.id ?? "")),
  );
  const baselineProtectedProjectionSha256 = protectedProjectionSha256(baselineRecords);
  if (baselineRecordCount > PRE_D01_EXPECTED_NODE_COUNT)
    errors.push(`unapproved-extra:baseline-count=${baselineRecordCount}`);
  if (baselineRecordCount < PRE_D01_EXPECTED_NODE_COUNT)
    errors.push(`baseline-removal:baseline-count=${baselineRecordCount}`);
  if (baselineNodeSetSha256 !== PRE_D01_NODE_SET_SHA256) errors.push("baseline-id-hash-drift");
  if (baselineProtectedProjectionSha256 !== PRE_D01_PROTECTED_PROJECTION_SHA256)
    errors.push("baseline-protected-projection-drift");

  const expectedSummary = {
    approved: 33,
    applied: appliedIds.length,
    remaining: 33 - appliedIds.length,
  };
  if (JSON.stringify(handoff.applicationSummary) !== JSON.stringify(expectedSummary))
    errors.push("application-summary-drift");
  if (handoff.status !== "approved-application-pending")
    errors.push("application-status-root-drift");
  if (handoff.gapClosed !== false) errors.push("gap-closed-drift");
  const boundary = handoff.authorityBoundary ?? {};
  if (!exactObject(boundary, AUTHORITY_BOUNDARY)) errors.push("authority-boundary-drift");

  return {
    errors: uniqueSorted(errors),
    approvedIds,
    appliedIds,
    actualApprovedIds,
    baselineRecordCount,
    baselineNodeSetSha256,
    baselineProtectedProjectionSha256,
  };
}
