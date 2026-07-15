#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LEGACY_PLATFORM_WRITERS,
  LEGACY_PLATFORM_WRITER_MARKER,
  inspectLegacyPlatformWriter,
} from "../lib/legacy-platform-writer-quarantine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-platform-writers-"));

const copyFile = (relative) => {
  const target = path.join(fixtureRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(ROOT, relative), target);
};

fs.cpSync(
  path.join(ROOT, "src/data/generated/nodes"),
  path.join(fixtureRoot, "src/data/generated/nodes"),
  { recursive: true },
);
fs.cpSync(
  path.join(ROOT, "tools/platform-content"),
  path.join(fixtureRoot, "tools/platform-content"),
  {
    recursive: true,
  },
);
for (const file of [...LEGACY_PLATFORM_WRITERS, "tools/lib/legacy-platform-writer-quarantine.mjs"])
  copyFile(file);

try {
  for (const writer of LEGACY_PLATFORM_WRITERS) {
    const source = fs.readFileSync(path.join(ROOT, writer), "utf8");
    errors.push(...inspectLegacyPlatformWriter(source, writer));
    const result = spawnSync(process.execPath, [path.join(fixtureRoot, writer)], {
      cwd: fixtureRoot,
      encoding: "utf8",
    });
    if (result.status !== 2) errors.push(`${writer}: direct execution exit=${result.status}`);
    if (!result.stderr.includes(LEGACY_PLATFORM_WRITER_MARKER))
      errors.push(`${writer}: quarantine marker missing`);
  }
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

if (errors.length) {
  console.error(`[legacy-platform-writer-quarantine] FAIL (${errors.length})`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log(
  `[legacy-platform-writer-quarantine] PASS — ${LEGACY_PLATFORM_WRITERS.length} stale writer fail-closed`,
);
