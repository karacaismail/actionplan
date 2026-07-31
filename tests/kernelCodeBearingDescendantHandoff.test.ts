import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- the pure JavaScript oracle intentionally has no declaration file.
// biome-ignore format: the test imports the complete immutable oracle constant set.
import { D01_APPROVED_ID_SET_SHA256, D01_APPROVED_MAPPING_SHA256, PRE_D01_EXPECTED_NODE_COUNT, PRE_D01_NODE_SET_SHA256, PRE_D01_PROTECTED_PROJECTION_SHA256, PRE_D01_SOURCE_COMMIT, validateKernelNodeUniverse } from "../tools/lib/kernel-node-universe.mjs";

const ROOT = process.cwd();
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const APPROVAL_SHA = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const LEVELS = ["archetype", "feature", "component", "work_unit", "micro_step"];
// biome-ignore format: GATE-01 exact id, title and technical dependency DAG stays compact and reviewable.
const APPROVED = { "k-actor": { id: "actor-role-binding-contract", title: "Actor RoleBinding Contract", dependencies: ["party-role-context-contract", "authorization-decision-contract"] }, "k-agent-runtime": { id: "agent-tool-execution-contract", title: "Agent Tool Execution Contract", dependencies: ["policy-decision-point-contract", "event-bus-delivery-contract", "worker-job-execution-contract", "search-index-query-contract", "module-registry-manifest-contract"] }, "k-archetype-bayraklari": { id: "archetype-lifecycle-flags-contract", title: "ArcheType Lifecycle Flags Contract", dependencies: ["schema-metadata-engine-contract", "sus-bitemporal"] }, "k-archetype-computation": { id: "archetype-computation-contract", title: "ArcheType Computation Definition Contract", dependencies: ["schema-metadata-engine-contract", "archetype-field-type-contract"] }, "k-archetype-fieldtypes": { id: "archetype-field-type-contract", title: "ArcheType Field Type Contract", dependencies: ["schema-metadata-engine-contract"] }, "k-archetype-mode-profile": { id: "archetype-mode-profile-contract", title: "ArcheType Mode Profile Contract", dependencies: ["capability-registry-contract", "schema-metadata-engine-contract", "surface-projection-contract"] }, "k-authz": { id: "authorization-decision-contract", title: "Authorization Decision Contract", dependencies: ["party-role-context-contract", "k-sso", "k-tenancy"] }, "k-boyut1-ops-panel": { id: "ops-control-plane-contract", title: "Ops Control Plane Contract", dependencies: ["control-plane-taxonomy-contract"] }, "k-boyut2-developer-panel": { id: "developer-control-plane-contract", title: "Developer Control Plane Contract", dependencies: ["control-plane-taxonomy-contract", "schema-metadata-engine-contract", "surface-projection-contract"] }, "k-boyut3-tenant-panel": { id: "tenant-control-plane-contract", title: "Tenant Control Plane Contract", dependencies: ["control-plane-taxonomy-contract", "agent-tool-execution-contract"] }, "k-bus": { id: "event-bus-delivery-contract", title: "Event Bus Delivery Contract", dependencies: ["scale-outbox"] }, "k-calendar-capacity": { id: "calendar-capacity-contract", title: "Calendar Capacity Contract", dependencies: ["computation-runtime-contract"] }, "k-computation": { id: "computation-runtime-contract", title: "Computation Runtime Contract", dependencies: ["archetype-computation-contract"] }, "k-control-planes": { id: "control-plane-taxonomy-contract", title: "Control Plane Taxonomy Contract", dependencies: ["authorization-decision-contract", "policy-decision-point-contract"] }, "k-edge-gateway": { id: "edge-gateway-sync-contract", title: "Edge Gateway Sync Contract", dependencies: ["event-bus-delivery-contract", "worker-job-execution-contract"] }, "k-genealogy-graph": { id: "genealogy-graph-contract", title: "Genealogy Graph Contract", dependencies: ["schema-metadata-engine-contract"] }, "k-jurisdiction": { id: "jurisdiction-resolution-contract", title: "Jurisdiction Resolution Contract", dependencies: ["k-tenancy", "policy-decision-point-contract"] }, "k-kpi-registry": { id: "kpi-formula-registry-contract", title: "KPI Formula Registry Contract", dependencies: ["computation-runtime-contract"] }, "k-mdm": { id: "master-data-golden-record-contract", title: "Master Data Golden Record Contract", dependencies: ["computation-runtime-contract", "policy-decision-point-contract"] }, "k-mod-l": { id: "module-registry-manifest-contract", title: "Module Registry Manifest Contract", dependencies: ["schema-pinning-conformance-contract"] }, "k-mode": { id: "mode-profile-composition-contract", title: "Mode Profile Composition Contract", dependencies: ["archetype-mode-profile-contract", "party-role-context-contract", "policy-decision-point-contract"] }, "k-party": { id: "party-role-context-contract", title: "Party Role Context Contract", dependencies: ["schema-metadata-engine-contract", "k-tenancy"] }, "k-plugin": { id: "plugin-registry-manifest-contract", title: "Plugin Registry Manifest Contract", dependencies: ["module-registry-manifest-contract", "policy-decision-point-contract"] }, "k-policy-pdp": { id: "policy-decision-point-contract", title: "Policy Decision Point Contract", dependencies: ["authorization-decision-contract", "capability-registry-contract", "party-role-context-contract"] }, "k-schema": { id: "schema-metadata-engine-contract", title: "Schema Metadata Engine Contract", dependencies: ["archetype-storage-contract", "schema-pinning-conformance-contract", "adr-0022"] }, "k-search": { id: "search-index-query-contract", title: "Search Index Query Contract", dependencies: ["schema-metadata-engine-contract", "k-tenancy", "event-bus-delivery-contract"] }, "k-sequence": { id: "sequence-allocation-contract", title: "Sequence Allocation Contract", dependencies: ["k-tenancy", "event-bus-delivery-contract"] }, "k-sozlesme": { id: "schema-pinning-conformance-contract", title: "Schema Pinning and Conformance Contract", dependencies: ["kernel-terminology-contract", "sus-conformance", "scale-projections"] }, "k-storage": { id: "digital-asset-storage-contract", title: "Digital Asset Storage Contract", dependencies: ["k-tenancy"] }, "k-surface": { id: "surface-projection-contract", title: "Surface Projection Contract", dependencies: ["schema-metadata-engine-contract", "authorization-decision-contract", "event-bus-delivery-contract"] }, "k-surface-consumer": { id: "consumer-surface-render-contract", title: "Consumer Surface Render Contract", dependencies: ["surface-projection-contract"] }, "k-terminoloji": { id: "kernel-terminology-contract", title: "Kernel Terminology Contract", dependencies: [] }, "k-worker": { id: "worker-job-execution-contract", title: "Worker Job Execution Contract", dependencies: ["event-bus-delivery-contract", "k-tenancy"] } } as const;
const SOURCES = [
  "src/data/generated/nodes/",
  "docs/task-to-code-contract.md",
  "docs/kernel-sdk-app-delivery-sequence.md",
  INVENTORY,
  CLOSURE,
];
const NON_GOALS = [
  "canonical mutation is limited to ledger rows marked applied and their deterministic app registry, kernel registry, index, navigation, meta, public and doc-matrix projections; the current shard applies schema-metadata-engine-contract only",
  "no parent-node, historical inventory, authority, package, queue or runtime mutation",
  "no unapproved or bulk descendant application; D01 cannot close before 33/33",
  "no runtime implementation or readiness claim",
  "no release, deploy, tag, force operation or direct-main push",
];
const TOP_ROLLBACK = {
  owner: "codex",
  trigger:
    "applied row, canonical node, app or kernel registry, deterministic projection, live or immutable hash, or fail-closed NO-GO boundary drifts",
  action:
    "atomically set the schema-metadata-engine-contract ledger row to pending; restore application summary to 33/3/30; remove its canonical node and app/kernel registry entries; restore the 620-node snapshots; regenerate index, navigation, meta, public nodes and doc matrix projections; preserve PRE-D01 hashes and authority; rerun all governance, registry, projection and content gates",
  runtimeDataImpact: "none",
};
// biome-ignore format: exact row contract stays compact for the shard budget.
const ROW_KEYS = ["applicationStatus", "approvalRef", "dependencies", "evidenceContract", "implementationBoundary", "level", "parentId", "parentOwner", "plannedTestCommand", "rollback", "selectedDescendantId", "selectionStatus", "sourceCluster", "title"];
// biome-ignore format: exact fail-closed root stays compact for the shard budget.
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "decision", "decisionId", "gapClosed", "gapId", "generatedAt", "id", "ledger", "measurement", "nonGoals", "provenance", "rollback", "schemaVersion", "sourceRefs", "status"];
// biome-ignore format: exact approved authority split stays compact for the shard budget.
const AUTHORITY = { actionplanWriter: "codex-governance-only", kernelWriter: "claude-only-fail-closed", claudeAuthGate: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max", perInvocation: true, cachedEvidenceAllowed: false }, platformProductWriter: "human-developer-only", gitExecutor: "codex", codeStartAllowed: false, runtimeCodeAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" };

