#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  KERNEL_AREA_IDS,
  KERNEL_NODE_SET_SHA256,
  appPortsFor,
  appPrimitiveIdsFor,
  readKernelCatalog,
} from "../lib/kernel-integration.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const catalog = readKernelCatalog(ROOT);
const registry = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/kernel-integration-decisions.json"), "utf8"),
);
const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")));
const publicNodes = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/nodes.json"), "utf8"));
const byId = new Map(nodes.map((node) => [node.id, node]));
const publicById = new Map(publicNodes.map((node) => [node.id, node]));
const errors = [];
const roles = new Set([
  "root",
  "provider",
  "sdk-bridge",
  "consumer",
  "contributor",
  "not-applicable",
]);
const ids = nodes.map((node) => node.id).sort();
const hash = crypto
  .createHash("sha256")
  .update(`${ids.join("\n")}\n`)
  .digest("hex");

if (nodes.length !== 617) errors.push(`node count 617 olmalı: ${nodes.length}`);
if (publicNodes.length !== 617) errors.push(`public node count 617 olmalı: ${publicNodes.length}`);
if (hash !== KERNEL_NODE_SET_SHA256) errors.push(`node-set SHA drift: ${hash}`);
if (registry.materializedSnapshot?.nodeSetSha256 !== hash)
  errors.push("registry snapshot hash canonical node set ile aynı değil");
if (JSON.stringify(Object.keys(registry.entries ?? {}).sort()) !== JSON.stringify(ids))
  errors.push("registry entries tam 617 canonical node ID'sini kapsamıyor");
if (catalog.areas.length !== 14)
  errors.push(`Kernel area count 14 olmalı: ${catalog.areas.length}`);
if (JSON.stringify(catalog.areas.map((area) => area.id)) !== JSON.stringify(KERNEL_AREA_IDS))
  errors.push("catalog area sırası şema WBS 12.1-12.14 ile aynı değil");

const primitiveOwners = new Map();
let consumerCount = 0;
let providerCount = 0;
const roleCounts = {};
for (const node of nodes) {
  const integration = node.kernelIntegration;
  const registryDecision = registry.entries?.[node.id];
  const publicDecision = publicById.get(node.id)?.kernelIntegration;
  if (!integration || !roles.has(integration.role)) {
    errors.push(`${node.id}: açık kernelIntegration role eksik`);
    continue;
  }
  roleCounts[integration.role] = (roleCounts[integration.role] ?? 0) + 1;
  if (JSON.stringify(integration) !== JSON.stringify(registryDecision))
    errors.push(`${node.id}: raw node/registry kernelIntegration drift`);
  if (JSON.stringify(integration) !== JSON.stringify(publicDecision))
    errors.push(`${node.id}: raw/public kernelIntegration drift`);

  if (integration.role === "not-applicable") {
    if ((integration.reason ?? "").trim().length < 12)
      errors.push(`${node.id}: Kernel N/A somut reason taşımıyor`);
    continue;
  }
  for (const flag of [
    "directKernelInternalsAllowed",
    "directKernelDatabaseAccessAllowed",
    "crossContextWritesAllowed",
  ])
    if (integration.publicBoundary?.[flag] !== false)
      errors.push(`${node.id}: publicBoundary.${flag} fail-closed false olmalı`);
  if (!(integration.plannedTestRefs ?? []).every((ref) => ref.startsWith("planned-test:")))
    errors.push(`${node.id}: planlanan test ref'i planned-test: prefix'i taşımalı`);

  if (integration.role === "provider") {
    providerCount++;
    for (const primitiveId of integration.providedPrimitiveIds ?? []) {
      const owners = primitiveOwners.get(primitiveId) ?? [];
      owners.push(node.id);
      primitiveOwners.set(primitiveId, owners);
    }
    for (const dependencyId of node.dependsOn ?? []) {
      const kind = byId.get(dependencyId)?.artifactKind;
      if (["sellable-app", "app-core-module", "app-module"].includes(kind))
        errors.push(`${node.id}: provider -> ${dependencyId} ters app bağımlılığı`);
    }
  }
  if (integration.role === "consumer") consumerCount++;
}

