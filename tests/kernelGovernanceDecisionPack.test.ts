import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- the JavaScript governance helpers intentionally have no declaration files.
import { validateKernelGovernance } from "../tools/lib/kernel-governance-audit.mjs";
// @ts-expect-error -- the JavaScript governance helper intentionally has no declaration file.
import { resolveD01NodeUniverse } from "../tools/lib/kernel-node-universe.mjs";
import { readD01LiveUniverse } from "./helpers/d01LiveUniverse";

const ROOT = process.cwd();
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const AUTHORITY = "reports/kernel-governance-closure-authority-2026-07-31.json";
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

describe("kernel governance decision pack", () => {
  it("accepts a validated synthetic first-applied current-live universe without rewriting the historical addendum", () => {
    const live = readD01LiveUniverse();
    const handoff = structuredClone(live.handoff);
    const row = handoff.ledger.find(
      (candidate: { selectedDescendantId: string }) =>
        candidate.selectedDescendantId === "actor-role-binding-contract",
    );
    row.applicationStatus = "applied";
    handoff.applicationSummary = { approved: 33, applied: 1, remaining: 32 };
    const child = structuredClone(
      live.nodes.find((node: { id: string }) => node.id === row.parentId),
    );
    Object.assign(child, {
      id: row.selectedDescendantId,
      title: row.title,
      level: "archetype",
      parentId: row.parentId,
      owner: row.parentOwner,
      artifactKind: "delivery-task",
      dependsOn: row.dependencies,
      blocks: [],
      related: [],
      source: { cluster: row.sourceCluster },
    });
    const nodeRecords = [
      ...structuredClone(live.nodeRecords),
      { filename: `${child.id}.json`, node: child },
    ];
    const validatedLiveUniverse = resolveD01NodeUniverse({ records: nodeRecords, handoff });
    const nodes = nodeRecords.map(({ node }) => node);
    const activeNodes = nodes.filter(
      (node: { artifactKind?: string }) => node.artifactKind !== "legacy-alias",
    );
    const kPrefixedNodes = nodes.filter((node: { id: string }) => node.id.startsWith("k-"));
    const sumSp = (items: Array<{ effort?: { estimate?: number } }>) =>
      items.reduce((sum, node) => sum + (node.effort?.estimate ?? 0), 0);
    const queue = JSON.parse(
      read("reports/platform-implementation-execution-queue-2026-07-09.json"),
    );
    const report = JSON.parse(read("reports/kernel-governance-gap-addendum-2026-07-15.json"));
    const artifacts = {
      adrCollisions: JSON.parse(
        read("reports/kernel-adr-collision-source-bindings-2026-07-15.json"),
      ),
      ghostBindings: JSON.parse(
        read("reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json"),
      ),
      tenancyAuthority: JSON.parse(
        read("reports/kernel-tenancy-authority-inventory-2026-07-15.json"),
      ),
    };

    expect(validatedLiveUniverse.expectedNodeCount).toBe(618);
    expect([
      nodes.length,
      activeNodes.length,
      sumSp(nodes),
      kPrefixedNodes.length,
      sumSp(kPrefixedNodes),
    ]).toEqual([618, 613, 10103, 41, 787]);
    expect(validateKernelGovernance({ nodes, queue, report, artifacts })).toEqual([]);
    expect(report.sourceSnapshot.nodeCount).toBe(617);
    const invalidHistoricalSnapshot = structuredClone(report);
    invalidHistoricalSnapshot.sourceSnapshot.nodeCount = 999;
    expect(
      validateKernelGovernance({ nodes, queue, report: invalidHistoricalSnapshot, artifacts }),
    ).toContain("kernel snapshot drift");

    const allAppliedHandoff = structuredClone(live.handoff);
    for (const appliedRow of allAppliedHandoff.ledger) appliedRow.applicationStatus = "applied";
    allAppliedHandoff.applicationSummary = { approved: 33, applied: 33, remaining: 0 };
    const allAppliedRecords = [
      ...structuredClone(live.nodeRecords),
      ...allAppliedHandoff.ledger.map((appliedRow: typeof row) => {
        const appliedChild = structuredClone(
          live.nodes.find((node: { id: string }) => node.id === appliedRow.parentId),
        );
        Object.assign(appliedChild, {
          id: appliedRow.selectedDescendantId,
          level: "archetype",
          parentId: appliedRow.parentId,
        });
        return { filename: `${appliedChild.id}.json`, node: appliedChild };
      }),
    ];
    expect(
      resolveD01NodeUniverse({
        records: allAppliedRecords,
        handoff: allAppliedHandoff,
      }).expectedNodeCount,
    ).toBe(650);
  });

  it("publishes evidence-backed options without taking human architecture decisions", () => {
    expect(fs.existsSync(path.join(ROOT, PACK))).toBe(true);
    const pack = read(PACK);
    const normalizedPack = pack.replace(/\s+/g, " ");
    for (const token of [
      "NO-GO",
      "Codex → PM → uzman ajanlar → Claude workers/slaves",
      "35 düğüm",
      "46 çelişkili kenar",
      "5 kernel düğümü",
      "8 çelişkili kenar",
      "13 hayalet WBS",
      "early-minimal-db-substrate",
      "provisional-contract-only",
      "create / alias / fold / reject",
      "physicalStrategy = null",
      "human-developer-only",
    ])
      expect(pack).toContain(token);
    expect(pack).toContain("atonota/kernel");
    expect(pack).toContain("2 test");
    expect(pack).toContain("uzak repo boş değildir");
    expect(pack).toContain("pending/unselected");
    expect(pack).toContain("ambiguous");
    expect(pack).toContain("aynı node içindeki dependsOn ∩ blocks kesişimidir");
    expect(pack).toContain("doğrudan doğrulanmış eksik-node setidir");
    expect(pack).toContain("PR-01 next-actionable bir code-start izni değildir");
    for (const ref of [
      "reports/kernel-adr-collision-source-bindings-2026-07-15.json",
      "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json",
      "reports/kernel-tenancy-authority-inventory-2026-07-15.json",
      "reports/kernel-crosscut-handoff-2026-07-15.json",
      "reports/kernel-missing-doc-ref-placement-2026-07-15.json",
    ])
      expect(pack).toContain(ref);
    expect(pack).toContain("D08/D09/D10 pending/unselected");
    expect(pack).toContain("## GATE-01 Approval Intake — Application Pending");
    expect(pack).toContain("approved-application-pending");
    expect(pack).toContain(AUTHORITY);
    expect(pack).toContain(HANDOFF);
    for (const approvalAware of [
      "GATE-01 onaylı exact 33-row D01 descendant ledger",
      "application özeti ve pending/applied satırları kanonik resolver ile doğrulanır",
      "D01 kapanmış değildir",
      "`codeStartAllowed=false`",
      "`runtimeCodeAllowed=false`",
    ])
      expect(normalizedPack).toContain(approvalAware);
    for (const obsolete of [
      "D01 handoff ayrıca code-bearing descendant seçmez",
      "Aday listeleri boştur",
      "selection, rationale ve approval alanları null'dır",
      "candidate listeleri boş, selection null",
      "| KGA-D01 | Code-bearing descendant seçimi | Base gap inventory | pending/unselected |",
      "D01 applied",
      "D01 closed",
      "runtimeReady=true",
    ])
      expect(pack).not.toContain(obsolete);
    const handoff = JSON.parse(read(HANDOFF));
    const currentLive = readD01LiveUniverse();
    expect(handoff).toMatchObject({
      status: "approved-application-pending",
      gapClosed: false,
      authorityBoundary: {
        codeStartAllowed: false,
        runtimeCodeAllowed: false,
        verdict: "NO-GO",
      },
    });
    expect(handoff.ledger).toHaveLength(33);
    expect(currentLive.validatedLiveUniverse.approvedIds).toHaveLength(33);
    expect(currentLive.nodes).toHaveLength(currentLive.liveExpectedNodeCount);
    expect(normalizedPack).toContain(
      "bu ledger'lar kanonik ADR topic, WBS owner/disposition veya tenancy topolojisini seçmez",
    );
    expect(normalizedPack).toContain(
      "current-live graph/readiness durumunu canlı kanonik veriden; tarihsel nodeCount ile ADR/hayalet WBS envanterini denetimli snapshot'tan doğrular",
    );
    expect(
      pack.match(/Karar sahibi: User\/Admin · Koordinatör: PM · Teslim yetkilisi: Codex/g),
    ).toHaveLength(10);
    for (const forbidden of [
      "early-minimal-db-substrate seçildi",
      "provisional-contract-only seçildi",
      "physicalStrategy belirlendi",
      "base queue değiştirildi",
      "kanonik ADR topic seçildi",
      "WBS owner seçildi",
      "tenancy topolojisi seçildi",
    ])
      expect(pack).not.toContain(forbidden);
    expect(pack).not.toContain("Kernel hazırdır");

    const gap = read("docs/kernel-readiness-gap-analysis-2026-07-14.md");
    expect(gap).toContain(PACK);
    expect(gap).toContain("reports/kernel-governance-gap-addendum-2026-07-15.json");
    expect(gap).toContain("WBS kimliği/parent/edge");
    expect(gap).toContain("yalnız traceability ref ekler");
    expect(normalizedPack).toContain("Karar paketi shard'ı belge, classification, matrix");
    expect(normalizedPack).toContain("tam governance shard rollback'inde");
    expect(normalizedPack).toContain("Crosscut ve missing-doc-ref shard'ları");
    expect(pack).not.toContain("Karar paketi ve governance raporu birlikte revert edilir");
    const evidence = read("docs/evidence-taxonomy.md");
    expect(evidence).toContain("doğrulanmış current-live düğüm evreni");
    expect(evidence).not.toContain("güncel 467 düğüm");

    const classifications = JSON.parse(read("src/data/doc-task-content-classification.json"));
    expect(
      classifications.find((entry: { docPath: string }) => entry.docPath === PACK),
    ).toMatchObject({
      documentClass: "gap-audit",
      decision: "reference-only",
    });
    const owner = JSON.parse(read("src/data/generated/nodes/archetype-storage-contract.json"));
    expect(owner.refs).toContain(PACK);

    const governance = JSON.parse(read("reports/kernel-governance-gap-addendum-2026-07-15.json"));
    expect(governance.finalDecision).toMatchObject({
      verdict: "NO-GO",
      codeStartAllowed: false,
      nextActionable: "PR-01",
    });
    expect(governance.decisions.map((decision: { id: string }) => decision.id)).toEqual([
      "KGA-D06",
      "KGA-D07",
      "KGA-D08",
      "KGA-D09",
      "KGA-D10",
    ]);
    for (const decision of governance.decisions) expect(pack).toContain(`### ${decision.id}`);
    expect(governance.structuralFindings.ghostWbsClaims.missingNodeIds).toHaveLength(13);
    expect(governance.structuralFindings.tenancyPhysicalStrategy.physicalStrategy).toBeNull();
  });
});
