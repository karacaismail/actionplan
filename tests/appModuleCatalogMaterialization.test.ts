import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { DeliveryContextSchema } from "@/schemas/delivery-context";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- the JavaScript governance helper intentionally has no declaration file.
import { resolveD01NodeUniverse } from "../tools/lib/kernel-integration.mjs";

const root = process.cwd();
const D01_618_NODE_SET_SHA256 = "51e42ca1917c50479449595051d02551ee84fe5e25c755c9218f16b00e5ff0a4";
const nodeDir = path.join(root, "src/data/generated/nodes");
const nodeFiles = fs
  .readdirSync(nodeDir)
  .filter((file) => file.endsWith(".json"))
  .sort();
const nodeRecords = nodeFiles.map((filename) => ({
  filename,
  node: JSON.parse(fs.readFileSync(path.join(nodeDir, filename), "utf8")),
}));
const handoff = JSON.parse(
  fs.readFileSync(
    path.join(root, "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json"),
    "utf8",
  ),
);
const expectedNodeCount = resolveD01NodeUniverse({
  records: nodeRecords,
  handoff,
}).expectedNodeCount;
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/app-catalog-decisions.json"), "utf8"),
) as {
  decisionProfiles: Record<string, Record<string, string>>;
  entries: Record<
    string,
    {
      profile: string;
      canonicalId: string;
      canonicalSlug: string;
      aliases: string[];
      disposition?: string;
      proposedArtifactKind?: string;
    }
  >;
  exactMergePairs: Array<{ canonicalId: string; legacyId: string }>;
};

const readNode = (id: string) =>
  JSON.parse(fs.readFileSync(path.join(nodeDir, `${id}.json`), "utf8")) as Record<string, unknown>;

const resolveDecision = (id: string) => {
  const entry = registry.entries[id];
  return { ...registry.decisionProfiles[entry.profile], ...entry };
};

const canonicalAppIds = Object.keys(registry.entries)
  .filter((id) => {
    const decision = resolveDecision(id);
    return decision.disposition === "PROMOTE_APP" && decision.canonicalId === id;
  })
  .sort();

