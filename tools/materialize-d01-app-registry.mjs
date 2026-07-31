#!/usr/bin/env node
/** S1-A-backed D01 app-registry reconciler; default check, --apply write. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// biome-ignore format: the complete D01 helper surface stays explicit and compact.
import { nodeIdSetSha256, reconcileD01AppEntries, resolveD01NodeUniverse, validateAppliedD01RegistryDelta } from "./lib/kernel-integration.mjs";

const args = process.argv.slice(2);
// biome-ignore format: every non-apply argument fails before data access.
if (args.length > 1 || args.some((arg) => arg !== "--apply")) { console.error("[d01-app-registry] only --apply is supported"); process.exit(1); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const REGISTRY_PATH = path.join(ROOT, "src/data/app-catalog-decisions.json");
// biome-ignore format: the canonical handoff path stays compact.
const HANDOFF_PATH = path.join(ROOT, "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json");
const APPLY = args.includes("--apply");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
// biome-ignore format: canonical node discovery and ordering stay one audited expression.
const nodeFiles = fs.readdirSync(NODE_DIR).filter((file) => file.endsWith(".json")).sort();
// biome-ignore format: filename-node parity is the complete oracle record.
const records = nodeFiles.map((filename) => ({ filename, node: readJson(path.join(NODE_DIR, filename)) }));
// biome-ignore format: the oracle inputs remain explicit and compact.
const universe = resolveD01NodeUniverse({ records, handoff: readJson(HANDOFF_PATH) });
const registry = readJson(REGISTRY_PATH);

reconcileD01AppEntries(registry.entries, universe);
registry.materializedSnapshot.expectedNodeCount = universe.expectedNodeCount;
// biome-ignore format: applied delta owns the optional exact-set evidence atomically.
registry.d01MaterializedSnapshot = universe.appliedRows.length > 0 ? { expectedNodeCount: universe.expectedNodeCount, nodeSetSha256: nodeIdSetSha256(records.map(({ node }) => node.id)) } : undefined;

// biome-ignore format: app-entry validation is a single fail-closed oracle call.
const errors = validateAppliedD01RegistryDelta({ appliedRows: universe.appliedRows, appEntries: registry.entries });
const liveIds = records.map(({ node }) => node.id).sort();
const registryIds = Object.keys(registry.entries).sort();
if (JSON.stringify(registryIds) !== JSON.stringify(liveIds))
  errors.push("app-registry-live-id-drift");
// biome-ignore format: all oracle failures report before any write.
if (errors.length) { console.error(`[d01-app-registry] FAIL (${errors.length})`); for (const error of errors) console.error(` - ${error}`); process.exit(1); }

const next = `${JSON.stringify(registry, null, 2)}\n`;
const current = fs.readFileSync(REGISTRY_PATH, "utf8");
const drift = current !== next;
if (drift && APPLY) fs.writeFileSync(REGISTRY_PATH, next);
// biome-ignore format: dry-run drift is a fail-closed exit.
if (drift && !APPLY) { console.error("[d01-app-registry] drift: src/data/app-catalog-decisions.json"); process.exit(1); }
// biome-ignore format: the deterministic result line stays compact.
console.log(`[d01-app-registry] ${APPLY ? "materialized" : "verified"}: node=${universe.expectedNodeCount}, applied=${universe.appliedRows.length}`);
