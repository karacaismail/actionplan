import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED_REFS = {
  "std-contracts": [
    "docs/adr-0030-commerce-operating-system-boundary.md",
    "docs/adr-0031-commerce-os-vibecoder-handoff-decisions.md",
    "docs/drafts/adr-product-boundary.md",
    "docs/enterprise-saas-capability-ontology.md",
    "docs/enterprise-saas-human-decision-queue.md",
    "docs/enterprise-saas-phase-10-human-decision-audit.md",
    "docs/enterprise-saas-phase-5-integration-decision.md",
  ],
  "std-ci-gates": [
    "docs/core-enterprise-maturity-ladder.md",
    "docs/doc-maintainer-boundary-gap-report-2026-07-08.md",
    "docs/enterprise-saas-phase-11-publish-readiness.md",
    "docs/enterprise-saas-phase-5-11-acceptance-oracles.md",
    "docs/enterprise-saas-phase-6-unknown-unknown-probes.md",
    "docs/enterprise-saas-phase-7-traceability-baseline.md",
    "docs/enterprise-saas-requirement-program-preflight.md",
    "docs/enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md",
    "docs/execution-readiness-gap.md",
    "docs/gap-2026-07-02-00-index.md",
    "docs/gap-2026-07-02-05-uygulama-raporu.md",
    "docs/global-market-readiness-directive.md",
    "docs/implementation-workspace-reality-gap-report-2026-07-08.md",
    "docs/kernel-sdk-app-sequence-gap-report-2026-07-08.md",
    "docs/next-30-days-plan.md",
    "docs/platform-implementation-advanced-gap-report-2026-07-09.md",
    "docs/repo-reality-audit.md",
  ],
  "std-schema-foundation": [
    "docs/archetype-numeronym-eslemesi.md",
    "docs/gap-2026-07-02-02-archetype.md",
    "docs/standards/05-c13n-canonicalization-standard.md",
    "docs/standards/06-data-normalization-standard.md",
  ],
  "std-ui-surfacing": [
    "docs/drafts/panel-tier-contract.md",
    "docs/enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md",
    "docs/gap-2026-07-02-03-surface.md",
    "docs/storybook-root-integration-gap-report.md",
    "docs/storybook-unknown-unknowns-gap-report.md",
    "docs/surface-numeronym-eslemesi.md",
  ],
} as const;

describe("program dokümanları semantik WBS refs entegrasyonu", () => {
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
