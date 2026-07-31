import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatasetMetaSchema } from "@/schemas";
import { selectSellableApps } from "@/views/DashboardView";
import { afterEach, describe, expect, it } from "vitest";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

type NavigationNode = { id: string; children: NavigationNode[] };
const navigationIds = (nodes: NavigationNode[]): string[] =>
  nodes.flatMap((node) => [node.id, ...navigationIds(node.children)]);

function runReindexFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "actionplan-reindex-"));
  tempRoots.push(root);
  for (const directory of ["tools/lib", "reports", "src/data", "public/data"])
    mkdirSync(path.join(root, directory), { recursive: true });
  const copies = [
    "tools/reindex.mjs",
    "tools/lib/kernel-node-universe.mjs",
    "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json",
    "src/data/generated",
    "public/data/nodes.json",
  ];
  for (const relative of copies)
    cpSync(path.resolve(relative), path.join(root, relative), { recursive: true });

  execFileSync(process.execPath, [path.join(root, "tools/reindex.mjs")], { cwd: root });
  const readJson = (file: string) =>
    JSON.parse(readFileSync(path.join(root, file), "utf8")) as unknown;
  return {
    navigation: readJson("src/data/generated/navigation.json") as NavigationNode[],
    index: readJson("src/data/generated/index.json") as Array<{
      id: string;
      artifactKind?: string;
    }>,
    meta: readJson("src/data/generated/meta.json"),
    publicNodes: readJson("public/data/nodes.json") as Array<{
      id: string;
      artifactKind?: string;
    }>,
  };
}

describe("app katalogu runtime tutarlılığı", () => {
  it("Dashboard yalnız sellable-app artefaktlarını app olarak seçer", () => {
    const selected = selectSellableApps([
      { id: "commercial", artifactKind: "sellable-app" },
      { id: "portfolio", artifactKind: "portfolio-facet" },
      { id: "legacy", artifactKind: "legacy-alias" },
      { id: "old-level-only" },
    ]);

    expect(selected.map((node) => node.id)).toEqual(["commercial"]);
  });

  it("reindex alias tombstone'u navigasyondan çıkarır ve katalog paritesini korur", () => {
    const output = runReindexFixture();
    const aliases = output.index
      .filter((node) => node.artifactKind === "legacy-alias")
      .map((node) => node.id)
      .sort();
    const visibleIds = new Set(navigationIds(output.navigation));

    expect(aliases.length).toBeGreaterThan(0);
    expect(aliases.every((id) => !visibleIds.has(id))).toBe(true);
    expect(output.index).toHaveLength(output.publicNodes.length);
    expect(output.index.map((node) => node.id).sort()).toEqual(
      output.publicNodes.map((node) => node.id).sort(),
    );
  });

  it("reindex meta byArtifactKind sayımlarını üretir ve DatasetMeta şemasına uyar", () => {
    const output = runReindexFixture();
    const meta = DatasetMetaSchema.parse(output.meta);
    const expected = Object.fromEntries(
      Object.entries(
        output.publicNodes.reduce<Record<string, number>>((counts, node) => {
          const kind = node.artifactKind ?? "audit-pending";
          counts[kind] = (counts[kind] ?? 0) + 1;
          return counts;
        }, {}),
      ).sort(([left], [right]) => left.localeCompare(right)),
    );

    expect(meta.counts.total).toBe(output.publicNodes.length);
    expect(meta.counts.byArtifactKind).toEqual(expected);
  });
});
