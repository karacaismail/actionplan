import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-gap-inventory-2026-07-14.json";
const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const nodes = fs
  .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => readJson(`src/data/generated/nodes/${file}`));
const kernel = nodes.filter((node) => node.id.startsWith("k-"));
const report = readJson(REPORT);
const sorted = (values: string[]) => [...values].sort();

describe("repo-wide kernel gap inventory", () => {
  it("locks the current 41-node reality without claiming runtime readiness", () => {
    const totalSp = (items: Array<{ effort?: { estimate?: number } }>) =>
      items.reduce((sum, node) => sum + (node.effort?.estimate ?? 0), 0);
    const levels = Object.fromEntries(
      ["module", "feature"].map((level) => [
        level,
        kernel.filter((node) => node.level === level).length,
      ]),
    );
    expect(report.sourceSnapshot).toMatchObject({
      nodeCount: nodes.length,
      totalSp: totalSp(nodes),
      kernelNodeCount: kernel.length,
      kernelSp: totalSp(kernel),
      levels,
      status: "backlog",
      phase: "requirements",
      runtimeEvidenceCount: 0,
    });
    expect(kernel.every((node) => node.status === "backlog")).toBe(true);
    expect(kernel.every((node) => node.phase === "requirements")).toBe(true);
    expect(kernel.every((node) => (node.evidence ?? []).length === 0)).toBe(true);
    expect(report.finalDecision).toMatchObject({
      kernelReady: false,
      sdkReady: false,
      appBuildable: false,
      codeStartAllowed: false,
      nextActionable: "PR-01",
      verdict: "NO-GO",
    });
  });

  it("assigns every k-* node once to a PM-coordinated audit shard", () => {
    const assigned = report.shards.flatMap((shard: { nodeIds: string[] }) => shard.nodeIds);
    expect(sorted(assigned)).toEqual(sorted(kernel.map((node) => node.id)));
    expect(new Set(assigned).size).toBe(41);
    expect(report.shards.map((shard: { id: string }) => shard.id)).toEqual([
      "KGA-01",
      "KGA-02",
      "KGA-03",
      "KGA-04",
      "KGA-05",
    ]);
    for (const shard of report.shards) {
      expect(shard.status).toBe("gap-confirmed");
      expect(shard.codeStartAllowed).toBe(false);
      expect(shard.coordinator).toBe("project_manager");
    }
  });

  it("materializes structural gaps from canonical node data", () => {
    const modules = kernel.filter((node) => node.level === "module");
    const codeBearingLevels = new Set([
      "archetype",
      "feature",
      "component",
      "work_unit",
      "micro_step",
    ]);
    const childrenByParent = new Map<string, typeof nodes>();
    for (const node of nodes) {
      if (!node.parentId) continue;
      const children = childrenByParent.get(node.parentId) ?? [];
      children.push(node);
      childrenByParent.set(node.parentId, children);
    }
    const descendantsOf = (parentId: string) => {
      const descendants: typeof nodes = [];
      const pending = [...(childrenByParent.get(parentId) ?? [])];
      const visited = new Set([parentId]);
      while (pending.length > 0) {
        const node = pending.shift();
        if (!node || visited.has(node.id)) continue;
        visited.add(node.id);
        descendants.push(node);
        pending.push(...(childrenByParent.get(node.id) ?? []));
      }
      return descendants;
    };
    const withoutCodeBearingDescendant = modules
      .filter(
        (parent) => !descendantsOf(parent.id).some((node) => codeBearingLevels.has(node.level)),
      )
      .map((node) => node.id);
    const withoutDocPath = kernel
      .filter((node) => !(node.refs ?? []).some((ref: string) => ref.includes("docs/")))
      .map((node) => node.id);
    const traceable = kernel.filter((node) => node.traceability).map((node) => node.id);
    const gap = (id: string) =>
      report.structuralGaps.find((item: { id: string }) => item.id === id);

    expect(withoutCodeBearingDescendant).toHaveLength(33);
    expect(withoutCodeBearingDescendant).toContain("k-control-planes");
    expect(childrenByParent.get("k-control-planes")?.map((node) => node.level)).toEqual([
      "module",
      "module",
      "module",
    ]);
    expect(gap("KGA-G01")).toMatchObject({
      kind: "missing-code-bearing-descendant",
      count: 33,
      nodeIds: sorted(withoutCodeBearingDescendant),
    });
    expect(gap("KGA-G02")).toMatchObject({ count: 17, nodeIds: sorted(withoutDocPath) });
    expect(gap("KGA-G03")).toMatchObject({
      coveredCount: 5,
      missingCount: 36,
      nodeIds: sorted(traceable),
    });
    expect(gap("KGA-G04")).toMatchObject({
      nodeId: "k-surface",
      conflicts: ["be-sdk", "stack-editions"],
      codeStartAllowed: false,
    });
  });

  it("keeps the base queue unchanged and blocks semantic mismatches", () => {
    const queue = readJson("reports/platform-implementation-execution-queue-2026-07-09.json");
    const foundation = queue.items.filter((item: { id: string }) => /^PR-\d{2}$/.test(item.id));
    expect(report.queueAudit.baseSequence).toEqual(
      foundation.map((item: { id: string }) => item.id),
    );
    expect(
      foundation.filter((item: { status: string }) => item.status === "next-actionable"),
    ).toEqual([expect.objectContaining({ id: "PR-01" })]);
    expect(report.queueAudit.baseQueueChanged).toBe(false);
    expect(report.queueAudit.codeStartAllowed).toBe(false);

    const pr07 = report.queueAudit.semanticFindings.find(
      (item: { queueItem: string }) => item.queueItem === "PR-07",
    );
    expect(pr07).toMatchObject({
      currentWbsNodes: ["k-capability"],
      missingOwnerNode: "k-mod-l",
      resolution: "human-decision-required",
    });
    expect(report.authorityChain.order).toEqual([
      "Codex",
      "project_manager",
      "specialist_agents",
      "Claude",
    ]);
    expect(report.authorityChain.claude).toBe("worker-slave-codex-invocation-only");
    expect(report.decisions.every((item: { status: string }) => item.status === "pending")).toBe(
      true,
    );
  });
});
