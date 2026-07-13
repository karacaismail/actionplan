import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED_REFS: Record<string, string> = {
  "k-archetype-storage": "docs/archetype-storage-canonical-directive.md",
  "app-kernel": "docs/kernel-execution-contract-matrix.md",
  "scale-invariant": "docs/scale-invariant-directive.md",
  "k-wbs": "docs/wbs-field-semantics.md",
};

describe("kernel ve WBS dokümanları node refs entegrasyonu", () => {
  for (const [nodeId, expectedRef] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} ilgili dokümanı exact ve tekil bağlar`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };

      expect(fs.existsSync(path.join(ROOT, expectedRef)), `doküman yok: ${expectedRef}`).toBe(true);
      expect(
        (node.refs ?? []).filter((candidate) => candidate === expectedRef),
        `${nodeId}: exact/tekil ref bekleniyor: ${expectedRef}`,
      ).toHaveLength(1);
    });
  }
});
