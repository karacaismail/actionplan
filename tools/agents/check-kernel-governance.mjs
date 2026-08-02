#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EFFECTIVE_AUTHORITY_CHAIN_REF,
  validateKernelEffectiveAuthorityChain,
} from "../lib/kernel-effective-authority-chain.mjs";
import {
  APPLICATION_STATE_REF,
  resolveApplicationStateEvidence,
  validateKernelGovernanceApplicationState,
} from "../lib/kernel-governance-application-state.mjs";
import { validateKernelGovernance } from "../lib/kernel-governance-audit.mjs";
import { validateKernelGovernanceAuthorization } from "../lib/kernel-governance-authorization-audit.mjs";
import {
  resolveD01AuthorityBoundary,
  validateKernelNodeUniverse,
} from "../lib/kernel-node-universe.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

// The banner reports what the chain the validators just accepted actually says; it never restates a
// hardcoded verdict. The verdict comes from the head entry that validateKernelEffectiveAuthorityChain
// proved above, compared there against the chain's own effectiveAuthorityBoundary, and an unknown
// verdict is a fail-closed exit so the banner can never over-report authority by default.
// RUNTIME_IMPLEMENTATION_START is reported only when the head actually seals that token: no chain
// entry is required to carry it, and inventing a floor the chain never wrote would be the same
// over-report this banner exists to prevent. So an absent token is reported as unbound, while a
// token present with a value outside the closed vocabulary is still a fail-closed exit.
const VERDICTS = new Set(["NO-GO", "GO-KERNEL-DEVELOPMENT-ONLY"]);
// The vocabulary is a Map, so the lookup below reads own entries only. A plain object would have
// resolved inherited Object.prototype names — toString, constructor, valueOf, hasOwnProperty — to
// truthy values, letting a head token outside the closed vocabulary escape the fail-closed exit and
// print native-code text as if the chain had sealed a runtime-implementation-start claim.
// biome-ignore format: the closed runtime-start vocabulary stays compact for the shard budget
const RUNTIME_START = new Map([["NO", "runtime implementation not started"], ["YES", "runtime implementation started"]]);
export const RUNTIME_START_UNBOUND = "runtime implementation start unbound by chain";

// biome-ignore format: the normalized-text token walk stays compact for the shard budget
export const readHeadTokens = (chain) => new Map(String(chain?.entries?.at(-1)?.normalizedText ?? "").split(";").map((segment) => segment.trim()).filter((segment) => segment.includes("=")).map((segment) => [segment.slice(0, segment.indexOf("=")), segment.slice(segment.indexOf("=") + 1)]));

// The single banner/lookup path: it either yields the exact line the gate prints on success, or the
// exact fail-closed diagnosis it prints before exiting 1. Nothing else may decide what the gate says
// about live authority, so a regression test can drive this one function and cover the real gate.
export const resolveLiveAuthorityBanner = (chain) => {
  const verdict = chain?.effectiveAuthorityBoundary?.verdict;
  const runtimeToken = readHeadTokens(chain).get("RUNTIME_IMPLEMENTATION_START");
  // biome-ignore format: the unbound-token fallback stays compact for the shard budget
  const runtimeClaim = runtimeToken === undefined ? RUNTIME_START_UNBOUND : RUNTIME_START.get(runtimeToken);
  if (!VERDICTS.has(verdict) || !runtimeClaim) {
    // biome-ignore format: the fail-closed banner diagnosis stays compact for the shard budget
    return { ok: false, error: `live-authority-unreportable:verdict=${verdict ?? "missing"}:runtimeImplementationStart=${runtimeToken ?? "unbound"}` };
  }
  // biome-ignore format: the pass banner stays compact for the shard budget
  return { ok: true, line: `[kernel-governance] PASS — planning integrity valid; live authority verdict ${verdict}; ${runtimeClaim}` };
};

const main = () => {
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
  const statePath = path.join(ROOT, APPLICATION_STATE_REF);
  const applicationState = fs.existsSync(statePath) ? readJson(APPLICATION_STATE_REF) : null;
  const evidence = resolveApplicationStateEvidence(applicationState, (ref) =>
    fs.existsSync(path.join(ROOT, ref)) ? readJson(ref) : null,
  );
  let universeBoundary;
  try {
    universeBoundary = resolveD01AuthorityBoundary();
  } catch {
    universeBoundary = undefined;
  }
  const errors = [
    ...validateKernelGovernance({ nodes, queue, report, artifacts }),
    ...validateKernelGovernanceAuthorization({ authority, registry, pack, scripts }),
    // biome-ignore format: the application-state gate call stays compact for the shard budget
    ...validateKernelGovernanceApplicationState({ state: applicationState, closure: authority, chain, registry, scripts, evidence }),
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

  const banner = resolveLiveAuthorityBanner(chain);
  if (!banner.ok) {
    console.error("[kernel-governance] FAIL (1)");
    console.error(` - ${banner.error}`);
    process.exit(1);
  }

  console.log(banner.line);
};

// Running is the default: only an entry point positively identified as some OTHER file (a test
// importing this module) skips the gate, so an unresolvable argv can never silently disable it.
// biome-ignore format: the direct-invocation probe stays compact for the shard budget
const realpath = (candidate) => { try { return fs.realpathSync(candidate); } catch { return candidate; } };
const selfPath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const importedByOtherEntry =
  entryPath !== "" && entryPath !== selfPath && realpath(entryPath) !== realpath(selfPath);
if (!importedByOtherEntry) main();
