import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REQUIRED = [
  "docs/core-enterprise-maturity-ladder.md",
  "docs/standards/14-enterprise-readiness-checklist.md",
  "docs/commerce-os-vibecoder-readiness-oracles.md",
  "docs/enterprise-saas-phase-6-unknown-unknown-probes.md",
  "docs/json-standards-integration-gap-report-2026-07-13.md",
] as const;

const classifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
) as Array<{ decision: string; docPath: string }>;
const rules = fs
  .readdirSync(path.join(ROOT, "src/data/doc-task-content-rules"))
  .filter((file) => file.endsWith(".json"))
  .flatMap(
    (file) =>
      JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-rules", file), "utf8"))
        .rules ?? [],
  );

describe("remaining live document instructions", () => {
  it("materializes every unresolved maturity, readiness, probe and integration source", () => {
    for (const docPath of REQUIRED) {
      expect(classifications.find((entry) => entry.docPath === docPath)?.decision, docPath).toBe(
        "task-materialize",
      );
      const owners = rules.filter((rule) => rule.sources?.includes(docPath));
      expect(owners.length, `${docPath}: source-specific rule`).toBeGreaterThan(0);
      for (const rule of owners) {
        expect(rule.sources).toEqual([docPath]);
        expect(rule.selector?.nodeIds?.length).toBeGreaterThan(0);
        expect(rule.content?.dimensionKey).toBeTruthy();
        expect(rule.content?.deliverables?.length).toBeGreaterThan(0);
        expect(rule.content?.acceptanceCriteria?.length).toBeGreaterThanOrEqual(2);
        for (const phase of ["test-plan", "verification", "release-maintenance"])
          expect(
            rule.content?.phaseCriteria?.[phase]?.length,
            `${docPath}:${phase}`,
          ).toBeGreaterThan(0);
        expect(rule.content).not.toHaveProperty("evidence");
      }
    }
  });
});
