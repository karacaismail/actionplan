import fs from "node:fs";
import path from "node:path";
import type { TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NODES = path.join(ROOT, "src/data/generated/nodes");
const RULES = path.join(ROOT, "src/data/doc-task-content-rules");
const INLINE_LEVELS = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);

const nodes = fs
  .readdirSync(NODES)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODES, file), "utf8")) as TaskNode);
const knownRuleIds = new Set<string>(
  fs
    .readdirSync(RULES)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      const registry = JSON.parse(fs.readFileSync(path.join(RULES, file), "utf8")) as {
        rules?: Array<{ id: string }>;
      };
      return (registry.rules ?? []).map((rule) => rule.id);
    }),
);

const marker = (id: string) => `[DOC-APPLY:${id}]`;
const countMarker = (items: string[], id: string) =>
  items.filter((item) => item.startsWith(marker(id))).length;
const docRefPaths = (node: TaskNode) =>
  node.refs.flatMap((ref) => ref.match(/docs\/[^#\s]+\.md/)?.[0] ?? []);
const phaseItems = (node: TaskNode) =>
  Object.values(node.phases).flatMap((phase) => phase.criteria ?? []);
const allInlineText = (node: TaskNode) => [
  ...node.deliverables,
  ...node.acceptanceCriteria,
  ...phaseItems(node),
  ...node.risks.flatMap((risk) => [risk.desc, risk.mitigation]),
  node.rollback ?? "",
];

describe("docs -> task content materialization contract", () => {
  it("every executable node carries the global handoff, ready and evidence clauses exactly once", () => {
    const executable = nodes.filter((node) => INLINE_LEVELS.has(node.level));
    expect(executable.length).toBeGreaterThan(250);

    for (const node of executable) {
      expect(countMarker(node.deliverables, "task-handoff"), node.id).toBe(1);
      expect(countMarker(node.acceptanceCriteria, "ready-for-dev"), node.id).toBe(2);
      expect(
        countMarker(node.phases.verification!.criteria, "evidence-dod"),
        `${node.id}.verification`,
      ).toBe(1);
      expect(
        countMarker(node.phases["release-maintenance"]!.criteria, "evidence-dod"),
        `${node.id}.release-maintenance`,
      ).toBe(1);

      for (const source of [
        "docs/task-to-code-contract.md",
        "docs/waterfall-developer-handoff.md",
        "docs/ready-for-dev-gate.md",
        "docs/evidence-taxonomy.md",
        "docs/enterprise-dod.md",
      ]) {
        expect(docRefPaths(node), `${node.id} -> ${source}`).toContain(source);
      }
    }
  });

  it("app/module nodes are never mutated through DOC-APPLY clauses", () => {
    const forbidden = nodes.filter((node) => !INLINE_LEVELS.has(node.level));
    const violations = forbidden.filter((node) =>
      allInlineText(node).some((item) => item.startsWith("[DOC-APPLY:")),
    );
    expect(violations.map((node) => `${node.id}:${node.level}`)).toEqual([]);
  });

  it("contains no managed markers or refs owned by retired rules", () => {
    const orphanMarkers: string[] = [];
    const orphanRefs: string[] = [];

    for (const node of nodes) {
      for (const match of JSON.stringify(node).matchAll(/\[DOC-APPLY:([^\]]+)\]/g)) {
        if (!knownRuleIds.has(match[1])) orphanMarkers.push(`${node.id}:${match[1]}`);
      }
      for (const ref of node.refs.filter((item) => item.startsWith("doc-apply:"))) {
        const owner = ref.match(/^doc-apply:([^:]+): docs\/.+\.md$/)?.[1];
        if (!owner || !knownRuleIds.has(owner)) orphanRefs.push(`${node.id}:${ref}`);
      }
    }

    expect([...new Set(orphanMarkers)].sort()).toEqual([]);
    expect([...new Set(orphanRefs)].sort()).toEqual([]);
  });

  it("domain directives are broken into their pragmatic task owners", () => {
    const expected: Record<string, string[]> = {
      "s-clm": ["clm-lifecycle"],
      "s-dms": ["document-composition", "media-maturity"],
      "s-inventory": ["inventory-stock"],
      "s-accounting": ["ledger-double-entry", "financial-state-model"],
      "s-marketplace": ["marketplace-listing"],
      "s-conversational": ["messaging-thread"],
      "s-sales": ["order-line"],
      "s-hrms": ["org-employment"],
      "s-pim": ["pim-taxonomy", "pim-variant-family", "archetype-eav", "archetype-tree-relation"],
      "s-fpa": ["budget-plan"],
      "s-data-catalog": ["decision-grade-data"],
      "scale-invariant": ["scale-invariant"],
      "s-ai-governance": ["ai-governance"],
      "deploy-yap": ["deployment-runbook"],
      customer: ["platform-customer-handoff"],
      "platform-customer-graphql": ["platform-customer-handoff"],
      "platform-customer-model": ["platform-customer-handoff"],
      "platform-customer-seed": ["platform-customer-handoff"],
      "platform-customer-ui": ["platform-customer-handoff"],
      "std-ci-gates": ["governance-gates"],
    };
    const byId = new Map(nodes.map((node) => [node.id, node]));

    for (const [nodeId, ruleIds] of Object.entries(expected)) {
      const node = byId.get(nodeId);
      expect(node, nodeId).toBeDefined();
      const content = allInlineText(node!);
      for (const ruleId of ruleIds) {
        expect(
          content.filter((item) => item.startsWith(marker(ruleId))),
          `${nodeId} -> ${ruleId}`,
        ).not.toEqual([]);
      }
    }
  });

  it("applies high-risk DoD after all source-specific risks reach their final owners", () => {
    const highRiskNodes = nodes.filter(
      (node) =>
        INLINE_LEVELS.has(node.level) &&
        node.risks.some((risk) => risk.severity === "high" || risk.severity === "critical"),
    );
    const missing = highRiskNodes
      .filter(
        (node) => !allInlineText(node).some((item) => item.startsWith(marker("high-risk-dod"))),
      )
      .map((node) => node.id)
      .sort();

    expect(highRiskNodes.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it("labels unmodeled shared primitive owners as blockers in consumer task clauses", () => {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const clausesFor = (nodeId: string, ruleId: string) =>
      allInlineText(byId.get(nodeId)!).filter((item) => item.startsWith(marker(ruleId)));

    expect(clausesFor("s-pim", "archetype-eav").join("\n")).toContain("consumer projection");
    expect(clausesFor("s-pim", "archetype-eav").join("\n")).toContain("k-fieldtypes");
    expect(clausesFor("s-pim", "archetype-tree-relation").join("\n")).toContain(
      "k-archetype-relation",
    );
    expect(clausesFor("s-accounting", "ledger-double-entry").join("\n")).toContain(
      "archetype-ledger",
    );
  });

  it("uses semantic selector boundaries and explicit UI applicability", () => {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const falsePositives: Array<[string, string]> = [
      ["app-build-x-kum", "ui-delivery"],
      ["app-platform-horizontal-x-kum", "ui-delivery"],
      ["std-docs", "market-readiness"],
      ["std-contracts", "scale-safety"],
      ["sus-lisans-tr-hukuk", "scale-safety"],
      ["app-kernel-x-kum", "kernel-contract"],
      ["app-kernel-x-molekul", "kernel-contract"],
      ["app-kernel-x-atom", "kernel-contract"],
      ["k-wbs", "kernel-contract"],
    ];

    for (const [nodeId, ruleId] of falsePositives) {
      const node = byId.get(nodeId);
      expect(node, nodeId).toBeDefined();
      expect(
        allInlineText(node!).some((item) => item.startsWith(marker(ruleId))),
        `${nodeId} must not match ${ruleId}`,
      ).toBe(false);
    }

    for (const nodeId of ["urlp-08", "urlp-13", "urlp-14", "urlp-15"]) {
      const node = byId.get(nodeId);
      expect(node, nodeId).toBeDefined();
      expect(
        allInlineText(node!).some((item) => item.startsWith(marker("ui-delivery"))),
        `${nodeId} declares uiDelivery.applies=true`,
      ).toBe(true);
    }
  });

  it("materialized clauses reference real Markdown and project only managed rules into dimensions", () => {
    for (const node of nodes) {
      for (const ref of node.refs.filter((item) => item.startsWith("docs/"))) {
        const docPath = ref.split("#")[0];
        expect(fs.existsSync(path.join(ROOT, docPath)), `${node.id} -> ${docPath}`).toBe(true);
      }
      for (const dimension of Object.values(node.dimensions)) {
        for (const item of dimension.items.filter((entry) => entry.startsWith("[DOC-APPLY:"))) {
          const ruleIds = [...item.matchAll(/\[DOC-APPLY:([^\]]+)\]/g)].map((match) => match[1]);
          expect(ruleIds.length, `${node.id}.${dimension.key}`).toBeGreaterThan(0);
          for (const ruleId of ruleIds) {
            expect(knownRuleIds.has(ruleId), `${node.id}.${dimension.key}:${ruleId}`).toBe(true);
            expect(dimension.prompt, `${node.id}.${dimension.key}:${ruleId}`).toContain(
              `[DOC-APPLY:${ruleId}]`,
            );
          }
        }
      }
    }
  });

  it("public aggregate is byte-semantic parity with all canonical task nodes", () => {
    const publicNodes = JSON.parse(
      fs.readFileSync(path.join(ROOT, "public/data/nodes.json"), "utf8"),
    ) as TaskNode[];
    const canonical = [...nodes].sort((a, b) =>
      a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true }),
    );
    expect(publicNodes).toEqual(canonical);
  });
});
