import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "cc-i18n-standards": ["docs/i18n-standard.md", "docs/standards/01-i18n-l10n-g11n-standard.md"],
  "cc-privacy": ["docs/privacy-retention-decision-matrix.md"],
  "cc-obs": [
    "docs/enterprise-saas-phase-5e-reliability-operations-candidates.md",
    "docs/standards/08-observability-standard.md",
  ],
  "cc-security": ["docs/standards/11-security-edge-standard.md"],
  "dx-api-gateway": ["docs/standards/07-api-interoperability-standard.md"],
  "golden-slice-ref": ["docs/golden-node-examples.md"],
};

describe("crosscut semantic dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} feature/archetype hedefte exact ve tekil ref verir`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as {
        level: string;
        refs?: string[];
      };

      expect(
        ["feature", "archetype"],
        `${nodeId}: hedef seviye feature/archetype olmalı`,
      ).toContain(node.level);

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