describe("enterprise SDK app/module catalog materialization", () => {
  it("materializes an isolated approved 618th D01 node through both real scripts", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "actionplan-d01-s1b-"));
    const fixturePath = (relative: string) => path.join(fixtureRoot, relative);
    const readFixture = (relative: string) =>
      JSON.parse(fs.readFileSync(fixturePath(relative), "utf8"));
    const writeFixture = (relative: string, value: unknown) =>
      fs.writeFileSync(fixturePath(relative), `${JSON.stringify(value, null, 2)}\n`);
    const copy = (relative: string) => {
      const target = fixturePath(relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(path.join(root, relative), target, { recursive: true });
    };
    try {
      // biome-ignore format: the isolated fixture copies only the complete executable dependency set.
      const fixtureFiles = ["src/data/generated/nodes", "src/data/app-catalog-decisions.json", "src/data/kernel-integration-catalog.json", "src/data/kernel-integration-decisions.json", "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json", "tools/materialize-d01-app-registry.mjs", "tools/materialize-app-module-contracts.mjs", "tools/materialize-kernel-integrations.mjs", "tools/lib/kernel-integration.mjs", "tools/lib/kernel-node-universe.mjs"];
      for (const relative of fixtureFiles) copy(relative);
      const launcherRef = "tools/run-d01-materializer.mjs";
      copy(launcherRef);
      const handoffRef = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
      const fixtureHandoff = readFixture(handoffRef);
      const row = fixtureHandoff.ledger.find(
        (candidate: { parentId: string }) => candidate.parentId === "k-actor",
      );
      row.applicationStatus = "applied";
      fixtureHandoff.applicationSummary = { approved: 33, applied: 1, remaining: 32 };
      writeFixture(handoffRef, fixtureHandoff);
      const staleRow = fixtureHandoff.ledger.find(
        (candidate: { applicationStatus: string }) => candidate.applicationStatus === "pending",
      );
      const fixtureAppRegistry = readFixture("src/data/app-catalog-decisions.json");
      // biome-ignore format: the seeded stale row is an exact pending delivery-task decision.
      fixtureAppRegistry.entries[staleRow.selectedDescendantId] = { profile: "delivery-task", canonicalId: staleRow.selectedDescendantId, canonicalSlug: staleRow.selectedDescendantId, aliases: [] };
      writeFixture("src/data/app-catalog-decisions.json", fixtureAppRegistry);

      const child = structuredClone(readNode("k-actor"));
      const childId = String(row.selectedDescendantId);
      // biome-ignore format: the synthetic node is the complete approved-row projection.
      Object.assign(child, { id: childId, title: row.title, level: "archetype", parentId: row.parentId, owner: row.parentOwner, artifactKind: "delivery-task", dependsOn: row.dependencies, blocks: [], related: [], source: { cluster: row.sourceCluster } });
      // biome-ignore format: all inherited typed projections must be cleared together.
      for (const key of ["appDefinition", "moduleDefinition", "kernelIntegration", "deliveryContext"])
        delete child[key];
      writeFixture(`src/data/generated/nodes/${childId}.json`, child);

      // biome-ignore format: exactly three public workflow entrypoints must reject root/write escape.
      const rootEscapes = [["tools/materialize-d01-app-registry.mjs", "--root", fixtureRoot, "--apply"], [launcherRef, "app", "--root", fixtureRoot, "--apply"], [launcherRef, "kernel", "--root", fixtureRoot, "--apply"]];
      for (const [script, ...args] of rootEscapes)
        expect(() => execFileSync(process.execPath, [fixturePath(script), ...args])).toThrow();
      // biome-ignore format: reordered, unknown and duplicate launcher arguments all fail before spawn.
      const invalidLauncherArgs = [["app", "app"], ["kernel", "--apply", "--apply"], ["--apply", "app"], ["app", "--unknown"]];
      for (const args of invalidLauncherArgs)
        expect(() => execFileSync(process.execPath, [fixturePath(launcherRef), ...args])).toThrow();
      expect(() => execFileSync(process.execPath, [fixturePath(launcherRef), "app"])).toThrow();
      // biome-ignore format: the required public workflow sequence stays explicit and compact.
      const commands = [["tools/materialize-d01-app-registry.mjs", "--apply"], [launcherRef, "app", "--apply"], [launcherRef, "kernel", "--apply"]];
      for (const [script, ...args] of commands)
        execFileSync(process.execPath, [fixturePath(script), ...args]);

      const ids = fs
        .readdirSync(fixturePath("src/data/generated/nodes"))
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.slice(0, -5))
        .sort();
      const appRegistry = readFixture("src/data/app-catalog-decisions.json");
      const kernelRegistry = readFixture("src/data/kernel-integration-decisions.json");
      const appEntries = appRegistry.entries;
      const kernelEntries = kernelRegistry.entries;
      const materializedChild = readFixture(`src/data/generated/nodes/${childId}.json`);
      const roles = Object.values(kernelEntries).reduce<Record<string, number>>((counts, entry) => {
        const role = (entry as { role: string }).role;
        counts[role] = (counts[role] ?? 0) + 1;
        return counts;
      }, {});
      expect(ids).toHaveLength(618);
      expect(Object.keys(appEntries).sort()).toEqual(ids);
      expect(Object.keys(kernelEntries).sort()).toEqual(ids);
      expect(appEntries[staleRow.selectedDescendantId]).toBeUndefined();
      expect(appEntries[childId].profile).toBe("delivery-task");
      expect(appRegistry.materializedSnapshot.expectedNodeCount).toBe(618);
      // biome-ignore format: both registry snapshots must pin the exact synthetic 618 set.
      expect(appRegistry.d01MaterializedSnapshot).toEqual({ expectedNodeCount: 618, nodeSetSha256: D01_618_NODE_SET_SHA256 });
      // biome-ignore format: both registry snapshots must pin the exact synthetic 618 set.
      expect(kernelRegistry.materializedSnapshot).toEqual({ expectedNodeCount: 618, nodeSetSha256: D01_618_NODE_SET_SHA256 });
      // biome-ignore format: only contributor grows over the immutable pre-D01 role baseline.
      expect(roles).toEqual({ root: 1, provider: 30, "sdk-bridge": 5, consumer: 292, contributor: 122, "not-applicable": 168 });
      // biome-ignore format: the complete fail-closed child registry contract stays one assertion.
      expect(kernelEntries[childId]).toMatchObject({ role: "contributor", areaId: "k-archetype-fieldtypes", contributionKind: "specification", targetProviderIds: ["k-party"], runtimeProviderClaimAllowed: false, publicBoundary: { directKernelInternalsAllowed: false, directKernelDatabaseAccessAllowed: false, crossContextWritesAllowed: false } });
      expect(materializedChild.artifactKind).toBe("delivery-task");
      expect(materializedChild.deliveryContext.applicability).toBe("not-applicable");
      expect(materializedChild.kernelIntegration).toEqual(kernelEntries[childId]);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("materializes the accepted identity set as 121 canonical sellable apps", () => {
    expect(canonicalAppIds).toHaveLength(121);

    for (const appId of canonicalAppIds) {
      const decision = resolveDecision(appId);
      const node = readNode(appId);

      expect(node.level, appId).toBe("app");
      expect(node.parentId, appId).toBeNull();
      expect(node.artifactKind, appId).toBe("sellable-app");
      expect(node.aliases, appId).toEqual(decision.aliases);
      expect(AppDefinitionSchema.safeParse(node.appDefinition).success, appId).toBe(true);

      const appDefinition = AppDefinitionSchema.parse(node.appDefinition);
      expect(appDefinition.productSlug, appId).toBe(decision.canonicalSlug);
      expect(appDefinition.appCoreModuleId, appId).toBe(`${appId}-core`);
      expect(appDefinition.requiredModuleIds[0], appId).toBe(`${appId}-core`);
      expect(appDefinition.enterpriseDelivery.mvpAllowed, appId).toBe(false);
      expect(appDefinition.enterpriseDelivery.evidence.actual, appId).toEqual([]);
      expect(appDefinition.sdkDelivery.required, appId).toBe(true);
    }
  });

  it("materializes one SDK-only app-core module below every canonical app", () => {
    for (const appId of canonicalAppIds) {
      const coreId = `${appId}-core`;
      const core = readNode(coreId);
      expect(core.level, coreId).toBe("module");
      expect(core.parentId, coreId).toBe(appId);
      expect(core.artifactKind, coreId).toBe("app-core-module");
      expect(ModuleDefinitionSchema.safeParse(core.moduleDefinition).success, coreId).toBe(true);

      const definition = ModuleDefinitionSchema.parse(core.moduleDefinition);
      expect(definition.appId, coreId).toBe(appId);
      expect(definition.moduleId, coreId).toBe(coreId);
      expect(definition.appCoreModuleId, coreId).toBe(coreId);
      expect(definition.sdkDelivery.required, coreId).toBe(true);
      expect(definition.sdkDelivery.manualEditAllowed, coreId).toBe(false);
      expect(definition.enterpriseDelivery.mvpAllowed, coreId).toBe(false);
      expect(definition.enterpriseDelivery.evidence.actual, coreId).toEqual([]);
    }
  });

  it("retains exact-merge legacy records only as canonical aliases", () => {
    for (const { canonicalId, legacyId } of registry.exactMergePairs) {
      const canonical = readNode(canonicalId);
      const legacy = readNode(legacyId);
      expect(canonical.aliases, canonicalId).toContain(legacyId);
      expect(legacy.artifactKind, legacyId).toBe("legacy-alias");
      expect(legacy.canonicalId, legacyId).toBe(canonicalId);
      expect(legacy.appDefinition, legacyId).toBeUndefined();
      expect(legacy.moduleDefinition, legacyId).toBeUndefined();
    }
  });

  it("does not represent stack-editions governance as a sellable app", () => {
    const node = readNode("stack-editions");
    expect(node.artifactKind).toBe("governance");
    expect(node.appDefinition).toBeUndefined();
    expect(node.moduleDefinition).toBeUndefined();
  });

  it("classifies every productized s-* package as an independent enterprise app", () => {
    const productizedPackages = fs
      .readdirSync(nodeDir)
      .filter((file) => /^s-[a-z0-9-]+\.json$/.test(file) && !file.endsWith("-core.json"))
      .map((file) => readNode(file.slice(0, -5)))
      .filter((node) => node.source && (node.source as { corpus?: string }).corpus !== "synthetic");

    expect(productizedPackages).toHaveLength(99);
    for (const node of productizedPackages) {
      expect(node.level, String(node.id)).toBe("app");
      expect(node.parentId, String(node.id)).toBeNull();
      expect(node.artifactKind, String(node.id)).toBe("sellable-app");
      expect(AppDefinitionSchema.safeParse(node.appDefinition).success, String(node.id)).toBe(true);
    }
  });

  it("treats Landx as an app and platform-factory as foundation", () => {
    const landx = readNode("app-landx");
    expect(landx.artifactKind).toBe("sellable-app");
    expect(AppDefinitionSchema.safeParse(landx.appDefinition).success).toBe(true);

    const factory = readNode("platform-factory");
    expect(factory.artifactKind).toBe("platform-foundation");
    expect(factory.appDefinition).toBeUndefined();
  });

  it("classifies every node and materializes an explicit delivery context", () => {
    const nodes = fs
      .readdirSync(nodeDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => readNode(file.slice(0, -5)));

    expect(nodes).toHaveLength(expectedNodeCount);
    expect(nodes.filter((node) => node.artifactKind === "audit-pending")).toEqual([]);
    for (const node of nodes) {
      expect(DeliveryContextSchema.safeParse(node.deliveryContext).success, String(node.id)).toBe(
        true,
      );
    }
  });

  it("materializes only real executable modules as SDK app modules", () => {
    const moduleIds = [
      "landx-l0",
      "landx-l1",
      "landx-l2",
      "landx-l3",
      "landx-l4",
      "landx-l5",
      "m-crm-sales",
    ];
    for (const moduleId of moduleIds) {
      const node = readNode(moduleId);
      expect(node.artifactKind, moduleId).toBe("app-module");
      expect(ModuleDefinitionSchema.safeParse(node.moduleDefinition).success, moduleId).toBe(true);
      expect((node.deliveryContext as { applicability?: string }).applicability, moduleId).toBe(
        "runtime",
      );
    }

    expect(readNode("adr-0001").artifactKind).toBe("governance");
    expect(readNode("k-tenancy").artifactKind).toBe("platform-foundation");
    expect(readNode("edu-overview").artifactKind).toBe("delivery-task");
  });
});
