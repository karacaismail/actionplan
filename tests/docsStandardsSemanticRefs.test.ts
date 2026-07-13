import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED_REFS = {
  "std-ci-gates": [
    "docs/audit-report.md",
    "docs/data-quality-report.md",
    "docs/governance-plan.md",
    "docs/rewrite-debt-cleanup-plan.md",
    "docs/short-items-wave2-plan.md",
    "docs/short-items-wave3-plan.md",
    "docs/standards/13-testing-quality-standard.md",
    "docs/wave4-plan.md",
    "docs/wave4-review-map.md",
    "docs/weak-content-17-report.md",
    "docs/yapi-content-celiski-denetimi-2026-07-08.md",
  ],
  "std-contracts": [
    "docs/json-standards-integration-gap-report-2026-07-13.md",
    "docs/enterprise-saas-phase-8-control-crosswalk.md",
    "docs/enterprise-saas-requirement-constitution.md",
    "docs/standards/02-a11y-accessibility-standard.md",
    "docs/standards/09-customization-personalization-standard.md",
  ],
  "std-schema-foundation": [
    "docs/gap-2026-07-02-06-boyut-analizi.md",
    "docs/node.md",
    "docs/standards-applicability-matrix.md",
  ],
} as const;

describe("standards dokümanları semantik WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} feature düğümünde exact ve tekil doküman ref'leri taşır`, () => {
      const node = JSON.parse(
        fs.readFileSync(path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`), "utf8"),
      ) as { id: string; level: string; refs?: string[] };

      expect(node.id).toBe(nodeId);
      expect(node.level).toBe("feature");
      expect(new Set(node.refs ?? []).size, `${nodeId}: refs[] içinde duplicate var`).toBe(
        (node.refs ?? []).length,
      );

      for (const docPath of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, docPath)), `doküman yok: ${docPath}`).toBe(true);
        expect(
          (node.refs ?? []).filter((ref) => ref === docPath),
          `${nodeId}: exact ve tekil ref bekleniyor: ${docPath}`,
        ).toHaveLength(1);
      }
    });
  }
});
