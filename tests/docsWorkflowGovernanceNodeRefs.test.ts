import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "k-schema": ["docs/claude-ai-archetype-eca-directive.md"],
  "l1-workflow": [
    "docs/claude-ai-archetype-eca-directive.md",
    "docs/workflow-directive.md",
  ],
  "dx-workflow": [
    "docs/doc-maintainer-operating-boundary.md",
    "docs/platform-product-code-write-prohibition-directive.md",
  ],
  "edu-vibecoding-ilk-nokta": ["docs/vibecoding-prompt-playbook.md"],
};

describe("workflow ve AI-boundary dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} ilgili dokümanlara exact ve tekil ref verir`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };

      for (const ref of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
        expect(
          node.refs?.filter((candidate) => candidate === ref),
          `${nodeId}: exact/tekil ref bekleniyor ${ref}`,
        ).toHaveLength(1);
      }
    });
  }
});
