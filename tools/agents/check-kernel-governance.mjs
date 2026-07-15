#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateKernelGovernance } from "../lib/kernel-governance-audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const nodes = fs
  .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => readJson(`src/data/generated/nodes/${file}`));
const queue = readJson("reports/platform-implementation-execution-queue-2026-07-09.json");
const report = readJson("reports/kernel-governance-gap-addendum-2026-07-15.json");
const errors = validateKernelGovernance({ nodes, queue, report });

if (errors.length) {
  console.error(`[kernel-governance] FAIL (${errors.length})`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log("[kernel-governance] PASS — planning integrity valid; runtime verdict remains NO-GO");
