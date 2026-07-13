#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = path.join(ROOT, "src/data/generated");
const NODE_DIR = path.join(GENERATED, "nodes");
const FILES = [
  ...fs
    .readdirSync(NODE_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(NODE_DIR, file)),
  path.join(GENERATED, "index.json"),
  path.join(GENERATED, "navigation.json"),
  path.join(GENERATED, "meta.json"),
  path.join(ROOT, "public/data/nodes.json"),
];

const digest = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const snapshot = () => new Map(FILES.map((file) => [file, digest(file)]));

const before = snapshot();
execFileSync(process.execPath, [path.join(ROOT, "tools/reindex.mjs")], {
  cwd: ROOT,
  stdio: "inherit",
});
const afterFirst = snapshot();
execFileSync(process.execPath, [path.join(ROOT, "tools/reindex.mjs")], {
  cwd: ROOT,
  stdio: "inherit",
});
const afterSecond = snapshot();
const stale = FILES.filter((file) => before.get(file) !== afterFirst.get(file));
const unstable = FILES.filter((file) => afterFirst.get(file) !== afterSecond.get(file));

if (stale.length || unstable.length) {
  console.error(
    [
      "[reindex-idempotence] FAIL",
      stale.length
        ? `stale generated çıktı:\n${stale.map((file) => path.relative(ROOT, file)).join("\n")}`
        : "",
      unstable.length
        ? `ikinci üretimde byte drift:\n${unstable.map((file) => path.relative(ROOT, file)).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  process.exit(1);
}

console.log(`[reindex-idempotence] PASS — ${FILES.length} generated dosya byte-stable.`);
