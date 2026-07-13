import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");

const EXPECTED_OWNER_TASKS = [
  {
    docPath: "docs/archetype-storage-canonical-directive.md",
    nodeId: "archetype-storage-contract",
    level: "archetype",
    parentId: "k-archetype-storage",
  },
  {
    docPath: "docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md",
    nodeId: "customer-app-core-shell",
    level: "feature",
    parentId: "customer",
  },
  {
    docPath: "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
    nodeId: "tenant-context-contract",
    level: "archetype",
    parentId: "platform-tenancy",
  },
  {
    docPath: "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
    nodeId: "policy-context-contract",
    level: "archetype",
    parentId: "platform-authn-authz",
  },
  {
    docPath: "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md",
    nodeId: "capability-registry-contract",
    level: "archetype",
    parentId: "k-capability",
  },
  {
    docPath: "docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md",
    nodeId: "platform-migration-contract",
    level: "archetype",
    parentId: "platform-db-schema",
  },
  {
    docPath: "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md",
    nodeId: "sdk-public-contract",
    level: "archetype",
    parentId: "be-sdk",
  },
  {
    docPath: "docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md",
    nodeId: "hello-platform-smoke",
    level: "archetype",
    parentId: "platform-cicd",
  },
  {
    docPath: "docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md",
    nodeId: "sdk-app-core-template",
    level: "feature",
    parentId: "sdk-public-contract",
  },
  {
    docPath: "docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md",
    nodeId: "sdk-module-template",
    level: "feature",
    parentId: "sdk-public-contract",
  },
] as const;

const classifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
) as Array<{ docPath: string; decision: string }>;
const rules = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(RULE_DIR, file), "utf8")).rules ?? []);

describe("previously unmodeled directive owners", () => {
  it("materializes every active directive into a dedicated executable JSON task", () => {
    for (const expected of EXPECTED_OWNER_TASKS) {
      expect(
        classifications.find((entry) => entry.docPath === expected.docPath)?.decision,
        expected.docPath,
      ).toBe("task-materialize");

      const owners = rules.filter((rule) => (rule.sources ?? []).includes(expected.docPath));
      expect(owners.length, `${expected.docPath}: source-specific rule`).toBeGreaterThan(0);
      expect(
        owners.some((rule) => (rule.selector?.nodeIds ?? []).includes(expected.nodeId)),
        `${expected.docPath}: ${expected.nodeId} owner`,
      ).toBe(true);
      expect(owners.every((rule) => !Object.hasOwn(rule.content ?? {}, "evidence"))).toBe(true);

      const nodePath = path.join(NODE_DIR, `${expected.nodeId}.json`);
      expect(fs.existsSync(nodePath), `${expected.nodeId}: JSON task`).toBe(true);
      if (!fs.existsSync(nodePath)) continue;

      const node = JSON.parse(fs.readFileSync(nodePath, "utf8"));
      expect(node.level, expected.nodeId).toBe(expected.level);
      expect(node.parentId, expected.nodeId).toBe(expected.parentId);
      expect(["app", "module"], expected.nodeId).not.toContain(node.level);
      expect(
        (node.refs ?? []).some((ref: string) => ref.includes(expected.docPath)),
        `${expected.nodeId}: source ref`,
      ).toBe(true);
      expect(node.deliverables?.length, expected.nodeId).toBeGreaterThan(0);
      expect(node.acceptanceCriteria?.length, expected.nodeId).toBeGreaterThanOrEqual(2);
      expect(node.phases?.["test-plan"]?.criteria?.length, expected.nodeId).toBeGreaterThan(0);
      expect(node.phases?.verification?.criteria?.length, expected.nodeId).toBeGreaterThan(0);
      expect(
        node.phases?.["release-maintenance"]?.criteria?.length,
        expected.nodeId,
      ).toBeGreaterThan(0);
      expect(Object.keys(node.dimensions ?? {}), expected.nodeId).toHaveLength(17);
      expect(node.evidence, `${expected.nodeId}: planned evidence is not actual evidence`).toEqual(
        [],
      );
    }
  });
});
