import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "s-pim": ["docs/pim-ozellik-yonerge-kapsama.md", "docs/pim-product-archetype-referans.md"],
  "s-esign": [
    "docs/agreement-clm-app-referans.md",
    "docs/kapsama-matrisi-agreement-clm-2026-07-01.md",
  ],
};

describe("domain dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} ilgili PIM/CLM dokümanlarına exact ref verir`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };

      for (const ref of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
        expect(node.refs, `${nodeId}: ref eksik ${ref}`).toContain(ref);
      }
    });
  }
});
