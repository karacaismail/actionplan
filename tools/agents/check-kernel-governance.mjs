#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EFFECTIVE_AUTHORITY_CHAIN_REF,
  validateKernelEffectiveAuthorityChain,
} from "../lib/kernel-effective-authority-chain.mjs";
import { validateKernelGovernance } from "../lib/kernel-governance-audit.mjs";
import { validateKernelGovernanceAuthorization } from "../lib/kernel-governance-authorization-audit.mjs";
import {
  resolveD01AuthorityBoundary,
  validateKernelNodeUniverse,
} from "../lib/kernel-node-universe.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const nodeRecords = fs
  .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
  .filter((file) => file.endsWith(".json"))
  .map((filename) => ({
    filename,
    node: readJson(`src/data/generated/nodes/${filename}`),
  }));
const nodes = nodeRecords.map(({ node }) => node);
const queue = readJson("reports/platform-implementation-execution-queue-2026-07-09.json");
const report = readJson("reports/kernel-governance-gap-addendum-2026-07-15.json");
const handoff = readJson("reports/kernel-code-bearing-descendant-handoff-2026-07-15.json");
const artifacts = {
  adrCollisions: readJson("reports/kernel-adr-collision-source-bindings-2026-07-15.json"),
  ghostBindings: readJson("reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json"),
  tenancyAuthority: readJson("reports/kernel-tenancy-authority-inventory-2026-07-15.json"),
};
const authority = readJson("reports/kernel-governance-closure-authority-2026-07-31.json");
const registry = readJson("reports/kernel-governance-decision-registry-2026-07-15.json");
const pack = fs.readFileSync(
  path.join(ROOT, "docs/kernel-governance-decision-pack-2026-07-15.md"),
  "utf8",
);
const scripts = readJson("package.json").scripts;
const chainPath = path.join(ROOT, EFFECTIVE_AUTHORITY_CHAIN_REF);
const chain = fs.existsSync(chainPath) ? readJson(EFFECTIVE_AUTHORITY_CHAIN_REF) : null;
let universeBoundary;
try {
  universeBoundary = resolveD01AuthorityBoundary();
} catch {
  universeBoundary = undefined;
}
const errors = [
  ...validateKernelGovernance({ nodes, queue, report, artifacts }),
  ...validateKernelGovernanceAuthorization({ authority, registry, pack, scripts }),
  ...validateKernelEffectiveAuthorityChain({
    chain,
    closure: authority,
    handoff,
    universeBoundary,
  }),
  ...validateKernelNodeUniverse({ records: nodeRecords, handoff }).errors,
];

if (errors.length) {
  console.error(`[kernel-governance] FAIL (${errors.length})`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log("[kernel-governance] PASS — planning integrity valid; runtime verdict remains NO-GO");
