#!/usr/bin/env node
/**
 * Materialize the Kernel 12.1-12.14 decision registry into every canonical task JSON.
 * Default mode is a byte-drift check; --apply is the only write mode.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  KERNEL_AREA_IDS,
  KERNEL_NODE_SET_SHA256,
  appPrimitiveIdsFor,
  areasForPrimitives,
  providerDefinitions,
  readKernelCatalog,
  unique,
} from "./lib/kernel-integration.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const REGISTRY_PATH = path.join(ROOT, "src/data/kernel-integration-decisions.json");
const APPLY = process.argv.includes("--apply");
const catalog = readKernelCatalog(ROOT);
const nodeFiles = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();
const nodes = nodeFiles.map((file) =>
  JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")),
);
const byId = new Map(nodes.map((node) => [node.id, node]));
const providers = providerDefinitions(catalog);
const nodeIds = nodes.map((node) => node.id).sort();
const nodeSetSha256 = crypto
  .createHash("sha256")
  .update(`${nodeIds.join("\n")}\n`)
  .digest("hex");

if (nodes.length !== 617 || nodeSetSha256 !== KERNEL_NODE_SET_SHA256) {
  console.error(
    `[kernel-integration] snapshot drift: count=${nodes.length}, sha256=${nodeSetSha256}`,
  );
  process.exit(1);
}

const publicBoundary = {
  directKernelInternalsAllowed: false,
  directKernelDatabaseAccessAllowed: false,
  crossContextWritesAllowed: false,
};
const commonFor = (nodeId) => ({
  kernelRef: catalog.kernelRef,
  contractRefs: catalog.contractRefs,
  publicBoundary,
  plannedTestRefs: [
    `planned-test:${nodeId}:kernel-public-contract`,
    `planned-test:${nodeId}:kernel-boundary-negative`,
  ],
});

function granularityContribution(node) {
  let current = node;
  while (current?.parentId) {
    if (current.id === "k-granulerlik" || current.parentId === "k-granulerlik") return true;
    current = byId.get(current.parentId);
  }
  return node.id === "k-granulerlik";
}

function contributorFor(node) {
  const base = { ...commonFor(node.id), runtimeProviderClaimAllowed: false };
  const catalogBinding = catalog.contributorBindings.find((binding) =>
    binding.nodeIds.includes(node.id),
  );
  if (catalogBinding)
    return {
      role: "contributor",
      ...base,
      areaId: catalogBinding.areaId,
      contributionKind: catalogBinding.contributionKind,
      targetProviderIds: catalogBinding.targetProviderIds,
    };
  if (node.id === "k-agent-runtime")
    return {
      role: "contributor",
      ...base,
      areaId: "k-agent-runtime",
      contributionKind: "sibling-runtime",
      targetProviderIds: ["k-tenancy", "k-authz", "k-bus", "k-party", "k-policy-pdp"],
    };
  if (node.id === "k-worker")
    return {
      role: "contributor",
      ...base,
      areaId: "k-agent-runtime",
      contributionKind: "sibling-runtime",
      targetProviderIds: ["k-tenancy", "k-authz", "k-bus"],
    };
  if (node.id === "k-archetype-mode-profile")
    return {
      role: "contributor",
      ...base,
      areaId: "k-archetype-mode-profile",
      contributionKind: "specification",
      targetProviderIds: ["k-mode"],
    };
  if (node.id === "k-archetype-computation")
    return {
      role: "contributor",
      ...base,
      areaId: "k-archetype-computation",
      contributionKind: "specification",
      targetProviderIds: ["k-computation"],
    };
  if (node.id === "k-actor")
    return {
      role: "contributor",
      ...base,
      areaId: "k-archetype-fieldtypes",
      contributionKind: "compatibility-alias",
      targetProviderIds: ["k-party"],
    };
  if (node.id === "cc-fx-ledger")
    return {
      role: "contributor",
      ...base,
      areaId: "k-archetype-computation",
      contributionKind: "provider-adapter",
      targetProviderIds: ["k-computation"],
    };
  if (["k-boyut1-ops-panel", "k-boyut2-developer-panel", "k-boyut3-tenant-panel"].includes(node.id))
    return {
      role: "contributor",
      ...base,
      areaId: "k-control-planes",
      contributionKind: "control-plane-projection",
      targetProviderIds: ["k-control-planes"],
    };
  if (node.id === "k-terminoloji")
    return {
      role: "contributor",
      ...base,
      areaId: "k-terminoloji",
      contributionKind: "governance",
      targetProviderIds: ["k-sozlesme"],
    };
  if (granularityContribution(node))
    return {
      role: "contributor",
      ...base,
      areaId: "k-granulerlik",
      contributionKind:
        node.source?.cluster === "url-policy-implementation"
          ? "implementation-program"
          : node.id === "k-granulerlik"
            ? "governance"
            : "example",
      targetProviderIds: ["k-sozlesme"],
    };
  const targetProviderIds = unique(
    [...(node.dependsOn ?? []), ...(node.related ?? [])].filter((id) => providers.has(id)),
  );
  if (targetProviderIds.length > 0) {
    const areaId =
      KERNEL_AREA_IDS.find((candidate) =>
        targetProviderIds.some((providerId) => providers.get(providerId).areaId === candidate),
      ) ?? "k-sozlesme";
    const contributionKind =
      node.artifactKind === "governance" || node.artifactKind === "portfolio-facet"
        ? "governance"
        : node.artifactKind === "platform-foundation"
          ? "provider-adapter"
          : node.artifactKind === "delivery-task"
            ? "implementation-program"
            : "specification";
    return {
      role: "contributor",
      ...base,
      areaId,
      contributionKind,
      targetProviderIds,
    };
  }
  return null;
}

function integrationFor(node) {
  if (node.id === "app-kernel")
    return { role: "root", ...commonFor(node.id), areaIds: KERNEL_AREA_IDS };

  const provider = providers.get(node.id);
  if (provider) return { role: "provider", ...commonFor(node.id), ...provider };

  if (catalog.sdkBridgeNodeIds.includes(node.id))
    return {
      role: "sdk-bridge",
      ...commonFor(node.id),
      areaId: "k-sozlesme",
      sdkContractRef: "sdk-public-contract",
      sourceProviderIds: unique(
        catalog.defaultAppPrimitiveIds.map(
          (primitiveId) => catalog.primitiveCatalog[primitiveId].providerNodeId,
        ),
      ),
      deterministic: true,
      generatedOutputManualEditAllowed: false,
    };

  if (node.deliveryContext?.applicability === "runtime") {
    const appId = node.deliveryContext.appRef;
    const requiredPrimitiveIds = appPrimitiveIdsFor(catalog, appId);
    const bindingSource =
      node.artifactKind === "sellable-app"
        ? "app-manifest"
        : node.artifactKind === "app-core-module" || node.artifactKind === "app-module"
          ? "owning-app-manifest"
          : "delivery-context";
    return {
      role: "consumer",
      ...commonFor(node.id),
      areaIds: areasForPrimitives(catalog, requiredPrimitiveIds),
      bindingSource,
      accessPath: "public-sdk-only",
      sdkContractRef: "sdk-public-contract",
      requiredPrimitiveIds,
    };
  }

  const contributor = contributorFor(node);
  if (contributor) return contributor;

  return {
    role: "not-applicable",
    reason: `${node.artifactKind ?? "Task"} kaydı Kernel runtime sağlayıcısı veya app-owned runtime tüketicisi değildir; mevcut WBS sahipliğinde kalır.`,
  };
}

const decisions = Object.fromEntries(nodes.map((node) => [node.id, integrationFor(node)]));
const registry = {
  schemaVersion: "1.0.0",
  source: {
    image: catalog.sourceImage,
    kernelRoot: catalog.kernelRef,
    areaCount: KERNEL_AREA_IDS.length,
    contractRefs: catalog.contractRefs,
  },
  materializedSnapshot: {
    expectedNodeCount: nodes.length,
    nodeSetSha256,
  },
  profiles: {},
  entries: decisions,
};

let drift = false;
const jsonBytes = (value) => `${JSON.stringify(value, null, 2)}\n`;
const writeOrCheck = (file, bytes) => {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === bytes) return;
  drift = true;
  if (APPLY) fs.writeFileSync(file, bytes);
  else console.error(`[kernel-integration] drift: ${path.relative(ROOT, file)}`);
};

for (const [index, node] of nodes.entries()) {
  node.kernelIntegration = decisions[node.id];
  // Kernel/provider must never point down into app-owned runtime dependencies.
  if (node.id === "k-agent-runtime") node.dependsOn = node.dependsOn.filter((id) => id !== "s-ai");
  if (node.id === "k-authz") node.dependsOn = node.dependsOn.filter((id) => id !== "s-drive");
  writeOrCheck(path.join(NODE_DIR, nodeFiles[index]), jsonBytes(node));
}
writeOrCheck(REGISTRY_PATH, jsonBytes(registry));

if (drift && !APPLY) process.exit(1);
console.log(
  `[kernel-integration] ${APPLY ? "materialized" : "verified"}: node=${nodes.length}, consumer=${Object.values(decisions).filter((item) => item.role === "consumer").length}, provider=${Object.values(decisions).filter((item) => item.role === "provider").length}`,
);
