import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- the JavaScript governance helpers intentionally have no declaration file.
// biome-ignore format: the complete D01 helper surface stays visible in one audited import.
import { PRE_D01_NODE_SET_SHA256, appliedD01AppDecision, appliedD01KernelDecision, expectedKernelRoleCounts, nodeIdSetSha256, readKernelCatalog, reconcileD01AppEntries, resolveD01NodeUniverse, validateAppliedD01RegistryDelta } from "../tools/lib/kernel-integration.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const REGISTRY_PATH = path.join(ROOT, "src/data/kernel-integration-decisions.json");
const PUBLIC_NODES_PATH = path.join(ROOT, "public/data/nodes.json");
// biome-ignore format: the canonical handoff path stays compact.
const HANDOFF_PATH = path.join(ROOT, "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json");
// biome-ignore format: the closed role enum stays compact.
const EXPECTED_ROLES = new Set(["root", "provider", "sdk-bridge", "consumer", "contributor", "not-applicable"]);

// biome-ignore format: audited fixture types stay compact to preserve the test source budget.
type RawNode = { id: string; level?: string; parentId?: string | null; owner?: string; artifactKind?: string; dependsOn?: string[]; blocks?: string[]; related?: string[]; source?: { cluster?: string }; deliveryContext?: { applicability?: string }; kernelIntegration?: { role?: string }; appDefinition?: { manifest?: { kernelPrimitiveIds?: string[] } } };
// biome-ignore format: audited fixture types stay compact to preserve the test source budget.
type RegistryEntry = { profile?: string; role?: string; reason?: string; areaId?: string; providedPrimitiveIds?: string[]; targetProviderIds?: string[]; contributionKind?: string };
// biome-ignore format: audited fixture types stay compact to preserve the test source budget.
type KernelRegistry = { snapshot?: { expectedNodeCount?: number; nodeSetSha256?: string }; sourceSnapshot?: { expectedNodeCount?: number; nodeSetSha256?: string }; materializedSnapshot?: { expectedNodeCount?: number; nodeSetSha256?: string }; decisionProfiles?: Record<string, RegistryEntry>; profiles?: Record<string, RegistryEntry>; entries?: Record<string, RegistryEntry> };

const nodeFiles = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();
const nodes = nodeFiles.map(
  (file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")) as RawNode,
);
const nodeRecords = nodeFiles.map((filename, index) => ({ filename, node: nodes[index] }));
const nodesById = new Map(nodes.map((node) => [node.id, node]));
const nodeIds = nodes.map((node) => node.id).sort();
const nodeSetSha256 = nodeIdSetSha256(nodeIds);
const registry = fs.existsSync(REGISTRY_PATH)
  ? (JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) as KernelRegistry)
  : null;
const handoff = JSON.parse(fs.readFileSync(HANDOFF_PATH, "utf8"));
const liveUniverse = resolveD01NodeUniverse({ records: nodeRecords, handoff });
const kernelCatalog = readKernelCatalog(ROOT);

const appliedFixture = (parentId?: string) => {
  const fixtureHandoff = structuredClone(handoff);
  const row = fixtureHandoff.ledger.find(
    (candidate: { parentId: string; applicationStatus: string }) =>
      parentId
        ? candidate.parentId === parentId && candidate.applicationStatus === "pending"
        : candidate.applicationStatus === "pending",
  );
  const nextApplied = fixtureHandoff.applicationSummary.applied + 1;
  const nextRemaining = fixtureHandoff.applicationSummary.remaining - 1;
  row.applicationStatus = "applied";
  fixtureHandoff.applicationSummary = {
    approved: 33,
    applied: nextApplied,
    remaining: nextRemaining,
  };
  // biome-ignore format: the complete synthetic approved node stays reviewable as one contract.
  const node = { id: row.selectedDescendantId, title: row.title, level: "archetype", parentId: row.parentId, owner: row.parentOwner, artifactKind: "delivery-task", dependsOn: row.dependencies, blocks: [], related: [], source: { cluster: row.sourceCluster } };
  const records = [...structuredClone(nodeRecords), { filename: `${node.id}.json`, node }];
  return { handoff: fixtureHandoff, records, row, node };
};

function profilesOf(value: KernelRegistry): Record<string, RegistryEntry> {
  return value.decisionProfiles ?? value.profiles ?? {};
}

