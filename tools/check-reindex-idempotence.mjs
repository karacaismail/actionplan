#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_RELATIVE_DIR = "src/data/generated/nodes";
const nodeFiles = fs
  .readdirSync(path.join(SOURCE_ROOT, NODE_RELATIVE_DIR))
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => path.join(NODE_RELATIVE_DIR, file));
const trackedFiles = nodeFiles.concat([
  "src/data/generated/index.json",
  "src/data/generated/navigation.json",
  "src/data/generated/meta.json",
  "public/data/nodes.json",
]);

const digest = (root, relative) =>
  createHash("sha256")
    .update(fs.readFileSync(path.join(root, relative)))
    .digest("hex");
const snapshot = (root) => new Map(trackedFiles.map((file) => [file, digest(root, file)]));
const changed = (before, after) =>
  trackedFiles.filter((file) => before.get(file) !== after.get(file));

const assertRegularFile = (file) => {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`[reindex-idempotence] regular file required: ${file}`);
  }
};

const copyIntoFixture = (fixtureRoot, relative) => {
  const source = path.join(SOURCE_ROOT, relative);
  const target = path.join(fixtureRoot, relative);
  assertRegularFile(source);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const sourceBefore = snapshot(SOURCE_ROOT);
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "actionplan-reindex-"));
try {
  for (const file of trackedFiles) copyIntoFixture(fixtureRoot, file);
  copyIntoFixture(fixtureRoot, "tools/reindex.mjs");

  const fixtureBefore = snapshot(fixtureRoot);
  const runReindex = () =>
    execFileSync(process.execPath, [path.join(fixtureRoot, "tools/reindex.mjs")], {
      cwd: fixtureRoot,
      env: { ...process.env, SOURCE_DATE_EPOCH: "0" },
      stdio: "inherit",
    });

  runReindex();
  const afterFirst = snapshot(fixtureRoot);
  runReindex();
  const afterSecond = snapshot(fixtureRoot);
  const sourceAfter = snapshot(SOURCE_ROOT);

  const stale = changed(fixtureBefore, afterFirst);
  const unstable = changed(afterFirst, afterSecond);
  const sourceMutation = changed(sourceBefore, sourceAfter);

  if (sourceMutation.length) {
    console.error(
      `[reindex-idempotence] FAIL — source checkout changed:\n${sourceMutation.join("\n")}`,
    );
    process.exitCode = 2;
  } else if (stale.length || unstable.length) {
    console.error(
      [
        "[reindex-idempotence] FAIL",
        stale.length ? `stale generated çıktı:\n${stale.join("\n")}` : "",
        unstable.length ? `ikinci üretimde byte drift:\n${unstable.join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    process.exitCode = 1;
  } else {
    console.log(`[reindex-idempotence] PASS — ${trackedFiles.length} generated dosya byte-stable.`);
  }
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
