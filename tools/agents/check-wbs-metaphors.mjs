#!/usr/bin/env node
/**
 * check-wbs-metaphors — WBS doga metaforu tutarlilik kapisi.
 *
 * Kanonik esleme:
 * app=ada, module=dag, archetype=kaya, feature=tas,
 * component=kum, work_unit=molekul, micro_step=atom.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const LEVELS = [
  ["app", "ada"],
  ["module", "dağ"],
  ["archetype", "kaya"],
  ["feature", "taş"],
  ["component", "kum"],
  ["work_unit", "molekül"],
  ["micro_step", "atom"],
];
const LEVEL_KEYS = LEVELS.map(([key]) => key);
const LEVEL_SET = new Set(LEVEL_KEYS);

const OLD_ID_PATTERNS = [
  /-x-archetype\b/,
  /-x-stone\b/,
  /-x-molecule\b/,
  /-x-element\b/,
  /^st-crm-/,
  /^mol-crm-/,
  /^el-crm-/,
  /^at-crm-/,
];

const TEXT_DRIFT_PATTERNS = [
  /\bApp\s*=\s*dağ\b/i,
  /\bModule\s*=\s*kaya\b/i,
  /\bArcheType\s*=\s*(büyük taş|taş)\b/i,
  /\bapp\(dağ\)/i,
  /\bmodule\(kaya\)/i,
  /\barchetype\((büyük taş|taş)\)/i,
  /Uygulamalar \(dağ\)/,
  /stone\/molecule\/element/i,
  /x-stone\/x-molecule\/x-element/i,
  /-x-archetype\b/i,
  /-x-stone\b/i,
  /-x-molecule\b/i,
  /-x-element\b/i,
  /--level-stone\b/,
  /--level-molecule\b/,
  /--level-element\b/,
  /--level-atom\b/,
];

const NODE_TEXT_DRIFT_PATTERNS = [
  ...TEXT_DRIFT_PATTERNS,
  /\bstone\b/i,
  /\bmolecule\b/i,
  /\belement\b/i,
  /\btoz\b/i,
  /büyük taş/i,
  /orta taş/i,
  /küçük taş/i,
  /\bst-crm-/i,
  /\bmol-crm-/i,
  /\bel-crm-/i,
  /\bat-crm-/i,
];

const fails = [];
let aliasCount = 0;

function rel(file) {
  return path.relative(ROOT, file);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fail(message) {
  fails.push(message);
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function isDocumentPathRef(value, pathParts) {
  return pathParts.includes("refs") && /(?:^|\s)docs\/\S+\.md(?:#\S*)?$/.test(value);
}

function withoutDocumentPaths(value) {
  return value.replace(/\bdocs\/[^\s]+\.md(?:#[^\s]+)?/g, "");
}

function trackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function scanStrings(value, visit, pathParts = []) {
  if (typeof value === "string") {
    visit(value, pathParts);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, idx) => scanStrings(item, visit, [...pathParts, String(idx)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      scanStrings(child, visit, [...pathParts, key]);
    }
  }
}

function checkStringsJson() {
  const strings = readJson(path.join(ROOT, "src", "data", "strings.json"));
  for (const [key, metaphor] of LEVELS) {
    if (strings.levels?.[key]?.metaphor !== metaphor) {
      fail(
        `strings-level-metaphor: ${key} beklenen "${metaphor}", bulunan "${strings.levels?.[key]?.metaphor}"`,
      );
    }
  }
  if (strings.ui?.dashboard?.apps !== "Uygulamalar (ada)") {
    fail(`dashboard-apps-label: "${strings.ui?.dashboard?.apps}"`);
  }
}

function checkTaskSchema() {
  const task = fs.readFileSync(path.join(ROOT, "src", "schemas", "task.ts"), "utf8");
  const block = task.match(/export const WBS_LEVELS = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const actual = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (actual.join(",") !== LEVEL_KEYS.join(",")) {
    fail(`task-wbs-level-order: ${actual.join(",")}`);
  }
  for (const [key, metaphor] of LEVELS) {
    if (!block.includes(`"${key}", // ${metaphor}`)) {
      fail(`task-wbs-level-comment: ${key} // ${metaphor} yok`);
    }
  }
  if (!task.includes("aliases: z.array(z.string()).default([])")) {
    fail("task-aliases-schema-yok");
  }
}

function checkCssTokens() {
  const css = fs.readFileSync(path.join(ROOT, "src", "styles", "tokens.css"), "utf8");
  for (const key of ["feature", "component", "work_unit", "micro_step"]) {
    if (!css.includes(`--level-${key}:`)) fail(`css-token-yok: --level-${key}`);
  }
  for (const key of ["stone", "molecule", "element", "atom"]) {
    if (css.includes(`--level-${key}:`)) fail(`css-eski-token: --level-${key}`);
  }
}

function checkGeneratedNodes() {
  const files = fs
    .readdirSync(NODES)
    .filter((file) => file.endsWith(".json"))
    .sort();
  const nodes = files.map((file) => [file, readJson(path.join(NODES, file))]);
  const ids = new Set(nodes.map(([, node]) => node.id));

  for (const [file, node] of nodes) {
    const where = `src/data/generated/nodes/${file}`;
    if (!LEVEL_SET.has(node.level)) fail(`node-level-gecersiz: ${node.id} (${node.level})`);
    for (const field of ["id", "slug", "parentId"]) {
      const value = node[field];
      if (typeof value === "string" && matchesAny(value, OLD_ID_PATTERNS)) {
        fail(`node-eski-id-${field}: ${node.id} -> ${value}`);
      }
    }
    for (const field of ["dependsOn", "blocks", "related"]) {
      for (const ref of node[field] ?? []) {
        if (!ids.has(ref)) fail(`node-dangling-${field}: ${node.id} -> ${ref}`);
        if (matchesAny(ref, OLD_ID_PATTERNS)) fail(`node-eski-ref-${field}: ${node.id} -> ${ref}`);
      }
    }
    for (const alias of node.aliases ?? []) {
      aliasCount++;
      if (matchesAny(alias, OLD_ID_PATTERNS)) {
        fail(`node-eski-alias: ${node.id} -> ${alias}`);
      }
    }
    scanStrings(node, (value, pathParts) => {
      if (pathParts.includes("aliases") || isDocumentPathRef(value, pathParts)) return;
      if (matchesAny(withoutDocumentPaths(value), NODE_TEXT_DRIFT_PATTERNS)) {
        fail(`node-text-drift: ${where}.${pathParts.join(".")} -> ${value.slice(0, 160)}`);
      }
    });
  }
}

function checkPublicNodes() {
  const file = path.join(ROOT, "public", "data", "nodes.json");
  if (!fs.existsSync(file)) return;
  const nodes = readJson(file);
  const ids = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    if (!LEVEL_SET.has(node.level)) fail(`public-node-level-gecersiz: ${node.id} (${node.level})`);
    for (const field of ["id", "slug", "parentId"]) {
      const value = node[field];
      if (typeof value === "string" && matchesAny(value, OLD_ID_PATTERNS)) {
        fail(`public-node-eski-id-${field}: ${node.id} -> ${value}`);
      }
    }
    for (const field of ["dependsOn", "blocks", "related"]) {
      for (const ref of node[field] ?? []) {
        if (!ids.has(ref)) fail(`public-node-dangling-${field}: ${node.id} -> ${ref}`);
        if (matchesAny(ref, OLD_ID_PATTERNS))
          fail(`public-node-eski-ref-${field}: ${node.id} -> ${ref}`);
      }
    }
    for (const alias of node.aliases ?? []) {
      aliasCount++;
      if (matchesAny(alias, OLD_ID_PATTERNS)) {
        fail(`public-node-eski-alias: ${node.id} -> ${alias}`);
      }
    }
    scanStrings(node, (value, pathParts) => {
      if (pathParts.includes("aliases") || isDocumentPathRef(value, pathParts)) return;
      if (matchesAny(withoutDocumentPaths(value), NODE_TEXT_DRIFT_PATTERNS)) {
        fail(`public-node-text-drift: ${node.id}.${pathParts.join(".")} -> ${value.slice(0, 160)}`);
      }
    });
  }
}

function checkTrackedText() {
  const files = trackedFiles().filter(
    (file) =>
      /\.(md|mjs|js|ts|tsx|json|css|html|txt|yml|yaml)$/.test(file) || file === "package.json",
  );
  for (const file of files) {
    if (file === "tools/agents/check-wbs-metaphors.mjs") continue;
    if (file === "public/data/nodes.json") continue;
    let text;
    try {
      text = fs.readFileSync(path.join(ROOT, file), "utf8");
    } catch {
      continue;
    }
    const lines = text.split("\n");
    lines.forEach((line, idx) => {
      if (matchesAny(line, TEXT_DRIFT_PATTERNS)) {
        fail(`tracked-text-drift: ${file}:${idx + 1}: ${line.slice(0, 180)}`);
      }
    });
  }
}

checkStringsJson();
checkTaskSchema();
checkCssTokens();
checkGeneratedNodes();
checkPublicNodes();
checkTrackedText();

console.log(
  `[wbs-metaphors] levels=${LEVEL_KEYS.join(">")} · aliases=${aliasCount} · ihlal=${fails.length}`,
);

if (fails.length) {
  console.error("\nSONUC: KIRMIZI X — WBS doga metaforu drift'i var:");
  for (const item of fails.slice(0, 80)) console.error(`  - ${item}`);
  if (fails.length > 80) console.error(`  ... +${fails.length - 80}`);
  process.exit(1);
}

console.log("SONUC: YESIL OK — WBS metaforlari kanonik ve celiskisiz.");
