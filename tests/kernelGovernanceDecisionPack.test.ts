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
    expect(
      pack.match(/Karar sahibi: User\/Admin · Koordinatör: PM · Teslim yetkilisi: Codex/g),
    ).toHaveLength(5);
    for (const forbidden of [
      "early-minimal-db-substrate seçildi",
      "provisional-contract-only seçildi",
      "physicalStrategy belirlendi",
      "base queue değiştirildi",
    ])
      expect(pack).not.toContain(forbidden);
    expect(pack).not.toContain("Kernel hazırdır");

    const gap = read("docs/kernel-readiness-gap-analysis-2026-07-14.md");
    expect(gap).toContain(PACK);
    expect(gap).toContain("reports/kernel-governance-gap-addendum-2026-07-15.json");
    const evidence = read("docs/evidence-taxonomy.md");
    expect(evidence).toContain("güncel 617 düğüm");
    expect(evidence).not.toContain("güncel 467 düğüm");
  });
});
