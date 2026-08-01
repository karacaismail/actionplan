import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HANDOFF = "reports/kernel-surface-dependency-order-handoff-2026-08-01.json";
const CLOSURE = "reports/kernel-governance-closure-authority-2026-07-31.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const QUEUE = "reports/platform-implementation-execution-queue-2026-07-09.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const SEQUENCE_DOC = "docs/kernel-sdk-app-delivery-sequence.md";
const AUDIT_LIB = "tools/lib/kernel-governance-authorization-audit.mjs";
const NODE_DIR = "src/data/generated/nodes";
const LIVE_NODE_COUNT = 650;
const SURFACE_DEPENDS_ON = ["l1-workflow", "l1-party", "be-sdk", "stack-editions"];
const SURFACE_CONFLICT_TARGETS = ["be-sdk", "stack-editions"];
const CONFLICTS = {
  affectedNodeCount: 35,
  edgeCount: 46,
  kernelNodeCount: 5,
  kernelEdgeCount: 8,
  nonKernelEdgeCount: 38,
};

const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");
const readJson = (file: string) => JSON.parse(read(file));

type Node = { id: string; dependsOn?: string[]; blocks?: string[] };

const liveNodes = (): Node[] =>
  fs
    .readdirSync(path.join(ROOT, NODE_DIR))
    .filter((file) => file.endsWith(".json"))
    .map((file) => readJson(`${NODE_DIR}/${file}`));

const conflictEdges = (nodes: Node[]) => {
  const edges: Array<{ nodeId: string; targetId: string }> = [];
  for (const node of nodes) {
    const blocked = new Set(node.blocks ?? []);
    for (const targetId of node.dependsOn ?? [])
      if (blocked.has(targetId)) edges.push({ nodeId: node.id, targetId });
  }
  return edges;
};

