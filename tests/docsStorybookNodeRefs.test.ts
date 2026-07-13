import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const NODE_PATH = path.join(ROOT, "src/data/generated/nodes/platform-ui-surface.json");
const STORYBOOK_DOCS = [
  "docs/storybook-implementation.md",
  "docs/storybook-master-component-integration-directive.md",
  "docs/storybook-governance-pack.md",
];

describe("DOC-STORYBOOK-REF-1 Storybook sözleşmeleri UI surface düğümünden erişilebilir", () => {
  const node = JSON.parse(fs.readFileSync(NODE_PATH, "utf8")) as { refs?: string[] };

  for (const docPath of STORYBOOK_DOCS) {
    it(`${docPath} exact ve tekil bağlanır`, () => {
      expect(fs.existsSync(path.join(ROOT, docPath)), `doküman yok: ${docPath}`).toBe(true);
      expect((node.refs ?? []).filter((ref) => ref === docPath)).toHaveLength(1);
    });
  }
});
