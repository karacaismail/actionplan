import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = {
  coverage: "docs/kapsama-matrisi-kernel-archetype-surface-2026-07-01.md",
  evmTenant: "docs/kapsama-matrisi-arsam-panel-2026-07-12.md",
  ecaPreview: "docs/kume-e-panel-eca-plan.md",
  panelTier: "docs/panel-tier-contract.md",
} as const;

const EXPECTED_REFS = {
  "k-control-planes": Object.values(DOCS),
  "k-boyut1-ops-panel": [DOCS.coverage],
  "k-boyut2-developer-panel": [DOCS.coverage, DOCS.ecaPreview, DOCS.panelTier],
  "k-boyut3-tenant-panel": [DOCS.coverage, DOCS.evmTenant, DOCS.panelTier],
} as const;

const readNode = (id: keyof typeof EXPECTED_REFS) =>
  JSON.parse(
    fs.readFileSync(path.join(ROOT, "src/data/generated/nodes", `${id}.json`), "utf8"),
  ) as { id: string; refs?: string[] };

describe("panel docs -> WBS node refs", () => {
  it("bağlanan panel dokümanlarının tümü repoda vardır", () => {
    for (const ref of Object.values(DOCS)) {
      expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
    }
  });

  for (const [id, expectedRefs] of Object.entries(EXPECTED_REFS) as [
    keyof typeof EXPECTED_REFS,
    readonly string[],
  ][]) {
    it(`${id} semantik kapsamındaki panel dokümanlarını tekil bağlar`, () => {
      const node = readNode(id);
      expect(node.id).toBe(id);

      for (const ref of expectedRefs) {
        expect(node.refs).toContain(ref);
        expect(node.refs?.filter((candidate) => candidate === ref)).toHaveLength(1);
      }
    });
  }
});
