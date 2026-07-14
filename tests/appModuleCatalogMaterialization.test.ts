import fs from "node:fs";
import path from "node:path";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { DeliveryContextSchema } from "@/schemas/delivery-context";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const nodeDir = path.join(root, "src/data/generated/nodes");
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

    expect(nodes).toHaveLength(617);
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
