import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const digest = (file: string) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

describe("reindex idempotence checker purity", () => {
  it("reports stale generated data without rewriting the checked checkout", () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "reindex-purity-"));
    try {
      fs.mkdirSync(path.join(fixture, "tools"), { recursive: true });
      fs.mkdirSync(path.join(fixture, "src/data"), { recursive: true });
      fs.mkdirSync(path.join(fixture, "public/data"), { recursive: true });
      fs.copyFileSync(
        path.join(ROOT, "tools/check-reindex-idempotence.mjs"),
        path.join(fixture, "tools/check-reindex-idempotence.mjs"),
      );
      fs.copyFileSync(
        path.join(ROOT, "tools/reindex.mjs"),
        path.join(fixture, "tools/reindex.mjs"),
      );
      fs.cpSync(path.join(ROOT, "src/data/generated"), path.join(fixture, "src/data/generated"), {
        recursive: true,
      });
      fs.copyFileSync(
        path.join(ROOT, "public/data/nodes.json"),
        path.join(fixture, "public/data/nodes.json"),
      );

      const nodeDir = path.join(fixture, "src/data/generated/nodes");
      const nodeFile = path.join(
        nodeDir,
        fs
          .readdirSync(nodeDir)
          .filter((file) => file.endsWith(".json"))
          .sort()[0],
      );
      const node = JSON.parse(fs.readFileSync(nodeFile, "utf8"));
      node.wbsCode = "__stale_fixture__";
      fs.writeFileSync(nodeFile, `${JSON.stringify(node, null, 2)}\n`);

      const tracked = [
        nodeFile,
        path.join(fixture, "src/data/generated/index.json"),
        path.join(fixture, "src/data/generated/navigation.json"),
        path.join(fixture, "src/data/generated/meta.json"),
        path.join(fixture, "public/data/nodes.json"),
      ];
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
});
