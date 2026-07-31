#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const stage = args[0];
const apply = args[1];
const validStage = stage === "app" || stage === "kernel";
const validApply = args.length === 1 || (args.length === 2 && apply === "--apply");
// biome-ignore format: reject every unknown, reordered or duplicate argument before spawning.
if (!validStage || !validApply) { console.error("[d01-materializer] usage: <app|kernel> [--apply]"); process.exit(64); }

// biome-ignore format: the closed public-stage map stays compact.
const scripts = { app: "materialize-app-module-contracts.mjs", kernel: "materialize-kernel-integrations.mjs" };
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), scripts[stage]);
const childArgs = [script, ...(apply === "--apply" ? ["--apply"] : [])];
// biome-ignore format: shell-free child execution is one atomic boundary.
const result = spawnSync(process.execPath, childArgs, { shell: false, stdio: "inherit" });
// biome-ignore format: spawn errors fail closed before exit propagation.
if (result.error) { console.error(`[d01-materializer] spawn failed: ${result.error.message}`); process.exit(1); }
process.exit(result.status ?? 1);
