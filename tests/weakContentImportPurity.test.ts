import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHECKER = "tools/agents/check-weak-content.mjs";
const OUTPUTS = ["reports/weak-content-17.json", "docs/weak-content-17-report.md"];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const digest = (relative: string) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(ROOT, relative)))
    .digest("hex");

describe("weak-content checker import purity", () => {
  it("uses the pure analysis module and leaves tracked reports byte-identical", () => {
    const checker = read(CHECKER);
    expect(checker).toContain('../lib/weak-content-analysis.mjs"');
    expect(checker).not.toContain('./report-weak-content.mjs"');

    const before = Object.fromEntries(OUTPUTS.map((file) => [file, digest(file)]));
    const result = spawnSync(process.execPath, [CHECKER], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(Object.fromEntries(OUTPUTS.map((file) => [file, digest(file)]))).toEqual(before);
  });
});