// biome-ignore format: audited test types stay compact for the shard budget.
type NodeRecord = { id: string; wbsCode?: string; title?: string; summary?: string; level: string; parentId?: string | null; owner?: string; artifactKind?: string; dependsOn?: string[]; blocks?: string[]; related?: string[]; phase?: string; status?: string; progress?: number; implementationStatus?: unknown; traceability?: unknown; schedule?: { start?: string | null; end?: string | null; actualStart?: string | null; actualEnd?: string | null; baselineStart?: string | null; baselineEnd?: string | null }; source?: { corpus?: string; originalId?: string; granularity?: string; cluster?: string } };
// biome-ignore format: exact ledger surface stays compact for the shard budget.
type LedgerRow = { parentId: string; parentOwner: string; sourceCluster: string; selectedDescendantId: string; title: string; level: string; approvalRef: string; selectionStatus: string; applicationStatus: string; implementationBoundary: { contract: string; scope: string; expansionAllowed: boolean }; dependencies: string[]; plannedTestCommand: string; evidenceContract: { required: string[]; acceptance: string }; rollback: { owner: string; trigger: string; action: string } };
// biome-ignore format: exact handoff root stays compact for the shard budget.
type Handoff = { schemaVersion: string; id: string; generatedAt: string; decisionId: string; gapId: string; status: string; gapClosed: boolean; decision: Record<string, unknown>; sourceRefs: string[]; provenance: { source: Record<string, unknown>; approval: Record<string, unknown> }; measurement: Record<string, unknown>; applicationSummary: Record<string, unknown>; ledger: LedgerRow[]; authorityBoundary: typeof AUTHORITY; nonGoals: string[]; rollback: typeof TOP_ROLLBACK };

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(read(relative)) as T;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (values: string[]) => [...values].sort();
const includesEvery = (text: string, markers: string[]) =>
  markers.every((marker) => text.includes(marker));
