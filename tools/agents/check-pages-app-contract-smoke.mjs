#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const BASE_PATH = "/actionplan/";
const DEEP_ROUTES = ["task/s-clinic", "task/s-clinic-core", "task/dist-clinic"];

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const dist = path.resolve(option("--dist", "dist"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function readRequired(relative) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file)) {
    failures.push(`eksik Pages artefaktı: dist/${relative}`);
    return undefined;
  }
  return fs.readFileSync(file, "utf8");
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function checkSdk(prefix, value) {
  const sdk = object(value);
  check(sdk.required === true, `${prefix}.required=true olmalı`);
  check(sdk.manualEditAllowed === false, `${prefix}.manualEditAllowed=false olmalı`);
  check(sdk.publicPortsOnly === true, `${prefix}.publicPortsOnly=true olmalı`);
  check(sdk.kernelInternalsAllowed === false, `${prefix}.kernelInternalsAllowed=false olmalı`);
}

function checkEnterprise(prefix, value) {
  const enterprise = object(value);
  check(enterprise.targetGrade === "enterprise", `${prefix}.targetGrade=enterprise olmalı`);
  check(
    enterprise.deliveryPolicy === "enterprise-only",
    `${prefix}.deliveryPolicy=enterprise-only olmalı`,
  );
  check(enterprise.mvpAllowed === false, `${prefix}.mvpAllowed=false olmalı`);
}

function checkApp(node) {
  check(node.level === "app", "s-clinic.level=app olmalı");
  check(node.artifactKind === "sellable-app", "s-clinic.artifactKind=sellable-app olmalı");
  const definition = object(node.appDefinition);
  check(
    definition.artifactKind === "sellable-app",
    "s-clinic.appDefinition.artifactKind=sellable-app olmalı",
  );
  check(definition.productSlug === "s-clinic", "s-clinic.appDefinition.productSlug tutarsız");
  check(
    definition.appCoreModuleId === "s-clinic-core",
    "s-clinic.appDefinition.appCoreModuleId=s-clinic-core olmalı",
  );
  check(
    definition.requiredModuleIds?.includes("s-clinic-core"),
    "s-clinic.appDefinition.requiredModuleIds app-core'u içermeli",
  );
  check(
    object(definition.classification).primaryCategory === "sector-app",
    "s-clinic.appDefinition.classification.primaryCategory=sector-app olmalı",
  );
  check(
    object(definition.commercialModel).licensingModel === "enterprise-subscription",
    "s-clinic.appDefinition.commercialModel.licensingModel=enterprise-subscription olmalı",
  );
  checkSdk("s-clinic.appDefinition.sdkDelivery", definition.sdkDelivery);
  checkEnterprise("s-clinic.appDefinition.enterpriseDelivery", definition.enterpriseDelivery);
}

function checkCore(node) {
  check(node.level === "module", "s-clinic-core.level=module olmalı");
  check(
    node.artifactKind === "app-core-module",
    "s-clinic-core.artifactKind=app-core-module olmalı",
  );
  check(node.parentId === "s-clinic", "s-clinic-core.parentId=s-clinic olmalı");
  const definition = object(node.moduleDefinition);
  check(
    definition.artifactKind === "app-core-module",
    "s-clinic-core.moduleDefinition.artifactKind=app-core-module olmalı",
  );
  check(
    definition.moduleId === "s-clinic-core",
    "s-clinic-core.moduleDefinition.moduleId tutarsız",
  );
  check(definition.appId === "s-clinic", "s-clinic-core.moduleDefinition.appId=s-clinic olmalı");
  check(
    definition.appCoreModuleId === "s-clinic-core",
    "s-clinic-core.moduleDefinition.appCoreModuleId tutarsız",
  );
  checkSdk("s-clinic-core.moduleDefinition.sdkDelivery", definition.sdkDelivery);
  checkEnterprise(
    "s-clinic-core.moduleDefinition.enterpriseDelivery",
    definition.enterpriseDelivery,
  );
}

function checkAlias(node) {
  check(node.level === "module", "dist-clinic.level=module olmalı");
  check(node.artifactKind === "legacy-alias", "dist-clinic.artifactKind=legacy-alias olmalı");
  check(node.canonicalId === "s-clinic", "dist-clinic.canonicalId=s-clinic olmalı");
}

const indexHtml = readRequired("index.html");
if (indexHtml !== undefined) {
  const fallbackHtml = readRequired("404.html");
  if (fallbackHtml !== undefined)
    check(fallbackHtml === indexHtml, "dist/404.html production index ile byte-parity taşımalı");

  for (const route of DEEP_ROUTES) {
    const routeHtml = readRequired(`${route}/index.html`);
    if (routeHtml !== undefined)
      check(
        routeHtml === indexHtml,
        `dist/${route}/index.html production index ile byte-parity taşımalı`,
      );
  }

  const assetRefs = [...indexHtml.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/g)].map(
    (match) => match[1],
  );
  check(assetRefs.length > 0, "production index asset referansı içermeli");
  for (const ref of assetRefs)
    check(
      ref.startsWith(`${BASE_PATH}assets/`),
      `asset ${ref} ${BASE_PATH} base path altında olmalı`,
    );

  const moduleSrc = indexHtml.match(
    /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/,
  )?.[1];
  check(Boolean(moduleSrc), "production index module bundle referansı içermeli");
  if (moduleSrc?.startsWith(BASE_PATH)) {
    const bundle = readRequired(moduleSrc.slice(BASE_PATH.length));
    if (bundle !== undefined) {
      check(
        bundle.includes(`${BASE_PATH}data/nodes.json`),
        `runtime nodes URL ${BASE_PATH}data/nodes.json olmalı`,
      );
      check(
        new RegExp(`basepath\\s*:\\s*["']${BASE_PATH.replaceAll("/", "\\/")}["']`).test(bundle),
        `router basepath ${BASE_PATH} olmalı`,
      );
    }
  }
}

const rawNodes = readRequired("data/nodes.json");
if (rawNodes !== undefined) {
  try {
    const nodes = JSON.parse(rawNodes);
    check(Array.isArray(nodes), "dist/data/nodes.json bir JSON dizisi olmalı");
    if (Array.isArray(nodes)) {
      const index = new Map(nodes.map((node) => [node?.id, node]));
      for (const id of ["s-clinic", "s-clinic-core", "dist-clinic"])
        check(index.has(id), `dist/data/nodes.json ${id} kaydını içermeli`);
      if (index.has("s-clinic")) checkApp(index.get("s-clinic"));
      if (index.has("s-clinic-core")) checkCore(index.get("s-clinic-core"));
      if (index.has("dist-clinic")) checkAlias(index.get("dist-clinic"));
    }
  } catch (error) {
    failures.push(`dist/data/nodes.json parse edilemedi: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`[pages-app-smoke] FAIL (${failures.length})\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(
    `[pages-app-smoke] PASS: ${DEEP_ROUTES.length} deep routes + ${BASE_PATH} base + typed app/core/alias`,
  );
}
