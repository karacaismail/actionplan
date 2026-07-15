import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHECKER = "tools/agents/check-legacy-platform-writer-quarantine.mjs";
const WRITERS = [
  "tools/gen-platform.mjs",
  "tools/gen-platform-content.mjs",
  "tools/gen-platform-meta.mjs",
];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const canonicalDigest = () => {
  const nodeDir = path.join(ROOT, "src/data/generated/nodes");
  const files = fs
    .readdirSync(nodeDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join("src/data/generated/nodes", file))
    .concat(["src/data/generated/meta.json", "public/data/nodes.json"]);
  const hash = crypto.createHash("sha256");
  for (const file of files) hash.update(file).update("\0").update(read(file));
  return hash.digest("hex");
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
});