const validateRootApplicationScope = (handoff: Handoff) => {
  const errors: string[] = [];
  const nonGoals = handoff.nonGoals.join(" ").toLowerCase();
  const trigger = handoff.rollback.trigger.toLowerCase();
  const action = handoff.rollback.action.toLowerCase();
  const appliedIds = handoff.ledger
    .filter((row) => row.applicationStatus === "applied")
    .map((row) => row.selectedDescendantId);
  if (
    /no canonical node[^.]*mutation/.test(nonGoals) ||
    /wording(?: only|-only)|limited to [^.]*wording/.test(nonGoals)
  )
    errors.push("non-goals-semantics:stale-approval-only");
  if (/\bno (?:commit|push|pull request|pr)\b/.test(nonGoals))
    errors.push("non-goals-semantics:delivery-step-prohibition");
  if (
    !same(appliedIds, [
      "event-bus-delivery-contract",
      "schema-metadata-engine-contract",
      "schema-pinning-conformance-contract",
      "kernel-terminology-contract",
    ]) ||
    !includesEvery(nonGoals, [
      "ledger rows marked applied",
      "schema-metadata-engine-contract only",
      "app registry",
      "kernel registry",
      "index",
      "navigation",
      "meta",
      "public",
      "doc-matrix",
      "parent-node",
      "historical inventory",
      "authority",
      "package",
      "queue",
      "runtime mutation",
      "unapproved",
      "bulk descendant",
      "33/33",
      "runtime implementation",
      "readiness",
      "release",
      "deploy",
      "tag",
      "force",
      "direct-main push",
    ])
  )
    errors.push("non-goals-semantics:applied-shard-markers");
  if (/leave canonical graph[^.]*unchanged|revert the report/.test(action))
    errors.push("rollback-semantics:stale-approval-only");
  if (!includesEvery(trigger, ["row", "node", "registry", "projection", "hash", "no-go"]))
    errors.push("rollback-semantics:trigger-markers");
  if (
    !includesEvery(action, [
      "atomically",
      "schema-metadata-engine-contract",
      "pending",
      "33/3/30",
      "remove",
      "canonical node",
      "app/kernel registry",
      "620-node",
      "index",
      "navigation",
      "meta",
      "public",
      "doc matrix",
      "pre-d01",
      "authority",
      "rerun",
      "gates",
    ])
  )
    errors.push("rollback-semantics:atomic-restore-markers");
  return errors;
};
const testCommand = (id: string) =>
  `uv run --python 3.12 pytest -q tests/kernel/contracts/test_${id.replaceAll("-", "_")}.py`;
// biome-ignore format: exact derived row contracts stay compact for the shard budget.
const rowEvidence = (id: string) => ({ required: ["implementation-diff", "planned-test-pass", "negative-boundary-proof"], acceptance: `${id} positive behavior and parent-scope exclusion are both proven` });
// biome-ignore format: exact derived rollback stays compact for the shard budget.
const rowRollback = (id: string) => ({ owner: "codex", trigger: `${id} planned test or parent-scope evidence fails`, action: `withdraw ${id} application and restore the pre-application canonical state` });
const CURRENT_SCHEDULE_FIELDS = ["start", "end"] as const;
const BASELINE_SCHEDULE_FIELDS = ["baselineStart", "baselineEnd"] as const;
const ACTUAL_SCHEDULE_FIELDS = ["actualStart", "actualEnd"] as const;
const validateAppliedNodeSchedule = (
  selected: NodeRecord,
  parent: NodeRecord | undefined,
  id: string,
) => {
  const errors: string[] = [];
  const expected = parent?.schedule;
  const actual = selected.schedule;
  if (!expected) return [`applied-node-parent-schedule-missing:${id}`];
  const owns = (field: keyof NonNullable<NodeRecord["schedule"]>) =>
    Boolean(actual && Object.hasOwn(actual, field));
  const differs = (field: keyof NonNullable<NodeRecord["schedule"]>) =>
    actual?.[field] !== expected[field];
  if (!CURRENT_SCHEDULE_FIELDS.every(owns))
    errors.push(`applied-node-current-schedule-missing:${id}`);
  else if (CURRENT_SCHEDULE_FIELDS.some(differs))
    errors.push(`applied-node-current-schedule-drift:${id}`);
  if (!BASELINE_SCHEDULE_FIELDS.every(owns))
    errors.push(`applied-node-baseline-schedule-missing:${id}`);
  else if (BASELINE_SCHEDULE_FIELDS.some(differs))
    errors.push(`applied-node-baseline-schedule-drift:${id}`);
  if (!ACTUAL_SCHEDULE_FIELDS.every(owns))
    errors.push(`applied-node-actual-schedule-missing:${id}`);
  else if (
    ACTUAL_SCHEDULE_FIELDS.some(differs) ||
    actual?.actualStart !== null ||
    actual.actualEnd !== null
  )
    errors.push(`applied-node-actual-schedule-drift:${id}`);
  return errors;
};
const isDag = (rows: LedgerRow[]) => {
  const ids = new Set(rows.map((row) => row.selectedDescendantId));
  const indegree = new Map([...ids].map((id) => [id, 0]));
  const dependents = new Map<string, string[]>();
  // biome-ignore format: compact DAG setup keeps this test shard within its source budget.
  for (const row of rows) for (const dependency of row.dependencies.filter((id) => ids.has(id))) { indegree.set(row.selectedDescendantId, (indegree.get(row.selectedDescendantId) ?? 0) + 1); dependents.set(dependency, [...(dependents.get(dependency) ?? []), row.selectedDescendantId]); }
  const queue = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id);
  let visited = 0;
  while (queue.length) {
    const id = queue.shift();
    if (!id) continue;
    visited += 1;
    for (const dependent of dependents.get(id) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) queue.push(dependent);
    }
  }
  return visited === rows.length;
};
const nodeRecords = fs
  .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
  .filter((file) => file.endsWith(".json"))
  .map((filename) => ({
    filename,
    node: readJson<NodeRecord>(`src/data/generated/nodes/${filename}`),
  }));
