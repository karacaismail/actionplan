import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");

const REQUIRED_TASK_MATERIALIZATION_DOCS = [
  "docs/archetype-uretim-spec.md",
  "docs/claude-ai-archetype-eca-directive.md",
  "docs/commerce-os-contract-test-plan.md",
  "docs/commerce-os-data-migration-contract.md",
  "docs/commerce-os-test-first-parallel-handoff.md",
  "docs/commerce-os-vibecoder-task-packets.md",
  "docs/dimension-migration-runbook.md",
  "docs/evidence-update-runbook.md",
  "docs/k-mdm-provenance-directive.md",
  "docs/k-search-directive.md",
  "docs/k-worker-taskqueue-directive.md",
  "docs/meta-framework-implementation-development-plan.md",
  "docs/reference/Agreement-CLM-Gereksinim-Analizi.md",
  "docs/reference/PIM-v2-Gereksinim-Analizi.md",
  "docs/standards/10-business-model-switching-standard.md",
  "docs/storybook-implementation.md",
  "docs/surface-counterparty-portal-addendum.md",
  "docs/surface-esign-document-addendum.md",
  "docs/surface-spec.md",
  "docs/surface-tree-metadataform-addendum.md",
  "docs/surface-v2-directive.md",
  "docs/task-export-contract.md",
  "docs/actor-party-contract.md",
  "docs/adr-geo-visualization.md",
  "docs/atomic-types-directive.md",
  "docs/atomik-tip-gelistirici-yonergesi.md",
  "docs/capability-entitlement-contract.md",
  "docs/computation-derivation-contract.md",
  "docs/event-replay-projection-contract.md",
  "docs/fragments-directive.md",
  "docs/k-storage-dam-directive.md",
  "docs/marketplace-module-security-directive.md",
  "docs/mode-profile-contract.md",
  "docs/panel-tier-contract.md",
  "docs/pdp-policy-contract.md",
  "docs/pim-ozellik-yonerge-kapsama.md",
  "docs/pim-product-archetype-referans.md",
  "docs/url-policy-implementation-directive.md",
  "docs/workflow-directive.md",
  "docs/platform-initial-11-pr-execution-handoff-2026-07-09.md",
  "docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md",
  "docs/platform-pr01-implementation-dispatch-2026-07-09.md",
  "docs/platform-pr01-remote-verification-runbook-2026-07-09.md",
  "docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md",
  "docs/platform-pr05-eca-runtime-agent-pack-2026-07-09.md",
  "docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md",
  "docs/platform-pr09-observability-agent-pack-2026-07-09.md",
  "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
  "docs/platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md",
  "docs/platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md",
  "docs/platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md",
  "docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md",
  "docs/platform-w3-02-enterprise-performance-gates-agent-pack-2026-07-09.md",
  "docs/platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md",
  "docs/platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md",
  "docs/platform-w3-05-enterprise-observability-gates-agent-pack-2026-07-09.md",
  "docs/platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md",
  "docs/platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md",
  "docs/platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md",
  "docs/platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md",
  "docs/platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md",
  "docs/platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md",
  "docs/platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md",
  "docs/platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md",
  "docs/platform-wave2-repeatability-pr-handoff-2026-07-09.md",
  "docs/platform-wave3-enterprise-pr-handoff-2026-07-09.md",
  "docs/platform-wave4-portfolio-pr-handoff-2026-07-09.md",
] as const;

const PROTECTED_OR_UNMODELED_REFERENCE_DOCS = [
  "docs/archetype-storage-canonical-directive.md",
  "docs/roadmap-pm-paritesi.md",
  "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
  "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
  "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md",
  "docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md",
  "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md",
  "docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md",
  "docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md",
  "docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md",
] as const;

const HUMAN_DECISION_DOCS = ["docs/app-distribution-contract.md"] as const;

const DOCUMENT_ONLY_REFERENCE_DOCS = [
  "docs/commerce-os-vibecoder-readiness-oracles.md",
  "docs/enterprise-saas-phase-5-11-acceptance-oracles.md",
  "docs/enterprise-saas-phase-6-unknown-unknown-probes.md",
  "docs/enterprise-saas-requirement-constitution.md",
] as const;

const rules = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(RULE_DIR, file), "utf8")).rules ?? []);
const ruleSources = new Set<string>(rules.flatMap((rule) => rule.sources ?? []));
const classifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
) as Array<{
  decision: "task-materialize" | "reference-only" | "human-decision";
  docPath: string;
  documentClass: string;
  rationale: string;
}>;

