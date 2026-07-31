import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";

const digest = (file: string) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const binaryCompare = (left: string, right: string) =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
const makeFixture = () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "reindex-purity-"));
  for (const directory of ["tools/lib", "reports", "src/data", "public/data"])
    fs.mkdirSync(path.join(fixture, directory), { recursive: true });
  for (const relative of [
    "tools/check-reindex-idempotence.mjs",
    "tools/reindex.mjs",
    "tools/lib/kernel-node-universe.mjs",
    HANDOFF,
    "public/data/nodes.json",
  ])
    fs.copyFileSync(path.join(ROOT, relative), path.join(fixture, relative));
  fs.cpSync(path.join(ROOT, "src/data/generated"), path.join(fixture, "src/data/generated"), {
    recursive: true,
  });
  return fixture;
};
const makeStale = (fixture: string) => {
  const nodeDir = path.join(fixture, "src/data/generated/nodes");
  const filename = fs
    .readdirSync(nodeDir)
    .filter((file) => file.endsWith(".json"))
    .sort()[0];
  const nodeFile = path.join(nodeDir, filename);
  const node = JSON.parse(fs.readFileSync(nodeFile, "utf8"));
  node.wbsCode = "__stale_fixture__";
  fs.writeFileSync(nodeFile, `${JSON.stringify(node, null, 2)}\n`);
};
const generatedFiles = (fixture: string) => {
  const nodeDir = path.join(fixture, "src/data/generated/nodes");
  const nodes = fs
    .readdirSync(nodeDir)
    .filter((file) => file.endsWith(".json"))
    .sort(binaryCompare)
    .map((file) => path.join(nodeDir, file));
  return nodes.concat([
    path.join(fixture, "src/data/generated/index.json"),
    path.join(fixture, "src/data/generated/navigation.json"),
    path.join(fixture, "src/data/generated/meta.json"),
    path.join(fixture, "public/data/nodes.json"),
  ]);
};

describe("reindex idempotence checker purity", () => {
  it("reports stale generated data without rewriting the checked checkout", () => {
    const fixture = makeFixture();
    try {
      makeStale(fixture);
      const tracked = generatedFiles(fixture);
      expect(tracked).toHaveLength(621);
      const before = tracked.map(digest);
      const result = spawnSync(
        process.execPath,
        [path.join(fixture, "tools/check-reindex-idempotence.mjs")],
        { cwd: fixture, encoding: "utf8" },
      );

      expect(result.status, result.stdout + result.stderr).toBe(1);
      expect(result.stdout + result.stderr).toContain("[reindex-idempotence] FAIL");
      expect(tracked.map(digest)).toEqual(before);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("blocks corrupt GATE-01 and authority evidence before any generated write", () => {
    const fixture = makeFixture();
    try {
      makeStale(fixture);
      const tracked = generatedFiles(fixture);
      expect(tracked).toHaveLength(621);
      const handoffPath = path.join(fixture, HANDOFF);
      const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
      Object.assign(handoff.provenance.approval, {
        gateId: "GATE-00",
        authority: "worker",
        normalizedSelectionSha256: "stale",
      });
      Object.assign(handoff.authorityBoundary, {
        kernelWriter: "human-fallback",
        gitExecutor: "worker",
        runtimeExecutor: "human-fallback",
      });
      Object.assign(handoff.authorityBoundary.claudeAuthGate, {
        apiProvider: "fallback",
        cachedEvidenceAllowed: true,
      });
      fs.writeFileSync(handoffPath, `${JSON.stringify(handoff, null, 2)}\n`);
      const before = tracked.map(digest);
      const result = spawnSync(process.execPath, [path.join(fixture, "tools/reindex.mjs")], {
        cwd: fixture,
        encoding: "utf8",
      });

      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).toContain("KERNEL-NODE-UNIVERSE FAIL");
      expect(tracked.map(digest)).toEqual(before);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
});