const nodes = nodeRecords.map(({ node }) => node);
const universe = (handoff = readJson<Handoff>(HANDOFF), records = nodeRecords) => {
  const result = validateKernelNodeUniverse({ records, handoff });
  const missingIds = result.errors
    .filter((error: string) => error.startsWith("applied-node-missing:"))
    .map((error: string) => error.slice("applied-node-missing:".length));
  if (!missingIds.length) return result;
  const redundant = new Set(
    missingIds.flatMap((id: string) => [
      `applied-node-level-drift:${id}`,
      `applied-node-parent-drift:${id}`,
    ]),
  );
  return {
    ...result,
    errors: result.errors.filter(
      (error: string) => !redundant.has(error) && error !== "live-applied-set-drift",
    ),
  };
};
const appliedFixture = () => {
  const handoff = structuredClone(readJson<Handoff>(HANDOFF));
  const row = handoff.ledger.find(
    (candidate) => candidate.selectedDescendantId === "schema-metadata-engine-contract",
  ) as LedgerRow;
  const parent = nodeRecords.find(({ node }) => node.id === row.parentId)?.node;
  if (!parent?.schedule) throw new Error(`fixture-parent-schedule-missing:${row.parentId}`);
  row.applicationStatus = "applied";
  handoff.applicationSummary = { approved: 33, applied: 4, remaining: 29 };
  const records = structuredClone(nodeRecords).filter(
    ({ node }) => node.id !== row.selectedDescendantId,
  );
  records.push({
    filename: `${row.selectedDescendantId}.json`,
    node: {
      id: row.selectedDescendantId,
      wbsCode: "36.7.1",
      title: row.title,
      summary: row.implementationBoundary.scope,
      level: "archetype",
      parentId: row.parentId,
      owner: row.parentOwner,
      artifactKind: "delivery-task",
      dependsOn: row.dependencies,
      blocks: [],
      related: [],
      phase: "requirements",
      status: "backlog",
      progress: 0,
      schedule: structuredClone(parent.schedule),
      source: {
        corpus: "synthetic",
        originalId: row.selectedDescendantId,
        granularity: row.level,
        cluster: row.sourceCluster,
      },
    },
  });
  return { handoff, records, row };
};

const derive = (records: NodeRecord[]) => {
  const children = new Map<string, NodeRecord[]>();
  for (const node of records)
    if (node.parentId) children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  const boundaries = (parentId: string) => {
    const result: string[] = [];
    const queue = [...(children.get(parentId) ?? [])];
    const visited = new Set([parentId]);
    while (queue.length) {
      const node = queue.shift();
      if (!node || visited.has(node.id)) continue;
      visited.add(node.id);
      if (LEVELS.includes(node.level)) result.push(node.id);
      else queue.push(...(children.get(node.id) ?? []));
    }
    return sorted(result);
  };
  const rows = records
    .filter((node) => node.id.startsWith("k-") && node.level === "module")
    .map((node) => ({
      parentId: node.id,
      directChildIds: sorted((children.get(node.id) ?? []).map((child) => child.id)),
      observedCodeBearingBoundaryIds: boundaries(node.id),
    }))
    .sort((a, b) => a.parentId.localeCompare(b.parentId));
  return {
    rows,
    direct: rows.filter((row) => row.directChildIds.length),
    covered: rows.filter((row) => row.observedCodeBearingBoundaryIds.length),
    pending: rows.filter((row) => !row.observedCodeBearingBoundaryIds.length),
  };
};

