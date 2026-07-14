#!/usr/bin/env node
/**
 * Historical swarm handoff preview.
 *
 * Direct Claude execution is permanently disabled. Only Codex may invoke a bounded
 * claude_review or claude_implement task after the account bridge verifies
 * claude.ai / firstParty / max. This file never emulates that bridge.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIRECT_EXECUTION_DISABLED = true;
const shards = JSON.parse(fs.readFileSync(path.join(__dirname, "shards.json"), "utf8")).clusters;
const template = fs.readFileSync(path.join(__dirname, "prompt-template.md"), "utf8");
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv
    .filter((value) => value.startsWith("--"))
    .map((value) => {
      const [key, raw] = value.slice(2).split("=");
      return [key, raw ?? true];
    }),
);
const clusterIds = argv.filter((value) => !value.startsWith("--"));
let selected = shards;
if (clusterIds.length) selected = shards.filter((shard) => clusterIds.includes(shard.cluster));
else if (flags.priority)
  selected = shards.filter((shard) => String(shard.oncelik) === String(flags.priority));

if (selected.length === 0) {
  console.error("[FAIL-CLOSED] No known shard matched the handoff preview selection.");
  process.exit(2);
}

if (!flags["dry-run"] && DIRECT_EXECUTION_DISABLED) {
  console.error(
    "[FAIL-CLOSED] Direct Claude execution is disabled. Only Codex may dispatch claude_review or claude_implement after claude.ai / firstParty / max verification; API/provider fallback is forbidden.",
  );
  process.exit(2);
}

console.log(`Swarm handoff preview: ${selected.length} shard`);
for (const shard of selected) {
  const prompt = template
    .replaceAll("{{CLUSTER}}", shard.cluster)
    .replaceAll("{{CLUSTER_TR}}", shard.tr);
  console.log(`[handoff preview] ${shard.cluster}: ${shard.count} node · ${prompt.length} chars`);
}
