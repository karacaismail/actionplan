import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NODES_DIR = path.join(ROOT, "src", "data", "generated", "nodes");

const OWNER_LEAF_IDS = [
  "archetype-storage-contract",
  "atomic-type-contract",
  "capability-registry-contract",
  "customer-app-core-shell",
  "hello-platform-smoke",
  "platform-migration-contract",
  "policy-context-contract",
  "sdk-app-core-template",
  "sdk-module-template",
  "sdk-public-contract",
  "tenant-context-contract",
] as const;

const DIMENSION_KEYS = [
  "featureDefs",
  "security",
  "codeOptimization",
  "securityOptimization",
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "eca",
  "aiAgents",
  "testing",
  "owasp",
  "integration",
  "moduleUsage",
  "dataLifecycle",
  "observability",
  "reliability",
] as const;

type Dimension = {
  status?: string;
  items?: string[];
  prompt?: string;
  provenance?: string;
};

type TaskNode = {
  id: string;
  title: string;
  schedule: {
    start?: string | null;
    end?: string | null;
    actualStart?: string | null;
    actualEnd?: string | null;
    baselineStart?: string | null;
    baselineEnd?: string | null;
  };
  phases: Record<string, { criteria?: string[] }>;
  dimensions: Record<string, Dimension>;
};

function readNode(id: string): TaskNode {
  return JSON.parse(fs.readFileSync(path.join(NODES_DIR, `${id}.json`), "utf8"));
}

describe("document owner leaf dimension completeness", () => {
  it.each(OWNER_LEAF_IDS)("materializes all 17 task dimensions for %s", (id) => {
    const node = readNode(id);

    expect(Object.keys(node.dimensions).sort()).toEqual([...DIMENSION_KEYS].sort());

    for (const key of DIMENSION_KEYS) {
      const dimension = node.dimensions[key];
      const content = (dimension.items ?? []).join("\n");

      expect(dimension.status, `${id}.${key} status`).toBe("filled");
      expect(dimension.items?.length ?? 0, `${id}.${key} item count`).toBeGreaterThanOrEqual(3);
      expect(content.length, `${id}.${key} content length`).toBeGreaterThan(100);
      expect(
        content.includes(node.id) || content.includes(node.title),
        `${id}.${key} must carry task context`,
      ).toBe(true);
      expect(dimension.prompt?.length ?? 0, `${id}.${key} prompt length`).toBeGreaterThan(120);
      expect(dimension.prompt, `${id}.${key} prompt context`).toContain(node.id);
      expect(dimension.prompt, `${id}.${key} prompt scope`).toMatch(/kapsa/i);
      expect(dimension.prompt, `${id}.${key} prompt constraint`).toMatch(/kısıt|çıktı/i);
      expect(dimension.provenance, `${id}.${key} provenance`).not.toBe("template");
    }
  });

  it.each(OWNER_LEAF_IDS)("materializes planned waterfall handoff fields for %s", (id) => {
    const node = readNode(id);

    expect(node.schedule.start, `${id}.schedule.start`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(node.schedule.end, `${id}.schedule.end`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(node.schedule.baselineStart, `${id}.schedule.baselineStart`).toBe(node.schedule.start);
    expect(node.schedule.baselineEnd, `${id}.schedule.baselineEnd`).toBe(node.schedule.end);
    expect(node.schedule.actualStart, `${id}.schedule.actualStart`).toBeNull();
    expect(node.schedule.actualEnd, `${id}.schedule.actualEnd`).toBeNull();

    for (const phase of ["db-schema", "test-qa"]) {
      const criteria = node.phases[phase]?.criteria ?? [];
      expect(criteria.length, `${id}.${phase}`).toBeGreaterThan(0);
      expect(criteria.join("\n").length, `${id}.${phase} context`).toBeGreaterThan(60);
    }
  });
});
