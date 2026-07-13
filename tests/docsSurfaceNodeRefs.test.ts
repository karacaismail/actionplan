import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const SURFACE_DOC_REFS: Record<string, string[]> = {
  "k-surface": [
    "docs/surface-spec.md",
    "docs/surface-v2-directive.md",
    "docs/surface-tree-metadataform-addendum.md",
  ],
  "k-surface-consumer": [
    "docs/surface-spec.md",
    "docs/surface-v2-directive.md",
    "docs/surface-counterparty-portal-addendum.md",
    "docs/surface-esign-document-addendum.md",
  ],
};

describe("DOC-SURFACE-REF-1 surface sözleşmeleri ilgili WBS düğümlerinden erişilebilir", () => {
  for (const [nodeId, docPaths] of Object.entries(SURFACE_DOC_REFS)) {
    it(`${nodeId} anlamlı surface dokümanlarına bağlanır`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };

      for (const docPath of docPaths) {
        expect(fs.existsSync(path.join(ROOT, docPath)), `doküman yok: ${docPath}`).toBe(true);
        expect(
          (node.refs ?? []).some((ref) => ref.includes(docPath)),
          `${nodeId}: refs[] içinde ${docPath} yok`,
        ).toBe(true);
      }
    });
  }
});
