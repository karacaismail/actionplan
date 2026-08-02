import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The effective-authority chain is the single source of the D01 authorityBoundary; this module
// never keeps a local copy of it. The import stays dynamic only so that deliberately partial tool
// sandboxes (reindex/materializer fixtures copying this file alone into a bare temp root) can
// still resolve. A complete Actionplan checkout is identified by BOTH canonical root markers and
// there the chain is mandatory: an absent or throwing chain fails closed, never silently skipped.
const ACTIONPLAN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const COMPLETE_CHECKOUT_MARKERS = ["AGENTS.md", "package.json"];
export const D01_EFFECTIVE_AUTHORITY_CHAIN_REF =
  "reports/kernel-effective-authority-chain-2026-07-31.json";
const CHAIN_MISSING = `effective-authority-chain-missing:${D01_EFFECTIVE_AUTHORITY_CHAIN_REF}`;
const isCompleteCheckout = () =>
  COMPLETE_CHECKOUT_MARKERS.every((marker) => fs.existsSync(path.join(ACTIONPLAN_ROOT, marker)));

let authorityChain = null;
try {
  authorityChain = await import("./kernel-effective-authority-chain.mjs");
} catch {
  authorityChain = null;
}

const resolveEffectiveAuthority = () => {
  if (!authorityChain) return null;
  try {
    return authorityChain.effectiveD01Authority();
  } catch {
    return null;
  }
};

// A consumer provenance stamp is historical-at-write: it names the sealed entry the artifact was
// authored against, so appending a successor epoch must never make it drift. Resolution is by
// entry digest against the sealed chain, never against the current head. A stamp naming no sealed
// entry resolves to null and fails closed at every call site.
let sealedEntries = null;
const sealedChainEntries = () => {
  if (!authorityChain) return null;
  try {
    sealedEntries ??= authorityChain.loadEffectiveAuthorityChain()?.entries ?? [];
    return sealedEntries;
  } catch {
    return null;
  }
};
const sealedStamp = (binding) => {
  const digest = binding?.chainHeadSha256;
  if (typeof digest !== "string" || !digest) return null;
  return sealedChainEntries()?.find((entry) => entry?.entrySha256 === digest) ?? null;
};

// The normalized-text digest a sealed entry actually seals. The genesis entry deliberately keeps
// no inline text and seals its digest through normalizedTextRef, so reading `normalizedTextSha256`
// alone yields undefined there and a stamp that simply omits the field compares equal to it. This
// resolves both shapes and returns null instead of undefined, so a comparison against it can never
// be satisfied by two absent values.
const sealedTextSha256 = (entry) => {
  const digest = entry?.normalizedTextSha256 ?? entry?.normalizedTextRef?.sha256;
  return typeof digest === "string" && digest ? digest : null;
};

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

export const resolveD01AuthorityBoundary = () => {
  const effective = resolveEffectiveAuthority();
  if (!effective) throw new Error(CHAIN_MISSING);
  return effective.boundary;
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

// Naming a sealed entry is necessary but not sufficient: a stamp stays valid only while the
// authority it named still governs. The D01 boundary derived from the chain prefix ending at the
// stamped entry must equal the boundary in force now. Whether a stamp survives an append is decided
// by the boundary, not by the epoch number: an append that leaves the derived boundary
// byte-identical keeps every earlier stamp governing, while an append that moves any mapped
// dimension supersedes every stamp behind it, so a consumer bound to the live boundary must be
// restamped onto the head. Either way a sealed stamp stays historically RESOLVABLE — that is a
// separate question, answered by sealedStamp above. A sealed but superseded entry binds a boundary
// that no longer holds and fails closed here. An unresolvable or erroring derivation is a
// rejection, never a bypass.
const stampGoverns = (stamped, effective) => {
  const entries = sealedChainEntries();
  const index = entries?.indexOf(stamped) ?? -1;
  if (index < 0 || !effective) return false;
  try {
    const derived = authorityChain.deriveAuthorityBoundary({
      entries: entries.slice(0, index + 1),
    });
    return !derived?.errors?.length && exactObject(derived.boundary, effective.boundary);
  } catch {
    return false;
  }
};

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
  const binding = provenance.effectiveAuthority ?? {};
  if (authorityChain) {
    if (binding.ref !== authorityChain.EFFECTIVE_AUTHORITY_CHAIN_REF)
      errors.push("effective-authority-ref-drift");
    const stamped = sealedStamp(binding);
    const sealedDigest = sealedTextSha256(stamped);
    if (
      !sealedDigest ||
      typeof binding.normalizedTextSha256 !== "string" ||
      binding.normalizedTextSha256 !== sealedDigest
    )
      errors.push("effective-authority-text-digest-drift");
    if (D01_EFFECTIVE_AUTHORITY_CHAIN_REF !== authorityChain.EFFECTIVE_AUTHORITY_CHAIN_REF)
      errors.push("effective-authority-ref-constant-drift");
  }

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
  const effective = resolveEffectiveAuthority();
  if (effective) {
    if (!exactObject(boundary, effective.boundary)) errors.push("authority-boundary-drift");
    // The stamp must name a sealed entry at or behind the current head — never ahead of it — and
    // that entry must still carry today's boundary, so a valid-but-too-old stamp cannot pass.
    const stamped = sealedStamp(binding);
    if (!stamped) errors.push("effective-authority-chain-head-drift");
    else if (binding.seq !== stamped.seq || stamped.seq > effective.seq)
      errors.push("effective-authority-seq-drift");
    else if (!stampGoverns(stamped, effective)) errors.push("effective-authority-stamp-superseded");
  } else if (isCompleteCheckout()) {
    // Complete checkout without a resolvable chain: fail closed, never bypass.
    errors.push(CHAIN_MISSING);
    errors.push("authority-boundary-drift");
  }

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

export function resolveD01NodeUniverse({ records = [], handoff = {} }) {
  const validatedLiveUniverse = validateKernelNodeUniverse({ records, handoff });
  if (validatedLiveUniverse.errors.length)
    throw new Error(`[kernel-node-universe] ${validatedLiveUniverse.errors.join(",")}`);
  const rowsById = new Map(
    (handoff.ledger ?? []).map((row) => [String(row.selectedDescendantId), row]),
  );
  const appliedRows = validatedLiveUniverse.appliedIds.map((id) => rowsById.get(id));
  return {
    ...validatedLiveUniverse,
    appliedRows,
    expectedNodeCount: PRE_D01_EXPECTED_NODE_COUNT + appliedRows.length,
  };
}
