import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

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
// biome-ignore format: exact non-goals stay compact for the shard budget.
const NON_GOALS = ["no canonical node, parent, projection, inventory, registry, authority, package or queue mutation", "decision pack change is limited to D01 approval-aware wording", "no runtime implementation or readiness claim", "no D01 closure", "no commit, push or pull request"];
// biome-ignore format: exact rollback stays compact for the shard budget.
const TOP_ROLLBACK = { owner: "codex", trigger: "GATE-01 provenance, exact mapping, live 38/5/33 measurement or fail-closed boundary drifts", action: "revert the report, decision-pack D01 approval-aware wording, and both associated tests together; leave canonical graph, governance records, queue and runtime unchanged", runtimeDataImpact: "none" };
// biome-ignore format: exact row contract stays compact for the shard budget.
const ROW_KEYS = ["applicationStatus", "approvalRef", "dependencies", "evidenceContract", "implementationBoundary", "level", "parentId", "parentOwner", "plannedTestCommand", "rollback", "selectedDescendantId", "selectionStatus", "sourceCluster", "title"];
// biome-ignore format: exact fail-closed root stays compact for the shard budget.
const ROOT_KEYS = ["applicationSummary", "authorityBoundary", "decision", "decisionId", "gapClosed", "gapId", "generatedAt", "id", "ledger", "measurement", "nonGoals", "provenance", "rollback", "schemaVersion", "sourceRefs", "status"];
// biome-ignore format: exact approved authority split stays compact for the shard budget.
const AUTHORITY = { actionplanWriter: "codex-governance-only", kernelWriter: "claude-only-fail-closed", claudeAuthGate: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max", perInvocation: true, cachedEvidenceAllowed: false }, platformProductWriter: "human-developer-only", gitExecutor: "codex", codeStartAllowed: false, runtimeCodeAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" };

// biome-ignore format: audited live-node projection stays compact for the shard budget.
type NodeRecord = { id: string; level: string; parentId?: string; owner?: string; source?: { cluster?: string } };
type LedgerRow = {
  parentId: string;
  parentOwner: string;
  sourceCluster: string;
  selectedDescendantId: string;
  title: string;
  level: string;
  approvalRef: string;
  selectionStatus: string;
  applicationStatus: string;
  implementationBoundary: { contract: string; scope: string; expansionAllowed: boolean };
  dependencies: string[];
  plannedTestCommand: string;
  evidenceContract: { required: string[]; acceptance: string };
  rollback: { owner: string; trigger: string; action: string };
};
type Handoff = {
  schemaVersion: string;
  id: string;
  generatedAt: string;
  decisionId: string;
  gapId: string;
  status: string;
  gapClosed: boolean;
  decision: Record<string, unknown>;
  sourceRefs: string[];
  provenance: Record<string, unknown>;
  measurement: Record<string, unknown>;
  applicationSummary: Record<string, unknown>;
  ledger: LedgerRow[];
  authorityBoundary: {
    actionplanWriter: string;
    kernelWriter: string;
    claudeAuthGate: {
      loggedIn: boolean;
      authMethod: string;
      apiProvider: string;
      subscriptionType: string;
      perInvocation: boolean;
      cachedEvidenceAllowed: boolean;
    };
    platformProductWriter: string;
    gitExecutor: string;
    codeStartAllowed: boolean;
    runtimeCodeAllowed: boolean;
    releaseAllowed: boolean;
    deployAllowed: boolean;
    verdict: string;
  };
  nonGoals: string[];
  rollback: typeof TOP_ROLLBACK;
};

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(read(relative)) as T;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sorted = (values: string[]) => [...values].sort();
const testCommand = (id: string) =>
  `uv run --python 3.12 pytest -q tests/kernel/contracts/test_${id.replaceAll("-", "_")}.py`;
