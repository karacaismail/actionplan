import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_REFS: Record<string, string> = {
  "k-bus": "docs/event-replay-projection-contract.md",
  "k-agent-runtime": "docs/execution-context-envelope-directive.md",
};

describe("execution dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRef] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} execution dokümanına exact ve tekil ref verir`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };

      expect(fs.existsSync(path.join(ROOT, expectedRef)), `doküman yok: ${expectedRef}`).toBe(true);
      expect(
        node.refs?.filter((ref) => ref === expectedRef),
        `${nodeId}: exact/tekil ref bekleniyor`,
      ).toHaveLength(1);
    });
  }
});
