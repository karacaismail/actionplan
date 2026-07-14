#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const NODES_DIR = path.join(ROOT, "src/data/generated/nodes");
const matrix = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/standards-applicability.json"), "utf8"),
);
const profiles = new Set(
  JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/tech-profiles.json"), "utf8")).profiles.map(
    (profile) => profile.id,
  ),
);
const uiRoles = new Set(matrix.surfaceOverlays.frontendUi.uiArtifactRoles);

function haystack(node) {
  return [node.id, node.title, node.summary ?? "", ...(node.tags ?? [])].join(" ");
}

function inferTechProfile(node) {
  const value = haystack(node);
  if (/geo|map|harita|viz|chart|dashboard|gantt|graph|bi\b|analytics/i.test(value))
    return "data-viz";
  if (/landing|frontpage|blog|static|statik|public page/i.test(value)) return "static-frontpage";
  if (/actionplan|projector|tooling|internal tool|iç araç/i.test(value)) return "tooling";
  return "saas-app";
}

function applies(overlay, node, text) {
  if (overlay.levels && !overlay.levels.includes(node.level)) return false;
  if (overlay.uiArtifactRoles && !overlay.uiArtifactRoles.includes(node.uiArtifactRole ?? ""))
    return false;
  return new RegExp(overlay.match, "i").test(text);
}

const files = fs
  .readdirSync(NODES_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();
let changedNodes = 0;
let addedRefs = 0;
const changes = [];

for (const file of files) {
  const filePath = path.join(NODES_DIR, file);
  const node = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const refs = { ...(node.standardRefs ?? {}) };
  const before = JSON.stringify(refs);

  for (const key of matrix.requiredByLevel[node.level] ?? []) {
    refs[key] = matrix.canonicalRefValues[key];
  }

  if (uiRoles.has(node.uiArtifactRole ?? "")) {
    for (const key of matrix.surfaceOverlays.frontendUi.requiredRefs) {
      if (key === "techProfileRef") {
        if (!profiles.has(refs[key])) refs[key] = inferTechProfile(node);
      } else refs[key] = matrix.canonicalRefValues[key];
    }
  }

  const text = haystack(node);
  for (const overlay of matrix.semanticOverlays ?? []) {
    if (!applies(overlay, node, text)) continue;
    Object.assign(refs, overlay.requiredRefs);
  }

  if (JSON.stringify(refs) === before) continue;
  addedRefs += Object.keys(refs).filter((key) => !node.standardRefs?.[key]).length;
  changedNodes++;
  changes.push(node.id);
  node.standardRefs = refs;
  if (APPLY) fs.writeFileSync(filePath, `${JSON.stringify(node, null, 2)}\n`);
}

console.log(
  `[standard-applicability] ${changedNodes} node · ${addedRefs} yeni ref · ${APPLY ? "APPLY" : changedNodes > 0 ? "DRIFT" : "OK"}`,
);
if (!APPLY && changedNodes > 0) {
  console.log(
    `DRIFT: node tools/apply-standard-applicability.mjs --apply (${changes.slice(0, 20).join(", ")})`,
  );
  process.exit(1);
}