const rowEvidence = (id: string) => ({
  required: ["implementation-diff", "planned-test-pass", "negative-boundary-proof"],
  acceptance: `${id} positive behavior and parent-scope exclusion are both proven`,
});
const rowRollback = (id: string) => ({
  owner: "codex",
  trigger: `${id} planned test or parent-scope evidence fails`,
  action: `withdraw ${id} application and restore the pre-application canonical state`,
});
const isDag = (rows: LedgerRow[]) => {
  const ids = new Set(rows.map((row) => row.selectedDescendantId));
  const indegree = new Map([...ids].map((id) => [id, 0]));
  const dependents = new Map<string, string[]>();
  for (const row of rows) {
    for (const dependency of row.dependencies.filter((id) => ids.has(id))) {
      indegree.set(row.selectedDescendantId, (indegree.get(row.selectedDescendantId) ?? 0) + 1);
      dependents.set(dependency, [...(dependents.get(dependency) ?? []), row.selectedDescendantId]);
    }
  }
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
const nodes = fs
  .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => readJson<NodeRecord>(`src/data/generated/nodes/${file}`));

const derive = (records: NodeRecord[]) => {
  const children = new Map<string, NodeRecord[]>();
  for (const node of records) {
    if (!node.parentId) continue;
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  }
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
  const gap = inventory.structuralGaps.find((item) => item.id === "KGA-G01");
  const closureD01 = closure.applications.find((item) => item.id === "KGA-D01");
  const measurement = {
    moduleParentCount: 38,
    directChildPresentCount: 6,
    parentsWithCodeBearingDescendantCount: 5,
    parentsMissingCodeBearingDescendantCount: 33,
    codeBearingLevels: LEVELS,
    traversal: "recursive-nearest-code-bearing-boundary-per-branch",
    coveredParentIds: live.covered.map((row) => row.parentId),
  };
  const provenance = {
    source: { liveNodeRoot: SOURCES[0], inventoryRef: INVENTORY, authorityClosureReport: CLOSURE },
    approval: { gateId: "GATE-01", authority: "user-admin", normalizedSelectionSha256: APPROVAL_SHA },
  };

  if (!same(handoff.sourceRefs, SOURCES)) errors.push("sources");
  if (!same(sorted(Object.keys(handoff)), sorted(ROOT_KEYS))) errors.push("root-keys");
  if (handoff.schemaVersion !== "1.0.0" || handoff.id !== "kernel-code-bearing-descendant-handoff-2026-07-15" || handoff.generatedAt !== "2026-07-15") errors.push("root-identity");
  if (!same(handoff.provenance, provenance)) errors.push("provenance");
  if (!same(handoff.measurement, measurement)) errors.push("measurement");
  if (!same(handoff.applicationSummary, { approved: 33, applied: 0, remaining: 33 })) errors.push("counts");
  if (!same(handoff.nonGoals, NON_GOALS)) errors.push("non-goals");
  if (!same(handoff.rollback, TOP_ROLLBACK)) errors.push("rollback");
  if (handoff.decisionId !== "KGA-D01" || handoff.gapId !== "KGA-G01" || handoff.status !== "approved-application-pending" || handoff.gapClosed) errors.push("identity-status");
  if (!same(handoff.decision, { topic: "code-bearing descendants for 33 module parents", status: "approved-not-applied", decisionOwner: "user-admin", coordinator: "project_manager", finalAuthority: "codex", selectedOption: "33-approved-descendant-ledger" })) errors.push("decision");
  if (!same(rowParents, expectedParents) || !same(rowParents, live.pending.map((row) => row.parentId)) || new Set(rowParents).size !== 33 || new Set(selectedIds).size !== 33) errors.push("ledger-identity");
  if (!same(gap, { ...gap, kind: "missing-code-bearing-descendant", count: 33, nodeIds: expectedParents })) errors.push("inventory");
  if (closure.status !== "approved-application-pending" || closure.approval.gateId !== "GATE-01" || closure.approval.authority !== "user-admin" || closure.approval.normalizedSelectionSha256 !== APPROVAL_SHA || closureD01?.approvedPendingApplication !== 33 || closureD01.applicationStatus !== "pending") errors.push("approval-source");
  if (live.rows.length !== 38 || live.direct.length !== 6 || live.covered.length !== 5 || live.pending.length !== 33) errors.push("live-counts");

  for (const row of handoff.ledger) {
    const parent = nodeById.get(row.parentId);
    const expected = APPROVED[row.parentId as keyof typeof APPROVED];
    if (!same(sorted(Object.keys(row)), sorted(ROW_KEYS))) errors.push(`row-fields:${row.parentId}`);
    if (!expected) {
      errors.push(`selection:${row.parentId}`);
      continue;
    }
    const expectedId = expected.id;
    if (!parent || parent.level !== "module" || row.parentOwner !== parent.owner || row.sourceCluster !== parent.source?.cluster) errors.push(`parent-source:${row.parentId}`);
    if (row.selectedDescendantId !== expectedId || row.title !== expected.title || !same(row.dependencies, expected.dependencies) || records.some((node) => node.id === row.selectedDescendantId)) errors.push(`selection:${row.parentId}`);
    if (row.level !== "archetype" || row.approvalRef !== "GATE-01" || row.selectionStatus !== "approved-not-applied" || row.applicationStatus !== "pending") errors.push(`state:${row.parentId}`);
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
  it("binds 33 exact GATE-01 selections to canonical parent scope without applying them", () => {
    expect(validate(readJson<Handoff>(HANDOFF))).toEqual([]);
  });

  it("rejects mapping, ownership, provenance, unresolved-field and runtime-boundary drift", () => {
    const handoff = readJson<Handoff>(HANDOFF);
    if (!Array.isArray(handoff.ledger)) return;
    const mutations: Array<(clone: Handoff) => void> = [
      (clone) => void clone.ledger.pop(),
      (clone) => void Object.assign(clone.ledger[1], { parentId: clone.ledger[0].parentId }),
      (clone) => void Object.assign(clone.ledger[0], { selectedDescendantId: clone.ledger[1].selectedDescendantId }),
      (clone) => void Object.assign(clone.ledger[0], { parentOwner: "invented-owner" }),
      (clone) => void Object.assign(clone.ledger[0], { sourceCluster: "expanded-scope" }),
      (clone) => void Object.assign(clone.ledger[0], { title: "Invented Contract" }),
      (clone) => void Object.assign(clone.ledger[0], { level: "feature", approvalRef: "GATE-00", selectionStatus: "candidate", applicationStatus: "applied" }),
      (clone) => void Object.assign(clone.ledger[0].implementationBoundary, { contract: "invented", expansionAllowed: true }),
      (clone) => void Object.assign(clone.ledger[0].implementationBoundary, { scope: "defer" }),
      (clone) => void clone.ledger[0].dependencies.push("invented-dependency"),
      (clone) => void Object.assign(clone.ledger[0], { plannedTestCommand: "pytest", evidenceContract: null }),
      (clone) => void Object.assign(clone.ledger[0].rollback, { owner: "worker", trigger: "defer" }),
      (clone) => void Object.assign(clone.applicationSummary, { approved: 32, applied: 1 }),
      (clone) => void Object.assign(clone.provenance, { approval: { gateId: "GATE-01", authority: "user-admin", normalizedSelectionSha256: "stale" } }),
      (clone) => void Object.assign(clone.authorityBoundary, { codeStartAllowed: true, runtimeCodeAllowed: true, releaseAllowed: true, deployAllowed: true }),
      (clone) => void Object.assign(clone.authorityBoundary, { actionplanWriter: "claude", kernelWriter: "human", platformProductWriter: "claude", gitExecutor: "worker" }),
      (clone) => void Object.assign(clone.authorityBoundary, { claudeAuthGate: { loggedIn: false, authMethod: "api-key", apiProvider: "fallback", subscriptionType: "api", perInvocation: false, cachedEvidenceAllowed: true } }),
      (clone) => void Object.assign(clone.authorityBoundary, { runtimeExecutor: "ambiguous" }),
      (clone) => void clone.ledger.find((row) => row.parentId === "k-party")?.dependencies.push("actor-role-binding-contract"),
      (clone) => void Object.assign(clone, { runtimeReady: true }),
      (clone) => void Object.assign(clone, { codeStartAllowed: true }),
      (clone) => void Object.assign(clone, { kernelReady: true }),
      (clone) => void Object.assign(clone, { schemaVersion: "2.0.0" }),
      (clone) => void Reflect.deleteProperty(clone, "id"),
      (clone) => void Reflect.deleteProperty(clone, "generatedAt"),
      (clone) => void Object.assign(clone, { status: "applied", gapClosed: true }),
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
