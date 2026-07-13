import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED = {
  "s-bpm": {
    level: "archetype",
    refs: ["docs/drafts/workflow-directive.md"],
  },
  "std-contracts": {
    level: "feature",
    refs: [
      "docs/enterprise-saas-phase-5a-strategy-commercial-candidates.md",
      "docs/standards/10-business-model-switching-standard.md",
    ],
  },
  "std-ci-gates": {
    level: "feature",
    refs: [
      "docs/standards/14-enterprise-readiness-checklist.md",
      "docs/standards/enterprise-standards-audit-2026-07-01.md",
    ],
  },
} as const;

describe("son program dokümanları semantik WBS refs entegrasyonu", () => {
  for (const [nodeId, expected] of Object.entries(EXPECTED)) {
    it(`${nodeId} doğru seviyede exact ve tekil doküman ref'leri taşır`, () => {
      const node = JSON.parse(
        fs.readFileSync(path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`), "utf8"),
      ) as { id: string; level: string; refs?: string[] };

      expect(node.id).toBe(nodeId);
      expect(node.level).toBe(expected.level);
      expect(new Set(node.refs ?? []).size, `${nodeId}: refs[] içinde duplicate var`).toBe(
        (node.refs ?? []).length,
      );

      for (const docPath of expected.refs) {
        expect(fs.existsSync(path.join(ROOT, docPath)), `doküman yok: ${docPath}`).toBe(true);
        expect(
          (node.refs ?? []).filter((ref) => ref === docPath),
          `${nodeId}: exact ve tekil ref bekleniyor: ${docPath}`,
        ).toHaveLength(1);
      }
    });
  }
});
