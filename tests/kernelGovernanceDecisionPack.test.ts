import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

describe("kernel governance decision pack", () => {
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
    expect(normalizedPack).toContain(
      "bu ledger'lar kanonik ADR topic, WBS owner/disposition veya tenancy topolojisini seçmez",
    );
    expect(normalizedPack).toContain(
      "node/SP/status/evidence ve graph/queue sayılarını canlı kanonik veriden; ADR ve hayalet WBS envanterini denetimli snapshot'tan doğrular",
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
    expect(evidence).toContain("güncel 617 düğüm");
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
