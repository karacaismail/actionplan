import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- the JavaScript governance helpers intentionally have no declaration files.
import { validateKernelGovernance } from "../tools/lib/kernel-governance-audit.mjs";
// biome-ignore format: the suppression must sit on the same statement as the module specifier
// @ts-expect-error -- the JavaScript governance helpers intentionally have no declaration files.
import { TIME_SCOPE_CLAUSES, UNQUALIFIED_LIVE_CLAIMS } from "../tools/lib/kernel-governance-authorization-audit.mjs";
// @ts-expect-error -- the JavaScript governance helper intentionally has no declaration file.
import { resolveD01NodeUniverse } from "../tools/lib/kernel-node-universe.mjs";
import { readD01LiveUniverse } from "./helpers/d01LiveUniverse";

const ROOT = process.cwd();
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const AUTHORITY = "reports/kernel-governance-closure-authority-2026-07-31.json";
const HANDOFF = "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
// The live D01 ledger is fully applied (33/33/0). The synthetic next-applied universe is built on
// a clone that deliberately withdraws this already-applied row; live data is never mutated.
const WITHDRAWN_APPLIED_DESCENDANT_ID = "worker-job-execution-contract";

describe("kernel governance decision pack", () => {
  it("accepts a validated synthetic next-applied current-live universe without rewriting the historical addendum", () => {
    const live = readD01LiveUniverse();
    const handoff = structuredClone(live.handoff);
    const row = handoff.ledger.find(
      (candidate: { selectedDescendantId: string }) =>
        candidate.selectedDescendantId === WITHDRAWN_APPLIED_DESCENDANT_ID,
    );
    row.applicationStatus = "pending";
    handoff.applicationSummary = { approved: 33, applied: 32, remaining: 1 };
    const withdrawnRecords = structuredClone(live.nodeRecords).filter(
      ({ node }) => node.id !== row.selectedDescendantId,
    );
    const withdrawn = resolveD01NodeUniverse({ records: withdrawnRecords, handoff });
    const withdrawnNodes = withdrawnRecords.map(({ node }) => node);
    const nextApplied = handoff.applicationSummary.applied + 1;
    row.applicationStatus = "applied";
    handoff.applicationSummary = {
      approved: 33,
      applied: nextApplied,
      remaining: handoff.applicationSummary.remaining - 1,
    };
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
      ...structuredClone(withdrawnRecords),
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

    const withdrawnActiveNodes = withdrawnNodes.filter(
      (node: { artifactKind?: string }) => node.artifactKind !== "legacy-alias",
    );
    const withdrawnKPrefixedNodes = withdrawnNodes.filter((node: { id: string }) =>
      node.id.startsWith("k-"),
    );
    expect(withdrawn.expectedNodeCount).toBe(live.liveExpectedNodeCount - 1);
    expect(validatedLiveUniverse.expectedNodeCount).toBe(withdrawn.expectedNodeCount + 1);
    expect([
      nodes.length,
      activeNodes.length,
      sumSp(nodes),
      kPrefixedNodes.length,
      sumSp(kPrefixedNodes),
    ]).toEqual([
      withdrawnNodes.length + 1,
      withdrawnActiveNodes.length + 1,
      sumSp(withdrawnNodes) + (child.effort?.estimate ?? 0),
      withdrawnKPrefixedNodes.length,
      sumSp(withdrawnKPrefixedNodes),
    ]);
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
    const approvedIds = new Set(
      allAppliedHandoff.ledger.map((appliedRow: typeof row) => appliedRow.selectedDescendantId),
    );
    const allAppliedRecords = [
      ...structuredClone(live.nodeRecords).filter(({ node }) => !approvedIds.has(node.id)),
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
    // The pack is a dated at-write snapshot: it may record what governed on its own date, but it may
    // never state today's authority. Both rule tables come from the gate module itself, so this
    // suite, the ledger suite and the validator all read one denylist instead of three copies.
    // biome-ignore format: every banned live claim is named by its own rule id
    for (const rule of UNQUALIFIED_LIVE_CLAIMS) expect(pack, `pack-unqualified-live-claim:${rule.id}`).not.toMatch(rule.pattern);
    // Non-vacuity: NO-GO still stands in the pack as dated evidence, so the bans above remove an
    // unqualified claim rather than the token itself.
    expect(pack).toContain("2026-07-15 at-write runtime NO-GO");
    // And the distinction is required positively: the dated snapshot, the live source of authority
    // named by path, and runtime-not-started stated as external fact rather than as a chain floor.
    // biome-ignore format: every required scope clause is named by its own rule id
    for (const rule of TIME_SCOPE_CLAUSES) expect(normalizedPack, `pack-time-scope-missing:${rule.id}`).toContain(rule.clause);
    // The chain is the only live authority, so it must still be named by path.
    expect(normalizedPack).toContain(CHAIN);
    // RUNTIME_IMPLEMENTATION_START is named only as a chain token that may bind the external fact
    // once the head seals it — never as a floor this pack asserts on the chain's behalf.
    expect(normalizedPack).toContain(
      "zincir başı bir `RUNTIME_IMPLEMENTATION_START` token'ı taşıdığı anda bağlayıcı kaynak o token olur",
    );
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
    // The handoff mirrors the boundary in force, so those three values are derived from the chain
    // rather than pinned to one epoch; exactly two tuples are legal and the polarity tracks the head.
    const boundary = JSON.parse(read(CHAIN)).effectiveAuthorityBoundary;
    // biome-ignore format: the two legal boundary tuples stay compact for the shard budget
    expect([boundary.codeStartAllowed, boundary.runtimeCodeAllowed, boundary.verdict]).toEqual(boundary.verdict === "NO-GO" ? [false, false, "NO-GO"] : [true, true, "GO-KERNEL-DEVELOPMENT-ONLY"]);
    expect(boundary.verdict === "NO-GO").toBe(JSON.parse(read(CHAIN)).chainHeadSeq < 4);
    expect(handoff).toMatchObject({
      status: "approved-application-pending",
      gapClosed: false,
      authorityBoundary: {
        codeStartAllowed: boundary.codeStartAllowed,
        runtimeCodeAllowed: boundary.runtimeCodeAllowed,
        verdict: boundary.verdict,
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

  it("keeps every D-report gate assertion derived from the canonical boundary, never literal", () => {
    // The application-state gate and the handoff boundary mirror both track the effective-authority
    // chain. A literal [false, false, "NO-GO"] tuple pins one epoch and silently breaks on the next
    // append, so every D-report must derive those three values from the chain instead. The four
    // immovable floors stay literal: they are the invariant these reports actually own.
    // biome-ignore format: the closed prep-shard registry stays compact for the shard budget
    const GATED = ["tests/kernelAdrIdentityQuarantine.test.ts", "tests/kernelEarlyMinimalDbSubstrate.test.ts", "tests/kernelGhostWbsIdentityRejection.test.ts", "tests/kernelGovernanceDecisionPack.test.ts", "tests/kernelModuleRegistryOwnershipSplitHandoff.test.ts", "tests/kernelRelationDirectionConflictDisposition.test.ts", "tests/kernelScaffoldWalkingSkeletonExitSemantics.test.ts", "tests/kernelTenancyPhysicalStrategyDisposition.test.ts", "tests/kernelUnownedDirectiveOwnershipDisposition.test.ts"];
    expect(GATED).toHaveLength(9);
    for (const file of GATED)
      expect(fs.existsSync(path.join(ROOT, file)), `gated-report-missing:${file}`).toBe(true);
    // Comments and quoted detector fixtures are stripped, so neither an example nor this test's own
    // probe rows can be mistaken for a live assertion.
    // biome-ignore format: the comment and fixture stripper stays compact for the shard budget
    const strip = (source: string) => source.split("\n").filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("['") && !line.trim().startsWith('["')).join("\n");
    // Whitespace is collapsed after stripping, so the detector is formatting-insensitive: the real
    // multiline handoff form and a hand-compressed one normalize to the same text and cannot differ.
    const executable = (source: string) => strip(source).replace(/\s+/g, " ");
    // Scoped to the LIVE artifacts only: the application-state gate and the code-bearing handoff
    // mirror both track the chain. A D-report's own authorityBoundary is frozen historical evidence
    // of what governed when it was written, so it stays literal and is deliberately not matched.
    // biome-ignore format: the live-artifact literal-tuple detector stays compact for the shard budget
    // The window spans the real multiline forms once whitespace is collapsed: the handoff mirror
    // needs 96 normalized characters between the receiver and the tuple, so a tight window would let
    // the multiline literal through. 320 covers both artifacts with margin and still binds the tuple
    // to its own assertion rather than matching across unrelated statements.
    const LITERAL = /expect\((?:state\.gate|handoff)\)[\s\S]{0,320}?codeStartAllowed:\s*(?:false|true)\s*,\s*runtimeCodeAllowed:\s*(?:false|true)\s*,[\s\S]{0,200}?verdict:\s*"(?:NO-GO|GO-KERNEL-DEVELOPMENT-ONLY)"/;
    // The detector is proven on synthetic sources before it is trusted against the real reports.
    // biome-ignore format: the adversarial detector matrix stays compact for the shard budget
    const PROBE: Array<[string, boolean]> = [
      // The exact multiline handoff mirror this shard replaced: 96 normalized chars to the tuple.
      ['expect(handoff).toMatchObject({\n  status: "approved-application-pending",\n  gapClosed: false,\n  authorityBoundary: {\n    codeStartAllowed: false,\n    runtimeCodeAllowed: false,\n    verdict: "NO-GO",\n  },\n});', true],
      // The exact multiline state.gate form, and its post-append polarity.
      ['expect(state.gate).toMatchObject({\n  gapClosed: false,\n  codeStartAllowed: false,\n  runtimeCodeAllowed: false,\n  readinessAllowed: false,\n  releaseAllowed: false,\n  deployAllowed: false,\n  verdict: "NO-GO",\n});', true],
      ['expect(state.gate).toMatchObject({\n  codeStartAllowed: true,\n  runtimeCodeAllowed: true,\n  verdict: "GO-KERNEL-DEVELOPMENT-ONLY",\n});', true],
      // The compressed one-liners must still be caught, so neither formatting hides a literal.
      ['expect(state.gate).toMatchObject({ gapClosed: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false, verdict: "NO-GO" });', true],
      ['expect(handoff).toMatchObject({ authorityBoundary: { codeStartAllowed: false, runtimeCodeAllowed: false, verdict: "NO-GO" } });', true],
      // The safe derived forms, multiline and compressed, must not be flagged.
      ['expect(state.gate).toMatchObject({\n  gapClosed: false,\n  readinessAllowed: false,\n  releaseAllowed: false,\n  deployAllowed: false,\n  codeStartAllowed: boundary.codeStartAllowed,\n  runtimeCodeAllowed: boundary.runtimeCodeAllowed,\n  verdict: boundary.verdict,\n});', false],
      ['expect(handoff).toMatchObject({\n  authorityBoundary: {\n    codeStartAllowed: boundary.codeStartAllowed,\n    runtimeCodeAllowed: boundary.runtimeCodeAllowed,\n    verdict: boundary.verdict,\n  },\n});', false],
      ['expect(state.gate).toMatchObject({ gapClosed: false, readinessAllowed: false, releaseAllowed: false, deployAllowed: false });', false],
      // A D-report's own frozen boundary is historical evidence and stays literal by design.
      ['expect(report.authorityBoundary).toMatchObject({ codeStartAllowed: false, runtimeCodeAllowed: false, verdict: "NO-GO" });', false],
    ];
    // biome-ignore format: the detector driver stays compact for the shard budget
    for (const [snippet, flagged] of PROBE) expect(LITERAL.test(executable(snippet)), snippet.slice(0, 70)).toBe(flagged);
    // biome-ignore format: every report still pinning the epoch-bound triple is named exactly
    const pinned = GATED.filter((file) => LITERAL.test(executable(read(file)))).map((file) => `application-state-gate-literal-pin:${file}`);
    expect(pinned).toEqual([]);
    // Non-vacuity: each report must actually read the chain boundary it now derives from.
    // biome-ignore format: the positive derivation requirement stays compact for the shard budget
    for (const file of GATED) expect(executable(read(file)), `gate-derivation-missing:${file}`).toContain("effectiveAuthorityBoundary");
  });
});
