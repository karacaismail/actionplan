import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");
const NODE_DIR = path.resolve(
  process.env.DOC_TASK_CONTENT_NODE_DIR ?? path.join(ROOT, "src/data/generated/nodes"),
);
const CLASSIFICATION = path.join(ROOT, "src/data/doc-task-content-classification.json");
const REPORT = path.resolve(
  process.env.DOC_TASK_CONTENT_REPORT ?? path.join(ROOT, "reports/doc-task-content-matrix.csv"),
);
const INLINE_LEVELS = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const TYPED_DIRECT_KINDS = new Set(["sellable-app", "app-core-module", "app-module"]);
const ROLLUP_KINDS = new Set([
  "legacy-alias",
  "portfolio-facet",
  "governance",
  "platform-foundation",
]);

type Rule = {
  id: string;
  sources: string[];
  selector: {
    all?: boolean;
    nodeIds?: string[];
    levels?: string[];
    anyTerms?: string[];
    hasUiDelivery?: boolean;
    uiArtifactRoles?: string[];
    riskSeverities?: string[];
  };
  content: Record<string, unknown>;
};

const rules: Rule[] = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(RULE_DIR, file), "utf8")).rules);
const humanDecisionOwnerIds = new Set(
  rules
    .filter((rule) => rule.content.humanDecisionBlocker === true)
    .flatMap((rule) => rule.selector.nodeIds ?? []),
);
const isExecutableDirectiveOwner = (node: {
  level: string;
  source?: { cluster?: string };
}) => INLINE_LEVELS.has(node.level) && node.source?.cluster === "platform-directive-owner";
const isExplicitHumanDecisionOwner = (node: { id: string }) => humanDecisionOwnerIds.has(node.id);
const isExplicitDirectMaterializationTarget = (node: {
  id: string;
  level: string;
  source?: { cluster?: string };
}) => isExecutableDirectiveOwner(node) || isExplicitHumanDecisionOwner(node);
const isDirectMaterializationTarget = (node: {
  id: string;
  level: string;
  artifactKind?: string;
  source?: { cluster?: string };
}) =>
  isExplicitDirectMaterializationTarget(node) ||
  (!ROLLUP_KINDS.has(node.artifactKind ?? "") &&
    (TYPED_DIRECT_KINDS.has(node.artifactKind ?? "") || INLINE_LEVELS.has(node.level)));
const nodes = new Map(
  fs
    .readdirSync(NODE_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const node = JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8"));
      return [node.id, node] as const;
    }),
);
const classifications = JSON.parse(fs.readFileSync(CLASSIFICATION, "utf8")) as Array<{
  docPath: string;
  decision: "task-materialize" | "reference-only" | "human-decision";
  rationale: string;
}>;

