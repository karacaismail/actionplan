import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const REGISTRY_PATH = path.join(ROOT, "src/data/kernel-integration-decisions.json");
const PUBLIC_NODES_PATH = path.join(ROOT, "public/data/nodes.json");
const EXPECTED_NODE_SET_SHA256 = "c87a7e67763454dec4fde4243e01e2a108a64a3b6c5cfd33b86e28dbc3daf6be";
const EXPECTED_ROLES = new Set([
  "root",
  "provider",
  "sdk-bridge",
  "consumer",
  "contributor",
  "not-applicable",
]);

type RawNode = {
  id: string;
  artifactKind?: string;
  dependsOn?: string[];
  deliveryContext?: { applicability?: string };
  kernelIntegration?: { role?: string };
  appDefinition?: { manifest?: { kernelPrimitiveIds?: string[] } };
};

type RegistryEntry = {
  profile?: string;
  role?: string;
  reason?: string;
  providedPrimitiveIds?: string[];
  targetProviderIds?: string[];
  contributionKind?: string;
};

type KernelRegistry = {
  snapshot?: { expectedNodeCount?: number; nodeSetSha256?: string };
  sourceSnapshot?: { expectedNodeCount?: number; nodeSetSha256?: string };
  materializedSnapshot?: { expectedNodeCount?: number; nodeSetSha256?: string };
  decisionProfiles?: Record<string, RegistryEntry>;
  profiles?: Record<string, RegistryEntry>;
  entries?: Record<string, RegistryEntry>;
};

const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")) as RawNode);
const nodesById = new Map(nodes.map((node) => [node.id, node]));
const nodeIds = nodes.map((node) => node.id).sort();
const nodeSetSha256 = crypto
  .createHash("sha256")
  .update(`${nodeIds.join("\n")}\n`)
  .digest("hex");
const registry = fs.existsSync(REGISTRY_PATH)
  ? (JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) as KernelRegistry)
  : null;

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
  it("locks the current 617-node identity set with a SHA-256 fingerprint", () => {
    const value = requireRegistry();
    const snapshot = value.materializedSnapshot ?? value.sourceSnapshot ?? value.snapshot;

    expect(nodes).toHaveLength(617);
    expect(new Set(nodeIds)).toHaveLength(617);
    expect(nodeSetSha256).toBe(EXPECTED_NODE_SET_SHA256);
    expect(snapshot?.expectedNodeCount).toBe(617);
    expect(snapshot?.nodeSetSha256).toBe(EXPECTED_NODE_SET_SHA256);
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
    expect(
      nodeIds.reduce<Record<string, number>>((counts, id) => {
        const role = resolveEntry(value, id)?.role ?? "missing";
        counts[role] = (counts[role] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({
      consumer: 292,
      contributor: 121,
      "not-applicable": 168,
      provider: 30,
      root: 1,
      "sdk-bridge": 5,
    });
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

    expect(publicNodes).toHaveLength(617);
    for (const collection of [nodes, publicNodes]) {
      for (const node of collection) {
        expect(node.kernelIntegration, `${node.id}: kernelIntegration eksik`).toBeDefined();
        expect(node.kernelIntegration?.role, `${node.id}: materialized role drift`).toBe(
          resolveEntry(value, node.id)?.role,
        );
      }
    }
  });
});