// biome-ignore format: audited validator stays compact for the shard budget.
const validate = (handoff: Handoff, records = nodes) => {
  const errors: string[] = [];
  if (!Array.isArray(handoff.ledger)) return ["ledger:missing"];
  const live = derive(records);
  const nodeById = new Map(records.map((node) => [node.id, node]));
  const closure = readJson<{
    status: string;
    approval: { gateId: string; authority: string; normalizedSelectionSha256: string };
    applications: Array<{ id: string; approvedPendingApplication?: number; applicationStatus: string }>;
  }>(CLOSURE);
  const inventory = readJson<{
    structuralGaps: Array<{ id: string; kind: string; count: number; nodeIds: string[] }>;
  }>(INVENTORY);
  const expectedParents = Object.keys(APPROVED);
  const rowParents = handoff.ledger.map((row) => row.parentId);
  const selectedIds = handoff.ledger.map((row) => row.selectedDescendantId);
  const historical = derive(records.filter((node) => !selectedIds.includes(node.id)));
  const appliedRows = handoff.ledger.filter((row) => row.applicationStatus === "applied");
  const pendingRows = handoff.ledger.filter((row) => row.applicationStatus === "pending");
  const gap = inventory.structuralGaps.find((item) => item.id === "KGA-G01");
  const closureD01 = closure.applications.find((item) => item.id === "KGA-D01");
  const measurement = {
    moduleParentCount: 38,
    directChildPresentCount: 6,
    parentsWithCodeBearingDescendantCount: 5,
    parentsMissingCodeBearingDescendantCount: 33,
    codeBearingLevels: LEVELS,
    traversal: "recursive-nearest-code-bearing-boundary-per-branch",
    coveredParentIds: historical.covered.map((row) => row.parentId),
    preD01Baseline: {
      expectedNodeCount: PRE_D01_EXPECTED_NODE_COUNT,
      nodeSetSha256: PRE_D01_NODE_SET_SHA256,
      protectedProjectionSha256: PRE_D01_PROTECTED_PROJECTION_SHA256,
    },
  };
  const provenance = {
    source: {
      liveNodeRoot: SOURCES[0],
      inventoryRef: INVENTORY,
      authorityClosureReport: CLOSURE,
      sourceCommit: PRE_D01_SOURCE_COMMIT,
    },
    approval: {
      gateId: "GATE-01",
      authority: "user-admin",
      normalizedSelectionSha256: APPROVAL_SHA,
      approvedMappingSha256: D01_APPROVED_MAPPING_SHA256,
      approvedIdSetSha256: D01_APPROVED_ID_SET_SHA256,
    },
  };

  if (!same(handoff.sourceRefs, SOURCES)) errors.push("sources");
  if (!same(sorted(Object.keys(handoff)), sorted(ROOT_KEYS))) errors.push("root-keys");
  if (handoff.schemaVersion !== "1.0.0" || handoff.id !== "kernel-code-bearing-descendant-handoff-2026-07-15" || handoff.generatedAt !== "2026-07-15") errors.push("root-identity");
  if (!same(handoff.provenance, provenance)) errors.push("provenance");
  if (!same(handoff.measurement, measurement)) errors.push("measurement");
  if (!same(handoff.applicationSummary, { approved: 33, applied: appliedRows.length, remaining: pendingRows.length })) errors.push("counts");
  if (!same(handoff.nonGoals, NON_GOALS)) errors.push("non-goals");
  if (!same(handoff.rollback, TOP_ROLLBACK)) errors.push("rollback");
  errors.push(...validateRootApplicationScope(handoff));
  if (handoff.decisionId !== "KGA-D01" || handoff.gapId !== "KGA-G01" || handoff.status !== "approved-application-pending" || handoff.gapClosed) errors.push("identity-status");
  if (!same(handoff.decision, { topic: "code-bearing descendants for 33 module parents", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "33-approved-descendant-ledger" })) errors.push("decision");
  if (!same(rowParents, expectedParents) || new Set(rowParents).size !== 33 || new Set(selectedIds).size !== 33) errors.push("ledger-identity");
  if (!same(gap, { ...gap, kind: "missing-code-bearing-descendant", count: 33, nodeIds: expectedParents })) errors.push("inventory");
  if (closure.status !== "approved-application-pending" || closure.approval.gateId !== "GATE-01" || closure.approval.authority !== "user-admin" || closure.approval.normalizedSelectionSha256 !== APPROVAL_SHA || closureD01?.approvedPendingApplication !== 33 || closureD01.applicationStatus !== "pending") errors.push("approval-source");
  if (records.length !== PRE_D01_EXPECTED_NODE_COUNT + appliedRows.length || live.rows.length !== 38 || live.covered.length !== historical.covered.length + appliedRows.length || live.pending.length !== historical.pending.length - appliedRows.length || !same(sorted(live.pending.map((row) => row.parentId)), sorted(pendingRows.map((row) => row.parentId)))) errors.push("live-counts");

  for (const row of handoff.ledger) {
    const parent = nodeById.get(row.parentId);
    const expected = APPROVED[row.parentId as keyof typeof APPROVED];
    if (!same(sorted(Object.keys(row)), sorted(ROW_KEYS))) errors.push(`row-fields:${row.parentId}`);
    if (!expected) {
      errors.push(`selection:${row.parentId}`);
      continue;
    }
    const expectedId = expected.id;
    const selected = nodeById.get(expectedId);
    if (!parent || parent.level !== "module" || row.parentOwner !== parent.owner || row.sourceCluster !== parent.source?.cluster) errors.push(`parent-source:${row.parentId}`);
    if (row.selectedDescendantId !== expectedId || row.title !== expected.title || !same(row.dependencies, expected.dependencies)) errors.push(`selection:${row.parentId}`);
    if (row.level !== "archetype" || row.approvalRef !== "GATE-01" || row.selectionStatus !== "approved-not-applied" || !["pending", "applied"].includes(row.applicationStatus)) errors.push(`state:${row.parentId}`);
    if ((row.applicationStatus === "pending" && selected) || (row.applicationStatus === "applied" && (!selected || selected.level !== "archetype" || selected.parentId !== row.parentId))) errors.push(`application-live-state:${row.parentId}`);
    if (row.applicationStatus === "applied") {
      if (!selected) errors.push(`applied-node-missing:${row.selectedDescendantId}`);
      else {
        if (selected.title !== row.title || selected.summary !== row.implementationBoundary.scope || selected.owner !== row.parentOwner || selected.artifactKind !== "delivery-task") errors.push(`applied-node-row-parity:${row.selectedDescendantId}`);
        if (row.selectedDescendantId === "schema-metadata-engine-contract" && (selected.wbsCode !== "36.7.1" || records.some((node) => node.id !== selected.id && node.wbsCode === selected.wbsCode))) errors.push(`applied-node-wbs-drift:${row.selectedDescendantId}`);
        if (!same(selected.dependsOn, row.dependencies) || !same(selected.blocks, []) || !same(selected.related, [])) errors.push(`applied-node-dependency-drift:${row.selectedDescendantId}`);
        if (!same(selected.source, { corpus: "synthetic", originalId: row.selectedDescendantId, granularity: row.level, cluster: row.sourceCluster })) errors.push(`applied-node-source-drift:${row.selectedDescendantId}`);
        if (row.selectedDescendantId === "schema-metadata-engine-contract" && (selected.phase !== "requirements" || selected.status !== "backlog" || selected.progress !== 0 || selected.implementationStatus != null || selected.traceability != null)) errors.push(`applied-node-state-drift:${row.selectedDescendantId}`);
        errors.push(...validateAppliedNodeSchedule(selected, parent, row.selectedDescendantId));
      }
    }
    if (row.implementationBoundary.contract !== expectedId || row.implementationBoundary.expansionAllowed || row.implementationBoundary.scope.trim().length < 40) errors.push(`boundary:${row.parentId}`);
    if (row.plannedTestCommand !== testCommand(expectedId) || !same(row.evidenceContract, rowEvidence(expectedId)) || !same(row.rollback, rowRollback(expectedId))) errors.push(`handoff:${row.parentId}`);
    if (JSON.stringify(row).toLowerCase().includes("null") || JSON.stringify(row).toLowerCase().includes("defer")) errors.push(`unresolved:${row.parentId}`);
    for (const dependency of row.dependencies)
      if (!selectedIds.includes(dependency) && !nodeById.has(dependency))
        errors.push(`external-dependency:${row.parentId}:${dependency}`);
  }
  if (!isDag(handoff.ledger)) errors.push("descendant-dependency-cycle");

  const boundary = handoff.authorityBoundary;
  if (!same(boundary, AUTHORITY)) errors.push("global-boundary");
  return errors;
};