describe("doc task content rule registry", () => {
  it("has unique ids, real Markdown sources and non-empty content", () => {
    expect(rules.length).toBeGreaterThanOrEqual(25);
    expect(new Set(rules.map((rule) => rule.id)).size).toBe(rules.length);
    for (const rule of rules) {
      expect(rule.id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(rule.sources, `${rule.id}: every materialization rule has one source`).toHaveLength(1);
      expect(Object.keys(rule.content).length, rule.id).toBeGreaterThan(0);
      expect(rule.content, `${rule.id}: evidence gerçekleşmiş gibi yazılamaz`).not.toHaveProperty(
        "evidence",
      );
      for (const source of rule.sources) {
        expect(source, rule.id).toMatch(/^docs\/.+\.md$/);
        expect(fs.existsSync(path.join(ROOT, source)), `${rule.id} -> ${source}`).toBe(true);
      }
    }
  });

  it("routes explicit owners to direct typed/task content or protected roll-up lanes", () => {
    for (const rule of rules) {
      for (const level of rule.selector.levels ?? []) {
        expect(INLINE_LEVELS.has(level), `${rule.id} -> ${level}`).toBe(true);
      }
      for (const nodeId of rule.selector.nodeIds ?? []) {
        const node = nodes.get(nodeId);
        expect(node, `${rule.id} -> ${nodeId}`).toBeDefined();
        expect(
          isDirectMaterializationTarget(node) || ROLLUP_KINDS.has(node.artifactKind ?? ""),
          `${rule.id} -> ${nodeId}:${node.level}:${node.artifactKind}`,
        ).toBe(true);
      }
    }
  });

  it("keeps dedicated platform directive owners executable across artifact classifications", () => {
    const directiveOwners = [...nodes.values()].filter(
      (node) => node.source?.cluster === "platform-directive-owner",
    );

    expect(directiveOwners).toHaveLength(10);
    expect(directiveOwners.every(isDirectMaterializationTarget)).toBe(true);
    expect(
      directiveOwners
        .filter((node) => ROLLUP_KINDS.has(node.artifactKind ?? ""))
        .map((node) => node.id)
        .sort(),
    ).toEqual([
      "platform-migration-contract",
      "policy-context-contract",
      "sdk-app-core-template",
      "sdk-module-template",
      "sdk-public-contract",
    ]);
  });

  it("treats explicit human-decision nodeIds as direct owners without reopening generic roll-ups", () => {
    const decisionRules = rules.filter((rule) => rule.content.humanDecisionBlocker === true);
    expect(decisionRules).toHaveLength(10);
    for (const rule of decisionRules) {
      expect(rule.selector.nodeIds?.length, `${rule.id}: explicit nodeIds`).toBeGreaterThan(0);
      expect(rule.selector.all, `${rule.id}: no broad all selector`).toBeUndefined();
      expect(rule.selector.levels, `${rule.id}: no broad level selector`).toBeUndefined();
      expect(rule.selector.anyTerms, `${rule.id}: no lexical selector`).toBeUndefined();
    }

    const promotedFoundationOwners = [...nodes.values()]
      .filter(
        (node) => node.artifactKind === "platform-foundation" && isExplicitHumanDecisionOwner(node),
      )
      .map((node) => node.id)
      .sort();
    expect(promotedFoundationOwners).toEqual([
      "cc-privacy",
      "cc-security",
      "l1-audit",
      "l1-import",
    ]);
    expect(
      promotedFoundationOwners.every((id) => isDirectMaterializationTarget(nodes.get(id)!)),
    ).toBe(true);

    const genericFoundation = [...nodes.values()].filter(
      (node) =>
        node.artifactKind === "platform-foundation" && !isExplicitDirectMaterializationTarget(node),
    );
    expect(genericFoundation.length).toBeGreaterThan(0);
    expect(genericFoundation.some((node) => node.id === "k-wbs")).toBe(true);
    expect(genericFoundation.every((node) => !isDirectMaterializationTarget(node))).toBe(true);
  });

  it("uses explicit semantic applicability instead of keyword-only fan-out", () => {
    const assertNoTerms = (selector: Rule["selector"], ruleId: string) => {
      expect(selector.anyTerms, `${ruleId}: anyTerms lexical fan-out yasak`).toBeUndefined();
      for (const branch of (selector as Rule["selector"] & { anyOf?: Rule["selector"][] }).anyOf ??
        [])
        assertNoTerms(branch, ruleId);
    };
    for (const rule of rules) assertNoTerms(rule.selector, rule.id);

    const uiRule = rules.find((rule) => rule.id === "ui-delivery");
    expect(uiRule?.selector.uiArtifactRoles).toEqual(["produces-ui", "changes-ui-contract"]);
  });

  it("keeps audited owner boundaries and non-goals exact", () => {
    const byId = new Map(rules.map((rule) => [rule.id, rule]));
    expect(byId.get("platform-foundation-pr01-pr11-handoff")?.selector.nodeIds).toEqual([
      "std-ci-gates",
    ]);
    expect(byId.get("platform-w4-03-marketplace-guardrails")?.selector.nodeIds).toEqual([
      "std-ci-gates",
    ]);
    expect(byId.has("archetype-storage-promotion")).toBe(false);
    expect(byId.get("surface-contract-runtime")?.selector.nodeIds).toEqual([
      "customer",
      "product",
      "sus-actions",
      "sus-declarative",
      "geo-map-surface",
      "platform-customer-ui",
      "golden-slice-ref",
    ]);
    expect(byId.get("surface-v2-taxonomy")?.selector.nodeIds).toEqual(
      byId.get("surface-contract-runtime")?.selector.nodeIds,
    );
    for (const [ruleId, rule] of byId) {
      expect(
        rule.selector.nodeIds?.filter((nodeId) => nodeId.startsWith("app-kernel-x-")) ?? [],
        `${ruleId}: generic kernel example owner olamaz`,
      ).toEqual([]);
    }
    const atomicOwner = nodes.get("atomic-type-contract");
    expect(atomicOwner).toMatchObject({
      parentId: "atomic-types",
      level: "archetype",
    });
    expect(byId.get("catalog-atom-archetype-clm-derivation")?.selector.nodeIds).toEqual([
      "atomic-type-contract",
      "s-clm",
    ]);
    for (const ruleId of [
      "catalog-atomic-tier-decision-contract",
      "catalog-atomic-type-catalog-vectors",
      "catalog-kernel-numeronym-map",
    ]) {
      expect(byId.get(ruleId)?.selector.nodeIds, ruleId).toEqual(["atomic-type-contract"]);
    }
    expect(byId.has("kernel-contract")).toBe(false);
    expect(byId.get("core-contract-platform-customer")?.sources).toEqual([
      "docs/core-contract-pack.md",
    ]);
    expect(byId.get("kernel-sdk-customer-delivery-sequence")?.sources).toEqual([
      "docs/kernel-sdk-app-delivery-sequence.md",
    ]);
    expect(byId.get("high-risk-dod")?.sources).toEqual(["docs/dod-evidence-schema-directive.md"]);
    const privacyRules = rules.filter(
      (rule) => rule.sources[0] === "docs/privacy-retention-decision-matrix.md",
    );
    expect(privacyRules.length).toBeGreaterThanOrEqual(2);
    expect(
      privacyRules.flatMap((rule) => rule.selector.nodeIds ?? []),
      "privacy directive must reach its explicit crosscut owner",
    ).toContain("cc-privacy");
    expect(privacyRules.every((rule) => rule.selector.riskSeverities === undefined)).toBe(true);
    expect(byId.get("platform-customer-model")?.selector.nodeIds).toEqual([
      "platform-customer-model",
    ]);
    expect(byId.get("platform-customer-graphql")?.selector.nodeIds).toEqual([
      "platform-customer-graphql",
    ]);
    expect(byId.get("platform-customer-ui")?.selector.nodeIds).toEqual(["platform-customer-ui"]);
    expect(byId.get("platform-customer-seed")?.selector.nodeIds).toEqual([
      "platform-customer-seed",
    ]);
    expect(byId.has("meta-framework-gated-delivery")).toBe(false);
    expect(byId.get("meta-framework-wave0-support")?.selector.nodeIds).toEqual([
      "k-tenancy-deep",
      "s-event",
      "scale-outbox",
      "l1-audit",
      "s-audit",
      "cc-obs",
      "s-observability",
      "dx-api-gateway",
    ]);
    expect(byId.get("meta-framework-customer-wave")?.selector.nodeIds).toEqual([
      "customer",
      "platform-customer-model",
      "platform-customer-graphql",
      "platform-customer-ui",
      "platform-customer-seed",
    ]);
    expect(byId.get("marketplace-module-security-runtime-contract")?.selector.nodeIds).toEqual([
      "std-ci-gates",
    ]);
    expect(byId.has("scale-safety")).toBe(false);
    expect(byId.get("evidence-writeback-runbook")?.sources).toEqual([
      "docs/evidence-update-runbook.md",
    ]);
    expect(byId.get("evidence-writeback-runbook")?.selector.all).toBe(true);
  });

  it("keeps current-live coverage count-neutral and preserves the immutable app identity snapshot", () => {
    const byId = new Map(rules.map((rule) => [rule.id, rule]));
    const integrationRule = byId.get("md-json-standards-integration-remediation");
    const ruleContent = JSON.stringify(integrationRule?.content);
    expect(ruleContent).toContain("doğrulanmış current-live task-page coverage");
    expect(ruleContent).not.toContain("617 task-page coverage");

    const appIdentity = classifications.find(
      (entry) => entry.docPath === "docs/adr-0032-enterprise-sdk-app-identity.md",
    );
    expect(appIdentity?.rationale).toContain("doğrulanmış current-live JSON evrenine");
    expect(appIdentity?.rationale).not.toContain("617 JSON kaydına");

    const standardsGap = fs.readFileSync(
      path.join(ROOT, "docs/json-standards-integration-gap-report-2026-07-13.md"),
      "utf8",
    );
    expect(standardsGap).toContain("doğrulanmış current-live materialized WBS düğümleri");
    expect(standardsGap).not.toContain("Güncel materialized katalog `617`");

    const identityAdr = fs.readFileSync(
      path.join(ROOT, "docs/adr-0032-enterprise-sdk-app-identity.md"),
      "utf8",
    );
    expect(identityAdr).toContain("immutable pre-D01 snapshot");
    expect(identityAdr).toContain("resolveD01NodeUniverse");

    for (const nodeId of [
      "std-contracts",
      "std-ci-gates",
      "std-ui-surfacing",
      "golden-slice-ref",
    ]) {
      const node = fs.readFileSync(path.join(NODE_DIR, `${nodeId}.json`), "utf8");
      expect(node, nodeId).toContain("doğrulanmış current-live task-page coverage");
      expect(node, nodeId).not.toContain("617 task-page coverage");
    }
  });

  it("keeps missing shared primitives as consumer-only projections", () => {
    const byId = new Map(rules.map((rule) => [rule.id, rule]));
    const projections = [
      { id: "archetype-eav", owner: "k-fieldtypes", target: "s-pim" },
      {
        id: "archetype-tree-relation",
        owner: "k-archetype-relation",
        target: "s-pim",
      },
      { id: "ledger-double-entry", owner: "archetype-ledger", target: "s-accounting" },
    ] as const;

    for (const expected of projections) {
      const rule = byId.get(expected.id);
      const content = JSON.stringify(rule?.content);
      expect(rule?.selector.nodeIds, expected.id).toEqual([expected.target]);
      expect(content, expected.id).toContain(expected.owner);
      expect(content, expected.id).toMatch(/consumer projection/i);
      expect(content, expected.id).toMatch(/NO-GO/);
      expect(content, expected.id).toMatch(/NOT-RUN|blocker/i);
      expect(content, expected.id).toMatch(/yerel|çoğaltma/i);
    }

    expect(JSON.stringify(byId.get("archetype-eav")?.content)).not.toContain(
      "EAV değerini value_type'a göre tipli kolonlar",
    );
    expect(JSON.stringify(byId.get("archetype-tree-relation")?.content)).not.toContain(
      "Relation şemasını parent",
    );
    expect(JSON.stringify(byId.get("ledger-double-entry")?.content)).not.toContain(
      "Account/journal/period tablolarını",
    );
  });

  it("generated matrix classifies every tracked Markdown and keeps decisions explicit", () => {
    const tracked = execFileSync("git", ["ls-files", "docs/*.md", "docs/**/*.md"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
    const report = fs.readFileSync(REPORT, "utf8");
    const rows = report.trim().split("\n");
    expect(rows).toHaveLength(new Set(tracked).size + 1);
    expect(rows[0]).toContain("document_class");
    expect(rows[0]).toContain("materialization_decision");
    expect(rows[0]).toContain("decision_rationale");
    expect(rows[0]).toContain("materialized_target_node_ids");
    expect(rows[0]).toContain("rollup_not_applicable_node_ids");
    expect(rows[0]).toContain("materialized_rule_ids");
    expect(rows[0]).toContain("rollup_not_applicable_rule_ids");
    expect(rows.filter((row) => row.endsWith('"yes"'))).toHaveLength(
      classifications.filter((entry) => entry.decision === "human-decision").length,
    );
    expect(rows.filter((row) => row.includes('"docs-only"'))).toEqual([]);
    for (const source of new Set(rules.flatMap((rule) => rule.sources))) {
      const row = rows.find((item) => item.startsWith(`\"${source}\",`));
      expect(row, source).toMatch(/task-materialized|task-rollup-n-a/);
    }
  });

  it("blocks Pages deployment on registry, coverage and materialization drift", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const command = packageJson.scripts["qa:doc-content"] as string;
    expect(command).toContain("tools/materialize-doc-task-content.mjs");
    expect(command).toContain("tools/check-reindex-idempotence.mjs");
    expect(command).toContain("tests/docTaskContentRules.test.ts");
    expect(command).toContain("tests/docTaskContentCoverage.test.ts");
    expect(command).toContain("tests/docTaskContentMaterialization.test.ts");

    const workflow = fs.readFileSync(path.join(ROOT, ".github/workflows/deploy.yml"), "utf8");
    expect(workflow).toContain(
      "Kernel WBS entegrasyon kapısı (current-live görev evreni + public SDK sınırı)",
    );
    expect(workflow).not.toContain("Kernel WBS entegrasyon kapısı (617 görev");
    const wbsGate = workflow.indexOf("run: npm run qa:wbs");
    const docGate = workflow.indexOf("run: npm run qa:doc-content");
    const contentGate = workflow.indexOf("run: npm run qa:content");
    expect(wbsGate).toBeGreaterThan(-1);
    expect(docGate).toBeGreaterThan(wbsGate);
    expect(contentGate).toBeGreaterThan(docGate);
  });
});
