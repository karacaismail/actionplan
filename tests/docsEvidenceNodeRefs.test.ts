import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_IDS = ["dx-workflow", "platform-factory"] as const;
const EVIDENCE_DOC_REFS = [
  "docs/dod-evidence-schema-directive.md",
  "docs/evidence-taxonomy.md",
] as const;

const readNode = (id: (typeof NODE_IDS)[number]) =>
  JSON.parse(
    fs.readFileSync(path.join(ROOT, "src/data/generated/nodes", `${id}.json`), "utf8"),
  ) as { id: string; refs?: string[] };

describe("docs evidence directives -> WBS node refs", () => {
  for (const id of NODE_IDS) {
    it(`${id} iki kanonik evidence dokümanını tekil refs olarak bağlar`, () => {
      const node = readNode(id);
      expect(node.id).toBe(id);

      for (const ref of EVIDENCE_DOC_REFS) {
        expect(node.refs).toContain(ref);
        expect(node.refs?.filter((candidate) => candidate === ref)).toHaveLength(1);
      }
    });
  }
});