// biome-ignore format: adversarial contract matrix stays compact for the shard budget.
describe("KGA-D01 approved code-bearing descendant ledger", () => {
  it("binds 33 exact GATE-01 selections to the current live application state", () => {
    const handoff = readJson<Handoff>(HANDOFF);
    expect(universe(handoff, nodeRecords).errors).toEqual([]);
    expect(validate(handoff)).toEqual([]);
    for (const [appliedId, parentId] of [
      ["event-bus-delivery-contract", "k-bus"],
      ["schema-metadata-engine-contract", "k-schema"],
      ["schema-pinning-conformance-contract", "k-sozlesme"],
      ["kernel-terminology-contract", "k-terminoloji"],
    ]) {
      const applied = nodes.find((node) => node.id === appliedId);
      const parent = nodes.find((node) => node.id === parentId);
      expect(applied?.schedule).toEqual(parent?.schedule);
    }
    expect([PRE_D01_SOURCE_COMMIT, PRE_D01_EXPECTED_NODE_COUNT, PRE_D01_NODE_SET_SHA256, PRE_D01_PROTECTED_PROJECTION_SHA256, D01_APPROVED_MAPPING_SHA256, D01_APPROVED_ID_SET_SHA256]).toEqual(["09f0a1fb52d4141092add22a54df1a6204c155a4", 617, "c87a7e67763454dec4fde4243e01e2a108a64a3b6c5cfd33b86e28dbc3daf6be", "598e39b8600b5ee78fa763e42cd7b80f3626e47c5d91860b338ee474c9ddd136", "2e5ce4b1c96446b6ca1f0e42cdc5225c4f36ac9551056fec31147b1febc332b0", "dd797dbf38594e77c8171a776d0eef1b681e0dfb7302b22b17e62526f950431d"]);
  });

  it("accepts exactly four correctly applied approved descendants at total 621", () => {
    const fixture = appliedFixture();
    const currentNodes = fixture.records.map(({ node }) => node);
    expect(universe(fixture.handoff, nodeRecords).errors).toEqual([]);
    expect(universe(fixture.handoff, fixture.records).errors).toEqual([]);
    expect(universe(fixture.handoff, fixture.records)).toMatchObject({ appliedIds: ["event-bus-delivery-contract", "kernel-terminology-contract", fixture.row.selectedDescendantId, "schema-pinning-conformance-contract"], baselineRecordCount: 617 });
    expect(validate(fixture.handoff, currentNodes)).toEqual([]);
    const currentLive = derive(currentNodes);
    expect([currentNodes.length, currentLive.covered.length, currentLive.pending.length]).toEqual([
      621, 9, 29,
    ]);
    expect(fixture.handoff).toMatchObject({
      applicationSummary: { approved: 33, applied: 4, remaining: 29 },
      status: "approved-application-pending",
      gapClosed: false,
      authorityBoundary: { codeStartAllowed: false, runtimeCodeAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" },
    });

    const pendingPresent = structuredClone(fixture.handoff);
    const pendingRow = pendingPresent.ledger.find((row) => row.selectedDescendantId === fixture.row.selectedDescendantId) as LedgerRow;
    pendingRow.applicationStatus = "pending";
    pendingPresent.applicationSummary = { approved: 33, applied: 3, remaining: 30 };
    expect(validate(pendingPresent, currentNodes)).toContain(`application-live-state:${fixture.row.parentId}`);
    expect(validate(fixture.handoff, nodes.filter((node) => node.id !== fixture.row.selectedDescendantId))).toContain(`application-live-state:${fixture.row.parentId}`);
  });

  it("rejects node-universe and application drift with named evidence", () => {
    const current = readJson<Handoff>(HANDOFF);
    const expectError = (handoff: Handoff, records: typeof nodeRecords, error: string) =>
      expect(universe(handoff, records).errors).toContain(error);
    const extra = structuredClone(nodeRecords);
    extra.push({ filename: "unknown-extra.json", node: { id: "unknown-extra", level: "archetype" } });
    expectError(current, extra, "unapproved-extra:baseline-count=618");
    expectError(current, structuredClone(nodeRecords).slice(1), "baseline-removal:baseline-count=616");
    const renamed = structuredClone(nodeRecords); renamed[0].node.id = "renamed-baseline"; renamed[0].filename = "renamed-baseline.json";
    expectError(current, renamed, "baseline-id-hash-drift");
    const pending = appliedFixture(); pending.row.applicationStatus = "pending"; pending.handoff.applicationSummary = { approved: 33, applied: 3, remaining: 30 };
    expectError(pending.handoff, pending.records, `pending-node-present:${pending.row.selectedDescendantId}`);
    const missing = appliedFixture();
    const missingErrors = universe(
      missing.handoff,
      nodeRecords.filter(({ node }) => node.id !== missing.row.selectedDescendantId),
    ).errors;
    expect(missingErrors).toEqual([
      `applied-node-missing:${missing.row.selectedDescendantId}`,
    ]);
    for (const [field, value, error] of [["parentId", "wrong-parent", `applied-node-parent-drift:${missing.row.selectedDescendantId}`], ["level", "feature", `applied-node-level-drift:${missing.row.selectedDescendantId}`]] as const) {
      const fixture = appliedFixture(); Object.assign(fixture.records.at(-1)?.node ?? {}, { [field]: value });
      expectError(fixture.handoff, fixture.records, error);
    }
    for (const [field, value] of [["title", "Drift"], ["owner", "drift-owner"], ["artifactKind", "governance"], ["summary", "Drift"]] as const) {
      const fixture = appliedFixture(); Object.assign(fixture.records.at(-1)?.node ?? {}, { [field]: value });
      expect(validate(fixture.handoff, fixture.records.map(({ node }) => node))).toContain(`applied-node-row-parity:${fixture.row.selectedDescendantId}`);
    }
    for (const [field, value, error] of [["wbsCode", "36.7.2", "applied-node-wbs-drift"], ["dependsOn", ["drift"], "applied-node-dependency-drift"], ["source", { corpus: "synthetic", originalId: "drift", granularity: "archetype", cluster: "layer0" }, "applied-node-source-drift"], ["phase", "development", "applied-node-state-drift"]] as const) {
      const fixture = appliedFixture(); Object.assign(fixture.records.at(-1)?.node ?? {}, { [field]: value });
      expect(validate(fixture.handoff, fixture.records.map(({ node }) => node))).toContain(`${error}:${fixture.row.selectedDescendantId}`);
    }
    const scheduleCases: Array<[string, (schedule: NonNullable<NodeRecord["schedule"]>) => void]> = [
      ["applied-node-current-schedule-missing", (schedule) => void Reflect.deleteProperty(schedule, "start")],
      ["applied-node-current-schedule-drift", (schedule) => void Object.assign(schedule, { end: "2099-01-01" })],
      ["applied-node-baseline-schedule-missing", (schedule) => void Reflect.deleteProperty(schedule, "baselineStart")],
      ["applied-node-baseline-schedule-drift", (schedule) => void Object.assign(schedule, { baselineEnd: "2099-01-01" })],
      ["applied-node-actual-schedule-missing", (schedule) => void Reflect.deleteProperty(schedule, "actualStart")],
      ["applied-node-actual-schedule-drift", (schedule) => void Object.assign(schedule, { actualEnd: "2099-01-01" })],
    ];
    for (const [error, mutate] of scheduleCases) {
      const fixture = appliedFixture();
      mutate(fixture.records.at(-1)?.node.schedule as NonNullable<NodeRecord["schedule"]>);
      expect(validate(fixture.handoff, fixture.records.map(({ node }) => node))).toContain(`${error}:${fixture.row.selectedDescendantId}`);
    }
    const duplicate = structuredClone(current); duplicate.ledger[1].selectedDescendantId = duplicate.ledger[0].selectedDescendantId; expectError(duplicate, nodeRecords, `duplicate-selected-id:${duplicate.ledger[0].selectedDescendantId}`);
    const mapping = structuredClone(current); mapping.ledger[0].parentId = "drift"; expectError(mapping, nodeRecords, "approved-mapping-digest-drift");
    const idSet = structuredClone(current); idSet.ledger[0].selectedDescendantId = "drift"; expectError(idSet, nodeRecords, "approved-id-set-digest-drift");
    const duplicateNode = structuredClone(nodeRecords); duplicateNode.push({ filename: "duplicate.json", node: duplicateNode[0].node }); expectError(current, duplicateNode, `duplicate-canonical-id:${duplicateNode[0].node.id}`);
    const filename = structuredClone(nodeRecords); filename[0].filename = "wrong.json"; expectError(current, filename, `filename-id-drift:wrong.json:${filename[0].node.id}`);
    const unknownStatus = structuredClone(current); unknownStatus.ledger[0].applicationStatus = "unknown"; expectError(unknownStatus, nodeRecords, `unknown-application-status:${unknownStatus.ledger[0].parentId}:unknown`);
    const evidenceCases: Array<[string, string, string]> = [["source", "sourceCommit", "baseline-source-commit-drift"], ["measurement", "expectedNodeCount", "baseline-count-evidence-drift"], ["measurement", "nodeSetSha256", "baseline-id-evidence-drift"], ["measurement", "protectedProjectionSha256", "baseline-projection-evidence-drift"], ["approval", "approvedMappingSha256", "approved-mapping-evidence-drift"], ["approval", "approvedIdSetSha256", "approved-id-set-evidence-drift"]];
    for (const [section, field, error] of evidenceCases) {
      const handoff = structuredClone(current);
      const target = section === "measurement" ? (handoff.measurement.preD01Baseline as Record<string, unknown>) : handoff.provenance[section as "source" | "approval"];
      target[field] = "drift";
      expectError(handoff, nodeRecords, error);
    }
    const protectedDrift = structuredClone(nodeRecords); protectedDrift[0].node.owner = "drift";
    expectError(current, protectedDrift, "baseline-protected-projection-drift");
    for (const field of ["dependsOn", "blocks", "related"] as const) { const invalid = structuredClone(nodeRecords); invalid[0].node[field] = [1] as unknown as string[]; expectError(current, invalid, `invalid-protected-relation:${invalid[0].node.id}:${field}`); }
  });

  it("rejects mapping, ownership, provenance, unresolved-field and runtime-boundary drift", () => {
    const handoff = readJson<Handoff>(HANDOFF);
    if (!Array.isArray(handoff.ledger)) return;
    // biome-ignore format: existing adversarial surface stays compact for the shard budget.
    const mutations: Array<(clone: Handoff) => void> = [
      (clone) => void clone.ledger.pop(), (clone) => void Object.assign(clone.ledger[1], { parentId: clone.ledger[0].parentId }), (clone) => void Object.assign(clone.ledger[0], { selectedDescendantId: clone.ledger[1].selectedDescendantId }), (clone) => void Object.assign(clone.ledger[0], { parentOwner: "invented-owner" }), (clone) => void Object.assign(clone.ledger[0], { sourceCluster: "expanded-scope" }),
      (clone) => void Object.assign(clone.ledger[0], { title: "Invented Contract" }), (clone) => void Object.assign(clone.ledger[0], { level: "feature", approvalRef: "GATE-00", selectionStatus: "candidate", applicationStatus: "applied" }), (clone) => void Object.assign(clone.ledger[0].implementationBoundary, { contract: "invented", expansionAllowed: true }), (clone) => void Object.assign(clone.ledger[0].implementationBoundary, { scope: "defer" }), (clone) => void clone.ledger[0].dependencies.push("invented-dependency"),
      (clone) => void Object.assign(clone.ledger[0], { plannedTestCommand: "pytest", evidenceContract: null }), (clone) => void Object.assign(clone.ledger[0].rollback, { owner: "worker", trigger: "defer" }), (clone) => void Object.assign(clone.applicationSummary, { approved: 32, applied: 1 }), (clone) => void Object.assign(clone.provenance, { approval: { gateId: "GATE-01", authority: "user-admin", normalizedSelectionSha256: "stale" } }), (clone) => void Object.assign(clone.authorityBoundary, { codeStartAllowed: true, runtimeCodeAllowed: true, releaseAllowed: true, deployAllowed: true }),
      (clone) => void Object.assign(clone.authorityBoundary, { actionplanWriter: "claude", kernelWriter: "human", platformProductWriter: "claude", gitExecutor: "worker" }), (clone) => void Object.assign(clone.authorityBoundary, { claudeAuthGate: { loggedIn: false, authMethod: "api-key", apiProvider: "fallback", subscriptionType: "api", perInvocation: false, cachedEvidenceAllowed: true } }), (clone) => void Object.assign(clone.authorityBoundary, { runtimeExecutor: "ambiguous" }), (clone) => void clone.ledger.find((row) => row.parentId === "k-party")?.dependencies.push("actor-role-binding-contract"), (clone) => void Object.assign(clone, { runtimeReady: true }),
      (clone) => void Object.assign(clone, { codeStartAllowed: true }), (clone) => void Object.assign(clone, { kernelReady: true }), (clone) => void Object.assign(clone, { schemaVersion: "2.0.0" }), (clone) => void Reflect.deleteProperty(clone, "id"), (clone) => void Reflect.deleteProperty(clone, "generatedAt"), (clone) => void Object.assign(clone, { status: "applied", gapClosed: true }),
    ];
    for (const mutate of mutations) {
      const clone = structuredClone(handoff);
      mutate(clone);
      expect(validate(clone).length).toBeGreaterThan(0);
    }
    const missingExternal = structuredClone(handoff);
    missingExternal.ledger[0].dependencies.push("missing-canonical-contract");
    expect(validate(missingExternal)).toContain(
      "external-dependency:k-actor:missing-canonical-contract",
    );
    expect(validate(handoff, [...nodes, { id: APPROVED["k-authz"].id, level: "archetype", parentId: "k-authz" }]).length).toBeGreaterThan(0);
    const staleApprovalOnly = structuredClone(handoff);
    staleApprovalOnly.nonGoals = [
      "no canonical node, parent, projection, inventory, registry, authority, package or queue mutation",
      "decision pack change is limited to D01 approval-aware wording",
      "no runtime implementation or readiness claim",
      "no D01 closure",
      "no commit, push or pull request",
    ];
    staleApprovalOnly.rollback = {
      owner: "codex",
      trigger:
        "GATE-01 provenance, exact mapping, live 38/5/33 measurement or fail-closed boundary drifts",
      action:
        "revert the report and associated tests together; leave canonical graph and runtime unchanged",
      runtimeDataImpact: "none",
    };
    expect(validateRootApplicationScope(staleApprovalOnly)).toEqual(
      expect.arrayContaining([
        "non-goals-semantics:stale-approval-only",
        "non-goals-semantics:delivery-step-prohibition",
        "rollback-semantics:stale-approval-only",
      ]),
    );
  });

  it("keeps registry, pack and named governance gate traceability", () => {
    const registry = readJson<{ decisions: Array<Record<string, unknown>> }>(REGISTRY);
    const d01 = registry.decisions.find((item) => item.id === "KGA-D01");
    const gate = readJson<{ scripts: Record<string, string> }>("package.json").scripts["qa:kernel-governance"];
    expect(d01?.handoffRef).toBe(HANDOFF);
    expect(read("docs/kernel-governance-decision-pack-2026-07-15.md")).toContain(HANDOFF);
    expect(gate).toContain("tests/kernelCodeBearingDescendantHandoff.test.ts");
  });
});
