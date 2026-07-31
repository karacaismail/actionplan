import fs from "node:fs";
import path from "node:path";
import {
  PRE_D01_EXPECTED_NODE_COUNT,
  PRE_D01_NODE_SET_SHA256,
  nodeIdSetSha256,
  resolveD01NodeUniverse,
} from "./kernel-node-universe.mjs";

export {
  PRE_D01_EXPECTED_NODE_COUNT,
  PRE_D01_NODE_SET_SHA256,
  nodeIdSetSha256,
  resolveD01NodeUniverse,
};

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

export const KERNEL_NODE_SET_SHA256 = PRE_D01_NODE_SET_SHA256;

export const PRE_D01_KERNEL_ROLE_COUNTS = Object.freeze({
  root: 1,
  provider: 30,
  "sdk-bridge": 5,
  consumer: 292,
  contributor: 121,
  "not-applicable": 168,
});

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

export function expectedKernelRoleCounts(appliedCount) {
  return {
    ...PRE_D01_KERNEL_ROLE_COUNTS,
    contributor: PRE_D01_KERNEL_ROLE_COUNTS.contributor + appliedCount,
  };
}

export function appliedD01AppDecision(row) {
  const id = String(row.selectedDescendantId);
  return {
    profile: "delivery-task",
    canonicalId: id,
    canonicalSlug: id,
    aliases: [],
  };
}

export function reconcileD01AppEntries(entries, universe) {
  for (const id of universe.approvedIds) delete entries[id];
  for (const row of universe.appliedRows)
    entries[row.selectedDescendantId] = appliedD01AppDecision(row);
  return entries;
}

const kernelIntegrationCommon = (catalog, nodeId) => ({
  kernelRef: catalog.kernelRef,
  contractRefs: catalog.contractRefs,
  publicBoundary: {
    directKernelInternalsAllowed: false,
    directKernelDatabaseAccessAllowed: false,
    crossContextWritesAllowed: false,
  },
  plannedTestRefs: [
    `planned-test:${nodeId}:kernel-public-contract`,
    `planned-test:${nodeId}:kernel-boundary-negative`,
  ],
});

export function appliedD01KernelDecision(catalog, row, parentDecision) {
  const id = String(row.selectedDescendantId);
  const parentId = String(row.parentId);
  if (!["provider", "contributor"].includes(parentDecision?.role))
    throw new Error(`${id}: invalid D01 parent kernel role (${parentDecision?.role ?? "missing"})`);
  if (!parentDecision.areaId) throw new Error(`${id}: D01 parent areaId missing`);
  const targetProviderIds =
    parentDecision.role === "provider" ? [parentId] : parentDecision.targetProviderIds;
  if (!Array.isArray(targetProviderIds) || targetProviderIds.length === 0)
    throw new Error(`${id}: D01 parent provider targets missing`);
  return {
    role: "contributor",
    ...kernelIntegrationCommon(catalog, id),
    runtimeProviderClaimAllowed: false,
    areaId: parentDecision.areaId,
    contributionKind: "specification",
    targetProviderIds: [...targetProviderIds],
  };
}

export function validateAppliedD01RegistryDelta({
  appliedRows,
  appEntries,
  kernelEntries,
  kernelCatalog,
}) {
  const errors = [];
  for (const row of appliedRows) {
    const id = String(row.selectedDescendantId);
    if (appEntries && JSON.stringify(appEntries[id]) !== JSON.stringify(appliedD01AppDecision(row)))
      errors.push(`${id}:app-decision-drift`);
    if (
      kernelEntries &&
      JSON.stringify(kernelEntries[id]) !==
        JSON.stringify(
          appliedD01KernelDecision(kernelCatalog, row, kernelEntries[String(row.parentId)]),
        )
    )
      errors.push(`${id}:kernel-decision-drift`);
  }
  return errors.sort();
}
