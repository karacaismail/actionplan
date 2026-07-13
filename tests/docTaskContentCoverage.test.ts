import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");

const PR01_REQUIRED_TEMPLATE_AND_INTAKE_DOCS = [
  "docs/platform-pr01-blocker-report-template-2026-07-09.md",
  "docs/platform-pr01-evidence-intake-template-2026-07-09.md",
  "docs/platform-pr01-remote-unblock-request-2026-07-09.md",
  "docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md",
  "docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md",
] as const;

const REQUIRED_TASK_MATERIALIZATION_DOCS = [
  "docs/archetype-storage-canonical-directive.md",
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
  "docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md",
  "docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md",
  "docs/platform-pr01-implementation-dispatch-2026-07-09.md",
  "docs/platform-pr01-remote-verification-runbook-2026-07-09.md",
  ...PR01_REQUIRED_TEMPLATE_AND_INTAKE_DOCS,
  "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
  "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
  "docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md",
  "docs/platform-pr05-eca-runtime-agent-pack-2026-07-09.md",
  "docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md",
  "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md",
  "docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md",
  "docs/platform-pr09-observability-agent-pack-2026-07-09.md",
  "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md",
  "docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md",
  "docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md",
  "docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md",
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

const HUMAN_DECISION_DOCS = ["docs/app-distribution-contract.md"] as const;

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
    expect(REQUIRED_TASK_MATERIALIZATION_DOCS).toHaveLength(82);
    expect(new Set(REQUIRED_TASK_MATERIALIZATION_DOCS).size).toBe(82);
    for (const docPath of REQUIRED_TASK_MATERIALIZATION_DOCS)
      expect(fs.existsSync(path.join(ROOT, docPath)), docPath).toBe(true);
  });

  it("requires all five PR01 templates and intake artifacts to materialize into task content", () => {
    const failures = PR01_REQUIRED_TEMPLATE_AND_INTAKE_DOCS.flatMap((docPath) => {
      const entry = classifications.find((candidate) => candidate.docPath === docPath);
      const problems: string[] = [];
      if (entry?.decision !== "task-materialize")
        problems.push(`${docPath}: classification=${entry?.decision ?? "missing"}`);
      if (!ruleSources.has(docPath)) problems.push(`${docPath}: materialization rule missing`);
      return problems;
    });

    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("keeps unresolved draft contracts behind an explicit human decision", () => {
    for (const docPath of HUMAN_DECISION_DOCS) {
      expect(ruleSources.has(docPath), `${docPath}: decision blocker must materialize`).toBe(true);
      expect(classifications.find((entry) => entry.docPath === docPath)?.decision, docPath).toBe(
        "human-decision",
      );
      expect(
        rules
          .filter((rule) => (rule.sources ?? []).includes(docPath))
          .every((rule) => rule.content?.humanDecisionBlocker === true),
        `${docPath}: approval cannot be implied`,
      ).toBe(true);
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
        expect(rule.content, `${docPath}: evidence gerçekleşmiş gibi yazılamaz`).not.toHaveProperty(
          "evidence",
        );
      }
    }
  });

  it("gives every task-materialize source a complete aggregate actionable contract", () => {
    const failures: string[] = [];
    const materializedDocs = classifications.filter((entry) => entry.decision !== "reference-only");

    for (const { docPath } of materializedDocs) {
      const owners = rules.filter((rule) => (rule.sources ?? []).includes(docPath));
      const deliverableCount = owners.flatMap((rule) => rule.content?.deliverables ?? []).length;
      const acceptanceCount = owners.flatMap(
        (rule) => rule.content?.acceptanceCriteria ?? [],
      ).length;

      if (owners.length === 0) failures.push(`${docPath}: materialization rule missing`);
      if (deliverableCount < 1)
        failures.push(`${docPath}: deliverables=${deliverableCount}, need>=1`);
      if (acceptanceCount < 2)
        failures.push(`${docPath}: acceptanceCriteria=${acceptanceCount}, need>=2`);

      for (const phase of ["test-plan", "verification", "release-maintenance"] as const) {
        const phaseCount = owners.flatMap(
          (rule) => rule.content?.phaseCriteria?.[phase] ?? [],
        ).length;
        if (phaseCount < 1) failures.push(`${docPath}: phaseCriteria.${phase}=0, need>=1`);
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
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
        .filter((entry) => entry.decision !== "reference-only")
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
