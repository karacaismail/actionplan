import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");
const EXECUTABLE = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const EXPECTED = new Map([
  ["docs/app-distribution-contract.md", ["deploy-yap"]],
  ["docs/archetype-venture-core-directive.md", ["s-pmo"]],
  ["docs/k-evidence-seal-directive.md", ["l1-audit", "s-clm"]],
  ["docs/k-kms-directive.md", ["cc-security", "s-iam"]],
  ["docs/k-legal-hold-retention-directive.md", ["cc-privacy", "s-clm"]],
  ["docs/k-migration-bridge-directive.md", ["archetype-storage-contract", "l1-import"]],
  ["docs/k-obligation-commitment-directive.md", ["s-bpm", "s-clm"]],
  ["docs/k-provider-adapter-directive.md", ["dx-api-gateway", "s-payment-methods"]],
  ["docs/k-signature-trust-directive.md", ["s-clm"]],
  ["docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md", ["s-pmo"]],
] as const);

const classifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
) as Array<{ decision: string; docPath: string }>;
const rules = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(RULE_DIR, file), "utf8")).rules ?? []);

describe("human decisions remain blocked but visible inside task JSON", () => {
  it("projects all ten decision documents to relevant executable owners without deciding them", () => {
    expect(classifications.filter((entry) => entry.decision === "human-decision")).toHaveLength(10);

    for (const [docPath, expectedTargets] of EXPECTED) {
      const classification = classifications.find((entry) => entry.docPath === docPath);
      expect(classification?.decision, docPath).toBe("human-decision");
      const owners = rules.filter((rule) => (rule.sources ?? []).includes(docPath));
      expect(owners.length, `${docPath}: decision-blocker rule`).toBeGreaterThan(0);
      expect(
        owners.every((rule) => rule.content?.humanDecisionBlocker === true),
        `${docPath}: cannot imply approval`,
      ).toBe(true);

      const selected = new Set(owners.flatMap((rule) => rule.selector?.nodeIds ?? []));
      for (const nodeId of expectedTargets)
        expect(selected.has(nodeId), `${docPath}: ${nodeId}`).toBe(true);
      for (const nodeId of selected) {
        const node = JSON.parse(fs.readFileSync(path.join(NODE_DIR, `${nodeId}.json`), "utf8"));
        expect(EXECUTABLE.has(node.level), `${nodeId}: protected target`).toBe(true);
        expect(
          (node.refs ?? []).some((ref: string) => ref.includes(docPath)),
          `${nodeId}: decision source ref`,
        ).toBe(true);
        expect(
          JSON.stringify(node.dimensions).includes(docPath),
          `${nodeId}: prompt projection`,
        ).toBe(true);
        expect(node.evidence, `${nodeId}: decision doc is not evidence`).toEqual([]);
      }
    }
  });
});