describe("required docs -> task content coverage", () => {
  it("keeps the audited active directive and handoff corpus explicit", () => {
    expect(REQUIRED_TASK_MATERIALIZATION_DOCS).toHaveLength(67);
    expect(new Set(REQUIRED_TASK_MATERIALIZATION_DOCS).size).toBe(67);
    for (const docPath of REQUIRED_TASK_MATERIALIZATION_DOCS)
      expect(fs.existsSync(path.join(ROOT, docPath)), docPath).toBe(true);
  });

  it("keeps docs-only, pre-WBS and NOT-RUN designs out of executable task gates", () => {
    for (const docPath of DOCUMENT_ONLY_REFERENCE_DOCS) {
      expect(ruleSources.has(docPath), `${docPath}: docs-only must not materialize`).toBe(false);
      const classification = classifications.find((entry) => entry.docPath === docPath);
      expect(classification?.decision, docPath).toBe("reference-only");
      expect(classification?.rationale, docPath).toMatch(
        /docs-only|pre-WBS|NOT-RUN|yürütülebilir/i,
      );
    }
  });

  it("does not force protected or unmodeled owners into unrelated executable leaves", () => {
    for (const docPath of PROTECTED_OR_UNMODELED_REFERENCE_DOCS) {
      expect(ruleSources.has(docPath), `${docPath}: must not materialize`).toBe(false);
      const classification = classifications.find((entry) => entry.docPath === docPath);
      expect(classification?.decision, docPath).toBe("reference-only");
      expect(classification?.rationale, docPath).toMatch(/protected|korunan|model|eşleşen/i);
    }
  });

  it("keeps unresolved draft contracts behind an explicit human decision", () => {
    for (const docPath of HUMAN_DECISION_DOCS) {
      expect(ruleSources.has(docPath), `${docPath}: must not materialize`).toBe(false);
      expect(classifications.find((entry) => entry.docPath === docPath)?.decision, docPath).toBe(
        "human-decision",
      );
    }
  });

  it("materializes every required document through an owned rule", () => {
    const missing = REQUIRED_TASK_MATERIALIZATION_DOCS.filter((doc) => !ruleSources.has(doc));
    expect(missing, `materialization rule eksik:\n${missing.join("\n")}`).toEqual([]);
  });

  it("keeps source-specific rule and clause contracts per required document lane", () => {
    for (const docPath of REQUIRED_TASK_MATERIALIZATION_DOCS) {
      const owners = rules.filter((rule) => (rule.sources ?? []).includes(docPath));
      expect(owners.length, `${docPath}: at least one semantic lane`).toBeGreaterThan(0);
      for (const rule of owners) {
        expect(rule.sources, `${docPath}: exactly-one source`).toEqual([docPath]);
        expect(
          Boolean(rule.selector?.nodeIds?.length) || rule.selector?.all === true,
          `${docPath}: explicit owners`,
        ).toBe(true);
        expect(rule.content?.deliverables?.length, `${docPath}: deliverable`).toBeGreaterThan(0);
        expect(
          rule.content?.acceptanceCriteria?.length,
          `${docPath}: acceptance`,
        ).toBeGreaterThanOrEqual(2);
        const phases = Object.keys(rule.content?.phaseCriteria ?? {});
        expect(phases.length, `${docPath}: phase criteria`).toBeGreaterThanOrEqual(2);
        if (docPath.startsWith("docs/platform-")) {
          expect(phases, `${docPath}: test-plan`).toContain("test-plan");
          expect(phases, `${docPath}: verification`).toContain("verification");
          expect(phases, `${docPath}: release-maintenance`).toContain("release-maintenance");
        }
        expect(rule.content, `${docPath}: evidence gerçekleşmiş gibi yazılamaz`).not.toHaveProperty(
          "evidence",
        );
      }
    }
  });

  it("classifies every tracked document and keeps rule-source decisions exact", () => {
    const tracked = execFileSync("git", ["ls-files", "docs/*.md", "docs/**/*.md"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean)
      .sort();
    expect(classifications.map((entry) => entry.docPath)).toEqual([...new Set(tracked)]);
    expect(new Set(classifications.map((entry) => entry.docPath)).size).toBe(290);
    const classifiedMaterialized = new Set(
      classifications
        .filter((entry) => entry.decision === "task-materialize")
        .map((entry) => entry.docPath),
    );
    expect([...classifiedMaterialized].sort()).toEqual([...ruleSources].sort());
    expect(classifications.filter((entry) => entry.decision === "human-decision")).toHaveLength(10);
    for (const entry of classifications.filter((item) => item.decision === "human-decision")) {
      expect(entry.rationale, entry.docPath).not.toMatch(
        /açık insan kararı gerektirir; karar olmadan görev içeriğine dönüşmez/i,
      );
      expect(entry.rationale, `${entry.docPath}: unresolved decision`).toMatch(/ADR|karar|onay/i);
      expect(entry.rationale, `${entry.docPath}: human authority`).toMatch(
        /User\/Admin|CPO|owner|yetki|sahip/i,
      );
      expect(entry.rationale, `${entry.docPath}: target lane`).toMatch(
        /WBS|module|archetype|lane|dependsOn/i,
      );
    }
    for (const entry of classifications) {
      expect(
        [
          "directive-contract",
          "handoff-agent-pack",
          "gap-audit",
          "catalog-reference",
          "engineering-standard",
          "human-decision",
        ],
        entry.docPath,
      ).toContain(entry.documentClass);
      expect(entry.rationale.length, entry.docPath).toBeGreaterThan(30);
    }

    const missingOwnerDocs = new Map([
      ["docs/archetype-eav-directive.md", "k-fieldtypes"],
      ["docs/archetype-tree-relation-directive.md", "k-archetype-relation"],
      ["docs/archetype-ledger-directive.md", "archetype-ledger"],
    ]);
    for (const [docPath, owner] of missingOwnerDocs) {
      const rationale = classifications.find((entry) => entry.docPath === docPath)?.rationale ?? "";
      expect(rationale, docPath).toContain(owner);
      expect(rationale, docPath).toMatch(/consumer|tüketici/i);
      expect(rationale, docPath).toMatch(/NO-GO|blocker/i);
    }
  });
});
