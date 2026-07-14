import fs from "node:fs";
import path from "node:path";

export const KERNEL_AREA_IDS = [
  "k-agent-runtime",
  "k-archetype-bayraklari",
  "k-control-planes",
  "k-granulerlik",
  "k-sozlesme",
  "k-surface",
  "k-terminoloji",
  "k-archetype-mode-profile",
  "k-archetype-computation",
  "k-archetype-fieldtypes",
  "k-surface-consumer",
  "k-edge-gateway",
  "k-kpi-registry",
  "k-calendar-capacity",
];

export const KERNEL_NODE_SET_SHA256 =
  "c87a7e67763454dec4fde4243e01e2a108a64a3b6c5cfd33b86e28dbc3daf6be";

export function readKernelCatalog(root) {
  return JSON.parse(
    fs.readFileSync(path.join(root, "src/data/kernel-integration-catalog.json"), "utf8"),
  );
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function appPrimitiveIdsFor(catalog, appId) {
  const optional = catalog.consumerRules
    .filter((rule) => rule.appIds.includes(appId))
    .flatMap((rule) => rule.primitiveIds);
  return unique([...catalog.defaultAppPrimitiveIds, ...optional]);
}

export function appPortsFor(catalog, primitiveIds) {
  return unique(primitiveIds.map((primitiveId) => catalog.primitiveCatalog[primitiveId]?.appPort));
}

export function providerDefinitions(catalog) {
  const byNode = new Map();
  for (const [primitiveId, primitive] of Object.entries(catalog.primitiveCatalog)) {
    const current = byNode.get(primitive.providerNodeId) ?? {
      areaId: primitive.areaId,
      providerClass: primitive.providerClass,
      scope: primitive.scope,
      providedPrimitiveIds: [],
      publicContractRefs: [],
    };
    if (current.areaId !== primitive.areaId)
      throw new Error(
        `${primitive.providerNodeId}: provider birden fazla Kernel area'ya bağlanmış`,
      );
    current.providedPrimitiveIds.push(primitiveId);
    current.publicContractRefs.push(primitive.publicContractRef);
    byNode.set(primitive.providerNodeId, current);
  }
  for (const provider of byNode.values()) {
    provider.providedPrimitiveIds = unique(provider.providedPrimitiveIds);
    provider.publicContractRefs = unique(provider.publicContractRefs);
  }
  return byNode;
}

export function areasForPrimitives(catalog, primitiveIds) {
  const included = new Set(
    primitiveIds
      .map((primitiveId) => catalog.primitiveCatalog[primitiveId]?.areaId)
      .filter(Boolean),
  );
  return KERNEL_AREA_IDS.filter((areaId) => included.has(areaId));
}