describe("KGA-D02 surface dependency order application handoff", () => {
  it("records the approved Edition/App->SDK->Kernel direction as an application, not a closure", () => {
    const handoff = readJson(HANDOFF);

    expect(handoff).toMatchObject({
      schemaVersion: "1.0.0",
      id: "kernel-surface-dependency-order-handoff-2026-08-01",
      decisionId: "KGA-D02",
      gapId: "KGA-G04",
      status: "approved-application-pending",
      gapClosed: false,
      edgeMutation: false,
      decision: {
        topic: "k-surface dependency semantics and SDK ordering",
        status: "approved-not-applied",
        decisionOwner: "user-admin",
        coordinator: "project_manager",
        finalAuthority: "codex",
        selectedOption: "edition-app-to-sdk-to-kernel",
        approvalToken: "D02=EDITION_APP_TO_SDK_TO_KERNEL",
      },
      directionContract: {
        contract: "Edition/App->SDK->Kernel",
        crosscutAxisId: "dependency-direction",
        scope: "governance-semantics-only",
      },
      authorityBoundary: {
        runtimeExecutor: "human-developer-only",
        codeStartAllowed: false,
        runtimeCodeAllowed: false,
        releaseAllowed: false,
        deployAllowed: false,
        kernelReady: false,
        sdkReady: false,
        appBuildable: false,
        verdict: "NO-GO",
      },
    });
    expect(handoff.sourceRefs).toContain(INVENTORY);
    expect(handoff.sourceRefs).toContain(SEQUENCE_DOC);
    expect(handoff.rollback.runtimeDataImpact).toBe("none");
    expect(handoff.nonGoals.length).toBeGreaterThan(0);
  });

  it("binds provenance to the immutable GATE-01 closure and EPOCH-02 chain without mutating them", () => {
    const handoff = readJson(HANDOFF);
    const closure = readJson(CLOSURE);
    const chain = readJson(CHAIN);
    const head = chain.entries.at(-1);

    expect(handoff.provenance.approval).toMatchObject({
      gateId: "GATE-01",
      authority: "user-admin",
      normalizedSelectionSha256: closure.approval.normalizedSelectionSha256,
    });
    expect(closure.approval.normalizedSelection).toContain("D02=EDITION_APP_TO_SDK_TO_KERNEL");
    expect(handoff.provenance.effectiveAuthority).toMatchObject({
      ref: CHAIN,
      seq: chain.chainHeadSeq,
      chainHeadSha256: chain.chainHeadEntrySha256,
      normalizedTextSha256: head.normalizedTextSha256,
    });
    expect(handoff.provenance.immutableRefs).toMatchObject({
      closureRef: CLOSURE,
      chainRef: CHAIN,
      registryRef: REGISTRY,
      mutationAllowed: false,
    });

    // The intake ledger stays exactly as approved: application state lives in this handoff only.
    expect(closure.status).toBe("approved-application-pending");
    expect(closure.applications.find((row: { id: string }) => row.id === "KGA-D02")).toEqual({
      id: "KGA-D02",
      disposition: "Edition/App->SDK->Kernel",
      applicationStatus: "pending",
      canonicalStatus: "pending",
    });
    expect(chain.status).toBe("effective");
    expect(chain.appendOnly).toBe(true);
    expect(chain.nonSupersedableFloors).toMatchObject({
      codeStart: "NO",
      runtimeCode: "NO",
      release: "NO",
      deploy: "NO",
      verdict: "NO-GO",
      historicalApprovalMutation: "FORBIDDEN",
    });
  });

  it("leaves every registry decision pending and unselected", () => {
    const registry = readJson(REGISTRY);
    const d02 = registry.decisions.find((row: { id: string }) => row.id === "KGA-D02");

    expect(registry.decisions).toHaveLength(10);
    expect(d02).toMatchObject({ status: "pending", selectedOption: null, codeStartAllowed: false });
    expect(
      registry.decisions.every(
        (row: { status: string; selectedOption: null; codeStartAllowed: boolean }) =>
          row.status === "pending" && row.selectedOption === null && row.codeStartAllowed === false,
      ),
    ).toBe(true);
    expect(registry.finalDecision.verdict).toBe("NO-GO");
  });

  it("pins the live 650-node universe and the unchanged 46/8/38 conflict split", () => {
    const handoff = readJson(HANDOFF);
    const nodes = liveNodes();
    const edges = conflictEdges(nodes);
    const kernelEdges = edges.filter((edge) => edge.nodeId.startsWith("k-"));
    const live = {
      affectedNodeCount: new Set(edges.map((edge) => edge.nodeId)).size,
      edgeCount: edges.length,
      kernelNodeCount: new Set(kernelEdges.map((edge) => edge.nodeId)).size,
      kernelEdgeCount: kernelEdges.length,
      nonKernelEdgeCount: edges.length - kernelEdges.length,
    };

    expect(nodes).toHaveLength(LIVE_NODE_COUNT);
    expect(live).toEqual(CONFLICTS);
    expect(handoff.measurement.liveNodeCount).toBe(LIVE_NODE_COUNT);
    expect(handoff.measurement.relationDirectionConflicts).toEqual(CONFLICTS);

    const surfaceEdges = kernelEdges
      .filter((edge) => edge.nodeId === "k-surface")
      .map((edge) => edge.targetId)
      .sort();
    expect(surfaceEdges).toEqual([...SURFACE_CONFLICT_TARGETS].sort());
    expect(handoff.measurement.surfaceConflictEdges).toEqual(
      SURFACE_CONFLICT_TARGETS.map((targetId) => ({ nodeId: "k-surface", targetId })),
    );
    expect(handoff.repairAuthority).toMatchObject({
      owner: "KGA-D07",
      edgeRepairAllowedHere: false,
      kernelEdgeCount: CONFLICTS.kernelEdgeCount,
    });
  });

  it("asserts no node, edge or queue mutation", () => {
    const handoff = readJson(HANDOFF);
    const surface = readJson(`${NODE_DIR}/k-surface.json`);
    const queue = readJson(QUEUE);
    const foundation = queue.items.filter((item: { id: string }) => /^PR-\d{2}$/.test(item.id));
    const actionable = foundation.filter(
      (item: { status: string }) => item.status === "next-actionable",
    );

    expect(surface.dependsOn).toEqual(SURFACE_DEPENDS_ON);
    expect(surface.blocks).toHaveLength(15);
    for (const target of SURFACE_CONFLICT_TARGETS) expect(surface.blocks).toContain(target);
    expect(actionable.map((item: { id: string }) => item.id)).toEqual(["PR-01"]);
    expect(handoff.mutationBoundary).toEqual({
      generatedNodes: false,
      edges: false,
      baseQueue: false,
      registryDecisions: false,
      closureAuthority: false,
      effectiveAuthorityChain: false,
      platformCode: false,
      runtime: false,
    });
    expect(handoff.queueSnapshot).toMatchObject({
      currentNextActionable: "PR-01",
      baseQueueChanged: false,
    });
  });

  it("wires the D02 application into the decision pack and the named governance gate", () => {
    const pack = read(PACK);
    const gate = readJson("package.json").scripts["qa:kernel-governance"] as string;

    expect(pack).toContain(HANDOFF);
    expect(pack).toContain("edition-app-to-sdk-to-kernel");
    expect(pack).not.toContain("D02 closed");
    expect(gate).toContain("tests/kernelSurfaceDependencyOrderHandoff.test.ts");
    // The authorization audit must mirror the exact parent gate string, or check-kernel-governance
    // reports "named gate drift" instead of silently accepting an unwired test.
    expect(read(AUDIT_LIB)).toContain(gate);
  });
});