if (consumerCount !== 292) errors.push(`runtime consumer count 292 olmalı: ${consumerCount}`);
if (providerCount !== 30) errors.push(`provider count 30 olmalı: ${providerCount}`);
for (const [role, expected] of Object.entries({
  root: 1,
  provider: 30,
  "sdk-bridge": 5,
  consumer: 292,
  contributor: 121,
  "not-applicable": 168,
}))
  if (roleCounts[role] !== expected)
    errors.push(`${role} count ${expected} olmalı: ${roleCounts[role] ?? 0}`);
for (const [primitiveId, owners] of primitiveOwners) {
  if (owners.length !== 1) errors.push(`${primitiveId}: tek provider owner olmalı: ${owners}`);
}
for (const primitiveId of Object.keys(catalog.primitiveCatalog)) {
  if (primitiveOwners.get(primitiveId)?.length !== 1)
    errors.push(`${primitiveId}: catalog primitive provider kararı eksik`);
}

const runtimeNodes = nodes.filter((node) => node.deliveryContext?.applicability === "runtime");
for (const node of runtimeNodes) {
  const integration = node.kernelIntegration;
  if (integration?.role !== "consumer") {
    errors.push(`${node.id}: app-owned runtime task consumer olmalı`);
    continue;
  }
  const app = byId.get(node.deliveryContext.appRef);
  if (!app?.appDefinition) {
    errors.push(`${node.id}: owning app manifest çözülemedi`);
    continue;
  }
  const expected = appPrimitiveIdsFor(catalog, app.id);
  if (JSON.stringify(integration.requiredPrimitiveIds) !== JSON.stringify(expected))
    errors.push(
      `${node.id}: consumer primitive projection owning app manifest kuralıyla aynı değil`,
    );
  for (const primitiveId of integration.requiredPrimitiveIds)
    if (primitiveOwners.get(primitiveId)?.length !== 1)
      errors.push(`${node.id}: ${primitiveId} için tek provider yok`);
}

const apps = nodes.filter((node) => node.artifactKind === "sellable-app");
if (apps.length !== 121) errors.push(`sellable app count 121 olmalı: ${apps.length}`);
for (const app of apps) {
  const expectedPrimitives = appPrimitiveIdsFor(catalog, app.id);
  const actualPrimitives = app.appDefinition?.manifest?.kernelPrimitiveIds ?? [];
  if (JSON.stringify(actualPrimitives) !== JSON.stringify(expectedPrimitives))
    errors.push(`${app.id}: app manifest kernel primitive roll-up drift`);
  for (const required of ["k-jurisdiction", "k-surface-consumer", "scale-invariant"])
    if (!actualPrimitives.includes(required)) errors.push(`${app.id}: global ${required} eksik`);

  const expectedPorts = appPortsFor(catalog, expectedPrimitives);
  const ownedModules = nodes.filter(
    (node) =>
      node.moduleDefinition?.appId === app.id &&
      ["app-core-module", "app-module"].includes(node.artifactKind),
  );
  for (const module of ownedModules) {
    const consumed = module.moduleDefinition.consumedPorts ?? [];
    for (const port of expectedPorts)
      if (!consumed.includes(port)) errors.push(`${module.id}: ${port} public SDK portu eksik`);
    if (module.moduleDefinition.kernelInternalsAllowed !== false)
      errors.push(`${module.id}: kernelInternalsAllowed=false olmalı`);
    if (module.moduleDefinition.crossContextWritesAllowed !== false)
      errors.push(`${module.id}: crossContextWritesAllowed=false olmalı`);
  }
}

for (const [id, expected] of [
  ["k-mode", "provider"],
  ["k-computation", "provider"],
  ["k-archetype-mode-profile", "contributor"],
  ["k-archetype-computation", "contributor"],
  ["k-agent-runtime", "contributor"],
  ["k-worker", "contributor"],
])
  if (byId.get(id)?.kernelIntegration?.role !== expected)
    errors.push(`${id}: role ${expected} olmalı`);
if (byId.get("k-agent-runtime")?.kernelIntegration?.contributionKind !== "sibling-runtime")
  errors.push("k-agent-runtime sibling-runtime contributor olmalı");
if (byId.get("k-worker")?.kernelIntegration?.contributionKind !== "sibling-runtime")
  errors.push("k-worker sibling-runtime contributor olmalı");

if (errors.length) {
  console.error(`[kernel-integration] FAIL (${errors.length})`);
  for (const error of errors.slice(0, 100)) console.error(` - ${error}`);
  process.exit(1);
}

console.log(
  `[kernel-integration] PASS — node=617, area=14, consumer=${consumerCount}, provider=${providerCount}, app=121`,
);
