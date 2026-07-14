#!/usr/bin/env node
import { loadCatalog, report, validateAppDefinition } from "../lib/app-contracts.mjs";

const errors = [];
let catalog;
try {
  catalog = loadCatalog();
} catch (error) {
  report("app-contracts", "catalog okunamadı", [error.message]);
  process.exit(1);
}

const { registry, nodes, decision } = catalog;
const canonicalIds = Object.keys(registry.entries ?? {}).filter((id) => {
  const item = decision(id);
  return item?.canonicalId === id && item.disposition === "PROMOTE_APP";
});

if (canonicalIds.length !== 121)
  errors.push(`canonical sellable app sayısı 121 olmalı: ${canonicalIds.length}`);
if (registry.sourceSnapshot?.expectedNodeCount !== 496)
  errors.push(
    `source snapshot 496 olarak sabit kalmalı: ${registry.sourceSnapshot?.expectedNodeCount}`,
  );
if (registry.materializedSnapshot?.expectedNodeCount !== nodes.size)
  errors.push(
    `materialized snapshot/node sayısı farklı: ${registry.materializedSnapshot?.expectedNodeCount}/${nodes.size}`,
  );

for (const id of canonicalIds) {
  const node = nodes.get(id);
  const item = decision(id);
  if (!node) {
    errors.push(`${id}: canonical app node yok`);
    continue;
  }
  if (item.decisionStatus !== "accepted" || item.proposedArtifactKind !== "app-definition")
    errors.push(`${id}: accepted app-definition kararı zorunlu`);
  if (node.level !== "app" || node.artifactKind !== "sellable-app" || node.parentId !== null)
    errors.push(`${id}: level=app, artifactKind=sellable-app ve parentId=null olmalı`);
  if (!node.appDefinition) errors.push(`${id}: appDefinition zorunlu`);
  else {
    validateAppDefinition(node, errors);
    if (node.appDefinition.productSlug !== item.canonicalSlug)
      errors.push(`${id}: productSlug registry canonicalSlug ile aynı olmalı`);
    if (node.appDefinition.appCoreModuleId !== node.appDefinition.requiredModuleIds?.[0])
      errors.push(`${id}: app-core ilk required module olmalı`);
    const required = new Set(node.appDefinition.requiredModuleIds ?? []);
    if (required.size !== (node.appDefinition.requiredModuleIds?.length ?? 0))
      errors.push(`${id}: duplicate requiredModuleIds`);
    for (const moduleId of node.appDefinition.optionalModuleIds ?? [])
      if (required.has(moduleId)) errors.push(`${id}: ${moduleId} hem required hem optional`);
  }
  if (node.moduleDefinition) errors.push(`${id}: sellable app moduleDefinition taşıyamaz`);
  if (node.standardRefs?.enterpriseDeliveryRef !== "enterprise-delivery")
    errors.push(`${id}: enterpriseDeliveryRef eksik/yanlış`);
  if (node.standardRefs?.sdkDevelopmentRef !== "sdk-development")
    errors.push(`${id}: sdkDevelopmentRef eksik/yanlış`);
  const expectedAliases = [...(item.aliases ?? [])].sort();
  const actualAliases = [...(node.aliases ?? [])].sort();
  if (JSON.stringify(expectedAliases) !== JSON.stringify(actualAliases))
    errors.push(`${id}: node aliases registry ile aynı değil`);
}

const sellableIds = [...nodes.values()]
  .filter((node) => node.artifactKind === "sellable-app")
  .map((node) => node.id)
  .sort();
if (JSON.stringify(sellableIds) !== JSON.stringify([...canonicalIds].sort()))
  errors.push("sellable-app node seti accepted canonical registry setiyle aynı değil");

for (const [id, node] of nodes) {
  const item = decision(id);
  if (!item) errors.push(`${id}: registry kararı çözülemedi`);
  if (item?.decisionStatus === "audit-pending") {
    if (node.artifactKind !== "audit-pending")
      errors.push(`${id}: audit-pending kayıt app/module sayılamaz`);
    if (node.appDefinition || node.moduleDefinition)
      errors.push(`${id}: audit-pending kayıt definition taşıyamaz`);
  }
}

report("app-contracts", `canonical-app=${canonicalIds.length} · node=${nodes.size}`, errors);
