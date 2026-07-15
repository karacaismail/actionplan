import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHECKER = "tools/agents/check-legacy-platform-writer-quarantine.mjs";
const WRITERS = [
  "tools/gen-platform.mjs",
  "tools/gen-platform-content.mjs",
  "tools/gen-platform-meta.mjs",
];

const read = (relative: string, root = ROOT) => fs.readFileSync(path.join(root, relative), "utf8");
const canonicalDigest = (root = ROOT) => {
  const nodeDir = path.join(root, "src/data/generated/nodes");
  const files = fs
    .readdirSync(nodeDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join("src/data/generated/nodes", file))
    .concat(["src/data/generated/meta.json", "public/data/nodes.json"]);
  const hash = crypto.createHash("sha256");
  for (const file of files) hash.update(file).update("\0").update(read(file, root));
  return hash.digest("hex");
};
const fixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-writer-purity-"));
  for (const dir of ["tools/agents", "tools/lib", "src/data/generated", "public/data"])
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of [CHECKER, ...WRITERS, "tools/lib/legacy-platform-writer-quarantine.mjs"]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), path.join(root, file));
  }
  fs.cpSync(
    path.join(ROOT, "src/data/generated/nodes"),
    path.join(root, "src/data/generated/nodes"),
    { recursive: true },
  );
  for (const file of ["src/data/generated/meta.json", "public/data/nodes.json"])
    fs.copyFileSync(path.join(ROOT, file), path.join(root, file));
  fs.cpSync(path.join(ROOT, "tools/platform-content"), path.join(root, "tools/platform-content"), {
    recursive: true,
  });
  return root;
};

describe("legacy platform writer quarantine", () => {
  it("blocks every stale writer before canonical data can change", () => {
    for (const writer of WRITERS) {
      const source = read(writer);
      const guard = `blockLegacyPlatformWriter("${writer}");`;
      expect(source).toContain(guard);
      expect(source.indexOf(guard)).toBeLessThan(source.indexOf("writeFileSync"));
    }

    const before = canonicalDigest();
    const result = spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(canonicalDigest()).toBe(before);

    const scripts = JSON.parse(read("package.json")).scripts;
    expect(scripts["qa:legacy-platform-writers"]).toBe(
      "node tools/agents/check-legacy-platform-writer-quarantine.mjs",
    );
    expect(scripts["qa:ci"]).toContain("npm run qa:legacy-platform-writers");
    const workflow = read(".github/workflows/deploy.yml");
    expect(workflow).toContain("run: npm run qa:legacy-platform-writers");
  });

  it("keeps a guard-regression writer isolated from the checked checkout", () => {
    const root = fixture();
    try {
      const writer = WRITERS[0];
      const guard = `blockLegacyPlatformWriter("${writer}");`;
      const writerPath = path.join(root, writer);
      const source = fs.readFileSync(writerPath, "utf8");
      fs.writeFileSync(writerPath, source.replace(guard, ""));
      expect(fs.readFileSync(writerPath, "utf8")).not.toContain(guard);

      const before = canonicalDigest(root);
      const result = spawnSync(process.execPath, [path.join(root, CHECKER)], {
        cwd: root,
        encoding: "utf8",
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
      expect(canonicalDigest(root)).toBe(before);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