function resolveEntry(value: KernelRegistry, id: string): RegistryEntry | null {
  const entry = value.entries?.[id];
  if (!entry) return null;
  const profile = entry.profile ? profilesOf(value)[entry.profile] : undefined;
  return { ...(profile ?? {}), ...entry };
}

function requireRegistry(): KernelRegistry {
  expect(registry, "src/data/kernel-integration-decisions.json eksik").not.toBeNull();
  return registry as KernelRegistry;
}

describe("kernel integration registry coverage", () => {
  it("locks the pre-D01 baseline and derives the live count from applied approved rows", () => {
    const value = requireRegistry();
    const snapshot = value.materializedSnapshot ?? value.sourceSnapshot ?? value.snapshot;

    expect(nodes).toHaveLength(liveUniverse.expectedNodeCount);
    expect(new Set(nodeIds)).toHaveLength(liveUniverse.expectedNodeCount);
    expect(liveUniverse.baselineNodeSetSha256).toBe(PRE_D01_NODE_SET_SHA256);
    expect(snapshot?.expectedNodeCount).toBe(liveUniverse.expectedNodeCount);
    expect(snapshot?.nodeSetSha256).toBe(nodeSetSha256);
  });

  it("contains exactly one explicit, resolved role decision for every node", () => {
    const value = requireRegistry();
    const registryIds = Object.keys(value.entries ?? {}).sort();

    expect(registryIds).toEqual(nodeIds);
    for (const id of nodeIds) {
      const resolved = resolveEntry(value, id);
      expect(resolved, `${id}: kernel kararı çözülemedi`).not.toBeNull();
      expect(EXPECTED_ROLES.has(resolved?.role ?? ""), `${id}: açık role zorunlu`).toBe(true);
      if (resolved?.role === "not-applicable") {
        expect(resolved.reason?.trim().length, `${id}: N/A reason zorunlu`).toBeGreaterThan(0);
      }
    }
    const counts = nodeIds.reduce<Record<string, number>>((counts, id) => {
      const role = resolveEntry(value, id)?.role ?? "missing";
      counts[role] = (counts[role] ?? 0) + 1;
      return counts;
    }, {});
    expect(counts).toEqual(expectedKernelRoleCounts(liveUniverse.appliedRows.length));
  });

  it("classifies app-kernel as root and preserves the duplicate/contributor decisions", () => {
    const value = requireRegistry();

    expect(resolveEntry(value, "app-kernel")?.role).toBe("root");
    expect(resolveEntry(value, "k-mode")?.role).toBe("provider");
    expect(resolveEntry(value, "k-computation")?.role).toBe("provider");
    expect(resolveEntry(value, "k-archetype-mode-profile")).toMatchObject({
      role: "contributor",
      targetProviderIds: expect.arrayContaining(["k-mode"]),
    });
    expect(resolveEntry(value, "k-archetype-computation")).toMatchObject({
      role: "contributor",
      targetProviderIds: expect.arrayContaining(["k-computation"]),
    });
    expect(resolveEntry(value, "k-agent-runtime")).toMatchObject({
      role: "contributor",
      contributionKind: "sibling-runtime",
    });
    expect(resolveEntry(value, "k-worker")).toMatchObject({
      role: "contributor",
      contributionKind: "sibling-runtime",
    });
  });

  it("classifies all 292 existing app-owned runtime tasks as kernel consumers", () => {
    const value = requireRegistry();
    const runtimeNodes = nodes.filter((node) => node.deliveryContext?.applicability === "runtime");

    expect(runtimeNodes).toHaveLength(292);
    for (const node of runtimeNodes) {
      expect(resolveEntry(value, node.id)?.role, `${node.id}: runtime consumer olmalı`).toBe(
        "consumer",
      );
    }
  });

  it("binds high-confidence domain apps to the specialized Kernel primitives they require", () => {
    const requiredByApp: Record<string, string[]> = {
      "s-ap-automation": ["k-party", "k-fieldtypes", "k-storage"],
      "s-ecommerce-models": ["k-mode"],
      "s-expenses": ["k-fieldtypes", "k-storage"],
      "s-fixed-assets": ["k-fieldtypes", "k-computation"],
      "s-fleet": ["k-party", "k-fieldtypes", "k-edge-gateway"],
      "s-fpa": ["k-computation", "k-fieldtypes"],
      "s-helpdesk": ["k-calendar-capacity"],
      "s-hrms": ["k-party", "k-computation"],
      "s-payroll": ["k-party", "k-fieldtypes", "k-computation"],
      "s-performance": ["k-party", "k-kpi-registry"],
      "s-pos": ["k-fieldtypes"],
      "s-revenue-recognition": ["k-computation", "k-fieldtypes"],
      "s-consolidation": ["k-fieldtypes", "k-computation"],
      "s-tax-compliance": ["k-fieldtypes", "k-computation", "k-sequence"],
      "s-treasury": ["k-fieldtypes", "k-computation"],
    };

    for (const [appId, requiredPrimitiveIds] of Object.entries(requiredByApp)) {
      const actual = nodesById.get(appId)?.appDefinition?.manifest?.kernelPrimitiveIds ?? [];
      expect(actual, `${appId}: semantik Kernel primitive bağı eksik`).toEqual(
        expect.arrayContaining(requiredPrimitiveIds),
      );
    }

    expect(
      nodesById.get("s-observability")?.appDefinition?.manifest?.kernelPrimitiveIds ?? [],
      "Observability RED/USE metrikleri ISO/iş KPI registry aggregate'i değildir",
    ).not.toContain("k-kpi-registry");
  });

  it("gives every provided primitive exactly one provider owner", () => {
    const value = requireRegistry();
    const owners = new Map<string, string[]>();

    for (const id of nodeIds) {
      const decision = resolveEntry(value, id);
      if (decision?.role !== "provider") continue;
      expect(
        decision.providedPrimitiveIds?.length,
        `${id}: providedPrimitiveIds zorunlu`,
      ).toBeGreaterThan(0);
      for (const primitiveId of decision.providedPrimitiveIds ?? []) {
        owners.set(primitiveId, [...(owners.get(primitiveId) ?? []), id]);
      }
    }

    for (const [primitiveId, providerIds] of owners) {
      expect(providerIds, `${primitiveId}: tek provider owner zorunlu`).toHaveLength(1);
    }
    expect(owners.get("k-mode")).toEqual(["k-mode"]);
    expect(owners.get("k-computation")).toEqual(["k-computation"]);
  });

  it("forbids root/providers from depending on sellable apps or app-owned modules", () => {
    const value = requireRegistry();
    const forbiddenKinds = new Set(["sellable-app", "app-core-module", "app-module"]);

    for (const node of nodes) {
      const decision = resolveEntry(value, node.id);
      if (decision?.role !== "root" && decision?.role !== "provider") continue;
      for (const dependencyId of node.dependsOn ?? []) {
        const dependency = nodesById.get(dependencyId);
        expect(
          forbiddenKinds.has(dependency?.artifactKind ?? ""),
          `${node.id}: kernel ${decision.role} -> ${dependencyId} (${dependency?.artifactKind}) ters bağımlılığı`,
        ).toBe(false);
      }
    }
  });

  it("materializes kernelIntegration into every generated and public task object", () => {
    const value = requireRegistry();
    const publicNodes = JSON.parse(fs.readFileSync(PUBLIC_NODES_PATH, "utf8")) as RawNode[];

    expect(publicNodes).toHaveLength(liveUniverse.expectedNodeCount);
    for (const collection of [nodes, publicNodes]) {
      for (const node of collection) {
        expect(node.kernelIntegration, `${node.id}: kernelIntegration eksik`).toBeDefined();
        expect(node.kernelIntegration?.role, `${node.id}: materialized role drift`).toBe(
          resolveEntry(value, node.id)?.role,
        );
      }
    }
  });

  it("inherits provider and contributor parent routing and rejects both drift forms", () => {
    const value = requireRegistry();
    // biome-ignore format: provider and contributor expectations are an exact two-case matrix.
    const cases = [
      { parentId: "k-authz", parent: { role: "provider", areaId: "k-sozlesme" }, child: { areaId: "k-sozlesme", targetProviderIds: ["k-authz"] }, drift: { areaId: "k-authz" } },
      { parentId: "k-actor", parent: { role: "contributor", areaId: "k-archetype-fieldtypes", targetProviderIds: ["k-party"] }, child: { areaId: "k-archetype-fieldtypes", targetProviderIds: ["k-party"] }, drift: { targetProviderIds: ["k-actor"] } },
    ];
    for (const item of cases) {
      const fixture = appliedFixture(item.parentId);
      const parent = resolveEntry(value, item.parentId);
      const child = appliedD01KernelDecision(kernelCatalog, fixture.row, parent);
      expect(parent).toMatchObject(item.parent);
      // biome-ignore format: the invariant tuple stays compact.
      expect(child).toMatchObject({ role: "contributor", contributionKind: "specification", runtimeProviderClaimAllowed: false, ...item.child });
      const kernelEntries = { ...value.entries, [fixture.node.id]: { ...child, ...item.drift } };
      // biome-ignore format: the adversarial validator call stays compact.
      expect(validateAppliedD01RegistryDelta({ appliedRows: [fixture.row], kernelEntries, kernelCatalog })).toContain(`${fixture.node.id}:kernel-decision-drift`);
    }
  });

  it("accepts only applied approved deltas and rejects stale, unapproved, parent or role drift", () => {
    const fixture = appliedFixture();
    const universe = resolveD01NodeUniverse(fixture);
    const value = requireRegistry();
    const parent = resolveEntry(value, fixture.row.parentId);
    const appEntry = appliedD01AppDecision(fixture.row);
    const kernelEntry = appliedD01KernelDecision(kernelCatalog, fixture.row, parent);
    // biome-ignore format: the exact dual-registry fixture stays compact.
    const appEntries = Object.fromEntries(universe.appliedRows.map((row: typeof fixture.row) => [row.selectedDescendantId, appliedD01AppDecision(row)]));
    const valid = {
      appliedRows: universe.appliedRows,
      appEntries,
      kernelEntries: { ...value.entries, [fixture.node.id]: kernelEntry },
      kernelCatalog,
    };
    expect(universe.expectedNodeCount).toBe(liveUniverse.expectedNodeCount + 1);
    expect(validateAppliedD01RegistryDelta(valid)).toEqual([]);
    expect(expectedKernelRoleCounts(liveUniverse.appliedRows.length + 1).contributor).toBe(124);

    const pending = appliedFixture();
    pending.row.applicationStatus = "pending";
    pending.handoff.applicationSummary = {
      approved: 33,
      applied: liveUniverse.appliedRows.length,
      remaining: 33 - liveUniverse.appliedRows.length,
    };
    expect(() => resolveD01NodeUniverse(pending)).toThrow(/pending-node-present/);
    const unapproved = structuredClone(nodeRecords);
    // biome-ignore format: the one-record unapproved delta stays compact.
    unapproved.push({ filename: "unapproved-d01-node.json", node: { ...pending.node, id: "unapproved-d01-node" } });
    // biome-ignore format: the fail-closed assertion stays compact.
    expect(() => resolveD01NodeUniverse({ records: unapproved, handoff })).toThrow(/unapproved-extra/);
    const wrongParent = appliedFixture();
    wrongParent.records.at(-1)!.node.parentId = "k-mode";
    expect(() => resolveD01NodeUniverse(wrongParent)).toThrow(/applied-node-parent-drift/);
    const pendingId = handoff.ledger.find(
      (row: { applicationStatus: string; selectedDescendantId: string }) =>
        row.applicationStatus === "pending" && row.selectedDescendantId !== fixture.node.id,
    ).selectedDescendantId;
    // biome-ignore format: stale and applied entries form one exact reconciliation fixture.
    const entries = { [pendingId]: { profile: "delivery-task" }, [fixture.node.id]: { profile: "foundation-component" } };
    reconcileD01AppEntries(entries, resolveD01NodeUniverse(fixture));
    expect(entries[pendingId]).toBeUndefined();
    expect(entries[fixture.node.id]).toEqual(appEntry);
    // biome-ignore format: the wrong-role mutation stays compact.
    const wrongRole = { ...valid, kernelEntries: { ...valid.kernelEntries, [fixture.node.id]: { ...kernelEntry, role: "provider" } } };
    // biome-ignore format: the fail-closed assertion stays compact.
    expect(validateAppliedD01RegistryDelta(wrongRole)).toContain(`${fixture.node.id}:kernel-decision-drift`);
  });
});
