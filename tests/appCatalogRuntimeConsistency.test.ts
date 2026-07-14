import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatasetMetaSchema } from "@/schemas";
import { selectSellableApps } from "@/views/DashboardView";
import { afterEach, describe, expect, it } from "vitest";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixtureNode(
  id: string,
  artifactKind: "sellable-app" | "app-core-module" | "legacy-alias",
  parentId: string | null,
) {
  return {
    id,
    title: id,
    level: artifactKind === "sellable-app" ? "app" : "module",
    artifactKind,
    parentId,
    order: 0,
    wbsCode: "",
    status: "backlog",
    icon: "ph-cube",
    source: { cluster: "test" },
    dimensions: {},
  };
}

function runReindexFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "actionplan-reindex-"));
  tempRoots.push(root);
  const toolsDir = path.join(root, "tools");
  const generatedDir = path.join(root, "src", "data", "generated");
  const nodesDir = path.join(generatedDir, "nodes");
  mkdirSync(toolsDir, { recursive: true });
  mkdirSync(nodesDir, { recursive: true });
  cpSync(path.resolve("tools/reindex.mjs"), path.join(toolsDir, "reindex.mjs"));
  const nodes = [
    fixtureNode("commercial-app", "sellable-app", null),
    fixtureNode("commercial-app-core", "app-core-module", "commercial-app"),
    fixtureNode("old-app-slug", "legacy-alias", "commercial-app"),
  ];
  for (const node of nodes) {
    writeFileSync(path.join(nodesDir, `${node.id}.json`), `${JSON.stringify(node, null, 2)}\n`);
  }
  writeFileSync(
    path.join(generatedDir, "meta.json"),
    `${JSON.stringify({
      schemaVersion: "1.0.0",
      generatedAt: "2026-01-01T00:00:00.000Z",
      counts: {
        total: 0,
        byLevel: {},
        byStatus: {},
        byCluster: {},
        filledExample: 0,
      },
      source: { contentSource: 0, oldatas: 0, deduped: 3, synthesizedApps: 0 },
    })}\n`,
  );

  execFileSync(process.execPath, [path.join(toolsDir, "reindex.mjs")], { cwd: root });
  const readJson = (file: string) =>
    JSON.parse(readFileSync(path.join(root, file), "utf8")) as unknown;
  return {
    navigation: readJson("src/data/generated/navigation.json") as Array<{
      id: string;
      children: Array<{ id: string }>;
    }>,
    index: readJson("src/data/generated/index.json") as Array<{
      id: string;
      artifactKind?: string;
    }>,
    meta: readJson("src/data/generated/meta.json"),
    publicNodes: readJson("public/data/nodes.json") as Array<{ id: string }>,
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
    const navigationIds = output.navigation.flatMap((node) => [
      node.id,
      ...node.children.map((child) => child.id),
    ]);

    expect(navigationIds).not.toContain("old-app-slug");
    expect(output.publicNodes.map((node) => node.id).sort()).toEqual([
      "commercial-app",
      "commercial-app-core",
      "old-app-slug",
    ]);
    expect(output.index).toHaveLength(output.publicNodes.length);
    expect(output.index).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "commercial-app", artifactKind: "sellable-app" }),
        expect.objectContaining({ id: "old-app-slug", artifactKind: "legacy-alias" }),
      ]),
    );
  });

  it("reindex meta byArtifactKind sayımlarını üretir ve DatasetMeta şemasına uyar", () => {
    const output = runReindexFixture();
    const meta = DatasetMetaSchema.parse(output.meta);

    expect(meta.counts.byArtifactKind).toEqual({
      "sellable-app": 1,
      "app-core-module": 1,
      "legacy-alias": 1,
    });
  });
});
