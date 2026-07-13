import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const COMMERCE_CONTRACT_REFS = [
  "docs/commerce-os-bounded-context-map.md",
  "docs/commerce-os-capability-classification.md",
  "docs/commerce-os-contract-test-plan.md",
  "docs/commerce-os-data-migration-contract.md",
  "docs/commerce-os-product-scope.md",
  "docs/commerce-os-stack-app-composition.md",
];

const EXPECTED_REFS: Record<string, string[]> = {
  "golden-slice-ref": [
    "docs/archetype-eav-directive.md",
    "docs/archetype-tree-relation-directive.md",
    "docs/archetype-uretim-spec.md",
    "docs/atom-archetype-bagi-clm-ornegi-2026-07-01.md",
    "docs/atomik-primitif-katman-gap-2026-07-01.md",
    "docs/commerce-os-kernel-sdk-gap-directive.md",
    "docs/commerce-os-test-first-parallel-handoff.md",
    "docs/commerce-os-vibecoder-readiness-oracles.md",
    "docs/commerce-os-vibecoder-task-packets.md",
    "docs/enterprise-saas-product-family-composition.md",
  ],
  "k-wbs": [
    "docs/atom-micro-step-gap-unknown-unknowns-report-2026-07-12.md",
    "docs/gap-2026-07-02-01-kernel.md",
    "docs/kernel-numeronym-eslemesi.md",
    "docs/micro-step-atom-gap-claude-vibecoding-2026-07-02.md",
    "docs/work-unit-molecule-gap-claude-vibecoding-2026-07-02.md",
  ],
  "s-marketplace": ["docs/archetype-listing-directive.md"],
  "s-conversational": ["docs/archetype-messaging-thread-directive.md"],
  "s-dms": ["docs/media-file-manager-maturity-codex-directive-2026-07-13.md"],
  "s-sales": COMMERCE_CONTRACT_REFS,
  "s-inventory": COMMERCE_CONTRACT_REFS,
};

const ALLOWED_LEVELS = new Set(["archetype", "feature"]);

describe("commerce ve kernel semantic dokümanları WBS refs entegrasyonu", () => {
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
