#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LEGACY_PLATFORM_WRITERS,
  LEGACY_PLATFORM_WRITER_MARKER,
  inspectLegacyPlatformWriter,
} from "../lib/legacy-platform-writer-quarantine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];

for (const writer of LEGACY_PLATFORM_WRITERS) {
  const absolute = path.join(ROOT, writer);
  const source = fs.readFileSync(absolute, "utf8");
  errors.push(...inspectLegacyPlatformWriter(source, writer));
  const result = spawnSync(process.execPath, [absolute], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 2) errors.push(`${writer}: direct execution exit=${result.status}`);
  if (!result.stderr.includes(LEGACY_PLATFORM_WRITER_MARKER))
    errors.push(`${writer}: quarantine marker missing`);
}

if (errors.length) {
  console.error(`[legacy-platform-writer-quarantine] FAIL (${errors.length})`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log(
  `[legacy-platform-writer-quarantine] PASS — ${LEGACY_PLATFORM_WRITERS.length} stale writer fail-closed`,
);
