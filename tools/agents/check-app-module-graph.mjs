#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadCatalog, report, validateModuleDefinition } from "../lib/app-contracts.mjs";

const errors = [];
let catalog;
try {
  catalog = loadCatalog();
} catch (error) {
  report("app-module-graph", "catalog okunamadı", [error.message]);
  process.exit(1);
}
const { registry, nodes, decision } = catalog;
const apps = [...nodes.values()].filter((node) => node.artifactKind === "sellable-app");
const modules = [...nodes.values()].filter((node) =>
  ["app-core-module", "app-module"].includes(node.artifactKind),
);

const resolverSource = fs.readFileSync(path.join(ROOT, "src/engine/resolve.ts"), "utf8");
const indexStart = resolverSource.indexOf("export function indexById");
const indexEnd = resolverSource.indexOf("export function getChildren", indexStart);
const indexBody = resolverSource.slice(indexStart, indexEnd);
if (!indexBody.includes("canonicalId") || !indexBody.includes("legacy-alias"))
  errors.push("indexById: legacy-alias düğümü canonicalId target'ına çözülmüyor");

for (const app of apps) {
  const definition = app.appDefinition;
  if (!definition) {
    errors.push(`${app.id}: appDefinition yok`);
    continue;
  }
  const coreId = definition.appCoreModuleId;
  if (definition.requiredModuleIds?.[0] !== coreId)
    errors.push(`${app.id}: app-core ilk required module değil`);
  const required = new Set(definition.requiredModuleIds ?? []);
  const optional = new Set(definition.optionalModuleIds ?? []);
  if (required.size !== (definition.requiredModuleIds?.length ?? 0))
    errors.push(`${app.id}: duplicate required module`);
  if (optional.size !== (definition.optionalModuleIds?.length ?? 0))
    errors.push(`${app.id}: duplicate optional module`);
  for (const id of optional)
    if (required.has(id)) errors.push(`${app.id}: ${id} required ve optional`);
  for (const id of [...required, ...optional]) {
    const module = nodes.get(id);
    if (!module) {
      errors.push(`${app.id}: module node yok ${id}`);
      continue;
    }
    if (!["app-core-module", "app-module"].includes(module.artifactKind))
      errors.push(`${app.id}: ${id} gerçek app module değil`);
    const expectedParent =
      module.artifactKind === "app-core-module" ? app.id : definition.appCoreModuleId;
    if (module.level !== "module" || module.parentId !== expectedParent)
      errors.push(`${id}: parent ${expectedParent} olmalı`);
    if (module.moduleDefinition?.appId !== app.id)
      errors.push(`${id}: moduleDefinition.appId ${app.id} olmalı`);
    if (module.moduleDefinition?.appCoreModuleId !== coreId)
      errors.push(`${id}: appCoreModuleId ${coreId} olmalı`);
  }
  const core = nodes.get(coreId);
  if (core?.artifactKind !== "app-core-module") errors.push(`${app.id}: gerçek app-core child yok`);
}

for (const module of modules) {
  if (!module.moduleDefinition) {
    errors.push(`${module.id}: moduleDefinition zorunlu`);
    continue;
  }
  validateModuleDefinition(module, errors);
  const definition = module.moduleDefinition;
  if (module.level !== "module" || definition.artifactKind !== module.artifactKind)
    errors.push(`${module.id}: WBS/artifact/moduleDefinition türleri tutarsız`);
  if (definition.moduleId !== module.id || definition.moduleSlug !== module.slug)
    errors.push(`${module.id}: module id/slug node kimliğiyle aynı olmalı`);
  const app = nodes.get(definition.appId);
  if (app?.artifactKind !== "sellable-app" || !app.appDefinition)
    errors.push(`${module.id}: canonical sellable app referansı çözülemedi`);
  else {
    const expectedParent =
      module.artifactKind === "app-core-module" ? definition.appId : definition.appCoreModuleId;
    if (module.parentId !== expectedParent)
      errors.push(`${module.id}: parentId ${expectedParent} olmalı`);
    if (app.appDefinition.appCoreModuleId !== definition.appCoreModuleId)
      errors.push(`${module.id}: app/core referansı canonical app ile farklı`);
    const refs = [...app.appDefinition.requiredModuleIds, ...app.appDefinition.optionalModuleIds];
    if (!refs.includes(module.id)) errors.push(`${module.id}: app manifest module listesinde yok`);
  }
  const core = nodes.get(definition.appCoreModuleId);
  if (core?.artifactKind !== "app-core-module" || core.moduleDefinition?.appId !== definition.appId)
    errors.push(`${module.id}: app-core referansı dangling/başka app'e ait`);
  if (
    module.artifactKind === "app-core-module" &&
    definition.moduleId !== definition.appCoreModuleId
  )
    errors.push(`${module.id}: app-core kendisini appCoreModuleId olarak göstermeli`);
  if (module.artifactKind === "app-module" && definition.moduleId === definition.appCoreModuleId)
    errors.push(`${module.id}: normal module app-core kimliğini kullanamaz`);
  if (
    module.standardRefs?.enterpriseDeliveryRef !== "enterprise-delivery" ||
    module.standardRefs?.sdkDevelopmentRef !== "sdk-development"
  )
    errors.push(`${module.id}: enterprise + SDK standard refs zorunlu`);
}

for (const node of nodes.values())
  if (node.moduleDefinition && !["app-core-module", "app-module"].includes(node.artifactKind))
    errors.push(`${node.id}: moduleDefinition yalnız gerçek app module'de olabilir`);

for (const [legacyId, entry] of Object.entries(registry.entries ?? {})) {
  const item = decision(legacyId);
  if (item?.disposition !== "MERGE_APP_ALIAS") continue;
  const alias = nodes.get(legacyId);
  const canonical = nodes.get(entry.canonicalId);
  if (alias?.artifactKind !== "legacy-alias" || alias.canonicalId !== entry.canonicalId)
    errors.push(`${legacyId}: legacy alias canonicalId çözümü hatalı`);
  if (canonical?.artifactKind !== "sellable-app" || canonical.canonicalId)
    errors.push(`${legacyId}: alias target canonical sellable app değil`);
  if (!canonical?.aliases?.includes(legacyId))
    errors.push(`${legacyId}: canonical node aliases içinde yok`);
  if (!decision(entry.canonicalId)?.aliases?.includes(legacyId))
    errors.push(`${legacyId}: registry canonical aliases içinde yok`);
}

report("app-module-graph", `app=${apps.length} · module=${modules.length}`, errors);
