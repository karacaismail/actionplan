import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readD01LiveUniverse } from "./helpers/d01LiveUniverse";

const ROOT = process.cwd();
const REPORT = "reports/kernel-gap-inventory-2026-07-14.json";
const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const live = readD01LiveUniverse();
const nodes = live.nodes;
const kPrefixedNodes = nodes.filter((node) => node.id.startsWith("k-"));
const report = readJson(REPORT);
const sorted = (values: string[]) => [...values].sort();
// The live D01 ledger is fully applied (33/33/0). The pending path is exercised on a clone that
// deliberately withdraws this already-applied row; the live ledger and node set stay untouched.
const WITHDRAWN_APPLIED_DESCENDANT_ID = "worker-job-execution-contract";
const CODE_BEARING_LEVELS = new Set([
  "archetype",
  "feature",
  "component",
  "work_unit",
  "micro_step",
]);

const missingCodeBearingParentIds = (nodeSet: typeof nodes) => {
  const modules = nodeSet.filter((node) => node.id.startsWith("k-") && node.level === "module");
  const childrenByParent = new Map<string, typeof nodes>();
  for (const node of nodeSet) {
    if (!node.parentId) continue;
    childrenByParent.set(node.parentId, [...(childrenByParent.get(node.parentId) ?? []), node]);
  }
  const hasCodeBearingDescendant = (parentId: string) => {
    const pending = [...(childrenByParent.get(parentId) ?? [])];
    const visited = new Set([parentId]);
    while (pending.length > 0) {
      const node = pending.shift();
      if (!node || visited.has(node.id)) continue;
      visited.add(node.id);
      if (CODE_BEARING_LEVELS.has(node.level)) return true;
      pending.push(...(childrenByParent.get(node.id) ?? []));
    }
    return false;
  };
  return modules.filter((parent) => !hasCodeBearingDescendant(parent.id)).map((node) => node.id);
};

describe("repo-wide kernel gap inventory", () => {
  it("locks the immutable 2026-07-14 snapshot without claiming current runtime readiness", () => {
    expect(report.sourceSnapshot).toMatchObject({
      nodeCount: 617,
      totalSp: 10082,
      kernelNodeCount: 41,
      kernelSp: 787,
      levels: { module: 38, feature: 3 },
      status: "backlog",
      phase: "requirements",
      runtimeEvidenceCount: 0,
    });
    expect(nodes).toHaveLength(live.liveExpectedNodeCount);
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
    expect(sorted(assigned)).toEqual(sorted(kPrefixedNodes.map((node) => node.id)));
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

  it("validates the historical structural snapshot separately from current-live gaps", () => {
    const historicalMissingParents = live.handoff.ledger.map(
      (row: { parentId: string }) => row.parentId,
    );
    const currentMissingParents = missingCodeBearingParentIds(nodes);
    const appliedParents = new Set(
      live.handoff.ledger
        .filter((row: { applicationStatus: string }) => row.applicationStatus === "applied")
        .map((row: { parentId: string }) => row.parentId),
    );
    const expectedCurrentMissing = historicalMissingParents.filter(
      (parentId: string) => !appliedParents.has(parentId),
    );
    const withoutDocPath = kPrefixedNodes
      .filter((node) => !(node.refs ?? []).some((ref: string) => ref.includes("docs/")))
      .map((node) => node.id);
    const traceable = kPrefixedNodes.filter((node) => node.traceability).map((node) => node.id);
    const gap = (id: string) =>
      report.structuralGaps.find((item: { id: string }) => item.id === id);

    expect(historicalMissingParents).toHaveLength(33);
    expect(gap("KGA-G01")).toMatchObject({
      kind: "missing-code-bearing-descendant",
      count: 33,
      nodeIds: sorted(historicalMissingParents),
    });
    expect(sorted(currentMissingParents)).toEqual(sorted(expectedCurrentMissing));
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

  it("keeps historical KGA-G01 at 33 while the next-applied current-live gap decreases by one", () => {
    const historicalGap = report.structuralGaps.find(
      (item: { id: string }) => item.id === "KGA-G01",
    );
    const handoff = structuredClone(live.handoff);
    const row = handoff.ledger.find(
      (candidate: { selectedDescendantId: string }) =>
        candidate.selectedDescendantId === WITHDRAWN_APPLIED_DESCENDANT_ID,
    );
    row.applicationStatus = "pending";
    handoff.applicationSummary = { approved: 33, applied: 32, remaining: 1 };
    const withdrawnNodes = structuredClone(nodes).filter(
      (node) => node.id !== row.selectedDescendantId,
    );
    const withdrawnMissing = missingCodeBearingParentIds(withdrawnNodes);
    const firstAppliedNodes = [
      ...withdrawnNodes,
      {
        id: row.selectedDescendantId,
        level: "archetype",
        parentId: row.parentId,
      },
    ];
    const currentMissing = missingCodeBearingParentIds(firstAppliedNodes);

    expect(historicalGap).toMatchObject({ count: 33 });
    expect(historicalGap.nodeIds).toContain(row.parentId);
    expect(withdrawnMissing).toHaveLength(handoff.applicationSummary.remaining);
    expect(withdrawnMissing).toContain(row.parentId);
    expect(currentMissing).toHaveLength(handoff.applicationSummary.remaining - 1);
    expect(currentMissing).not.toContain(row.parentId);
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
    expect(report.decisions.map((item: { id: string }) => item.id)).toEqual([
      "KGA-D01",
      "KGA-D02",
      "KGA-D03",
      "KGA-D04",
      "KGA-D05",
    ]);
  });
});
