import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "s-ai-governance": ["docs/ai-governance-master.md"],
  "sus-ai-uretim-sozlesmesi": ["docs/ai-governance-master.md"],
  "std-ci-gates": ["docs/ci-conformance-gates.md"],
  "std-schema-foundation": ["docs/dimension-migration-runbook.md"],
  "std-docs": [
    "docs/icerik-kalite-sozlesmesi.md",
    "docs/prompt-template-library.md",
  ],
  "std-contracts": ["docs/release-policy.md", "docs/waiver-policy.md"],
};

describe("governance dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} ilgili governance dokümanlarını exact ve tekil bağlar`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };

      for (const ref of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
        expect(
          (node.refs ?? []).filter((candidate) => candidate === ref),
          `${nodeId}: exact/tekil ref bekleniyor: ${ref}`,
        ).toHaveLength(1);
      }
    });
  }
});
