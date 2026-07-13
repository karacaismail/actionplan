import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "s-accounting": [
    "docs/financial-state-model-contract.md",
    "docs/archetype-ledger-directive.md",
    "docs/drafts/archetype-ledger-directive.md",
  ],
  "s-clm": [
    "docs/archetype-agreement-lifecycle-negotiation-directive.md",
    "docs/reference/Agreement-CLM-Gereksinim-Analizi.md",
  ],
  "s-pim": [
    "docs/archetype-taxonomy-directive.md",
    "docs/archetype-variant-attribute-family-directive.md",
  ],
  "s-data-catalog": [
    "docs/decision-grade-data-contract.md",
    "docs/enterprise-saas-phase-5c-data-metadata-candidates.md",
  ],
  "s-ipaas": ["docs/enterprise-saas-phase-5f-integration-extensibility-candidates.md"],
  "s-fpa": ["docs/archetype-budget-plan-directive.md"],
  "s-dms": ["docs/archetype-document-composition-directive.md"],
  "s-inventory": ["docs/archetype-inventory-stock-directive.md"],
  "s-sales": [
    "docs/archetype-order-line-item-directive.md",
    "docs/drafts/archetype-order-line-item-directive.md",
  ],
  "s-hrms": ["docs/archetype-org-employment-directive.md"],
};

const ALLOWED_LEVELS = new Set(["archetype", "feature"]);

describe("archetype semantic dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} uygun level ile ilgili dokümanları exact ve tekil bağlar`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as {
        level?: string;
        refs?: string[];
      };

      expect(
        ALLOWED_LEVELS.has(node.level ?? ""),
        `${nodeId}: level archetype veya feature olmalı`,
      ).toBe(true);

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
